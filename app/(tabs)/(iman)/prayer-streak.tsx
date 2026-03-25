
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { useTranslation } from "@/contexts/I18nContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  totalDaysCompleted: number;
  weeklyHistory: boolean[]; // Last 7 days
}

export default function PrayerStreakScreen() {
  const { t } = useTranslation();
  const { prayerGoals } = useImanTracker();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
    totalDaysCompleted: 0,
    weeklyHistory: [false, false, false, false, false, false, false],
  });

  const loadStreakData = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('prayerStreakData');
      if (saved) {
        setStreakData(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading streak data:', error);
    }
  }, []);

  const saveStreakData = useCallback(async (data: StreakData) => {
    try {
      await AsyncStorage.setItem('prayerStreakData', JSON.stringify(data));
      setStreakData(data);
    } catch (error) {
      console.log('Error saving streak data:', error);
    }
  }, []);

  const checkAndUpdateStreak = useCallback(async () => {
    if (!prayerGoals) return;

    const allPrayersCompleted = Object.values(prayerGoals.fardPrayers).every(Boolean);
    const today = new Date().toDateString();

    if (allPrayersCompleted && streakData.lastCompletedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let newCurrentStreak = streakData.currentStreak;
      
      if (streakData.lastCompletedDate === yesterdayStr) {
        newCurrentStreak += 1;
      } else if (streakData.lastCompletedDate === today) {
        newCurrentStreak = streakData.currentStreak;
      } else {
        newCurrentStreak = 1;
      }

      const newLongestStreak = Math.max(newCurrentStreak, streakData.longestStreak);
      const newWeeklyHistory = [...streakData.weeklyHistory.slice(1), true];

      const updatedData: StreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: today,
        totalDaysCompleted: streakData.totalDaysCompleted + 1,
        weeklyHistory: newWeeklyHistory,
      };

      await saveStreakData(updatedData);
    }
  }, [prayerGoals, streakData, saveStreakData]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  useEffect(() => {
    if (prayerGoals) {
      checkAndUpdateStreak();
    }
  }, [prayerGoals, checkAndUpdateStreak]);

  const getStreakMessage = () => {
    if (streakData.currentStreak === 0) {
      return "Start your streak today!";
    } else if (streakData.currentStreak === 1) {
      return "Great start! Keep it going!";
    } else if (streakData.currentStreak < 7) {
      return "Building momentum! 🔥";
    } else if (streakData.currentStreak < 30) {
      return "Amazing consistency! 🌟";
    } else if (streakData.currentStreak < 100) {
      return "Incredible dedication! 💪";
    } else {
      return "Masha'Allah! Legendary! 👑";
    }
  };

  const getStreakColor = () => {
    if (streakData.currentStreak === 0) return colors.textSecondary;
    if (streakData.currentStreak < 7) return colors.info;
    if (streakData.currentStreak < 30) return colors.primary;
    if (streakData.currentStreak < 100) return colors.accent;
    return colors.warning;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Prayer Streak</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Track your consistency in completing all 5 daily prayers. Build a streak by completing all prayers every day!
          </Text>
        </View>

        <LinearGradient
          colors={[getStreakColor(), getStreakColor() + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakIconContainer}>
            <IconSymbol
              ios_icon_name="flame.fill"
              android_material_icon_name="local-fire-department"
              size={48}
              color={colors.card}
            />
          </View>
          <Text style={styles.streakTitle}>Current Streak</Text>
          <Text style={styles.streakCount}>{streakData.currentStreak}</Text>
          <Text style={styles.streakSubtitle}>{streakData.currentStreak === 1 ? 'day' : 'days'}</Text>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={24}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={[colors.success, colors.successDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconContainer}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={24}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.statValue}>{streakData.totalDaysCompleted}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        <View style={styles.weeklySection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyGrid}>
            {weekDays.map((day, index) => {
              const dayIndex = (today - 6 + index + 7) % 7;
              const isCompleted = streakData.weeklyHistory[index];
              const isToday = index === 6;

              return (
                <React.Fragment key={index}>
                  <View style={styles.dayContainer}>
                    <View style={[
                      styles.dayCircle,
                      isCompleted && styles.dayCircleCompleted,
                      isToday && styles.dayCircleToday,
                    ]}>
                      {isCompleted ? (
                        <IconSymbol
                          ios_icon_name="checkmark"
                          android_material_icon_name="check"
                          size={16}
                          color={colors.card}
                        />
                      ) : (
                        <Text style={[
                          styles.dayNumber,
                          isToday && styles.dayNumberToday,
                        ]}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text style={[
                      styles.dayLabel,
                      isToday && styles.dayLabelToday,
                    ]}>
                      {day}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={styles.motivationCard}>
          <View style={styles.motivationHeader}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={24}
              color={colors.warning}
            />
            <Text style={styles.motivationTitle}>{t('iman.keepGoing')}</Text>
          </View>
          <Text style={styles.motivationText}>
            {streakData.currentStreak === 0 && t('iman.startStreakMessage')}
            {streakData.currentStreak > 0 && streakData.currentStreak < 7 && t('iman.buildingHabit')}
            {streakData.currentStreak >= 7 && streakData.currentStreak < 30 && t('iman.oneWeekDown')}
            {streakData.currentStreak >= 30 && streakData.currentStreak < 100 && t('iman.monthConsistency')}
            {streakData.currentStreak >= 100 && t('iman.hundredDays')}
          </Text>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.tipsTitle}>{t('iman.tipsForMaintainingStreak')}</Text>
          </View>
          <Text style={styles.tipsText}>
            - {t('iman.setReminders')}{'\n'}
            - {t('iman.prayAfterAdhan')}{'\n'}
            - {t('iman.findAccountabilityPartner')}{'\n'}
            - {t('iman.makeDuaForConsistency')}{'\n'}
            - {t('iman.qualityOverQuantity')}
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  streakCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.colored,
  },
  streakIconContainer: {
    marginBottom: spacing.md,
  },
  streakTitle: {
    ...typography.body,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  streakCount: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.card,
    lineHeight: 80,
  },
  streakSubtitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.md,
  },
  streakMessage: {
    ...typography.bodyBold,
    color: colors.card,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  weeklySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  dayContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayCircleToday: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  dayNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  motivationCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  motivationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  motivationTitle: {
    ...typography.h4,
    color: colors.text,
  },
  motivationText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  tipsText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
