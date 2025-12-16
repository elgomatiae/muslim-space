
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { loadDhikrGoals, saveDhikrGoals, type DhikrGoals } from "@/utils/imanScoreCalculator";

export default function DhikrGoalsScreen() {
  const [goals, setGoals] = useState<DhikrGoals>({
    dailyGoal: 100,
    dailyCompleted: 0,
    weeklyGoal: 1000,
    weeklyCompleted: 0,
  });

  const [dailyInput, setDailyInput] = useState('100');
  const [weeklyInput, setWeeklyInput] = useState('1000');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const loaded = await loadDhikrGoals();
    setGoals(loaded);
    setDailyInput(loaded.dailyGoal.toString());
    setWeeklyInput(loaded.weeklyGoal.toString());
  };

  const handleSave = async () => {
    const dailyGoal = parseInt(dailyInput) || 0;
    const weeklyGoal = parseInt(weeklyInput) || 0;

    if (dailyGoal < 0 || dailyGoal > 10000) {
      Alert.alert('Invalid Input', 'Daily goal must be between 0 and 10,000.');
      return;
    }

    if (weeklyGoal < 0 || weeklyGoal > 100000) {
      Alert.alert('Invalid Input', 'Weekly goal must be between 0 and 100,000.');
      return;
    }

    const updatedGoals: DhikrGoals = {
      ...goals,
      dailyGoal,
      weeklyGoal,
    };

    await saveDhikrGoals(updatedGoals);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Dhikr goals saved!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const incrementDhikr = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...goals,
      dailyCompleted: goals.dailyCompleted + amount,
      weeklyCompleted: goals.weeklyCompleted + amount,
    };
    setGoals(updatedGoals);
    await saveDhikrGoals(updatedGoals);
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
        <Text style={styles.headerTitle}>Dhikr Goals</Text>
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
            color={colors.info}
          />
          <Text style={styles.infoText}>
            Set your daily and weekly dhikr goals. Track your remembrance of Allah throughout the day.
          </Text>
        </View>

        {/* Daily Dhikr Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="back-hand"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Daily Dhikr Goal</Text>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Daily Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={dailyInput}
              onChangeText={setDailyInput}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="0-10000"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>dhikr/day</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
              <Text style={styles.progressValue}>
                {goals.dailyCompleted}/{goals.dailyGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.dailyGoal > 0 ? Math.min(100, (goals.dailyCompleted / goals.dailyGoal) * 100) : 0}%`,
                    backgroundColor: colors.info,
                  }
                ]} 
              />
            </View>

            <View style={styles.counterGrid}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementDhikr(1)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientInfo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+1</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementDhikr(10)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientInfo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+10</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementDhikr(33)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientInfo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+33</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => incrementDhikr(100)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientInfo}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.counterButtonGradient}
                >
                  <Text style={styles.counterButtonText}>+100</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weekly Dhikr Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Weekly Dhikr Goal</Text>
          </View>

          <View style={styles.goalInputContainer}>
            <Text style={styles.goalInputLabel}>Weekly Goal:</Text>
            <TextInput
              style={styles.goalInput}
              value={weeklyInput}
              onChangeText={setWeeklyInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="0-100000"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.goalInputUnit}>dhikr/week</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>This Week&apos;s Progress</Text>
              <Text style={styles.progressValue}>
                {goals.weeklyCompleted}/{goals.weeklyGoal}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${goals.weeklyGoal > 0 ? Math.min(100, (goals.weeklyCompleted / goals.weeklyGoal) * 100) : 0}%`,
                    backgroundColor: colors.info,
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.recommendationBox}>
          <IconSymbol
            ios_icon_name="lightbulb.fill"
            android_material_icon_name="lightbulb"
            size={16}
            color={colors.info}
          />
          <Text style={styles.recommendationText}>
            Common dhikr include: Subhan Allah (33x), Alhamdulillah (33x), Allahu Akbar (34x) after each prayer.
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
    backgroundColor: colors.info,
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
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.info + '30',
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
    minWidth: 80,
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
    color: colors.info,
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
    minWidth: '22%',
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
    fontSize: 18,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.info + '30',
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
