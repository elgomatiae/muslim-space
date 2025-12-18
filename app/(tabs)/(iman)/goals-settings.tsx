
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { IbadahGoals, IlmGoals, AmanahGoals } from '@/utils/imanScoreCalculator';

type SectionType = 'ibadah' | 'ilm' | 'amanah';

interface GoalConfig {
  id: string;
  label: string;
  description: string;
  goalField: string;
  completedField?: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  enabled: boolean;
  canDisable: boolean;
  isRequired?: boolean;
}

export default function GoalsSettingsScreen() {
  const params = useLocalSearchParams();
  const { ibadahGoals, ilmGoals, amanahGoals, updateIbadahGoals, updateIlmGoals, updateAmanahGoals } = useImanTracker();
  
  const [activeSection, setActiveSection] = useState<SectionType>((params.section as SectionType) || 'ibadah');
  const [localIbadahGoals, setLocalIbadahGoals] = useState<IbadahGoals | null>(null);
  const [localIlmGoals, setLocalIlmGoals] = useState<IlmGoals | null>(null);
  const [localAmanahGoals, setLocalAmanahGoals] = useState<AmanahGoals | null>(null);

  useEffect(() => {
    if (ibadahGoals) setLocalIbadahGoals({ ...ibadahGoals });
    if (ilmGoals) setLocalIlmGoals({ ...ilmGoals });
    if (amanahGoals) setLocalAmanahGoals({ ...amanahGoals });
  }, [ibadahGoals, ilmGoals, amanahGoals]);

  const ibadahGoalConfigs: GoalConfig[] = [
    {
      id: 'sunnah',
      label: 'Sunnah Prayers',
      description: 'Daily Sunnah prayer goal',
      goalField: 'sunnahDailyGoal',
      completedField: 'sunnahCompleted',
      min: 0,
      max: 20,
      step: 1,
      unit: 'prayers',
      enabled: (localIbadahGoals?.sunnahDailyGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'tahajjud',
      label: 'Tahajjud (Night Prayer)',
      description: 'Weekly Tahajjud goal',
      goalField: 'tahajjudWeeklyGoal',
      completedField: 'tahajjudCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'times/week',
      enabled: (localIbadahGoals?.tahajjudWeeklyGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'quranPages',
      label: 'Quran Pages',
      description: 'Daily Quran reading goal',
      goalField: 'quranDailyPagesGoal',
      completedField: 'quranDailyPagesCompleted',
      min: 0,
      max: 20,
      step: 1,
      unit: 'pages/day',
      enabled: (localIbadahGoals?.quranDailyPagesGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'quranVerses',
      label: 'Quran Verses',
      description: 'Daily Quran verses goal',
      goalField: 'quranDailyVersesGoal',
      completedField: 'quranDailyVersesCompleted',
      min: 0,
      max: 50,
      step: 5,
      unit: 'verses/day',
      enabled: (localIbadahGoals?.quranDailyVersesGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'memorization',
      label: 'Quran Memorization',
      description: 'Weekly memorization goal',
      goalField: 'quranWeeklyMemorizationGoal',
      completedField: 'quranWeeklyMemorizationCompleted',
      min: 0,
      max: 20,
      step: 1,
      unit: 'verses/week',
      enabled: (localIbadahGoals?.quranWeeklyMemorizationGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'dhikrDaily',
      label: 'Daily Dhikr',
      description: 'Daily dhikr count goal',
      goalField: 'dhikrDailyGoal',
      completedField: 'dhikrDailyCompleted',
      min: 0,
      max: 500,
      step: 10,
      unit: 'times/day',
      enabled: (localIbadahGoals?.dhikrDailyGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'dhikrWeekly',
      label: 'Weekly Dhikr',
      description: 'Weekly dhikr count goal',
      goalField: 'dhikrWeeklyGoal',
      completedField: 'dhikrWeeklyCompleted',
      min: 0,
      max: 5000,
      step: 100,
      unit: 'times/week',
      enabled: (localIbadahGoals?.dhikrWeeklyGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'dua',
      label: 'Daily Duʿāʾ',
      description: 'Daily dua goal',
      goalField: 'duaDailyGoal',
      completedField: 'duaDailyCompleted',
      min: 0,
      max: 10,
      step: 1,
      unit: 'duas/day',
      enabled: (localIbadahGoals?.duaDailyGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'fasting',
      label: 'Voluntary Fasting',
      description: 'Weekly fasting goal',
      goalField: 'fastingWeeklyGoal',
      completedField: 'fastingWeeklyCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'days/week',
      enabled: (localIbadahGoals?.fastingWeeklyGoal ?? 0) > 0,
      canDisable: true,
    },
  ];

  const ilmGoalConfigs: GoalConfig[] = [
    {
      id: 'lectures',
      label: 'Islamic Lectures',
      description: 'Weekly lecture goal',
      goalField: 'weeklyLecturesGoal',
      completedField: 'weeklyLecturesCompleted',
      min: 0,
      max: 10,
      step: 1,
      unit: 'lectures/week',
      enabled: (localIlmGoals?.weeklyLecturesGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'recitations',
      label: 'Quran Recitations',
      description: 'Weekly recitation listening goal',
      goalField: 'weeklyRecitationsGoal',
      completedField: 'weeklyRecitationsCompleted',
      min: 0,
      max: 10,
      step: 1,
      unit: 'recitations/week',
      enabled: (localIlmGoals?.weeklyRecitationsGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'quizzes',
      label: 'Knowledge Quizzes',
      description: 'Weekly quiz goal',
      goalField: 'weeklyQuizzesGoal',
      completedField: 'weeklyQuizzesCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'quizzes/week',
      enabled: (localIlmGoals?.weeklyQuizzesGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'reflection',
      label: 'Reflection Prompts',
      description: 'Weekly reflection goal',
      goalField: 'weeklyReflectionGoal',
      completedField: 'weeklyReflectionCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'reflections/week',
      enabled: (localIlmGoals?.weeklyReflectionGoal ?? 0) > 0,
      canDisable: true,
    },
  ];

  const amanahGoalConfigs: GoalConfig[] = [
    {
      id: 'exercise',
      label: 'Daily Exercise',
      description: 'Daily exercise duration goal',
      goalField: 'dailyExerciseGoal',
      completedField: 'dailyExerciseCompleted',
      min: 0,
      max: 120,
      step: 5,
      unit: 'minutes/day',
      enabled: (localAmanahGoals?.dailyExerciseGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'water',
      label: 'Daily Water Intake',
      description: 'Daily water consumption goal',
      goalField: 'dailyWaterGoal',
      completedField: 'dailyWaterCompleted',
      min: 0,
      max: 15,
      step: 1,
      unit: 'glasses/day',
      enabled: (localAmanahGoals?.dailyWaterGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'workout',
      label: 'Weekly Workouts',
      description: 'Weekly workout sessions goal',
      goalField: 'weeklyWorkoutGoal',
      completedField: 'weeklyWorkoutCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'sessions/week',
      enabled: (localAmanahGoals?.weeklyWorkoutGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'mentalHealth',
      label: 'Mental Health Activities',
      description: 'Weekly mental health activities goal',
      goalField: 'weeklyMentalHealthGoal',
      completedField: 'weeklyMentalHealthCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'activities/week',
      enabled: (localAmanahGoals?.weeklyMentalHealthGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'sleep',
      label: 'Daily Sleep',
      description: 'Daily sleep duration goal',
      goalField: 'dailySleepGoal',
      completedField: 'dailySleepCompleted',
      min: 0,
      max: 12,
      step: 0.5,
      unit: 'hours/day',
      enabled: (localAmanahGoals?.dailySleepGoal ?? 0) > 0,
      canDisable: true,
    },
    {
      id: 'stress',
      label: 'Stress Management',
      description: 'Weekly stress management activities goal',
      goalField: 'weeklyStressManagementGoal',
      completedField: 'weeklyStressManagementCompleted',
      min: 0,
      max: 7,
      step: 1,
      unit: 'activities/week',
      enabled: (localAmanahGoals?.weeklyStressManagementGoal ?? 0) > 0,
      canDisable: true,
    },
  ];

  const getCurrentGoals = () => {
    switch (activeSection) {
      case 'ibadah':
        return localIbadahGoals;
      case 'ilm':
        return localIlmGoals;
      case 'amanah':
        return localAmanahGoals;
    }
  };

  const getCurrentConfigs = () => {
    switch (activeSection) {
      case 'ibadah':
        return ibadahGoalConfigs;
      case 'ilm':
        return ilmGoalConfigs;
      case 'amanah':
        return amanahGoalConfigs;
    }
  };

  const updateGoalValue = (goalField: string, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (activeSection) {
      case 'ibadah':
        if (localIbadahGoals) {
          setLocalIbadahGoals({
            ...localIbadahGoals,
            [goalField]: value,
          });
        }
        break;
      case 'ilm':
        if (localIlmGoals) {
          setLocalIlmGoals({
            ...localIlmGoals,
            [goalField]: value,
          });
        }
        break;
      case 'amanah':
        if (localAmanahGoals) {
          setLocalAmanahGoals({
            ...localAmanahGoals,
            [goalField]: value,
          });
        }
        break;
    }
  };

  const toggleGoal = (goalField: string, currentValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newValue = currentValue > 0 ? 0 : getDefaultValue(goalField);
    updateGoalValue(goalField, newValue);
  };

  const getDefaultValue = (goalField: string): number => {
    const defaults: { [key: string]: number } = {
      sunnahDailyGoal: 5,
      tahajjudWeeklyGoal: 2,
      quranDailyPagesGoal: 2,
      quranDailyVersesGoal: 10,
      quranWeeklyMemorizationGoal: 5,
      dhikrDailyGoal: 100,
      dhikrWeeklyGoal: 1000,
      duaDailyGoal: 3,
      fastingWeeklyGoal: 2,
      weeklyLecturesGoal: 2,
      weeklyRecitationsGoal: 2,
      weeklyQuizzesGoal: 1,
      weeklyReflectionGoal: 3,
      dailyExerciseGoal: 30,
      dailyWaterGoal: 8,
      weeklyWorkoutGoal: 3,
      weeklyMentalHealthGoal: 3,
      dailySleepGoal: 7,
      weeklyStressManagementGoal: 2,
    };
    return defaults[goalField] || 1;
  };

  const saveGoals = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (localIbadahGoals) await updateIbadahGoals(localIbadahGoals);
      if (localIlmGoals) await updateIlmGoals(localIlmGoals);
      if (localAmanahGoals) await updateAmanahGoals(localAmanahGoals);
      
      Alert.alert('Success', 'Your goals have been saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Error saving goals:', error);
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    }
  };

  const renderGoalItem = (config: GoalConfig) => {
    const currentGoals = getCurrentGoals();
    if (!currentGoals) return null;

    const currentValue = currentGoals[config.goalField as keyof typeof currentGoals] as number;
    const isEnabled = currentValue > 0;

    return (
      <View key={config.id} style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalLabel}>{config.label}</Text>
            <Text style={styles.goalDescription}>{config.description}</Text>
          </View>
          {config.canDisable && (
            <Switch
              value={isEnabled}
              onValueChange={() => toggleGoal(config.goalField, currentValue)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          )}
        </View>

        {isEnabled && (
          <View style={styles.goalControls}>
            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{currentValue}</Text>
              <Text style={styles.unitText}>{config.unit}</Text>
            </View>

            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  const newValue = Math.max(config.min, currentValue - config.step);
                  if (newValue >= config.min) {
                    updateGoalValue(config.goalField, newValue);
                  }
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="minus"
                  android_material_icon_name="remove"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              <View style={styles.rangeInfo}>
                <Text style={styles.rangeText}>
                  {config.min} - {config.max}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  const newValue = Math.min(config.max, currentValue + config.step);
                  if (newValue <= config.max) {
                    updateGoalValue(config.goalField, newValue);
                  }
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const getSectionColor = (section: SectionType) => {
    switch (section) {
      case 'ibadah':
        return ['#10B981', '#059669'];
      case 'ilm':
        return ['#3B82F6', '#2563EB'];
      case 'amanah':
        return ['#F59E0B', '#D97706'];
    }
  };

  const getSectionIcon = (section: SectionType) => {
    switch (section) {
      case 'ibadah':
        return { ios: 'hands.sparkles.fill', android: 'auto-awesome' };
      case 'ilm':
        return { ios: 'book.fill', android: 'menu-book' };
      case 'amanah':
        return { ios: 'heart.fill', android: 'favorite' };
    }
  };

  const getSectionTitle = (section: SectionType) => {
    switch (section) {
      case 'ibadah':
        return 'ʿIbādah';
      case 'ilm':
        return 'ʿIlm';
      case 'amanah':
        return 'Amanah';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize Goals</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveGoals}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={24}
          color={colors.info}
        />
        <Text style={styles.infoText}>
          Customize your spiritual goals. The five daily prayers (Fard) are obligatory and cannot be changed.
        </Text>
      </View>

      <View style={styles.sectionTabs}>
        {(['ibadah', 'ilm', 'amanah'] as SectionType[]).map((section, index) => {
          const isActive = activeSection === section;
          const icon = getSectionIcon(section);
          const colors_gradient = getSectionColor(section);

          return (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[styles.sectionTab, isActive && styles.sectionTabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSection(section);
                }}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient
                    colors={colors_gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sectionTabGradient}
                  >
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.sectionTabTextActive}>{getSectionTitle(section)}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.sectionTabContent}>
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.sectionTabText}>{getSectionTitle(section)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'ibadah' && (
          <View style={styles.fardPrayersInfo}>
            <View style={styles.fardHeader}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.fardTitle}>Five Daily Prayers (Fard)</Text>
            </View>
            <Text style={styles.fardDescription}>
              The five daily prayers are obligatory for every Muslim and cannot be disabled. They are:
            </Text>
            <View style={styles.fardList}>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer, index) => (
                <React.Fragment key={index}>
                  <View style={styles.fardItem}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.fardItemText}>{prayer}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        <View style={styles.goalsSection}>
          <Text style={styles.goalsSectionTitle}>
            {activeSection === 'ibadah' ? 'Optional Worship Goals' : 'Goals'}
          </Text>
          {getCurrentConfigs().map(config => renderGoalItem(config))}
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTab: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTabActive: {
    borderColor: 'transparent',
  },
  sectionTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.card,
  },
  sectionTabText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionTabTextActive: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  fardPrayersInfo: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  fardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  fardDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fardList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  fardItemText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  goalsSection: {
    marginBottom: spacing.xl,
  },
  goalsSectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  goalItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  goalLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalDescription: {
    ...typography.small,
    color: colors.textSecondary,
  },
  goalControls: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  valueText: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  unitText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  rangeText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
