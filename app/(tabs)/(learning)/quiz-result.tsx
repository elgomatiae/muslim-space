
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useImanTracker } from '@/contexts/ImanTrackerContext';

export default function QuizResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateIlmGoals, ilmGoals } = useImanTracker();

  const score = parseInt(params.score as string);
  const total = parseInt(params.total as string);
  const percentage = parseFloat(params.percentage as string);
  const categoryName = params.categoryName as string;
  const timeTaken = params.timeTaken ? parseInt(params.timeTaken as string) : null;

  useEffect(() => {
    // Update Ilm goals - increment quiz completion
    if (ilmGoals) {
      const updatedGoals = {
        ...ilmGoals,
        weeklyQuizzesCompleted: ilmGoals.weeklyQuizzesCompleted + 1,
      };
      updateIlmGoals(updatedGoals);
    }
  }, []);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { title: 'Excellent!', message: 'Mashallah! Outstanding performance!' };
    if (percentage >= 80) return { title: 'Great Job!', message: 'Very good! Keep up the great work!' };
    if (percentage >= 70) return { title: 'Good Work!', message: 'Well done! You\'re doing great!' };
    if (percentage >= 60) return { title: 'Not Bad!', message: 'Good effort! Keep learning!' };
    return { title: 'Keep Trying!', message: 'Don\'t give up! Practice makes perfect!' };
  };

  const getGradeColor = () => {
    if (percentage >= 90) return colors.gradientPrimary;
    if (percentage >= 80) return colors.gradientSecondary;
    if (percentage >= 70) return colors.gradientInfo;
    if (percentage >= 60) return colors.gradientWarning;
    return colors.gradientRed;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const performance = getPerformanceMessage();
  const gradeColor = getGradeColor();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Banner */}
        <LinearGradient
          colors={gradeColor}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultBanner}
        >
          <View style={styles.resultIconContainer}>
            <IconSymbol
              ios_icon_name={percentage >= 70 ? 'star.fill' : 'star'}
              android_material_icon_name={percentage >= 70 ? 'star' : 'star-outline'}
              size={48}
              color={colors.card}
            />
          </View>
          <Text style={styles.resultTitle}>{performance.title}</Text>
          <Text style={styles.resultMessage}>{performance.message}</Text>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scoreDivider}>/</Text>
            <Text style={styles.totalText}>{total}</Text>
          </View>
          
          <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={32}
                color={colors.success}
              />
            </View>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={32}
                color={colors.error}
              />
            </View>
            <Text style={styles.statValue}>{total - score}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>

          {timeTaken && (
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={32}
                  color={colors.info}
                />
              </View>
              <Text style={styles.statValue}>{formatTime(timeTaken)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          )}
        </View>

        {/* Category Info */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryLabel}>Quiz Category</Text>
          <Text style={styles.categoryName}>{categoryName}</Text>
        </View>

        {/* Ilm Points Earned */}
        <View style={styles.pointsCard}>
          <LinearGradient
            colors={colors.gradientPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsIconContainer}>
              <IconSymbol
                ios_icon_name="brain.head.profile"
                android_material_icon_name="psychology"
                size={28}
                color={colors.card}
              />
            </View>
            <View style={styles.pointsTextContainer}>
              <Text style={styles.pointsTitle}>Ilm Points Earned</Text>
              <Text style={styles.pointsSubtitle}>Contributing to your knowledge ring</Text>
            </View>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={32}
              color={colors.card}
            />
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={20}
              color={colors.card}
            />
            <Text style={styles.actionButtonText}>Try Another Quiz</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)/(learning)')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Back to Learning</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
  },
  resultBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  resultIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.h1,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  resultMessage: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.card,
  },
  scoreDivider: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.card,
    opacity: 0.7,
    marginHorizontal: spacing.sm,
  },
  totalText: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.card,
    opacity: 0.9,
  },
  percentageText: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    marginBottom: spacing.sm,
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
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    marginBottom: spacing.xxl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.h3,
    color: colors.text,
  },
  pointsCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.emphasis,
  },
  pointsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  pointsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  pointsSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  actionButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: spacing.xl,
  },
  secondaryButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
