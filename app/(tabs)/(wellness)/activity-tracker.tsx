
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { supabase } from "@/lib/supabase";

const WORKOUT_TYPES = [
  { value: 'general', label: 'General Fitness', icon: { ios: 'figure.mixed.cardio', android: 'fitness-center' } },
  { value: 'cardio', label: 'Cardio', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'strength', label: 'Strength Training', icon: { ios: 'dumbbell.fill', android: 'fitness-center' } },
  { value: 'yoga', label: 'Yoga', icon: { ios: 'figure.yoga', android: 'self-improvement' } },
  { value: 'walking', label: 'Walking', icon: { ios: 'figure.walk', android: 'directions-walk' } },
  { value: 'running', label: 'Running', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'sports', label: 'Sports', icon: { ios: 'sportscourt.fill', android: 'sports' } },
];

interface WorkoutDurations {
  [key: string]: number;
}

export default function ActivityTrackerScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals, refreshData } = useImanTracker();
  const [refreshing, setRefreshing] = useState(false);
  const [todayExerciseMinutes, setTodayExerciseMinutes] = useState(0);
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(['general']);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutDurations, setWorkoutDurations] = useState<WorkoutDurations>({});
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [tempGoal, setTempGoal] = useState('30');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Animation values
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const glowAnim = useMemo(() => new Animated.Value(0), []);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    loadData();
    
    // Animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, glowAnim, rotateAnim]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load workout types from goals
      const { data: goalsData } = await supabase
        .from('physical_wellness_goals')
        .select('workout_types, workout_type')
        .eq('user_id', user.id)
        .single();
      
      if (goalsData) {
        setWorkoutTypes(goalsData.workout_types || [goalsData.workout_type || 'general']);
      }
      
      // Load today's exercise
      const today = new Date().toISOString().split('T')[0];
      const { data: activityData } = await supabase
        .from('physical_activities')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('date', today);
      
      const totalMinutes = activityData?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;
      setTodayExerciseMinutes(totalMinutes);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const openWorkoutModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Initialize durations for each workout type
    const initialDurations: WorkoutDurations = {};
    workoutTypes.forEach(type => {
      initialDurations[type] = 30;
    });
    
    setWorkoutDurations(initialDurations);
    setShowWorkoutModal(true);
  };

  const addQuickWorkout = async (minutes: number) => {
    if (!user || minutes <= 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
      const newTotal = todayExerciseMinutes + minutes;
      setTodayExerciseMinutes(newTotal);
      await updateGoalsProgress(newTotal);
      await refreshData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show completion modal if goal reached
      if (amanahGoals && newTotal >= amanahGoals.dailyExerciseGoal && todayExerciseMinutes < amanahGoals.dailyExerciseGoal) {
        setShowCompletionModal(true);
      }
    }
  };

  const saveMultiWorkoutSession = async () => {
    if (!user) return;
    
    const totalDuration = Object.values(workoutDurations).reduce((sum, duration) => sum + duration, 0);
    
    if (totalDuration === 0) {
      Alert.alert('Error', 'Please enter at least one workout duration.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
      const newTotal = todayExerciseMinutes + totalDuration;
      setTodayExerciseMinutes(newTotal);
      await updateGoalsProgress(newTotal);
      await refreshData();
      Alert.alert('Success', `Logged ${totalDuration} minutes of exercise!`);
      
      // Show completion modal if goal reached
      if (amanahGoals && newTotal >= amanahGoals.dailyExerciseGoal && todayExerciseMinutes < amanahGoals.dailyExerciseGoal) {
        setShowCompletionModal(true);
      }
    } else {
      Alert.alert('Error', 'Failed to log workout. Please try again.');
    }
  };

  const updateGoalsProgress = async (newTotal: number) => {
    if (!user || !amanahGoals) return;

    console.log('💪 Updating Iman Tracker with exercise progress:', newTotal, 'minutes');
    
    await updateAmanahGoals({
      ...amanahGoals,
      dailyExerciseCompleted: newTotal,
    });
  };

  const updateGoal = async () => {
    if (!user || !amanahGoals) return;
    
    const newGoal = parseInt(tempGoal) || 30;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await updateAmanahGoals({
      ...amanahGoals,
      dailyExerciseGoal: newGoal,
    });
    
    setShowGoalsModal(false);
    Alert.alert('Success', 'Your activity goal has been updated!');
  };

  // Ring configuration
  const centerX = 200;
  const centerY = 200;
  const radius = 150;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  const goal = amanahGoals?.dailyExerciseGoal || 30;
  const completed = todayExerciseMinutes;
  const progress = Math.min(1, completed / goal);
  const offset = circumference * (1 - progress);
  
  const ringColor = '#F59E0B'; // Amber/Gold for activity
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "Masha'Allah! Goal achieved! 🌟";
    if (percentage >= 80) return "Almost there! Keep going! 💪";
    if (percentage >= 60) return "Great progress! 🔥";
    if (percentage >= 40) return "You're doing well! ✨";
    if (percentage >= 20) return "Good start! Keep moving! 🚀";
    return "Let's get moving! 💫";
  };

  const percentage = Math.round(progress * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Tracker</Text>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTempGoal(goal.toString());
            setShowGoalsModal(true);
          }}
          style={styles.settingsButton}
        >
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Ring Display */}
        <LinearGradient
          colors={['#FFFFFF', '#F5F7FA', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ringContainer}
        >
          <View style={styles.ringsWrapper}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={400} height={400}>
                <Defs>
                  <SvgRadialGradient id="glow" cx="50%" cy="50%">
                    <Stop offset="0%" stopColor={ringColor} stopOpacity="0.3" />
                    <Stop offset="100%" stopColor={ringColor} stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                
                <Animated.View style={{ opacity: glowOpacity }}>
                  <Circle
                    cx={centerX}
                    cy={centerY}
                    r={180}
                    fill="url(#glow)"
                  />
                </Animated.View>
                
                {/* Background ring */}
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke="#E5E7EB"
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={0.3}
                />
                
                {/* Progress ring */}
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${centerX}, ${centerY}`}
                />
              </Svg>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.centerContentWrapper}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Animated.View 
                style={[
                  styles.centerContent,
                  {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <IconSymbol
                  ios_icon_name="figure.mixed.cardio"
                  android_material_icon_name="fitness-center"
                  size={48}
                  color={ringColor}
                />
                <Text style={styles.centerTitle}>Activity</Text>
                <Text style={[styles.centerPercentage, { color: ringColor }]}>{percentage}%</Text>
                <Text style={styles.centerSubtitle}>{completed} / {goal} min</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Motivational Message */}
          <View style={styles.motivationalContainer}>
            <Text style={styles.motivationalText}>
              {getMotivationalMessage(percentage)}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="local-fire-department"
                size={24}
                color={ringColor}
              />
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statLabel}>Minutes Today</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="target"
                android_material_icon_name="flag"
                size={24}
                color={ringColor}
              />
              <Text style={styles.statValue}>{goal}</Text>
              <Text style={styles.statLabel}>Daily Goal</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="chart.line.uptrend.xyaxis"
                android_material_icon_name="trending-up"
                size={24}
                color={ringColor}
              />
              <Text style={styles.statValue}>{Math.max(0, goal - completed)}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => addQuickWorkout(15)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>15 min</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => addQuickWorkout(30)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>30 min</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => addQuickWorkout(60)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>60 min</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {workoutTypes.length > 1 && (
            <TouchableOpacity
              style={styles.customWorkoutButton}
              onPress={openWorkoutModal}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.customWorkoutGradient}
              >
                <IconSymbol
                  ios_icon_name="list.bullet.clipboard.fill"
                  android_material_icon_name="assignment"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.customWorkoutText}>Log Custom Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Connection to Iman Tracker */}
        <TouchableOpacity
          style={styles.imanTrackerCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/(iman)' as any);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientOcean}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imanTrackerGradient}
          >
            <View style={styles.imanTrackerContent}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={32}
                color={colors.card}
              />
              <View style={styles.imanTrackerTextContainer}>
                <Text style={styles.imanTrackerTitle}>Connected to Iman Tracker</Text>
                <Text style={styles.imanTrackerSubtitle}>
                  Your activity contributes to the Amanah ring
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward"
                size={28}
                color={colors.card}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Islamic Reminder */}
        <View style={styles.reminderCard}>
          <LinearGradient
            colors={colors.gradientTeal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.reminderGradient}
          >
            <IconSymbol
              ios_icon_name="quote.opening"
              android_material_icon_name="format-quote"
              size={28}
              color={colors.card}
            />
            <Text style={styles.reminderText}>
              &quot;Your body has a right over you.&quot;
            </Text>
            <Text style={styles.reminderSource}>Prophet Muhammad (ﷺ)</Text>
          </LinearGradient>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

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
              {workoutTypes.map((type, index) => {
                const workoutType = WORKOUT_TYPES.find(t => t.value === type);
                if (!workoutType) return null;

                return (
                  <View key={index} style={styles.workoutDurationItem}>
                    <View style={styles.workoutDurationHeader}>
                      <IconSymbol
                        ios_icon_name={workoutType.icon.ios}
                        android_material_icon_name={workoutType.icon.android}
                        size={24}
                        color={ringColor}
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

      {/* Goals Modal */}
      <Modal
        visible={showGoalsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalsModalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many minutes of activity per day?
            </Text>
            
            <TextInput
              style={styles.goalInput}
              value={tempGoal}
              onChangeText={setTempGoal}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textSecondary}
            />
            
            <View style={styles.goalsModalButtons}>
              <TouchableOpacity
                style={styles.goalsModalButton}
                onPress={() => setShowGoalsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.goalsModalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goalsModalButtonPrimary}
                onPress={updateGoal}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.goalsModalButtonGradient}
                >
                  <Text style={styles.goalsModalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModalContent}>
            <LinearGradient
              colors={colors.gradientSuccess}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completionGradient}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.card}
              />
              <Text style={styles.completionTitle}>Goal Achieved!</Text>
              <Text style={styles.completionMessage}>
                Masha&apos;Allah! You&apos;ve completed your daily activity goal. Your progress has been updated in the Iman Tracker.
              </Text>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => setShowCompletionModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.completionButtonText}>Continue</Text>
              </TouchableOpacity>
            </LinearGradient>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  ringsWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 400,
    height: 400,
  },
  centerContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  centerPercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 64,
    marginTop: spacing.xs,
  },
  centerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  motivationalContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  motivationalText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  quickActionText: {
    ...typography.bodyBold,
    color: colors.card,
    marginTop: spacing.sm,
  },
  customWorkoutButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  customWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  customWorkoutText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  imanTrackerCard: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  imanTrackerGradient: {
    padding: spacing.lg,
  },
  imanTrackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  imanTrackerTextContainer: {
    flex: 1,
  },
  imanTrackerTitle: {
    ...typography.bodyBold,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  imanTrackerSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  reminderCard: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  reminderGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  reminderText: {
    ...typography.h4,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  reminderSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  bottomPadding: {
    height: 100,
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
  goalsModalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginHorizontal: spacing.xl,
  },
  goalInput: {
    ...typography.h1,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalsModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalsModalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.highlight,
  },
  goalsModalButtonTextCancel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  goalsModalButtonPrimary: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  goalsModalButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  goalsModalButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  completionModalContent: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  completionGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  completionTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  completionMessage: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  completionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
  },
  completionButtonText: {
    ...typography.h4,
    color: colors.card,
  },
});
