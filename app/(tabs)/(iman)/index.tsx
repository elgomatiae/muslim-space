
import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import DhikrCircularCounter from "@/components/iman/DhikrCircularCounter";

export default function ImanTrackerScreen() {
  const { user } = useAuth();
  const {
    prayerGoals,
    dhikrGoals,
    quranGoals,
    refreshData,
    updatePrayerGoals,
    updateDhikrGoals,
    updateQuranGoals,
    loading,
  } = useImanTracker();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const toggleFardPrayer = async (prayer: keyof typeof prayerGoals.fardPrayers) => {
    if (!prayerGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...prayerGoals,
      fardPrayers: {
        ...prayerGoals.fardPrayers,
        [prayer]: !prayerGoals.fardPrayers[prayer],
      },
    };
    await updatePrayerGoals(updatedGoals);
  };

  const incrementSunnah = async () => {
    if (!prayerGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...prayerGoals,
      sunnahCompleted: Math.min(prayerGoals.sunnahCompleted + 1, prayerGoals.sunnahDailyGoal),
    };
    await updatePrayerGoals(updatedGoals);
  };

  const incrementTahajjud = async () => {
    if (!prayerGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...prayerGoals,
      tahajjudCompleted: Math.min(prayerGoals.tahajjudCompleted + 1, prayerGoals.tahajjudWeeklyGoal),
    };
    await updatePrayerGoals(updatedGoals);
  };

  const incrementDhikr = async (amount: number) => {
    if (!dhikrGoals) return;
    
    const updatedGoals = {
      ...dhikrGoals,
      dailyCompleted: dhikrGoals.dailyCompleted + amount,
      weeklyCompleted: dhikrGoals.weeklyCompleted + amount,
    };
    await updateDhikrGoals(updatedGoals);
  };

  const incrementQuranPages = async (amount: number) => {
    if (!quranGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...quranGoals,
      dailyPagesCompleted: Math.min(quranGoals.dailyPagesCompleted + amount, quranGoals.dailyPagesGoal),
    };
    await updateQuranGoals(updatedGoals);
  };

  const incrementQuranVerses = async (amount: number) => {
    if (!quranGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...quranGoals,
      dailyVersesCompleted: Math.min(quranGoals.dailyVersesCompleted + amount, quranGoals.dailyVersesGoal),
    };
    await updateQuranGoals(updatedGoals);
  };

  const incrementQuranMemorization = async (amount: number) => {
    if (!quranGoals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...quranGoals,
      weeklyMemorizationCompleted: Math.min(quranGoals.weeklyMemorizationCompleted + amount, quranGoals.weeklyMemorizationGoal),
    };
    await updateQuranGoals(updatedGoals);
  };

  const fardPrayers = [
    { key: 'fajr' as const, name: 'Fajr', time: 'Dawn' },
    { key: 'dhuhr' as const, name: 'Dhuhr', time: 'Noon' },
    { key: 'asr' as const, name: 'Asr', time: 'Afternoon' },
    { key: 'maghrib' as const, name: 'Maghrib', time: 'Sunset' },
    { key: 'isha' as const, name: 'Isha', time: 'Night' },
  ];

  const fardCompleted = prayerGoals ? Object.values(prayerGoals.fardPrayers).filter(Boolean).length : 0;

  if (loading || !prayerGoals || !dhikrGoals || !quranGoals) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ENHANCED HEADER - BIGGER AND MORE EYE-CATCHING */}
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <View style={styles.headerIconContainer}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={48}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.header}>Iman Tracker</Text>
            <Text style={styles.subtitle}>Track your spiritual journey daily</Text>
          </View>
          <View style={styles.headerDecoration}>
            <IconSymbol
              ios_icon_name="moon.stars.fill"
              android_material_icon_name="nights-stay"
              size={36}
              color="rgba(255, 255, 255, 0.6)"
            />
          </View>
        </LinearGradient>

        <ImanRingsDisplay onRefresh={onRefresh} />

        {/* PRAYER SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="hands.sparkles.fill"
                android_material_icon_name="auto-awesome"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Prayer</Text>
            <TouchableOpacity
              style={styles.setGoalsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/prayer-goals');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.setGoalsButtonText}>Set Goals</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Access Buttons */}
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/qada-tracker');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickAccessGradient}
              >
                <IconSymbol
                  ios_icon_name="clock.arrow.circlepath"
                  android_material_icon_name="history"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.quickAccessText}>Qada Tracker</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/prayer-streak');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.warning, colors.warningDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickAccessGradient}
              >
                <IconSymbol
                  ios_icon_name="flame.fill"
                  android_material_icon_name="local-fire-department"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.quickAccessText}>Prayer Streak</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.goalsContainer}>
            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>Five Daily Prayers ({fardCompleted}/5)</Text>
              <View style={styles.prayersGrid}>
                {fardPrayers.map((prayer, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.prayerCard,
                        prayerGoals.fardPrayers[prayer.key] && styles.prayerCardCompleted
                      ]}
                      onPress={() => toggleFardPrayer(prayer.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkCircle,
                        prayerGoals.fardPrayers[prayer.key] && styles.checkCircleCompleted
                      ]}>
                        {prayerGoals.fardPrayers[prayer.key] && (
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={16}
                            color={colors.card}
                          />
                        )}
                      </View>
                      <Text style={[
                        styles.prayerName,
                        prayerGoals.fardPrayers[prayer.key] && styles.prayerNameCompleted
                      ]}>
                        {prayer.name}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Sunnah Prayers ({prayerGoals.sunnahCompleted}/{prayerGoals.sunnahDailyGoal} today)
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${prayerGoals.sunnahDailyGoal > 0 ? (prayerGoals.sunnahCompleted / prayerGoals.sunnahDailyGoal) * 100 : 0}%`,
                      backgroundColor: colors.primary,
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={incrementSunnah}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={16}
                    color={colors.card}
                  />
                  <Text style={styles.incrementButtonText}>Mark Sunnah</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Tahajjud ({prayerGoals.tahajjudCompleted}/{prayerGoals.tahajjudWeeklyGoal} this week)
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${prayerGoals.tahajjudWeeklyGoal > 0 ? (prayerGoals.tahajjudCompleted / prayerGoals.tahajjudWeeklyGoal) * 100 : 0}%`,
                      backgroundColor: colors.primary,
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={incrementTahajjud}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={16}
                    color={colors.card}
                  />
                  <Text style={styles.incrementButtonText}>Mark Tahajjud</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* QURAN SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quran</Text>
            <TouchableOpacity
              style={styles.setGoalsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/quran-goals');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.setGoalsButtonText}>Set Goals</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalsContainer}>
            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Daily Pages ({quranGoals.dailyPagesCompleted}/{quranGoals.dailyPagesGoal})
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${quranGoals.dailyPagesGoal > 0 ? (quranGoals.dailyPagesCompleted / quranGoals.dailyPagesGoal) * 100 : 0}%`,
                      backgroundColor: colors.accent,
                    }
                  ]} 
                />
              </View>
              <View style={styles.counterGrid}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranPages(1)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+1</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranPages(5)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+5</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Daily Verses ({quranGoals.dailyVersesCompleted}/{quranGoals.dailyVersesGoal})
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${quranGoals.dailyVersesGoal > 0 ? (quranGoals.dailyVersesCompleted / quranGoals.dailyVersesGoal) * 100 : 0}%`,
                      backgroundColor: colors.accent,
                    }
                  ]} 
                />
              </View>
              <View style={styles.counterGrid}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranVerses(1)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+1</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranVerses(5)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+5</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranVerses(10)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+10</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Weekly Memorization ({quranGoals.weeklyMemorizationCompleted}/{quranGoals.weeklyMemorizationGoal} verses)
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${quranGoals.weeklyMemorizationGoal > 0 ? (quranGoals.weeklyMemorizationCompleted / quranGoals.weeklyMemorizationGoal) * 100 : 0}%`,
                      backgroundColor: colors.accent,
                    }
                  ]} 
                />
              </View>
              <View style={styles.counterGrid}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranMemorization(1)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+1</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranMemorization(3)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+3</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementQuranMemorization(5)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.accent, colors.accentDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterButtonGradient}
                  >
                    <Text style={styles.counterButtonText}>+5</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* DHIKR SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="back-hand"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Dhikr</Text>
            <TouchableOpacity
              style={styles.setGoalsButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/dhikr-goals');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.setGoalsButtonText}>Set Goals</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Access Button for Challenges */}
          <TouchableOpacity
            style={styles.challengesButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(iman)/dhikr-challenges');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.challengesButtonGradient}
            >
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color={colors.card}
              />
              <Text style={styles.challengesButtonText}>Dhikr Challenges & Custom Phrases</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.goalsContainer}>
            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Daily Dhikr ({dhikrGoals.dailyCompleted}/{dhikrGoals.dailyGoal})
              </Text>
              
              <DhikrCircularCounter
                count={dhikrGoals.dailyCompleted}
                onIncrement={incrementDhikr}
                dailyGoal={dhikrGoals.dailyGoal}
              />
            </View>

            <View style={styles.goalSubsection}>
              <Text style={styles.goalSubsectionTitle}>
                Weekly Dhikr ({dhikrGoals.weeklyCompleted}/{dhikrGoals.weeklyGoal})
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${dhikrGoals.weeklyGoal > 0 ? Math.min(100, (dhikrGoals.weeklyCompleted / dhikrGoals.weeklyGoal) * 100) : 0}%`,
                      backgroundColor: colors.info,
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <Text style={styles.infoText}>
                - Each ring represents: Prayer, Quran, and Dhikr{'\n'}
                - Track progress directly on this screen{'\n'}
                - Rings update INSTANTLY when you track goals{'\n'}
                - Scores slowly decay over time if inactive{'\n'}
                - Unmet daily goals deplete score at midnight{'\n'}
                - Unmet weekly goals deplete score Sunday 12 AM{'\n'}
                - Stay consistent to maintain high scores!{'\n'}
                {user && '- Progress auto-saves to your account'}
              </Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.large,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerDecoration: {
    opacity: 0.8,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  setGoalsButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  setGoalsButtonText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickAccessButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickAccessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  quickAccessText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '600',
  },
  challengesButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  challengesButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  challengesButtonText: {
    ...typography.body,
    color: colors.card,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.sm,
  },
  goalsContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
    gap: spacing.lg,
  },
  goalSubsection: {
    gap: spacing.sm,
  },
  goalSubsectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  prayersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prayerCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  prayerCardCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  checkCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  prayerName: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  prayerNameCompleted: {
    color: colors.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  incrementButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  incrementButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  incrementButtonText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
  },
  counterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  counterButton: {
    flex: 1,
    minWidth: '22%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.medium,
  },
  counterButtonGradient: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
