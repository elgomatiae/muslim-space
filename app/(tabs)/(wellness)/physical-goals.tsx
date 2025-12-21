
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from 'expo-haptics';

const WORKOUT_TYPES = [
  { value: 'general', label: 'General Fitness', icon: { ios: 'figure.mixed.cardio', android: 'fitness-center' } },
  { value: 'cardio', label: 'Cardio', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'strength', label: 'Strength Training', icon: { ios: 'dumbbell.fill', android: 'fitness-center' } },
  { value: 'yoga', label: 'Yoga', icon: { ios: 'figure.yoga', android: 'self-improvement' } },
  { value: 'walking', label: 'Walking', icon: { ios: 'figure.walk', android: 'directions-walk' } },
  { value: 'running', label: 'Running', icon: { ios: 'figure.run', android: 'directions-run' } },
  { value: 'sports', label: 'Sports', icon: { ios: 'sportscourt.fill', android: 'sports' } },
];

export default function PhysicalGoalsScreen() {
  const { user } = useAuth();
  const [dailyStepsGoal, setDailyStepsGoal] = useState('10000');
  const [dailyExerciseGoal, setDailyExerciseGoal] = useState('30');
  const [dailyWaterGoal, setDailyWaterGoal] = useState('8');
  const [weeklyWorkoutsGoal, setWeeklyWorkoutsGoal] = useState('3');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('general');
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('physical_wellness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setDailyStepsGoal(data.daily_steps_goal.toString());
      setDailyExerciseGoal(data.daily_exercise_minutes_goal.toString());
      setDailyWaterGoal(data.daily_water_glasses_goal.toString());
      setWeeklyWorkoutsGoal(data.weekly_workout_sessions_goal.toString());
      setSelectedWorkoutType(data.workout_type || 'general');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoals = async () => {
    if (!user) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const { error } = await supabase
      .from('physical_wellness_goals')
      .upsert({
        user_id: user.id,
        daily_steps_goal: parseInt(dailyStepsGoal) || 10000,
        daily_exercise_minutes_goal: parseInt(dailyExerciseGoal) || 30,
        daily_water_glasses_goal: parseInt(dailyWaterGoal) || 8,
        weekly_workout_sessions_goal: parseInt(weeklyWorkoutsGoal) || 3,
        workout_type: selectedWorkoutType,
        updated_at: new Date().toISOString(),
      });

    // Also update iman_tracker_goals
    await supabase
      .from('iman_tracker_goals')
      .upsert({
        user_id: user.id,
        amanah_workout_type: selectedWorkoutType,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Physical Goals</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workoutTypeSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="figure.mixed.cardio"
              android_material_icon_name="fitness-center"
              size={28}
              color={colors.accent}
            />
            <Text style={styles.sectionTitle}>Workout Type Preference</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Select your preferred workout type to better track your fitness journey
          </Text>
          <View style={styles.workoutTypesGrid}>
            {WORKOUT_TYPES.map((type, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.workoutTypeCard,
                    selectedWorkoutType === type.value && styles.workoutTypeCardActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedWorkoutType(type.value);
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={type.icon.ios}
                    android_material_icon_name={type.icon.android}
                    size={32}
                    color={selectedWorkoutType === type.value ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[
                    styles.workoutTypeLabel,
                    selectedWorkoutType === type.value && styles.workoutTypeLabelActive,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <IconSymbol
              ios_icon_name="figure.walk"
              android_material_icon_name="directions-walk"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.goalTitle}>Daily Steps</Text>
          </View>
          <TextInput
            style={styles.input}
            value={dailyStepsGoal}
            onChangeText={setDailyStepsGoal}
            keyboardType="number-pad"
            placeholder="10000"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.goalDescription}>Recommended: 10,000 steps per day</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <IconSymbol
              ios_icon_name="figure.mixed.cardio"
              android_material_icon_name="fitness-center"
              size={28}
              color={colors.warning}
            />
            <Text style={styles.goalTitle}>Daily Exercise (minutes)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={dailyExerciseGoal}
            onChangeText={setDailyExerciseGoal}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.goalDescription}>Recommended: 30 minutes per day</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <IconSymbol
              ios_icon_name="drop.fill"
              android_material_icon_name="water-drop"
              size={28}
              color={colors.info}
            />
            <Text style={styles.goalTitle}>Daily Water (glasses)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={dailyWaterGoal}
            onChangeText={setDailyWaterGoal}
            keyboardType="number-pad"
            placeholder="8"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.goalDescription}>Recommended: 8 glasses (250ml each)</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={28}
              color={colors.accent}
            />
            <Text style={styles.goalTitle}>Weekly Workouts</Text>
          </View>
          <TextInput
            style={styles.input}
            value={weeklyWorkoutsGoal}
            onChangeText={setWeeklyWorkoutsGoal}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.goalDescription}>Recommended: 3-5 sessions per week</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveGoals} activeOpacity={0.8}>
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
            <Text style={styles.saveButtonText}>Save Goals</Text>
          </LinearGradient>
        </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  workoutTypeSection: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  workoutTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  workoutTypeCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
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
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  goalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  input: {
    ...typography.h2,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  goalDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
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
  bottomPadding: {
    height: 100,
  },
});
