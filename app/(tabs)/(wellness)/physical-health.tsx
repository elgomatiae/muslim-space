
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, RefreshControl, Switch, TextInput, Alert, Modal } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WORKOUT_TYPES = [
  { value: 'general', label: 'General Fitness', icon: { ios: 'figure.mixed.cardio', android: 'fitness-center' } },
  { value: 'cardio', label: 'Cardio', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'strength', label: 'Strength Training', icon: { ios: 'dumbbell.fill', android: 'fitness-center' } },
  { value: 'yoga', label: 'Yoga', icon: { ios: 'figure.yoga', android: 'self-improvement' } },
  { value: 'walking', label: 'Walking', icon: { ios: 'figure.walk', android: 'directions-walk' } },
  { value: 'running', label: 'Running', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'sports', label: 'Sports', icon: { ios: 'sportscourt.fill', android: 'sports' } },
];

interface PhysicalWellnessGoals {
  workout_enabled: boolean;
  sleep_enabled: boolean;
  water_enabled: boolean;
  daily_exercise_minutes_goal: number;
  daily_exercise_minutes_completed: number;
  daily_water_glasses_goal: number;
  daily_water_glasses_completed: number;
  daily_sleep_hours_goal: number;
  daily_sleep_hours_completed: number;
  workout_type: string;
  workout_types: string[];
}

interface WorkoutDurations {
  [key: string]: number;
}

export default function PhysicalHealthScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals, refreshScores } = useImanTracker();
  const [goals, setGoals] = useState<PhysicalWellnessGoals | null>(null);
  const [waterIntakeToday, setWaterIntakeToday] = useState(0);
  const [todayExerciseMinutes, setTodayExerciseMinutes] = useState(0);
  const [todaySleepHours, setTodaySleepHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  
  // Temporary state for editing
  const [tempWorkoutGoal, setTempWorkoutGoal] = useState('30');
  const [tempWaterGoal, setTempWaterGoal] = useState('8');
  const [tempSleepGoal, setTempSleepGoal] = useState('7');
  const [tempWorkoutTypes, setTempWorkoutTypes] = useState<string[]>(['general']);
  const [tempWorkoutEnabled, setTempWorkoutEnabled] = useState(true);
  const [tempWaterEnabled, setTempWaterEnabled] = useState(true);
  const [tempSleepEnabled, setTempSleepEnabled] = useState(true);
  
  // Modal state for multi-workout time entry
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutDurations, setWorkoutDurations] = useState<WorkoutDurations>({});
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadAllData();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGoals(),
        loadTodayStats(),
      ]);
    } catch (error) {
      console.error('Error loading physical health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  const loadGoals = async () => {
    if (!user) return;
    
    let { data, error } = await supabase
      .from('physical_wellness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No goals exist, create default
      const { data: newGoals } = await supabase
        .from('physical_wellness_goals')
        .insert({ 
          user_id: user.id,
          workout_enabled: true,
          sleep_enabled: true,
          water_enabled: true,
          workout_types: ['general'],
        })
        .select()
        .single();
      data = newGoals;
    }

    if (data) {
      setGoals(data);
      setTempWorkoutGoal(data.daily_exercise_minutes_goal.toString());
      setTempWaterGoal(data.daily_water_glasses_goal.toString());
      setTempSleepGoal(data.daily_sleep_hours_goal.toString());
      setTempWorkoutTypes(data.workout_types || [data.workout_type || 'general']);
      setTempWorkoutEnabled(data.workout_enabled ?? true);
      setTempWaterEnabled(data.water_enabled ?? true);
      setTempSleepEnabled(data.sleep_enabled ?? true);
    }
  };

  const loadTodayStats = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Water intake
    const { data: waterData } = await supabase
      .from('water_intake')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('date', today);
    
    const totalWater = waterData?.reduce((sum, entry) => sum + entry.amount_ml, 0) || 0;
    setWaterIntakeToday(Math.floor(totalWater / 250)); // Convert to glasses

    // Exercise minutes today
    const { data: activityData } = await supabase
      .from('physical_activities')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today);
    
    const totalMinutes = activityData?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;
    setTodayExerciseMinutes(totalMinutes);

    // Sleep hours today
    const { data: sleepData } = await supabase
      .from('sleep_tracking')
      .select('sleep_hours')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    
    setTodaySleepHours(sleepData?.sleep_hours ? parseFloat(sleepData.sleep_hours) : 0);
  };

  const addWaterIntake = async (amount: number) => {
    if (!user || !goals?.water_enabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { error } = await supabase
      .from('water_intake')
      .insert({
        user_id: user.id,
        amount_ml: amount,
      });

    if (!error) {
      await loadTodayStats();
      await updateGoalsProgress();
      await refreshScores();
    }
  };

  const openWorkoutModal = () => {
    if (!goals?.workout_enabled) return;
    
    const workoutTypes = goals.workout_types || [goals.workout_type || 'general'];
    
    // Initialize durations for each workout type
    const initialDurations: WorkoutDurations = {};
    workoutTypes.forEach(type => {
      initialDurations[type] = 30; // Default 30 minutes
    });
    
    setWorkoutDurations(initialDurations);
    setShowWorkoutModal(true);
  };

  const addExerciseSession = async () => {
    if (!user || !goals?.workout_enabled) return;
    
    const workoutTypes = goals.workout_types || [goals.workout_type || 'general'];
    
    // If only one workout type, use quick add
    if (workoutTypes.length === 1) {
      await addSingleExerciseSession(30);
      return;
    }
    
    // Multiple workout types - open modal
    openWorkoutModal();
  };

  const addSingleExerciseSession = async (minutes: number) => {
    if (!user || minutes <= 0 || !goals?.workout_enabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const workoutTypes = goals.workout_types || [goals.workout_type || 'general'];
    
    const { error } = await supabase
      .from('physical_activities')
      .insert({
        user_id: user.id,
        activity_type: workoutTypes[0] || 'general',
        duration_minutes: minutes,
        workout_type: workoutTypes[0] || 'general',
        workout_types: workoutTypes,
        is_multi_workout: false,
      });

    if (!error) {
      await loadTodayStats();
      await updateGoalsProgress();
      await refreshScores();
    }
  };

  const saveMultiWorkoutSession = async () => {
    if (!user || !goals?.workout_enabled) return;
    
    // Calculate total duration
    const totalDuration = Object.values(workoutDurations).reduce((sum, duration) => sum + duration, 0);
    
    if (totalDuration === 0) {
      Alert.alert('Error', 'Please enter at least one workout duration.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const workoutTypes = goals.workout_types || [goals.workout_type || 'general'];
    
    const { error } = await supabase
      .from('physical_activities')
      .insert({
        user_id: user.id,
        activity_type: workoutTypes[0] || 'general',
        duration_minutes: totalDuration,
        workout_type: workoutTypes[0] || 'general',
        workout_types: workoutTypes,
        is_multi_workout: true,
        workout_durations: workoutDurations,
      });

    if (!error) {
      setShowWorkoutModal(false);
      await loadTodayStats();
      await updateGoalsProgress();
      await refreshScores();
      Alert.alert('Success', `Logged ${totalDuration} minutes of exercise!`);
    } else {
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    }
  };

  const logSleep = async (hours: number) => {
    if (!user || !goals?.sleep_enabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('sleep_tracking')
      .upsert({
        user_id: user.id,
        sleep_hours: hours,
        date: today,
      });

    if (!error) {
      await loadTodayStats();
      await updateGoalsProgress();
      await refreshScores();
    }
  };

  const updateGoalsProgress = async () => {
    if (!user || !goals) return;

    const updatedGoals = {
      daily_water_glasses_completed: waterIntakeToday,
      daily_exercise_minutes_completed: todayExerciseMinutes,
      daily_sleep_hours_completed: todaySleepHours,
    };

    await supabase
      .from('physical_wellness_goals')
      .update(updatedGoals)
      .eq('user_id', user.id);

    // Update Iman Tracker Amanah goals
    if (amanahGoals) {
      await updateAmanahGoals({
        ...amanahGoals,
        dailyExerciseCompleted: goals.workout_enabled ? todayExerciseMinutes : 0,
        dailyWaterCompleted: goals.water_enabled ? waterIntakeToday : 0,
        dailySleepCompleted: goals.sleep_enabled ? todaySleepHours : 0,
      });
    }

    await loadGoals();
  };

  const toggleWorkoutType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setTempWorkoutTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow removing the last type
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

  const saveGoalSettings = async () => {
    if (!user) return;
    
    if (tempWorkoutTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one workout type.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const { error } = await supabase
      .from('physical_wellness_goals')
      .update({
        daily_exercise_minutes_goal: parseInt(tempWorkoutGoal) || 30,
        daily_water_glasses_goal: parseInt(tempWaterGoal) || 8,
        daily_sleep_hours_goal: parseFloat(tempSleepGoal) || 7,
        workout_type: tempWorkoutTypes[0], // Keep for backward compatibility
        workout_types: tempWorkoutTypes,
        workout_enabled: tempWorkoutEnabled,
        water_enabled: tempWaterEnabled,
        sleep_enabled: tempSleepEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Update Iman Tracker goals
    await supabase
      .from('iman_tracker_goals')
      .upsert({
        user_id: user.id,
        amanah_daily_exercise_goal: tempWorkoutEnabled ? parseInt(tempWorkoutGoal) || 30 : 0,
        amanah_daily_water_goal: tempWaterEnabled ? parseInt(tempWaterGoal) || 8 : 0,
        amanah_daily_sleep_goal: tempSleepEnabled ? parseFloat(tempSleepGoal) || 7 : 0,
        amanah_workout_type: tempWorkoutTypes[0], // Keep for backward compatibility
        amanah_workout_types: tempWorkoutTypes,
        amanah_workout_enabled: tempWorkoutEnabled,
        amanah_sleep_enabled: tempSleepEnabled,
        amanah_water_enabled: tempWaterEnabled,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setEditingGoals(false);
      await loadGoals();
      await refreshScores();
      Alert.alert('Success', 'Your physical wellness goals have been updated!');
    } else {
      Alert.alert('Error', 'Failed to save goals. Please try again.');
    }
  };

  const getWorkoutIcons = () => {
    const types = goals?.workout_types || [goals?.workout_type || 'general'];
    return types.map(type => {
      const workoutType = WORKOUT_TYPES.find(t => t.value === type);
      return workoutType?.icon || WORKOUT_TYPES[0].icon;
    });
  };

  const getWorkoutLabels = () => {
    const types = goals?.workout_types || [goals?.workout_type || 'general'];
    return types.map(type => {
      const workoutType = WORKOUT_TYPES.find(t => t.value === type);
      return workoutType?.label || 'General Fitness';
    }).join(', ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero Section */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeader}>
            <IconSymbol
              ios_icon_name="figure.run"
              android_material_icon_name="directions-run"
              size={48}
              color={colors.card}
            />
            <Text style={styles.heroTitle}>Physical Wellness</Text>
            <Text style={styles.heroSubtitle}>
              Strengthen your body, strengthen your faith
            </Text>
          </View>

          {/* Quick Access to Iman Tracker */}
          <TouchableOpacity
            style={styles.imanTrackerLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(iman)' as any);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={20}
              color={colors.card}
            />
            <Text style={styles.imanTrackerLinkText}>View in Iman Tracker</Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.card}
            />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Settings Toggle */}
      <View style={styles.settingsToggle}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditingGoals(!editingGoals);
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name={editingGoals ? "checkmark.circle.fill" : "gearshape.fill"}
            android_material_icon_name={editingGoals ? "check-circle" : "settings"}
            size={24}
            color={colors.primary}
          />
          <Text style={styles.settingsButtonText}>
            {editingGoals ? 'Done Editing' : 'Adjust Goals'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout Section */}
      <View style={styles.goalSection}>
        <View style={styles.goalSectionHeader}>
          <View style={styles.goalSectionTitleRow}>
            <View style={styles.workoutIconsContainer}>
              {getWorkoutIcons().slice(0, 3).map((icon, index) => (
                <React.Fragment key={index}>
                  <View style={[styles.workoutIconWrapper, index > 0 && styles.workoutIconOverlap]}>
                    <IconSymbol
                      ios_icon_name={icon.ios}
                      android_material_icon_name={icon.android}
                      size={24}
                      color={colors.warning}
                    />
                  </View>
                </React.Fragment>
              ))}
            </View>
            <View style={styles.goalSectionTitleContainer}>
              <Text style={styles.goalSectionTitle}>Workout</Text>
              {!editingGoals && (
                <Text style={styles.goalSectionSubtitle}>{getWorkoutLabels()}</Text>
              )}
            </View>
          </View>
          {editingGoals && (
            <Switch
              value={tempWorkoutEnabled}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTempWorkoutEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          )}
        </View>

        {editingGoals ? (
          <View style={styles.editingContainer}>
            <Text style={styles.editLabel}>Workout Types (Select Multiple)</Text>
            <Text style={styles.editHint}>Choose all workout types you want to track</Text>
            <View style={styles.workoutTypesGrid}>
              {WORKOUT_TYPES.map((type, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.workoutTypeCard,
                      tempWorkoutTypes.includes(type.value) && styles.workoutTypeCardActive,
                      !tempWorkoutEnabled && styles.workoutTypeCardDisabled,
                    ]}
                    onPress={() => {
                      if (tempWorkoutEnabled) {
                        toggleWorkoutType(type.value);
                      }
                    }}
                    activeOpacity={0.7}
                    disabled={!tempWorkoutEnabled}
                  >
                    <IconSymbol
                      ios_icon_name={type.icon.ios}
                      android_material_icon_name={type.icon.android}
                      size={24}
                      color={tempWorkoutTypes.includes(type.value) && tempWorkoutEnabled ? colors.warning : colors.textSecondary}
                    />
                    <Text style={[
                      styles.workoutTypeLabel,
                      tempWorkoutTypes.includes(type.value) && tempWorkoutEnabled && styles.workoutTypeLabelActive,
                    ]}>
                      {type.label}
                    </Text>
                    {tempWorkoutTypes.includes(type.value) && tempWorkoutEnabled && (
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
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.editLabel}>Daily Goal (minutes)</Text>
            <TextInput
              style={[styles.editInput, !tempWorkoutEnabled && styles.editInputDisabled]}
              value={tempWorkoutGoal}
              onChangeText={setTempWorkoutGoal}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textSecondary}
              editable={tempWorkoutEnabled}
            />
          </View>
        ) : (
          <>
            {goals?.workout_enabled ? (
              <>
                <View style={styles.goalProgress}>
                  <LinearGradient
                    colors={colors.gradientWarning}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goalProgressGradient}
                  >
                    <Text style={styles.goalProgressText}>
                      {todayExerciseMinutes} / {goals.daily_exercise_minutes_goal} min
                    </Text>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgressFill,
                          { width: `${Math.min(100, (todayExerciseMinutes / goals.daily_exercise_minutes_goal) * 100)}%` }
                        ]} 
                      />
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => addSingleExerciseSession(15)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientWarning}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>+15 Min</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => addSingleExerciseSession(30)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientWarning}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>+30 Min</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => addSingleExerciseSession(60)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientWarning}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>+60 Min</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Custom Workout Button - Opens modal for multiple workout types */}
                {goals.workout_types && goals.workout_types.length > 1 && (
                  <TouchableOpacity
                    style={styles.customWorkoutButton}
                    onPress={openWorkoutModal}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientWarning}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.customWorkoutButtonGradient}
                    >
                      <IconSymbol
                        ios_icon_name="plus.circle.fill"
                        android_material_icon_name="add-circle"
                        size={20}
                        color={colors.card}
                      />
                      <Text style={styles.customWorkoutButtonText}>Log Custom Workout</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.disabledMessage}>
                <Text style={styles.disabledMessageText}>
                  Workout tracking is disabled. Enable it in settings to track your progress.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Sleep Section */}
      <View style={styles.goalSection}>
        <View style={styles.goalSectionHeader}>
          <View style={styles.goalSectionTitleRow}>
            <IconSymbol
              ios_icon_name="moon.stars.fill"
              android_material_icon_name="bedtime"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.goalSectionTitle}>Sleep</Text>
          </View>
          {editingGoals && (
            <Switch
              value={tempSleepEnabled}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTempSleepEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          )}
        </View>

        {editingGoals ? (
          <View style={styles.editingContainer}>
            <Text style={styles.editLabel}>Daily Goal (hours)</Text>
            <TextInput
              style={[styles.editInput, !tempSleepEnabled && styles.editInputDisabled]}
              value={tempSleepGoal}
              onChangeText={setTempSleepGoal}
              keyboardType="decimal-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary}
              editable={tempSleepEnabled}
            />
            <Text style={styles.editHint}>Recommended: 7-9 hours per night</Text>
          </View>
        ) : (
          <>
            {goals?.sleep_enabled ? (
              <>
                <View style={styles.goalProgress}>
                  <LinearGradient
                    colors={colors.gradientSecondary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goalProgressGradient}
                  >
                    <Text style={styles.goalProgressText}>
                      {todaySleepHours.toFixed(1)} / {goals.daily_sleep_hours_goal} hrs
                    </Text>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgressFill,
                          { width: `${Math.min(100, (todaySleepHours / goals.daily_sleep_hours_goal) * 100)}%` }
                        ]} 
                      />
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => logSleep(6)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientSecondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>6 hrs</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => logSleep(7)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientSecondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>7 hrs</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => logSleep(8)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientSecondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>8 hrs</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.disabledMessage}>
                <Text style={styles.disabledMessageText}>
                  Sleep tracking is disabled. Enable it in settings to track your progress.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Water Section */}
      <View style={styles.goalSection}>
        <View style={styles.goalSectionHeader}>
          <View style={styles.goalSectionTitleRow}>
            <IconSymbol
              ios_icon_name="drop.fill"
              android_material_icon_name="water-drop"
              size={32}
              color={colors.info}
            />
            <Text style={styles.goalSectionTitle}>Water Intake</Text>
          </View>
          {editingGoals && (
            <Switch
              value={tempWaterEnabled}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTempWaterEnabled(value);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          )}
        </View>

        {editingGoals ? (
          <View style={styles.editingContainer}>
            <Text style={styles.editLabel}>Daily Goal (glasses)</Text>
            <TextInput
              style={[styles.editInput, !tempWaterEnabled && styles.editInputDisabled]}
              value={tempWaterGoal}
              onChangeText={setTempWaterGoal}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={colors.textSecondary}
              editable={tempWaterEnabled}
            />
            <Text style={styles.editHint}>1 glass = 250ml. Recommended: 8 glasses per day</Text>
          </View>
        ) : (
          <>
            {goals?.water_enabled ? (
              <>
                <View style={styles.goalProgress}>
                  <LinearGradient
                    colors={colors.gradientInfo}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.goalProgressGradient}
                  >
                    <Text style={styles.goalProgressText}>
                      {waterIntakeToday} / {goals.daily_water_glasses_goal} glasses
                    </Text>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgressFill,
                          { width: `${Math.min(100, (waterIntakeToday / goals.daily_water_glasses_goal) * 100)}%` }
                        ]} 
                      />
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => addWaterIntake(250)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientInfo}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>+1 Glass</Text>
                      <Text style={styles.quickButtonSubtext}>(250ml)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickButton}
                    onPress={() => addWaterIntake(500)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={colors.gradientInfo}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickButtonGradient}
                    >
                      <Text style={styles.quickButtonText}>+2 Glasses</Text>
                      <Text style={styles.quickButtonSubtext}>(500ml)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.disabledMessage}>
                <Text style={styles.disabledMessageText}>
                  Water tracking is disabled. Enable it in settings to track your progress.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Save Button (only visible when editing) */}
      {editingGoals && (
        <TouchableOpacity style={styles.saveButton} onPress={saveGoalSettings} activeOpacity={0.8}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.card}
            />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Islamic Reminder */}
      <View style={styles.reminderSection}>
        <LinearGradient
          colors={colors.gradientTeal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reminderGradient}
        >
          <IconSymbol
            ios_icon_name="quote.opening"
            android_material_icon_name="format-quote"
            size={32}
            color={colors.card}
          />
          <Text style={styles.reminderText}>
            &quot;Your body has a right over you.&quot;
          </Text>
          <Text style={styles.reminderSource}>Prophet Muhammad (ﷺ)</Text>
        </LinearGradient>
      </View>

      <View style={styles.bottomPadding} />

      {/* Multi-Workout Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Workout</Text>
              <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the duration for each workout type
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {goals?.workout_types?.map((type, index) => {
                const workoutType = WORKOUT_TYPES.find(t => t.value === type);
                if (!workoutType) return null;

                return (
                  <React.Fragment key={index}>
                    <View style={styles.workoutDurationItem}>
                      <View style={styles.workoutDurationHeader}>
                        <IconSymbol
                          ios_icon_name={workoutType.icon.ios}
                          android_material_icon_name={workoutType.icon.android}
                          size={24}
                          color={colors.warning}
                        />
                        <Text style={styles.workoutDurationLabel}>{workoutType.label}</Text>
                      </View>
                      <View style={styles.workoutDurationInputContainer}>
                        <TextInput
                          style={styles.workoutDurationInput}
                          value={workoutDurations[type]?.toString() || '0'}
                          onChangeText={(value) => {
                            setWorkoutDurations(prev => ({
                              ...prev,
                              [type]: parseInt(value) || 0,
                            }));
                          }}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                        />
                        <Text style={styles.workoutDurationUnit}>min</Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.modalTotalText}>
                Total: {Object.values(workoutDurations).reduce((sum, duration) => sum + duration, 0)} minutes
              </Text>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveMultiWorkoutSession}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradientWarning}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color={colors.card}
                  />
                  <Text style={styles.modalSaveButtonText}>Log Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },
  heroSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  heroGradient: {
    padding: spacing.xxl,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
  },
  imanTrackerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  imanTrackerLinkText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  settingsToggle: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  settingsButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  goalSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  goalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  goalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  goalSectionTitleContainer: {
    flex: 1,
  },
  goalSectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  goalSectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  workoutIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  workoutIconOverlap: {
    marginLeft: -8,
  },
  editingContainer: {
    marginTop: spacing.md,
  },
  editLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  editInput: {
    ...typography.h2,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editInputDisabled: {
    opacity: 0.5,
    backgroundColor: colors.border,
  },
  editHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  workoutTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  workoutTypeCard: {
    width: '31%',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  workoutTypeCardActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '20',
  },
  workoutTypeCardDisabled: {
    opacity: 0.5,
  },
  workoutTypeLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 10,
  },
  workoutTypeLabelActive: {
    color: colors.warning,
    fontWeight: '700',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalProgress: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  goalProgressGradient: {
    padding: spacing.lg,
  },
  goalProgressText: {
    ...typography.h3,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  quickButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  quickButtonSubtext: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  customWorkoutButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  customWorkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  customWorkoutButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  disabledMessage: {
    backgroundColor: colors.highlight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  disabledMessageText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  saveButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  reminderSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  reminderGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  reminderText: {
    ...typography.h3,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  reminderSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  bottomPadding: {
    height: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  workoutDurationItem: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutDurationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  workoutDurationLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  workoutDurationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  workoutDurationInput: {
    ...typography.h3,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutDurationUnit: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  modalTotalText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSaveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  modalSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  modalSaveButtonText: {
    ...typography.h4,
    color: colors.card,
  },
});
