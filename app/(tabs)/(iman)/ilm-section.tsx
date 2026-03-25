
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { useAccessGate } from '@/hooks/useAccessGate';
import { AccessGate } from '@/components/access/AccessGate';

export default function IlmSection() {
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const { checkAccess, showGate, gateVisible, onGateClose, onGateGranted } = useAccessGate();

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

  const setCounter = async (field: string, value: number, maxField: string) => {
    const maxValue = ilmGoals[maxField as keyof typeof ilmGoals] as number;
    const clamped = Math.max(0, Math.min(maxValue, value));
    const updatedGoals = { ...ilmGoals, [field]: clamped };
    await updateIlmGoals(updatedGoals);
  };

  const hasAnyGoals = ilmGoals.weeklyLecturesGoal > 0 || 
                      ilmGoals.weeklyStoriesGoal > 0 || 
                      ilmGoals.weeklyQuizzesGoal > 0 || 
                      ilmGoals.weeklyReflectionGoal > 0 ||
                      ilmGoals.weeklyAllahNamesGoal > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B82F615', '#3B82F605', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionWrapper}
      >
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
              <View style={styles.goalLabelRow}>
                <Text style={styles.goalLabel}>Weekly Lectures </Text>
                <TextInput
                  style={styles.goalCountInput}
                  value={String(ilmGoals.weeklyLecturesCompleted || 0)}
                  onChangeText={(t) => setCounter('weeklyLecturesCompleted', parseInt(t.replace(/\D/g, ''), 10) || 0, 'weeklyLecturesGoal')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.goalLabel}> / {ilmGoals.weeklyLecturesGoal}</Text>
              </View>
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
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Check access before navigating to lectures
                const hasAccess = await checkAccess();
                if (!hasAccess) {
                  // Show access gate, navigate after ad is watched
                  showGate(() => {
                    router.push('/(tabs)/(learning)/lectures' as any);
                  });
                  return;
                }
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

      {/* Islamic Stories */}
      {ilmGoals.weeklyStoriesGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="text.book.closed.fill"
              android_material_icon_name="auto-stories"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Islamic Stories</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <View style={styles.goalLabelRow}>
                <Text style={styles.goalLabel}>Weekly Stories </Text>
                <TextInput
                  style={styles.goalCountInput}
                  value={String(ilmGoals.weeklyStoriesCompleted || 0)}
                  onChangeText={(t) => setCounter('weeklyStoriesCompleted', parseInt(t.replace(/\D/g, ''), 10) || 0, 'weeklyStoriesGoal')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.goalLabel}> / {ilmGoals.weeklyStoriesGoal}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyStoriesGoal > 0 ? (ilmGoals.weeklyStoriesCompleted / ilmGoals.weeklyStoriesGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyStoriesCompleted', 1, 'weeklyStoriesGoal')}
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
                  <Text style={styles.incrementText}>Mark Story</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(learning)/stories' as any);
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
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Read Stories</Text>
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
              <View style={styles.goalLabelRow}>
                <Text style={styles.goalLabel}>Weekly Quizzes </Text>
                <TextInput
                  style={styles.goalCountInput}
                  value={String(ilmGoals.weeklyQuizzesCompleted || 0)}
                  onChangeText={(t) => setCounter('weeklyQuizzesCompleted', parseInt(t.replace(/\D/g, ''), 10) || 0, 'weeklyQuizzesGoal')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.goalLabel}> / {ilmGoals.weeklyQuizzesGoal}</Text>
              </View>
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

      {/* Allah Names Section */}
      {ilmGoals.weeklyAllahNamesGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="sparkles.rectangle.stack.fill"
              android_material_icon_name="auto-awesome"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.subsectionTitle}>Allah's Names (Asma ul Husna)</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <View style={styles.goalLabelRow}>
                <Text style={styles.goalLabel}>Weekly Names Reviewed </Text>
                <TextInput
                  style={styles.goalCountInput}
                  value={String(ilmGoals.weeklyAllahNamesCompleted || 0)}
                  onChangeText={(t) => setCounter('weeklyAllahNamesCompleted', parseInt(t.replace(/\D/g, ''), 10) || 0, 'weeklyAllahNamesGoal')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.goalLabel}> / {ilmGoals.weeklyAllahNamesGoal}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ilmGoals.weeklyAllahNamesGoal > 0 ? (ilmGoals.weeklyAllahNamesCompleted / ilmGoals.weeklyAllahNamesGoal) * 100 : 0}%`,
                      backgroundColor: '#3B82F6',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('weeklyAllahNamesCompleted', 1, 'weeklyAllahNamesGoal')}
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
                  <Text style={styles.incrementText}>Mark Name</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(learning)/allah-names' as any);
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
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.actionText}>Review Names</Text>
              </LinearGradient>
            </TouchableOpacity>
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
              <View style={styles.goalLabelRow}>
                <Text style={styles.goalLabel}>Weekly Reflections </Text>
                <TextInput
                  style={styles.goalCountInput}
                  value={String(ilmGoals.weeklyReflectionCompleted || 0)}
                  onChangeText={(t) => setCounter('weeklyReflectionCompleted', parseInt(t.replace(/\D/g, ''), 10) || 0, 'weeklyReflectionGoal')}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.goalLabel}> / {ilmGoals.weeklyReflectionGoal}</Text>
              </View>
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
      </LinearGradient>

      {/* Access Gate Modal */}
      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onAccessGranted={onGateGranted}
        title="Unlock Islamic Lectures"
        description="Watch a short ad to access premium Islamic lectures for 24 hours"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionWrapper: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3B82F620',
    ...shadows.medium,
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
    borderColor: '#3B82F615',
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
  goalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  goalLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  goalCountInput: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
    textAlign: 'center',
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
