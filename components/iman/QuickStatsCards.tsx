
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

interface QuickStatsCardsProps {
  prayerProgress: number;
  quranProgress: number;
  dhikrProgress: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
  };
}

export default function QuickStatsCards({
  prayerProgress,
  quranProgress,
  dhikrProgress,
  streakData,
}: QuickStatsCardsProps) {
  const activeCount = (prayerProgress > 0 ? 1 : 0) + (quranProgress > 0 ? 1 : 0) + (dhikrProgress > 0 ? 1 : 0);
  const overallProgress = Math.round(((prayerProgress + quranProgress + dhikrProgress) / 3) * 100);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.success + '20', colors.success + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statCard}
      >
        <IconSymbol
          ios_icon_name="checkmark.circle.fill"
          android_material_icon_name="check-circle"
          size={28}
          color={colors.success}
        />
        <Text style={styles.statValue}>{activeCount}</Text>
        <Text style={styles.statLabel}>Active Today</Text>
      </LinearGradient>
      
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statCard}
      >
        <IconSymbol
          ios_icon_name="target"
          android_material_icon_name="track-changes"
          size={28}
          color={colors.primary}
        />
        <Text style={styles.statValue}>{overallProgress}%</Text>
        <Text style={styles.statLabel}>Overall</Text>
      </LinearGradient>
      
      <LinearGradient
        colors={[colors.info + '20', colors.info + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.statCard}
      >
        <IconSymbol
          ios_icon_name="calendar"
          android_material_icon_name="calendar-today"
          size={28}
          color={colors.info}
        />
        <Text style={styles.statValue}>{streakData.longestStreak}</Text>
        <Text style={styles.statLabel}>Best Streak</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
