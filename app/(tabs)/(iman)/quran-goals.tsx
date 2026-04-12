
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from "@/contexts/I18nContext";
import {
  loadQuranGoals,
  saveQuranGoals,
  type QuranGoals,
  type QuranGoalPeriod,
} from "@/utils/imanScoreCalculator";

export default function QuranGoalsScreen() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<QuranGoals>({
    dailyPagesGoal: 2,
    dailyPagesCompleted: 0,
    weeklyMemorizationGoal: 5,
    weeklyMemorizationCompleted: 0,
    pagesFrequency: 'daily',
    memorizationFrequency: 'weekly',
  });

  const [pagesInput, setPagesInput] = useState('2');
  const [memorizationInput, setMemorizationInput] = useState('5');
  const [pagesFreq, setPagesFreq] = useState<QuranGoalPeriod>('daily');
  const [memorizationFreq, setMemorizationFreq] = useState<QuranGoalPeriod>('weekly');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const loaded = await loadQuranGoals();
    setGoals(loaded);
    setPagesInput(loaded.dailyPagesGoal.toString());
    setMemorizationInput(loaded.weeklyMemorizationGoal.toString());
    setPagesFreq(loaded.pagesFrequency ?? 'daily');
    setMemorizationFreq(loaded.memorizationFrequency ?? 'weekly');
  };

  const handleSave = async () => {
    const pagesGoal = parseInt(pagesInput) || 0;
    const memorizationGoal = parseInt(memorizationInput) || 0;

    if (pagesGoal < 0 || pagesGoal > 604) {
      Alert.alert(t('common.error'), t('iman.invalidDailyPages'));
      return;
    }

    if (memorizationGoal < 0 || memorizationGoal > 6236) {
      Alert.alert(t('common.error'), t('iman.invalidWeeklyMemorization'));
      return;
    }

    const updatedGoals: QuranGoals = {
      ...goals,
      dailyPagesGoal: pagesGoal,
      weeklyMemorizationGoal: memorizationGoal,
      pagesFrequency: pagesFreq,
      memorizationFrequency: memorizationFreq,
    };

    await saveQuranGoals(updatedGoals);
    setGoals(updatedGoals);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Quran goals saved!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const incrementPages = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals: QuranGoals = {
      ...goals,
      dailyPagesCompleted: Math.min(goals.dailyPagesCompleted + amount, goals.dailyPagesGoal),
      pagesFrequency: pagesFreq,
      memorizationFrequency: memorizationFreq,
    };
    setGoals(updatedGoals);
    await saveQuranGoals(updatedGoals);
  };

  const incrementMemorization = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals: QuranGoals = {
      ...goals,
      weeklyMemorizationCompleted: Math.min(goals.weeklyMemorizationCompleted + amount, goals.weeklyMemorizationGoal),
      pagesFrequency: pagesFreq,
      memorizationFrequency: memorizationFreq,
    };
    setGoals(updatedGoals);
    await saveQuranGoals(updatedGoals);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Quran Goals</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.accent}
          />
          <Text style={styles.infoText}>
            Track Quran reading by pages and memorization by verses. Choose whether each target is daily or weekly.
          </Text>
        </View>

        {/* Quran reading (pages) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quran Reading</Text>
          </View>

          <View style={styles.freqRow}>
            <Text style={styles.goalInputLabel}>Every</Text>
            <TouchableOpacity
              style={[styles.freqChip, pagesFreq === 'daily' && styles.freqChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPagesFreq('daily');
              }}
            >
              <Text style={[styles.freqChipText, pagesFreq === 'daily' && styles.freqChipTextActive]}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.freqChip, pagesFreq === 'weekly' && styles.freqChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPagesFreq('weekly');
              }}
            >
              <Text style={[styles.freqChipText, pagesFreq === 'weekly' && styles.freqChipTextActive]}>Week</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={pagesInput}
              onChangeText={setPagesInput}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="0-604"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>
              pages / {pagesFreq === 'weekly' ? 'week' : 'day'}
            </Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {pagesFreq === 'weekly' ? 'This week' : 'Today'}
              </Text>
              <Text style={styles.progressValue}>
                {goals.dailyPagesCompleted}/{goals.dailyPagesGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.dailyPagesGoal > 0 ? (goals.dailyPagesCompleted / goals.dailyPagesGoal) * 100 : 0}%`,
                    backgroundColor: colors.accent,
                  }
                ]} 
              />
            </View>

            <View style={styles.counterGrid}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementPages(1)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+1 Page</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementPages(5)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+5 Pages</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quran memorization (verses) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="brain.head.profile"
                android_material_icon_name="psychology"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quran Memorization</Text>
          </View>

          <View style={styles.freqRow}>
            <Text style={styles.goalInputLabel}>Every</Text>
            <TouchableOpacity
              style={[styles.freqChip, memorizationFreq === 'daily' && styles.freqChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMemorizationFreq('daily');
              }}
            >
              <Text style={[styles.freqChipText, memorizationFreq === 'daily' && styles.freqChipTextActive]}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.freqChip, memorizationFreq === 'weekly' && styles.freqChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMemorizationFreq('weekly');
              }}
            >
              <Text style={[styles.freqChipText, memorizationFreq === 'weekly' && styles.freqChipTextActive]}>Week</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={memorizationInput}
              onChangeText={setMemorizationInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0-6236"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>
              verses / {memorizationFreq === 'weekly' ? 'week' : 'day'}
            </Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {memorizationFreq === 'weekly' ? 'This week' : 'Today'}
              </Text>
              <Text style={styles.progressValue}>
                {goals.weeklyMemorizationCompleted}/{goals.weeklyMemorizationGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.weeklyMemorizationGoal > 0 ? (goals.weeklyMemorizationCompleted / goals.weeklyMemorizationGoal) * 100 : 0}%`,
                    backgroundColor: colors.accent,
                  }
                ]} 
              />
            </View>

            <View style={styles.counterGrid}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementMemorization(1)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+1</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementMemorization(3)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+3</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementMemorization(5)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+5</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.recommendationBox}>
          <IconSymbol
            ios_icon_name="lightbulb.fill"
            android_material_icon_name="lightbulb"
            size={16}
            color={colors.accent}
          />
          <Text style={styles.recommendationText}>
            The Quran has 604 pages. Memorization is tracked in verses. Small, steady targets work best.
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
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  freqChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqChipActive: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  freqChipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  freqChipTextActive: {
    color: colors.accent,
  },
  goalInputLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginRight: spacing.md,
  },
  goalInput: {
    ...typography.h3,
    color: colors.text,
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    minWidth: 70,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalInputUnit: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  progressValue: {
    ...typography.h4,
    color: colors.accent,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  counterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  counterButton: {
    flex: 1,
    minWidth: '30%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  counterButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  recommendationText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
