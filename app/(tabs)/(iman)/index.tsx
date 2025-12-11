
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Modal } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';

interface Goal {
  name: string;
  target: number;
  current: number;
  unit: string;
  color: string;
  gradientColors: string[];
  icon: string;
}

export default function ImanTrackerScreen() {
  const [goals, setGoals] = useState<Goal[]>([
    { 
      name: 'Prayers', 
      target: 5, 
      current: 3, 
      unit: 'prayers', 
      color: colors.primary,
      gradientColors: colors.gradientPrimary,
      icon: 'schedule' 
    },
    { 
      name: 'Quran', 
      target: 30, 
      current: 15, 
      unit: 'minutes', 
      color: colors.accent,
      gradientColors: colors.gradientAccent,
      icon: 'book' 
    },
    { 
      name: 'Dhikr', 
      target: 100, 
      current: 50, 
      unit: 'times', 
      color: colors.info,
      gradientColors: colors.gradientInfo,
      icon: 'favorite' 
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');

  const openModal = (index: number) => {
    setSelectedGoalIndex(index);
    setInputValue(goals[index].current.toString());
    setModalVisible(true);
  };

  const updateGoal = () => {
    if (selectedGoalIndex !== null) {
      const newGoals = [...goals];
      const value = parseInt(inputValue) || 0;
      newGoals[selectedGoalIndex].current = Math.min(value, newGoals[selectedGoalIndex].target);
      setGoals(newGoals);
      setModalVisible(false);
      setSelectedGoalIndex(null);
      setInputValue('');
    }
  };

  const renderProgressRing = (goal: Goal, size: number, strokeWidth: number) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = goal.current / goal.target;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={styles.ringContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.highlight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={goal.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.ringContent}>
          <View style={[styles.ringIconContainer, { backgroundColor: goal.color }]}>
            <IconSymbol
              ios_icon_name={goal.icon}
              android_material_icon_name={goal.icon}
              size={26}
              color={colors.card}
            />
          </View>
          <Text style={styles.ringText}>{goal.current}/{goal.target}</Text>
          <Text style={styles.ringPercentage}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    );
  };

  const totalProgress = goals.reduce((sum, goal) => sum + (goal.current / goal.target), 0) / goals.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Iman Tracker</Text>
        <Text style={styles.subtitle}>Track your daily spiritual goals</Text>

        {/* Overall Progress Card */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overallCard}
        >
          <View style={styles.overallIconContainer}>
            <IconSymbol
              ios_icon_name="chart"
              android_material_icon_name="trending-up"
              size={36}
              color={colors.card}
            />
          </View>
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <Text style={styles.overallPercentage}>{Math.round(totalProgress * 100)}%</Text>
          <Text style={styles.overallSubtext}>
            {totalProgress === 1 ? 'Perfect! All goals achieved! 🎉' : 'Keep up the great work!'}
          </Text>
        </LinearGradient>

        {/* Progress Rings */}
        <View style={styles.ringsContainer}>
          {goals.map((goal, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.ringWrapper}
                onPress={() => openModal(index)}
                activeOpacity={0.7}
              >
                <View style={styles.ringCard}>
                  {renderProgressRing(goal, 140, 16)}
                  <Text style={styles.ringLabel}>{goal.name}</Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Goal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="list"
                android_material_icon_name="list"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Today&apos;s Goals</Text>
          </View>
          {goals.map((goal, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.goalCard}
                onPress={() => openModal(index)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={goal.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.goalGradient}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <IconSymbol
                        ios_icon_name={goal.icon}
                        android_material_icon_name={goal.icon}
                        size={26}
                        color={colors.card}
                      />
                    </View>
                    <View style={styles.goalTextContainer}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalProgress}>
                        {goal.current} / {goal.target} {goal.unit}
                      </Text>
                    </View>
                    <Text style={styles.goalPercentage}>
                      {Math.round((goal.current / goal.target) * 100)}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${(goal.current / goal.target) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Update Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.modalTitle}>
                Update {selectedGoalIndex !== null ? goals[selectedGoalIndex].name : ''}
              </Text>
            </View>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder="Enter value"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={updateGoal}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  overallCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.colored,
  },
  overallIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  overallTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.md,
  },
  overallPercentage: {
    fontSize: 52,
    fontWeight: 'bold',
    color: colors.card,
    marginBottom: spacing.sm,
  },
  overallSubtext: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xxxl,
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  ringWrapper: {
    marginBottom: spacing.sm,
  },
  ringCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  ringText: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.xs,
  },
  ringPercentage: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ringLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  goalCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  goalGradient: {
    padding: spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  goalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalName: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  goalProgress: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  goalPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.card,
  },
  progressBarContainer: {
    marginTop: spacing.xs,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  bottomPadding: {
    height: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    width: '85%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.highlight,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  modalButtonTextConfirm: {
    color: colors.card,
  },
});
