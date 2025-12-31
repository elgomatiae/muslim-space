
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type SectionType = 'ibadah' | 'ilm' | 'amanah';
type FrequencyType = 'daily' | 'weekly';

interface GoalConfig {
  id: string;
  label: string;
  description: string;
  goalField: string;
  completedField?: string;
  frequencyField?: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  enabled: boolean;
  canDisable: boolean;
  isRequired?: boolean;
  defaultFrequency: FrequencyType;
  currentFrequency?: FrequencyType;
}

const WORKOUT_TYPES = [
  { value: 'general', label: 'General Fitness', icon: { ios: 'figure.mixed.cardio', android: 'fitness-center' } },
  { value: 'cardio', label: 'Cardio', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'strength', label: 'Strength Training', icon: { ios: 'dumbbell.fill', android: 'fitness-center' } },
  { value: 'yoga', label: 'Yoga', icon: { ios: 'figure.yoga', android: 'self-improvement' } },
  { value: 'walking', label: 'Walking', icon: { ios: 'figure.walk', android: 'directions-walk' } },
  { value: 'running', label: 'Running', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'sports', label: 'Sports', icon: { ios: 'sportscourt.fill', android: 'sports' } },
];

const FARD_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function GoalsSettingsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { ibadahGoals, ilmGoals, amanahGoals, updateIbadahGoals, updateIlmGoals, updateAmanahGoals } = useImanTracker();
  
  const [activeSection, setActiveSection] = useState<SectionType>((params.section as SectionType) || 'ibadah');
  const [localIbadahGoals, setLocalIbadahGoals] = useState<IbadahGoals | null>(null);
  const [localIlmGoals, setLocalIlmGoals] = useState<IlmGoals | null>(null);
  const [localAmanahGoals, setLocalAmanahGoals] = useState<AmanahGoals | null>(null);
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>(['general']);
  const [goalFrequencies, setGoalFrequencies] = useState<{ [key: string]: FrequencyType }>({});

  useEffect(() => {
    if (ibadahGoals) setLocalIbadahGoals({ ...ibadahGoals });
    if (ilmGoals) setLocalIlmGoals({ ...ilmGoals });
    if (amanahGoals) setLocalAmanahGoals({ ...amanahGoals });
    loadWorkoutTypes();
    loadGoalFrequencies();
  }, [ibadahGoals, ilmGoals, amanahGoals]);

  const loadGoalFrequencies = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('iman_tracker_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      const frequencies: { [key: string]: FrequencyType } = {};
      
      // Load all frequency fields
      if (data.sunnah_goal_frequency) frequencies.sunnah = data.sunnah_goal_frequency;
      if (data.tahajjud_goal_frequency) frequencies.tahajjud = data.tahajjud_goal_frequency;
      if (data.quran_pages_goal_frequency) frequencies.quranPages = data.quran_pages_goal_frequency;
      if (data.quran_verses_goal_frequency) frequencies.quranVerses = data.quran_verses_goal_frequency;
      if (data.quran_memorization_goal_frequency) frequencies.memorization = data.quran_memorization_goal_frequency;
      if (data.dhikr_goal_frequency) frequencies.dhikrDaily = data.dhikr_goal_frequency;
      if (data.dua_goal_frequency) frequencies.dua = data.dua_goal_frequency;
      if (data.fasting_goal_frequency) frequencies.fasting = data.fasting_goal_frequency;
      if (data.lectures_goal_frequency) frequencies.lectures = data.lectures_goal_frequency;
      if (data.recitations_goal_frequency) frequencies.recitations = data.recitations_goal_frequency;
      if (data.quizzes_goal_frequency) frequencies.quizzes = data.quizzes_goal_frequency;
      if (data.reflection_goal_frequency) frequencies.reflection = data.reflection_goal_frequency;
      if (data.exercise_goal_frequency) frequencies.exercise = data.exercise_goal_frequency;
      if (data.water_goal_frequency) frequencies.water = data.water_goal_frequency;
      if (data.workout_goal_frequency) frequencies.workout = data.workout_goal_frequency;
      if (data.meditation_goal_frequency) frequencies.meditation = data.meditation_goal_frequency;
      if (data.journal_goal_frequency) frequencies.journal = data.journal_goal_frequency;
      if (data.sleep_goal_frequency) frequencies.sleep = data.sleep_goal_frequency;
      
      setGoalFrequencies(frequencies);
    }
  };

  const loadWorkoutTypes = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('physical_wellness_goals')
      .select('workout_types, workout_type')
      .eq('user_id', user.id)
      .single();
    
    if (data?.workout_types && data.workout_types.length > 0) {
      setSelectedWorkoutTypes(data.workout_types);
    } else if (data?.workout_type) {
      setSelectedWorkoutTypes([data.workout_type]);
    }
  };

  const toggleWorkoutType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedWorkoutTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) {
          Alert.alert('Notice', 'You must have at least one workout type selected.');
          return prev;
        }
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const saveWorkoutTypes = async (types: string[]) => {
    if (!user || types.length === 0) return;
    
    await supabase
      .from('physical_wellness_goals')
      .upsert({
        user_id: user.id,
        workout_type: types[0],
        workout_types: types,
        updated_at: new Date().toISOString(),
      });
    
    await supabase
      .from('iman_tracker_goals')
      .upsert({
        user_id: user.id,
        amanah_workout_type: types[0],
        amanah_workout_types: types,
        updated_at: new Date().toISOString(),
      });
  };

  const toggleFrequency = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoalFrequencies(prev => ({
      ...prev,
      [goalId]: prev[goalId] === 'daily' ? 'weekly' : 'daily',
    }));
  };

  const ibadahGoalConfigs: GoalConfig[] = [
    {
      id: 'sunnah',
      label: 'Sunnah Prayers',
      description: 'Sunnah prayer goal',
      goalField: 'sunnahDailyGoal',
      completedField: 'sunnahCompleted',
      frequencyField: 'sunnah_goal_frequency',
      min: 0,
      max: 20,
      step: 1,
      unit: 'prayers',
      enabled: (localIbadahGoals?.sunnahDailyGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.sunnah || 'daily',
    },
    {
      id: 'tahajjud',
      label: 'Tahajjud (Night Prayer)',
      description: 'Tahajjud goal',
      goalField: 'tahajjudWeeklyGoal',
      completedField: 'tahajjudCompleted',
      frequencyField: 'tahajjud_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'times',
      enabled: (localIbadahGoals?.tahajjudWeeklyGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.tahajjud || 'weekly',
    },
    {
      id: 'quranPages',
      label: 'Quran Pages',
      description: 'Quran reading goal',
      goalField: 'quranDailyPagesGoal',
      completedField: 'quranDailyPagesCompleted',
      frequencyField: 'quran_pages_goal_frequency',
      min: 0,
      max: 20,
      step: 1,
      unit: 'pages',
      enabled: (localIbadahGoals?.quranDailyPagesGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.quranPages || 'daily',
    },
    {
      id: 'quranVerses',
      label: 'Quran Verses',
      description: 'Quran verses goal',
      goalField: 'quranDailyVersesGoal',
      completedField: 'quranDailyVersesCompleted',
      frequencyField: 'quran_verses_goal_frequency',
      min: 0,
      max: 50,
      step: 5,
      unit: 'verses',
      enabled: (localIbadahGoals?.quranDailyVersesGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.quranVerses || 'daily',
    },
    {
      id: 'memorization',
      label: 'Quran Memorization',
      description: 'Memorization goal',
      goalField: 'quranWeeklyMemorizationGoal',
      completedField: 'quranWeeklyMemorizationCompleted',
      frequencyField: 'quran_memorization_goal_frequency',
      min: 0,
      max: 20,
      step: 1,
      unit: 'verses',
      enabled: (localIbadahGoals?.quranWeeklyMemorizationGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.memorization || 'weekly',
    },
    {
      id: 'dhikrDaily',
      label: 'Dhikr',
      description: 'Dhikr count goal',
      goalField: 'dhikrDailyGoal',
      completedField: 'dhikrDailyCompleted',
      frequencyField: 'dhikr_goal_frequency',
      min: 0,
      max: 5000,
      step: 10,
      unit: 'times',
      enabled: (localIbadahGoals?.dhikrDailyGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.dhikrDaily || 'daily',
    },
    {
      id: 'dua',
      label: 'Daily Duʿāʾ',
      description: 'Dua goal',
      goalField: 'duaDailyGoal',
      completedField: 'duaDailyCompleted',
      frequencyField: 'dua_goal_frequency',
      min: 0,
      max: 10,
      step: 1,
      unit: 'duas',
      enabled: (localIbadahGoals?.duaDailyGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.dua || 'daily',
    },
    {
      id: 'fasting',
      label: 'Voluntary Fasting',
      description: 'Fasting goal',
      goalField: 'fastingWeeklyGoal',
      completedField: 'fastingWeeklyCompleted',
      frequencyField: 'fasting_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'days',
      enabled: (localIbadahGoals?.fastingWeeklyGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.fasting || 'weekly',
    },
  ];

  const ilmGoalConfigs: GoalConfig[] = [
    {
      id: 'lectures',
      label: 'Islamic Lectures',
      description: 'Lecture goal',
      goalField: 'weeklyLecturesGoal',
      completedField: 'weeklyLecturesCompleted',
      frequencyField: 'lectures_goal_frequency',
      min: 0,
      max: 10,
      step: 1,
      unit: 'lectures',
      enabled: (localIlmGoals?.weeklyLecturesGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.lectures || 'weekly',
    },
    {
      id: 'recitations',
      label: 'Quran Recitations',
      description: 'Recitation listening goal',
      goalField: 'weeklyRecitationsGoal',
      completedField: 'weeklyRecitationsCompleted',
      frequencyField: 'recitations_goal_frequency',
      min: 0,
      max: 10,
      step: 1,
      unit: 'recitations',
      enabled: (localIlmGoals?.weeklyRecitationsGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.recitations || 'weekly',
    },
    {
      id: 'quizzes',
      label: 'Knowledge Quizzes',
      description: 'Quiz goal',
      goalField: 'weeklyQuizzesGoal',
      completedField: 'weeklyQuizzesCompleted',
      frequencyField: 'quizzes_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'quizzes',
      enabled: (localIlmGoals?.weeklyQuizzesGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.quizzes || 'weekly',
    },
    {
      id: 'reflection',
      label: 'Reflection Prompts',
      description: 'Reflection goal',
      goalField: 'weeklyReflectionGoal',
      completedField: 'weeklyReflectionCompleted',
      frequencyField: 'reflection_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'reflections',
      enabled: (localIlmGoals?.weeklyReflectionGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.reflection || 'weekly',
    },
  ];

  const amanahGoalConfigs: GoalConfig[] = [
    {
      id: 'exercise',
      label: 'Exercise',
      description: 'Exercise duration goal',
      goalField: 'dailyExerciseGoal',
      completedField: 'dailyExerciseCompleted',
      frequencyField: 'exercise_goal_frequency',
      min: 0,
      max: 120,
      step: 5,
      unit: 'minutes',
      enabled: (localAmanahGoals?.dailyExerciseGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.exercise || 'daily',
    },
    {
      id: 'water',
      label: 'Water Intake',
      description: 'Water consumption goal',
      goalField: 'dailyWaterGoal',
      completedField: 'dailyWaterCompleted',
      frequencyField: 'water_goal_frequency',
      min: 0,
      max: 15,
      step: 1,
      unit: 'glasses',
      enabled: (localAmanahGoals?.dailyWaterGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.water || 'daily',
    },
    {
      id: 'workout',
      label: 'Workouts',
      description: 'Workout sessions goal',
      goalField: 'weeklyWorkoutGoal',
      completedField: 'weeklyWorkoutCompleted',
      frequencyField: 'workout_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'sessions',
      enabled: (localAmanahGoals?.weeklyWorkoutGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.workout || 'weekly',
    },
    {
      id: 'meditation',
      label: 'Meditation Sessions',
      description: 'Meditation & mindfulness goal',
      goalField: 'weeklyMeditationGoal',
      completedField: 'weeklyMeditationCompleted',
      frequencyField: 'meditation_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'sessions',
      enabled: (localAmanahGoals?.weeklyMeditationGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.meditation || 'weekly',
    },
    {
      id: 'journal',
      label: 'Journal Entries',
      description: 'Journaling & reflection goal',
      goalField: 'weeklyJournalGoal',
      completedField: 'weeklyJournalCompleted',
      frequencyField: 'journal_goal_frequency',
      min: 0,
      max: 7,
      step: 1,
      unit: 'entries',
      enabled: (localAmanahGoals?.weeklyJournalGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'weekly',
      currentFrequency: goalFrequencies.journal || 'weekly',
    },
    {
      id: 'sleep',
      label: 'Sleep',
      description: 'Sleep duration goal',
      goalField: 'dailySleepGoal',
      completedField: 'dailySleepCompleted',
      frequencyField: 'sleep_goal_frequency',
      min: 0,
      max: 12,
      step: 0.5,
      unit: 'hours',
      enabled: (localAmanahGoals?.dailySleepGoal ?? 0) > 0,
      canDisable: true,
      defaultFrequency: 'daily',
      currentFrequency: goalFrequencies.sleep || 'daily',
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
      weeklyMeditationGoal: 2,
      weeklyJournalGoal: 2,
      dailySleepGoal: 7,
      weeklyStressManagementGoal: 2,
    };
    return defaults[goalField] || 1;
  };

  const saveGoals = async () => {
    try {
      if (selectedWorkoutTypes.length === 0) {
        Alert.alert('Error', 'Please select at least one workout type.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (localIbadahGoals) await updateIbadahGoals(localIbadahGoals);
      if (localIlmGoals) await updateIlmGoals(localIlmGoals);
      if (localAmanahGoals) {
        await updateAmanahGoals(localAmanahGoals);
        
        if (user) {
          await supabase
            .from('physical_wellness_goals')
            .upsert({
              user_id: user.id,
              daily_exercise_minutes_goal: localAmanahGoals.dailyExerciseGoal || 0,
              daily_water_glasses_goal: localAmanahGoals.dailyWaterGoal || 0,
              daily_sleep_hours_goal: localAmanahGoals.dailySleepGoal || 0,
              workout_enabled: (localAmanahGoals.dailyExerciseGoal || 0) > 0,
              water_enabled: (localAmanahGoals.dailyWaterGoal || 0) > 0,
              sleep_enabled: (localAmanahGoals.dailySleepGoal || 0) > 0,
              updated_at: new Date().toISOString(),
            });
        }
      }
      
      // Save workout types
      await saveWorkoutTypes(selectedWorkoutTypes);
      
      // Save goal frequencies
      if (user) {
        const frequencyUpdates: any = {};
        Object.entries(goalFrequencies).forEach(([key, value]) => {
          const config = [...ibadahGoalConfigs, ...ilmGoalConfigs, ...amanahGoalConfigs].find(c => c.id === key);
          if (config?.frequencyField) {
            frequencyUpdates[config.frequencyField] = value;
          }
        });
        
        if (Object.keys(frequencyUpdates).length > 0) {
          await supabase
            .from('iman_tracker_goals')
            .update({
              ...frequencyUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        }
      }
      
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
    const currentFreq = config.currentFrequency || config.defaultFrequency;

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
            {/* Frequency Toggle */}
            <View style={styles.frequencyToggle}>
              <Text style={styles.frequencyLabel}>Frequency:</Text>
              <View style={styles.frequencyButtons}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    currentFreq === 'daily' && styles.frequencyButtonActive,
                  ]}
                  onPress={() => toggleFrequency(config.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    currentFreq === 'daily' && styles.frequencyButtonTextActive,
                  ]}>
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    currentFreq === 'weekly' && styles.frequencyButtonActive,
                  ]}
                  onPress={() => toggleFrequency(config.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    currentFreq === 'weekly' && styles.frequencyButtonTextActive,
                  ]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{currentValue}</Text>
              <Text style={styles.unitText}>{config.unit}/{currentFreq}</Text>
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
          Customize your spiritual and wellness goals. Toggle any goal off to exclude it from your Iman Tracker score. Switch between daily and weekly frequencies for each goal.
        </Text>
      </View>

      <View style={styles.sectionTabs}>
        {(['ibadah', 'ilm', 'amanah'] as SectionType[]).map((section) => {
          const isActive = activeSection === section;
          const icon = getSectionIcon(section);
          const colors_gradient = getSectionColor(section);

          return (
            <TouchableOpacity
              key={section}
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
              {FARD_PRAYERS.map((prayer, index) => (
                <View key={`fard-prayer-${prayer}-${index}`} style={styles.fardItem}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.fardItemText}>{prayer}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeSection === 'amanah' && (
          <View style={styles.workoutTypeSection}>
            <View style={styles.workoutTypeHeader}>
              <IconSymbol
                ios_icon_name="figure.mixed.cardio"
                android_material_icon_name="fitness-center"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.workoutTypeTitle}>Workout Types (Select Multiple)</Text>
            </View>
            <Text style={styles.workoutTypeDescription}>
              Select all workout types you want to track. You can choose multiple types to match your fitness routine.
            </Text>
            <View style={styles.workoutTypesGrid}>
              {WORKOUT_TYPES.map((type, index) => (
                <TouchableOpacity
                  key={`workout-type-${type.value}-${index}`}
                  style={[
                    styles.workoutTypeCard,
                    selectedWorkoutTypes.includes(type.value) && styles.workoutTypeCardActive,
                  ]}
                  onPress={() => toggleWorkoutType(type.value)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={type.icon.ios}
                    android_material_icon_name={type.icon.android}
                    size={32}
                    color={selectedWorkoutTypes.includes(type.value) ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[
                    styles.workoutTypeLabel,
                    selectedWorkoutTypes.includes(type.value) && styles.workoutTypeLabelActive,
                  ]}>
                    {type.label}
                  </Text>
                  {selectedWorkoutTypes.includes(type.value) && (
                    <View style={styles.checkmarkBadge}>
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={12}
                        color={colors.card}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.selectedTypesInfo}>
              <IconSymbol
                ios_icon_name="info.circle"
                android_material_icon_name="info"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.selectedTypesText}>
                {selectedWorkoutTypes.length} type{selectedWorkoutTypes.length !== 1 ? 's' : ''} selected
              </Text>
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
  workoutTypeSection: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  workoutTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  workoutTypeTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  workoutTypeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  workoutTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  workoutTypeCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  workoutTypeCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  workoutTypeLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  workoutTypeLabelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTypesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.accent + '30',
  },
  selectedTypesText: {
    ...typography.caption,
    color: colors.accent,
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
  frequencyToggle: {
    marginBottom: spacing.md,
  },
  frequencyLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  frequencyButtonText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
