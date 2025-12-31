
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from '@/contexts/ImanTrackerContext';

export default function AmanahSection() {
  const { amanahGoals, updateAmanahGoals } = useImanTracker();

  if (!amanahGoals) return null;

  const incrementCounter = async (field: string, amount: number, maxField: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentValue = amanahGoals[field as keyof typeof amanahGoals] as number;
    const maxValue = amanahGoals[maxField as keyof typeof amanahGoals] as number;
    const updatedGoals = {
      ...amanahGoals,
      [field]: Math.min(currentValue + amount, maxValue),
    };
    await updateAmanahGoals(updatedGoals);
  };

  const hasPhysicalGoals = amanahGoals.dailyExerciseGoal > 0 || 
                           amanahGoals.dailyWaterGoal > 0 || 
                           amanahGoals.weeklyWorkoutGoal > 0;
  
  const hasMeditationGoals = amanahGoals.weeklyMeditationGoal > 0;
  const hasJournalGoals = amanahGoals.weeklyJournalGoal > 0;
  
  const hasSleepGoals = amanahGoals.dailySleepGoal > 0;

  const hasAnyGoals = hasPhysicalGoals || hasMeditationGoals || hasJournalGoals || hasSleepGoals;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={24}
            color="#FFFFFF"
          />
        </LinearGradient>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Amanah (Well-Being)</Text>
          <Text style={styles.subtitle}>الأمانة - Trust of body and mind</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/(tabs)/(iman)/goals-settings',
              params: { section: 'amanah' }
            });
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {!hasAnyGoals && (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="heart"
            android_material_icon_name="favorite-border"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No wellness goals set</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the settings icon to customize your well-being goals
          </Text>
        </View>
      )}

      {/* Physical Health Section */}
      {hasPhysicalGoals && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="figure.run"
              android_material_icon_name="directions-run"
              size={18}
              color="#F59E0B"
            />
            <Text style={styles.subsectionTitle}>Physical Health</Text>
          </View>

          <View style={styles.subsectionContent}>
            {amanahGoals.dailyExerciseGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Exercise ({amanahGoals.dailyExerciseCompleted}/{amanahGoals.dailyExerciseGoal} minutes)
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${amanahGoals.dailyExerciseGoal > 0 ? (amanahGoals.dailyExerciseCompleted / amanahGoals.dailyExerciseGoal) * 100 : 0}%`,
                        backgroundColor: '#F59E0B',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('dailyExerciseCompleted', 10, 'dailyExerciseGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+10 min</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('dailyExerciseCompleted', 30, 'dailyExerciseGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+30 min</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {amanahGoals.dailyWaterGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Water Intake ({amanahGoals.dailyWaterCompleted}/{amanahGoals.dailyWaterGoal} glasses)
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${amanahGoals.dailyWaterGoal > 0 ? (amanahGoals.dailyWaterCompleted / amanahGoals.dailyWaterGoal) * 100 : 0}%`,
                        backgroundColor: '#F59E0B',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('dailyWaterCompleted', 1, 'dailyWaterGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+1 glass</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('dailyWaterCompleted', 2, 'dailyWaterGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+2 glasses</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {amanahGoals.weeklyWorkoutGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Weekly Workouts ({amanahGoals.weeklyWorkoutCompleted}/{amanahGoals.weeklyWorkoutGoal} sessions)
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${amanahGoals.weeklyWorkoutGoal > 0 ? (amanahGoals.weeklyWorkoutCompleted / amanahGoals.weeklyWorkoutGoal) * 100 : 0}%`,
                        backgroundColor: '#F59E0B',
                      }
                    ]} 
                  />
                </View>
                <TouchableOpacity
                  style={styles.incrementButton}
                  onPress={() => incrementCounter('weeklyWorkoutCompleted', 1, 'weeklyWorkoutGoal')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.incrementGradient}
                  >
                    <IconSymbol
                      ios_icon_name="plus"
                      android_material_icon_name="add"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.incrementText}>Mark Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/physical-health' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Go to Physical Health</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Meditation Section */}
      {hasMeditationGoals && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="spa"
              size={18}
              color="#F59E0B"
            />
            <Text style={styles.subsectionTitle}>Meditation & Mindfulness</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Meditation Sessions ({amanahGoals.weeklyMeditationCompleted}/{amanahGoals.weeklyMeditationGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${amanahGoals.weeklyMeditationGoal > 0 ? (amanahGoals.weeklyMeditationCompleted / amanahGoals.weeklyMeditationGoal) * 100 : 0}%`,
                      backgroundColor: '#F59E0B',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyMeditationCompleted', 1, 'weeklyMeditationGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.incrementText}>Mark Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/meditation' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Go to Meditation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Journal Section */}
      {hasJournalGoals && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="menu-book"
              size={18}
              color="#F59E0B"
            />
            <Text style={styles.subsectionTitle}>Journaling & Reflection</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Journal Entries ({amanahGoals.weeklyJournalCompleted}/{amanahGoals.weeklyJournalGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${amanahGoals.weeklyJournalGoal > 0 ? (amanahGoals.weeklyJournalCompleted / amanahGoals.weeklyJournalGoal) * 100 : 0}%`,
                      backgroundColor: '#F59E0B',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyJournalCompleted', 1, 'weeklyJournalGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.incrementText}>Mark Entry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/journal' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Go to Journal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sleep Section */}
      {hasSleepGoals && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="bed.double.fill"
              android_material_icon_name="hotel"
              size={18}
              color="#F59E0B"
            />
            <Text style={styles.subsectionTitle}>Sleep & Rest</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Daily Sleep ({amanahGoals.dailySleepCompleted}/{amanahGoals.dailySleepGoal} hours)
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${amanahGoals.dailySleepGoal > 0 ? (amanahGoals.dailySleepCompleted / amanahGoals.dailySleepGoal) * 100 : 0}%`,
                      backgroundColor: '#F59E0B',
                    }
                  ]} 
                />
              </View>
              <View style={styles.counterButtons}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementCounter('dailySleepCompleted', 1, 'dailySleepGoal')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterGradient}
                  >
                    <Text style={styles.counterText}>+1 hr</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementCounter('dailySleepCompleted', 7, 'dailySleepGoal')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterGradient}
                  >
                    <Text style={styles.counterText}>+7 hrs</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => incrementCounter('dailySleepCompleted', 8, 'dailySleepGoal')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.counterGradient}
                  >
                    <Text style={styles.counterText}>+8 hrs</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/sleep-tracker' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Go to Sleep Tracker</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subsection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subsectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  subsectionContent: {
    gap: spacing.md,
  },
  goalItem: {
    gap: spacing.sm,
  },
  goalLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  incrementButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  incrementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  incrementText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  counterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  counterButton: {
    flex: 1,
    minWidth: '30%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.medium,
  },
  counterGradient: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  actionText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
