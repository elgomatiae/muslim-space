
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from '@/contexts/I18nContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import type { PrayerGoals } from "@/utils/imanScoreCalculator";

export default function PrayerGoalsScreen() {
  const { t } = useTranslation();
  const { prayerGoals: contextGoals, updatePrayerGoals } = useImanTracker();
  
  const [goals, setGoals] = useState<PrayerGoals | null>(contextGoals);
  const [sunnahInput, setSunnahInput] = useState('5');
  const [tahajjudInput, setTahajjudInput] = useState('2');

  useEffect(() => {
    if (contextGoals) {
      setGoals(contextGoals);
      setSunnahInput(contextGoals.sunnahDailyGoal.toString());
      setTahajjudInput(contextGoals.tahajjudWeeklyGoal.toString());
    }
  }, [contextGoals]);

  const handleSave = async () => {
    if (!goals) return;

    const sunnahGoal = parseInt(sunnahInput) || 0;
    const tahajjudGoal = parseInt(tahajjudInput) || 0;

    if (sunnahGoal < 0 || sunnahGoal > 100) {
      Alert.alert(t('common.error'), t('iman.invalidSunnahPrayers'));
      return;
    }

    if (tahajjudGoal < 0 || tahajjudGoal > 50) {
      Alert.alert(t('common.error'), t('iman.invalidTahajjudGoal'));
      return;
    }

    const updatedGoals: PrayerGoals = {
      ...goals,
      sunnahDailyGoal: sunnahGoal,
      tahajjudWeeklyGoal: tahajjudGoal,
    };

    await updatePrayerGoals(updatedGoals);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('common.success'), t('iman.prayerGoalsSaved'), [
      { text: t('common.ok'), onPress: () => router.back() }
    ]);
  };

  const toggleFardPrayer = async (prayer: keyof PrayerGoals['fardPrayers']) => {
    if (!goals) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...goals,
      fardPrayers: {
        ...goals.fardPrayers,
        [prayer]: !goals.fardPrayers[prayer],
      },
    };
    setGoals(updatedGoals);
    await updatePrayerGoals(updatedGoals);
  };

  const incrementSunnah = async () => {
    if (!goals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...goals,
      sunnahCompleted: Math.min(goals.sunnahCompleted + 1, goals.sunnahDailyGoal),
    };
    setGoals(updatedGoals);
    await updatePrayerGoals(updatedGoals);
  };

  const incrementTahajjud = async () => {
    if (!goals) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...goals,
      tahajjudCompleted: Math.min(goals.tahajjudCompleted + 1, goals.tahajjudWeeklyGoal),
    };
    setGoals(updatedGoals);
    await updatePrayerGoals(updatedGoals);
  };

  const fardPrayers = [
    { key: 'fajr' as const, name: 'Fajr', time: 'Dawn' },
    { key: 'dhuhr' as const, name: 'Dhuhr', time: 'Noon' },
    { key: 'asr' as const, name: 'Asr', time: 'Afternoon' },
    { key: 'maghrib' as const, name: 'Maghrib', time: 'Sunset' },
    { key: 'isha' as const, name: 'Isha', time: 'Night' },
  ];

  if (!goals) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fardCompleted = Object.values(goals.fardPrayers).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Prayer Goals</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
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
            The five daily prayers are mandatory and always tracked. Set your goals for Sunnah prayers and Tahajjud. Changes update immediately!
          </Text>
        </View>

        {/* Five Daily Prayers */}
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
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Five Daily Prayers (Mandatory)</Text>
              <Text style={styles.sectionSubtitle}>{fardCompleted}/5 completed today</Text>
            </View>
          </View>

          <View style={styles.prayersGrid}>
            {fardPrayers.map((prayer, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.prayerCard,
                    goals.fardPrayers[prayer.key] && styles.prayerCardCompleted
                  ]}
                  onPress={() => toggleFardPrayer(prayer.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkCircle,
                    goals.fardPrayers[prayer.key] && styles.checkCircleCompleted
                  ]}>
                    {goals.fardPrayers[prayer.key] && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.card}
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.prayerName,
                    goals.fardPrayers[prayer.key] && styles.prayerNameCompleted
                  ]}>
                    {prayer.name}
                  </Text>
                  <Text style={styles.prayerTime}>{prayer.time}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Sunnah Prayers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Sunnah Prayers (Daily Goal)</Text>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Daily Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={sunnahInput}
              onChangeText={setSunnahInput}
              keyboardType="number-pad"
              maxLength={2}
              placeholder={t('iman.sunnahPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>prayers/day</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
              <Text style={styles.progressValue}>
                {goals.sunnahCompleted}/{goals.sunnahDailyGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.sunnahDailyGoal > 0 ? (goals.sunnahCompleted / goals.sunnahDailyGoal) * 100 : 0}%`,
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
                  size={20}
                  color={colors.card}
                />
                <Text style={styles.incrementButtonText}>Mark Sunnah Prayer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tahajjud */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="nightlight"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Tahajjud (Weekly Goal)</Text>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Weekly Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={tahajjudInput}
              onChangeText={setTahajjudInput}
              keyboardType="number-pad"
              maxLength={1}
              placeholder={t('iman.tahajjudPlaceholder')}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>times/week</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>This Week&apos;s Progress</Text>
              <Text style={styles.progressValue}>
                {goals.tahajjudCompleted}/{goals.tahajjudWeeklyGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.tahajjudWeeklyGoal > 0 ? (goals.tahajjudCompleted / goals.tahajjudWeeklyGoal) * 100 : 0}%`,
                    backgroundColor: colors.accent,
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
                  size={20}
                  color={colors.card}
                />
                <Text style={styles.incrementButtonText}>Mark Tahajjud</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.recommendationBox}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.recommendationText}>
              Tahajjud is prayed in the last third of the night before Fajr. It&apos;s a highly rewarded voluntary prayer.
            </Text>
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
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.card,
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
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  prayersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prayerCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.small,
  },
  prayerCardCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  prayerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  prayerNameCompleted: {
    color: colors.primary,
  },
  prayerTime: {
    ...typography.small,
    color: colors.textSecondary,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  goalInputLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginRight: spacing.md,
  },
  goalInput: {
    ...typography.h3,
    color: colors.text,
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalInputUnit: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  progressValue: {
    ...typography.h4,
    color: colors.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
    gap: spacing.sm,
    padding: spacing.md,
  },
  incrementButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  recommendationText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
