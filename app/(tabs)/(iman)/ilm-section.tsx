
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from '@/contexts/ImanTrackerContext';

export default function IlmSection() {
  const { ilmGoals, updateIlmGoals } = useImanTracker();

  if (!ilmGoals) return null;

  const incrementCounter = async (field: string, amount: number, maxField: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentValue = ilmGoals[field as keyof typeof ilmGoals] as number;
    const maxValue = ilmGoals[maxField as keyof typeof ilmGoals] as number;
    const updatedGoals = {
      ...ilmGoals,
      [field]: Math.min(currentValue + amount, maxValue),
    };
    await updateIlmGoals(updatedGoals);
  };

  const hasAnyGoals = ilmGoals.weeklyLecturesGoal > 0 || 
                      ilmGoals.weeklyRecitationsGoal > 0 || 
                      ilmGoals.weeklyQuizzesGoal > 0 || 
                      ilmGoals.weeklyReflectionGoal > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <IconSymbol
            ios_icon_name="book.fill"
            android_material_icon_name="menu-book"
            size={24}
            color="#FFFFFF"
          />
        </LinearGradient>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>ʿIlm (Knowledge)</Text>
          <Text style={styles.subtitle}>العلم - Seeking knowledge that strengthens faith</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/(tabs)/(iman)/goals-settings',
              params: { section: 'ilm' }
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
            ios_icon_name="book.closed"
            android_material_icon_name="menu-book"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No knowledge goals set</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the settings icon to customize your learning goals
          </Text>
        </View>
      )}

      {/* Lectures Section */}
      {ilmGoals.weeklyLecturesGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="video.fill"
              android_material_icon_name="video-library"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Islamic Lectures</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Lectures ({ilmGoals.weeklyLecturesCompleted}/{ilmGoals.weeklyLecturesGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyLecturesGoal > 0 ? (ilmGoals.weeklyLecturesCompleted / ilmGoals.weeklyLecturesGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyLecturesCompleted', 1, 'weeklyLecturesGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
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
                  <Text style={styles.incrementText}>Mark Lecture</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(learning)/lectures' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="play.fill"
                  android_material_icon_name="play-arrow"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Watch Lectures</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quran Recitations Section */}
      {ilmGoals.weeklyRecitationsGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="music.note"
              android_material_icon_name="headset"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Quran Recitations</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Recitations ({ilmGoals.weeklyRecitationsCompleted}/{ilmGoals.weeklyRecitationsGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyRecitationsGoal > 0 ? (ilmGoals.weeklyRecitationsCompleted / ilmGoals.weeklyRecitationsGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyRecitationsCompleted', 1, 'weeklyRecitationsGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
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
                  <Text style={styles.incrementText}>Mark Recitation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(learning)/recitations' as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <IconSymbol
                  ios_icon_name="play.fill"
                  android_material_icon_name="play-arrow"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Listen to Recitations</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quizzes Section */}
      {ilmGoals.weeklyQuizzesGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="quiz"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Knowledge Quizzes</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Quizzes ({ilmGoals.weeklyQuizzesCompleted}/{ilmGoals.weeklyQuizzesGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyQuizzesGoal > 0 ? (ilmGoals.weeklyQuizzesCompleted / ilmGoals.weeklyQuizzesGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyQuizzesCompleted', 1, 'weeklyQuizzesGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
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
                  <Text style={styles.incrementText}>Mark Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Reflection Section */}
      {ilmGoals.weeklyReflectionGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Reflection Prompts</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Reflections ({ilmGoals.weeklyReflectionCompleted}/{ilmGoals.weeklyReflectionGoal})
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyReflectionGoal > 0 ? (ilmGoals.weeklyReflectionCompleted / ilmGoals.weeklyReflectionGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyReflectionCompleted', 1, 'weeklyReflectionGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
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
                  <Text style={styles.incrementText}>Mark Reflection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
