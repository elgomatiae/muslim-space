
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";

export default function PhysicalGoalsScreen() {
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (amanahGoals) {
      setLoading(false);
    }
  }, [amanahGoals]);

  const navigateToGoalsSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(tabs)/(iman)/goals-settings',
      params: { section: 'amanah' }
    } as any);
  };

  if (loading || !amanahGoals) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calculateProgress = (completed: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min(Math.round((completed / goal) * 100), 100);
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

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <IconSymbol
            ios_icon_name="link.circle.fill"
            android_material_icon_name="link"
            size={24}
            color={colors.info}
          />
          <Text style={styles.infoBannerText}>
            These goals are synced with your Iman Tracker. Changes here will update your Amanah ring progress.
          </Text>
        </View>

        {/* Exercise Goal */}
        {amanahGoals.dailyExerciseGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <IconSymbol
                  ios_icon_name="figure.mixed.cardio"
                  android_material_icon_name="fitness-center"
                  size={28}
                  color={colors.warning}
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Daily Exercise</Text>
                <Text style={styles.goalSubtitle}>
                  {amanahGoals.dailyExerciseCompleted} / {amanahGoals.dailyExerciseGoal} minutes
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradientWarning}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${calculateProgress(amanahGoals.dailyExerciseCompleted, amanahGoals.dailyExerciseGoal)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(amanahGoals.dailyExerciseCompleted, amanahGoals.dailyExerciseGoal)}%
              </Text>
            </View>
          </View>
        )}

        {/* Water Goal */}
        {amanahGoals.dailyWaterGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <IconSymbol
                  ios_icon_name="drop.fill"
                  android_material_icon_name="water-drop"
                  size={28}
                  color={colors.info}
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Daily Water Intake</Text>
                <Text style={styles.goalSubtitle}>
                  {amanahGoals.dailyWaterCompleted} / {amanahGoals.dailyWaterGoal} glasses
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradientInfo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${calculateProgress(amanahGoals.dailyWaterCompleted, amanahGoals.dailyWaterGoal)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(amanahGoals.dailyWaterCompleted, amanahGoals.dailyWaterGoal)}%
              </Text>
            </View>
          </View>
        )}

        {/* Workout Sessions Goal */}
        {amanahGoals.weeklyWorkoutGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={28}
                  color={colors.accent}
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Weekly Workouts</Text>
                <Text style={styles.goalSubtitle}>
                  {amanahGoals.weeklyWorkoutCompleted} / {amanahGoals.weeklyWorkoutGoal} sessions
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradientAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${calculateProgress(amanahGoals.weeklyWorkoutCompleted, amanahGoals.weeklyWorkoutGoal)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(amanahGoals.weeklyWorkoutCompleted, amanahGoals.weeklyWorkoutGoal)}%
              </Text>
            </View>
          </View>
        )}

        {/* Sleep Goal */}
        {amanahGoals.dailySleepGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <IconSymbol
                  ios_icon_name="moon.stars.fill"
                  android_material_icon_name="bedtime"
                  size={28}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Daily Sleep</Text>
                <Text style={styles.goalSubtitle}>
                  {amanahGoals.dailySleepCompleted} / {amanahGoals.dailySleepGoal} hours
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradientSecondary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${calculateProgress(amanahGoals.dailySleepCompleted, amanahGoals.dailySleepGoal)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(amanahGoals.dailySleepCompleted, amanahGoals.dailySleepGoal)}%
              </Text>
            </View>
          </View>
        )}

        {/* Mental Health Goal */}
        {amanahGoals.weeklyMentalHealthGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconContainer}>
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Weekly Meditation</Text>
                <Text style={styles.goalSubtitle}>
                  {amanahGoals.weeklyMentalHealthCompleted} / {amanahGoals.weeklyMentalHealthGoal} sessions
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${calculateProgress(amanahGoals.weeklyMentalHealthCompleted, amanahGoals.weeklyMentalHealthGoal)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(amanahGoals.weeklyMentalHealthCompleted, amanahGoals.weeklyMentalHealthGoal)}%
              </Text>
            </View>
          </View>
        )}

        {/* Edit Goals Button */}
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={navigateToGoalsSettings}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editButtonGradient}
          >
            <IconSymbol
              ios_icon_name="slider.horizontal.3"
              android_material_icon_name="tune"
              size={24}
              color={colors.card}
            />
            <Text style={styles.editButtonText}>Customize Goals</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoCardText}>
            Your physical wellness goals contribute to your Amanah (Well-Being) ring in the Iman Tracker. 
            Completing these goals helps maintain balance in your spiritual and physical health.
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
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
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  goalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  goalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.bodyBold,
    color: colors.text,
    minWidth: 45,
    textAlign: 'right',
  },
  editButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  editButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  infoCardText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
