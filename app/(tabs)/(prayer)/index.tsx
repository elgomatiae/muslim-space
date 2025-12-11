
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';

interface PrayerTime {
  name: string;
  time: string;
  completed: boolean;
  arabicName: string;
}

export default function PrayerScreen() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([
    { name: 'Fajr', time: '5:30 AM', completed: true, arabicName: 'الفجر' },
    { name: 'Dhuhr', time: '12:45 PM', completed: true, arabicName: 'الظهر' },
    { name: 'Asr', time: '4:15 PM', completed: false, arabicName: 'العصر' },
    { name: 'Maghrib', time: '6:30 PM', completed: false, arabicName: 'المغرب' },
    { name: 'Isha', time: '8:00 PM', completed: false, arabicName: 'العشاء' },
  ]);

  const togglePrayer = (index: number) => {
    const newPrayers = [...prayers];
    newPrayers[index].completed = !newPrayers[index].completed;
    setPrayers(newPrayers);
  };

  const completedCount = prayers.filter(p => p.completed).length;
  const progressPercentage = (completedCount / prayers.length) * 100;

  const renderProgressCircle = () => {
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - completedCount / prayers.length);

    return (
      <View style={styles.progressCircleContainer}>
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
            stroke={colors.card}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.progressContent}>
          <Text style={styles.progressNumber}>{completedCount}/{prayers.length}</Text>
          <Text style={styles.progressLabel}>Prayers</Text>
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Prayer Tracker</Text>
        <Text style={styles.subtitle}>Track your daily prayers</Text>
        
        {/* Progress Summary Card */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          {renderProgressCircle()}
          <Text style={styles.summaryText}>
            {completedCount === prayers.length 
              ? 'All prayers completed! 🎉' 
              : 'Keep up the great work!'}
          </Text>
        </LinearGradient>

        {/* Prayer List */}
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
            <Text style={styles.sectionTitle}>Today&apos;s Prayers</Text>
          </View>
          {prayers.map((prayer, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.prayerCard,
                  prayer.completed && styles.prayerCardCompleted
                ]}
                onPress={() => togglePrayer(index)}
                activeOpacity={0.7}
              >
                <View style={styles.prayerLeft}>
                  <View style={[
                    styles.prayerIconContainer,
                    prayer.completed && styles.prayerIconContainerCompleted
                  ]}>
                    <IconSymbol
                      ios_icon_name="moon"
                      android_material_icon_name="brightness-3"
                      size={22}
                      color={prayer.completed ? colors.card : colors.primary}
                    />
                  </View>
                  <View style={styles.prayerInfo}>
                    <Text style={[
                      styles.prayerName,
                      prayer.completed && styles.prayerNameCompleted
                    ]}>
                      {prayer.name}
                    </Text>
                    <Text style={[
                      styles.prayerArabic,
                      prayer.completed && styles.prayerArabicCompleted
                    ]}>
                      {prayer.arabicName}
                    </Text>
                    <Text style={[
                      styles.prayerTime,
                      prayer.completed && styles.prayerTimeCompleted
                    ]}>
                      {prayer.time}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.checkbox,
                  prayer.completed && styles.checkboxCompleted
                ]}>
                  {prayer.completed && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color={colors.card}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

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
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    marginBottom: spacing.xxxl,
    alignItems: 'center',
    ...shadows.colored,
  },
  progressCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.card,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    marginTop: spacing.xs,
  },
  progressPercentage: {
    ...typography.bodyBold,
    color: colors.card,
    marginTop: spacing.xs,
  },
  summaryText: {
    ...typography.bodyBold,
    color: colors.card,
    textAlign: 'center',
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
  prayerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prayerCardCompleted: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prayerIconContainerCompleted: {
    backgroundColor: colors.primary,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  prayerNameCompleted: {
    color: colors.primary,
  },
  prayerArabic: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  prayerArabicCompleted: {
    color: colors.primary,
  },
  prayerTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prayerTimeCompleted: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
