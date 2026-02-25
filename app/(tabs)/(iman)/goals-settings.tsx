
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput } from "react-native";
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
import { useTranslation } from "@/contexts/I18nContext";

type SectionType = 'ibadah' | 'ilm' | 'amanah';
type FrequencyType = 'daily' | 'weekly';

interface ExerciseGoal {
  id: string;
  workoutType: string;
  amount: number;
  frequency: FrequencyType;
}

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
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { ibadahGoals, ilmGoals, amanahGoals, updateIbadahGoals, updateIlmGoals, updateAmanahGoals, refreshScores } = useImanTracker();
  
  const [activeSection, setActiveSection] = useState<SectionType>((params.section as SectionType) || 'ibadah');
  const [localIbadahGoals, setLocalIbadahGoals] = useState<IbadahGoals | null>(null);
  const [localIlmGoals, setLocalIlmGoals] = useState<IlmGoals | null>(null);
  const [localAmanahGoals, setLocalAmanahGoals] = useState<AmanahGoals | null>(null);
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>(['general']);
  const [goalFrequencies, setGoalFrequencies] = useState<{ [key: string]: FrequencyType }>({});
  const [exerciseGoals, setExerciseGoals] = useState<ExerciseGoal[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editingExerciseGoal, setEditingExerciseGoal] = useState<ExerciseGoal | null>(null);

  useEffect(() => {
    if (ibadahGoals) setLocalIbadahGoals({ ...ibadahGoals });
    if (ilmGoals) setLocalIlmGoals({ ...ilmGoals });
    if (amanahGoals) {
      setLocalAmanahGoals({ ...amanahGoals });
      loadExerciseGoals(amanahGoals);
    }
    loadWorkoutTypes();
    loadGoalFrequencies();
  }, [ibadahGoals, ilmGoals, amanahGoals]);

  const loadExerciseGoals = (goals: AmanahGoals) => {
    const loadedGoals: ExerciseGoal[] = [];
    if (goals.workoutTypeGoals) {
      Object.entries(goals.workoutTypeGoals).forEach(([type, typeGoals], index) => {
        if (typeGoals.daily && typeGoals.daily > 0) {
          loadedGoals.push({
            id: `${type}-daily-${index}-${Date.now()}`,
            workoutType: type,
            amount: typeGoals.daily,
            frequency: 'daily',
          });
        }
        if (typeGoals.weekly && typeGoals.weekly > 0) {
          loadedGoals.push({
            id: `${type}-weekly-${index}-${Date.now()}`,
            workoutType: type,
            amount: typeGoals.weekly,
            frequency: 'weekly',
          });
        }
      });
    }
    // If no workout type goals exist but dailyExerciseGoal exists, migrate it
    if (loadedGoals.length === 0 && goals.dailyExerciseGoal > 0) {
      const defaultType = goals.workout_types?.[0] || goals.workout_type || 'general';
      loadedGoals.push({
        id: `${defaultType}-daily-migrated-${Date.now()}`,
        workoutType: defaultType,
        amount: goals.dailyExerciseGoal,
        frequency: 'daily',
      });
    }
    setExerciseGoals(loadedGoals);
  };

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
      if (data.quizzes_goal_frequency) frequencies.quizzes = data.quizzes_goal_frequency;
      if (data.reflection_goal_frequency) frequencies.reflection = data.reflection_goal_frequency;
      if (data.exercise_goal_frequency) frequencies.exercise = data.exercise_goal_frequency;
      if (data.water_goal_frequency) frequencies.water = data.water_goal_frequency;
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
          Alert.alert(t('common.error'), t('iman.mustSelectWorkoutType'));
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

  const addExerciseGoal = () => {
    const availableTypes = WORKOUT_TYPES.filter(
      type => !exerciseGoals.some(goal => goal.workoutType === type.value && goal.frequency === 'daily') &&
               !exerciseGoals.some(goal => goal.workoutType === type.value && goal.frequency === 'weekly')
    );
    
    if (availableTypes.length === 0) {
      Alert.alert(t('common.error'), 'All workout types already have goals. Please remove one first.');
      return;
    }
    
    setEditingExerciseGoal({
      id: `new-${Date.now()}`,
      workoutType: availableTypes[0].value,
      amount: 30,
      frequency: 'daily',
    });
    setShowAddExerciseModal(true);
  };

  const editExerciseGoal = (goal: ExerciseGoal) => {
    setEditingExerciseGoal({ ...goal });
    setShowAddExerciseModal(true);
  };

  const removeExerciseGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Remove Exercise Goal',
      'Are you sure you want to remove this exercise goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setExerciseGoals(prev => prev.filter(g => g.id !== id));
          },
        },
      ]
    );
  };

  const saveExerciseGoal = () => {
    if (!editingExerciseGoal) return;
    
    if (editingExerciseGoal.amount <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount (greater than 0).');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (editingExerciseGoal.id.startsWith('new-')) {
      // New goal
      setExerciseGoals(prev => [...prev, { ...editingExerciseGoal }]);
    } else {
      // Update existing
      setExerciseGoals(prev =>
        prev.map(g => g.id === editingExerciseGoal.id ? editingExerciseGoal : g)
      );
    }
    
    setShowAddExerciseModal(false);
    setEditingExerciseGoal(null);
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
      id: 'water',
      label: 'Daily Water Intake',
      description: 'Track how many glasses of water you drink each day',
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
      id: 'sleep',
      label: 'Daily Sleep',
      description: 'Track your sleep duration each night',
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
    {
      id: 'meditation',
      label: 'Meditation & Mindfulness',
      description: 'Track meditation or mindfulness sessions per week',
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
      label: 'Journaling & Reflection',
      description: 'Track journal entries or reflection sessions per week',
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
    
    const isCurrentlyEnabled = currentValue > 0;
    const newValue = isCurrentlyEnabled ? 0 : getDefaultValue(goalField);
    
    // Find the goal config to get the completed field
    const allConfigs = [...ibadahGoalConfigs, ...ilmGoalConfigs, ...amanahGoalConfigs];
    const config = allConfigs.find(c => c.goalField === goalField);
    
    // If enabling a goal (was 0, now > 0), reset the completed field to 0
    if (!isCurrentlyEnabled && config?.completedField) {
      switch (activeSection) {
        case 'ibadah':
          if (localIbadahGoals) {
            setLocalIbadahGoals({
              ...localIbadahGoals,
              [goalField]: newValue,
              [config.completedField]: 0, // Reset completed to 0 when enabling
            });
            return; // Early return, already updated
          }
          break;
        case 'ilm':
          if (localIlmGoals) {
            setLocalIlmGoals({
              ...localIlmGoals,
              [goalField]: newValue,
              [config.completedField]: 0, // Reset completed to 0 when enabling
            });
            return; // Early return, already updated
          }
          break;
        case 'amanah':
          if (localAmanahGoals) {
            setLocalAmanahGoals({
              ...localAmanahGoals,
              [goalField]: newValue,
              [config.completedField]: 0, // Reset completed to 0 when enabling
            });
            return; // Early return, already updated
          }
          break;
      }
    }
    
    // If disabling, just update the goal value
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
      weeklyMeditationGoal: 2,
      weeklyJournalGoal: 2,
      dailySleepGoal: 7,
      weeklyStressManagementGoal: 2,
    };
    return defaults[goalField] || 1;
  };

  const saveGoals = async () => {
    try {
      // Build workoutTypeGoals from exerciseGoals
      const workoutTypeGoals: { [key: string]: { daily?: number; weekly?: number } } = {};
      const allWorkoutTypes = new Set<string>();
      
      exerciseGoals.forEach(goal => {
        if (!workoutTypeGoals[goal.workoutType]) {
          workoutTypeGoals[goal.workoutType] = {};
        }
        workoutTypeGoals[goal.workoutType][goal.frequency] = goal.amount;
        allWorkoutTypes.add(goal.workoutType);
      });

      // Prepare updated goals
      let updatedAmanahGoals: AmanahGoals | null = null;
      if (localAmanahGoals) {
        updatedAmanahGoals = {
          ...localAmanahGoals,
          workoutTypeGoals: Object.keys(workoutTypeGoals).length > 0 ? workoutTypeGoals : undefined,
          dailyExerciseGoal: exerciseGoals
            .filter(g => g.frequency === 'daily')
            .reduce((sum, g) => sum + g.amount, 0),
        };
      }

      // Update state immediately (optimistic UI updates)
      // The update functions update state synchronously first, then save in background
      if (localIbadahGoals) {
        updateIbadahGoals(localIbadahGoals).catch(err => console.log('Background save error:', err));
      }
      if (localIlmGoals) {
        updateIlmGoals(localIlmGoals).catch(err => console.log('Background save error:', err));
      }
      if (updatedAmanahGoals) {
        updateAmanahGoals(updatedAmanahGoals).catch(err => console.log('Background save error:', err));
      }

      // Show success immediately (state is already updated optimistically)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('common.success'), t('iman.goalsSaved'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);

      // Continue with database operations in background (non-blocking)
      (async () => {
        try {
          
          // Database operations in parallel (non-critical, can happen after)
          if (user && updatedAmanahGoals) {
            const workoutTypesArray = Array.from(allWorkoutTypes);
            
            const dbPromises = [
              supabase
                .from('physical_wellness_goals')
                .upsert({
                  user_id: user.id,
                  daily_exercise_minutes_goal: updatedAmanahGoals.dailyExerciseGoal || 0,
                  daily_water_glasses_goal: updatedAmanahGoals.dailyWaterGoal || 0,
                  daily_sleep_hours_goal: updatedAmanahGoals.dailySleepGoal || 0,
                  workout_enabled: exerciseGoals.length > 0,
                  water_enabled: (updatedAmanahGoals.dailyWaterGoal || 0) > 0,
                  sleep_enabled: (updatedAmanahGoals.dailySleepGoal || 0) > 0,
                  workout_type: workoutTypesArray[0] || 'general',
                  workout_types: workoutTypesArray.length > 0 ? workoutTypesArray : ['general'],
                  updated_at: new Date().toISOString(),
                }),
            ];
            
            if (workoutTypesArray.length > 0) {
              dbPromises.push(saveWorkoutTypes(workoutTypesArray));
            }
            
            // Save goal frequencies
            const frequencyUpdates: any = {};
            Object.entries(goalFrequencies).forEach(([key, value]) => {
              const config = [...ibadahGoalConfigs, ...ilmGoalConfigs, ...amanahGoalConfigs].find(c => c.id === key);
              if (config?.frequencyField) {
                frequencyUpdates[config.frequencyField] = value;
              }
            });
            
            if (Object.keys(frequencyUpdates).length > 0) {
              dbPromises.push(
                supabase
                  .from('iman_tracker_goals')
                  .update({
                    ...frequencyUpdates,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('user_id', user.id)
              );
            }
            
            // Run database operations in background (don't wait)
            Promise.all(dbPromises).catch(err => {
              console.log('Background database save error:', err);
            });
          }
        } catch (error) {
          console.log('Background save error:', error);
          // Don't show error to user - they already saw success
          // The state was updated optimistically, so UI is consistent
        }
      })();
      
    } catch (error) {
      console.log('Error saving goals:', error);
      const { getErrorMessage } = require('@/utils/errorHandler');
      Alert.alert(t('common.error'), getErrorMessage(error) || t('iman.failedToSaveGoals'));
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
          <View style={styles.exerciseGoalsSection}>
            <View style={styles.exerciseGoalsHeader}>
              <View>
                <Text style={styles.exerciseGoalsTitle}>Exercise Goals</Text>
                <Text style={styles.exerciseGoalsDescription}>
                  Track your physical activity by setting goals for specific exercise types (cardio, strength, yoga, etc.). Each goal can be set for daily or weekly frequency with a target duration in minutes.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={addExerciseGoal}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.addExerciseButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
            
            {exerciseGoals.length === 0 ? (
              <View style={styles.emptyExerciseGoals}>
                <IconSymbol
                  ios_icon_name="figure.mixed.cardio"
                  android_material_icon_name="fitness-center"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyExerciseGoalsText}>
                  No exercise goals set yet
                </Text>
                <Text style={styles.emptyExerciseGoalsSubtext}>
                  Tap "Add Goal" to create your first exercise goal
                </Text>
              </View>
            ) : (
              exerciseGoals.map((goal) => {
                const workoutType = WORKOUT_TYPES.find(t => t.value === goal.workoutType);
                return (
                  <View key={goal.id} style={styles.exerciseGoalCard}>
                    <View style={styles.exerciseGoalHeader}>
                      <View style={styles.exerciseGoalTypeInfo}>
                        <IconSymbol
                          ios_icon_name={workoutType?.icon.ios || 'figure.mixed.cardio'}
                          android_material_icon_name={workoutType?.icon.android || 'fitness-center'}
                          size={24}
                          color={colors.primary}
                        />
                        <View style={styles.exerciseGoalTypeDetails}>
                          <Text style={styles.exerciseGoalTypeLabel}>
                            {workoutType?.label || 'General Fitness'}
                          </Text>
                          <Text style={styles.exerciseGoalFrequency}>
                            {goal.frequency === 'daily' ? 'Daily' : 'Weekly'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.exerciseGoalActions}>
                        <Text style={styles.exerciseGoalAmount}>
                          {goal.amount} min
                        </Text>
                        <TouchableOpacity
                          onPress={() => editExerciseGoal(goal)}
                          style={styles.editExerciseButton}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            ios_icon_name="pencil"
                            android_material_icon_name="edit"
                            size={18}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeExerciseGoal(goal.id)}
                          style={styles.removeExerciseButton}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            ios_icon_name="trash"
                            android_material_icon_name="delete"
                            size={18}
                            color={colors.error || '#EF4444'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={styles.goalsSection}>
          <Text style={styles.goalsSectionTitle}>
            {activeSection === 'ibadah' ? 'Optional Worship Goals' : activeSection === 'amanah' ? 'Wellness Goals' : 'Goals'}
          </Text>
          {getCurrentConfigs().map(config => renderGoalItem(config))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add/Edit Exercise Goal Modal */}
      <Modal
        visible={showAddExerciseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddExerciseModal(false);
          setEditingExerciseGoal(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExerciseGoal?.id.startsWith('new-') ? 'Add Exercise Goal' : 'Edit Exercise Goal'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddExerciseModal(false);
                  setEditingExerciseGoal(null);
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            {editingExerciseGoal && (
              <ScrollView style={styles.modalBody}>
                {/* Workout Type Selection */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Workout Type</Text>
                  <View style={styles.modalWorkoutTypesGrid}>
                    {WORKOUT_TYPES.map((type) => {
                      const isSelected = editingExerciseGoal.workoutType === type.value;
                      const isDisabled = exerciseGoals.some(
                        g => g.workoutType === type.value && 
                             g.frequency === editingExerciseGoal.frequency &&
                             g.id !== editingExerciseGoal.id
                      );
                      return (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.modalWorkoutTypeCard,
                            isSelected && styles.modalWorkoutTypeCardActive,
                            isDisabled && styles.modalWorkoutTypeCardDisabled,
                          ]}
                          onPress={() => {
                            if (!isDisabled) {
                              setEditingExerciseGoal({ ...editingExerciseGoal, workoutType: type.value });
                            }
                          }}
                          disabled={isDisabled}
                          activeOpacity={0.7}
                        >
                          <IconSymbol
                            ios_icon_name={type.icon.ios}
                            android_material_icon_name={type.icon.android}
                            size={24}
                            color={isSelected ? colors.primary : (isDisabled ? colors.border : colors.textSecondary)}
                          />
                          <Text style={[
                            styles.modalWorkoutTypeLabel,
                            isSelected && styles.modalWorkoutTypeLabelActive,
                            isDisabled && styles.modalWorkoutTypeLabelDisabled,
                          ]}>
                            {type.label}
                          </Text>
                          {isDisabled && (
                            <Text style={styles.modalWorkoutTypeDisabledText}>
                              Already set
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Frequency Selection */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Frequency</Text>
                  <View style={styles.modalFrequencyButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalFrequencyButton,
                        editingExerciseGoal.frequency === 'daily' && styles.modalFrequencyButtonActive,
                      ]}
                      onPress={() => {
                        // Check if this type already has a daily goal
                        const hasDaily = exerciseGoals.some(
                          g => g.workoutType === editingExerciseGoal.workoutType && 
                               g.frequency === 'daily' &&
                               g.id !== editingExerciseGoal.id
                        );
                        if (!hasDaily) {
                          setEditingExerciseGoal({ ...editingExerciseGoal, frequency: 'daily' });
                        } else {
                          Alert.alert('Already Set', 'This workout type already has a daily goal.');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.modalFrequencyButtonText,
                        editingExerciseGoal.frequency === 'daily' && styles.modalFrequencyButtonTextActive,
                      ]}>
                        Daily
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalFrequencyButton,
                        editingExerciseGoal.frequency === 'weekly' && styles.modalFrequencyButtonActive,
                      ]}
                      onPress={() => {
                        // Check if this type already has a weekly goal
                        const hasWeekly = exerciseGoals.some(
                          g => g.workoutType === editingExerciseGoal.workoutType && 
                               g.frequency === 'weekly' &&
                               g.id !== editingExerciseGoal.id
                        );
                        if (!hasWeekly) {
                          setEditingExerciseGoal({ ...editingExerciseGoal, frequency: 'weekly' });
                        } else {
                          Alert.alert('Already Set', 'This workout type already has a weekly goal.');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.modalFrequencyButtonText,
                        editingExerciseGoal.frequency === 'weekly' && styles.modalFrequencyButtonTextActive,
                      ]}>
                        Weekly
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Duration (minutes)</Text>
                  <View style={styles.modalAmountControls}>
                    <TouchableOpacity
                      style={styles.modalAmountButton}
                      onPress={() => {
                        if (editingExerciseGoal.amount > 5) {
                          setEditingExerciseGoal({ ...editingExerciseGoal, amount: editingExerciseGoal.amount - 5 });
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
                    <TextInput
                      style={styles.modalAmountInput}
                      value={editingExerciseGoal.amount.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        if (num >= 0 && num <= 300) {
                          setEditingExerciseGoal({ ...editingExerciseGoal, amount: num });
                        }
                      }}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      style={styles.modalAmountButton}
                      onPress={() => {
                        if (editingExerciseGoal.amount < 300) {
                          setEditingExerciseGoal({ ...editingExerciseGoal, amount: editingExerciseGoal.amount + 5 });
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
                  <Text style={styles.modalAmountHint}>Range: 5 - 300 minutes</Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={saveExerciseGoal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSaveButtonText}>Save Goal</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  workoutTypeSelectionInline: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  workoutTypeSelectionLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  workoutTypeSelectionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  workoutTypesGridInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  workoutTypeCardInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    minWidth: 100,
  },
  workoutTypeCardInlineActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  workoutTypeLabelInline: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
  },
  workoutTypeLabelInlineActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  checkmarkBadgeInline: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  selectedTypesInfoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  selectedTypesTextInline: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    fontSize: 11,
  },
  exerciseGoalsSection: {
    marginBottom: spacing.xl,
  },
  exerciseGoalsHeader: {
    marginBottom: spacing.md,
  },
  exerciseGoalsTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  exerciseGoalsDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addExerciseButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  emptyExerciseGoals: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyExerciseGoalsText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptyExerciseGoalsSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  exerciseGoalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  exerciseGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseGoalTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  exerciseGoalTypeDetails: {
    flex: 1,
  },
  exerciseGoalTypeLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  exerciseGoalFrequency: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exerciseGoalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseGoalAmount: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  editExerciseButton: {
    padding: spacing.xs,
  },
  removeExerciseButton: {
    padding: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalWorkoutTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalWorkoutTypeCard: {
    width: '31%',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalWorkoutTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  modalWorkoutTypeCardDisabled: {
    opacity: 0.5,
    borderColor: colors.border,
  },
  modalWorkoutTypeLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalWorkoutTypeLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalWorkoutTypeLabelDisabled: {
    color: colors.border,
  },
  modalWorkoutTypeDisabledText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  modalFrequencyButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalFrequencyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalFrequencyButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  modalFrequencyButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalFrequencyButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalAmountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  modalAmountButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalAmountInput: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalAmountHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalSaveButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
});
