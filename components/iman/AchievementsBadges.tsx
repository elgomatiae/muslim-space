
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_day',
    title: 'First Steps',
    description: 'Complete your first day',
    icon: 'star.fill',
    unlocked: false,
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: 'flame.fill',
    unlocked: false,
  },
  {
    id: 'prayer_100',
    title: 'Prayer Champion',
    description: '100 prayers completed',
    icon: 'hands.sparkles.fill',
    unlocked: false,
  },
  {
    id: 'quran_lover',
    title: 'Quran Lover',
    description: 'Read 100 pages',
    icon: 'book.fill',
    unlocked: false,
  },
];

export default function AchievementsBadges() {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const saved = await AsyncStorage.getItem('achievements');
      if (saved) {
        setAchievements(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading achievements:', error);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={colors.gradientPurple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconContainer}
        >
          <IconSymbol
            ios_icon_name="rosette"
            android_material_icon_name="workspace-premium"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubtitle}>{unlockedCount}/{achievements.length} unlocked</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
        {achievements.map((achievement, index) => (
          <React.Fragment key={index}>
            <View style={[
              styles.achievementCard,
              !achievement.unlocked && styles.achievementCardLocked
            ]}>
              <LinearGradient
                colors={achievement.unlocked 
                  ? colors.gradientPurple
                  : [colors.card, colors.cardAlt]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.achievementCardGradient}
              >
                <View style={[
                  styles.achievementIconContainer,
                  !achievement.unlocked && styles.achievementIconContainerLocked
                ]}>
                  <IconSymbol
                    ios_icon_name={achievement.icon}
                    android_material_icon_name="star"
                    size={32}
                    color={achievement.unlocked ? colors.card : colors.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.achievementTitle,
                  achievement.unlocked && styles.achievementTitleUnlocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  achievement.unlocked && styles.achievementDescriptionUnlocked
                ]}>
                  {achievement.description}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <IconSymbol
                      ios_icon_name="checkmark.seal.fill"
                      android_material_icon_name="verified"
                      size={16}
                      color={colors.card}
                    />
                    <Text style={styles.unlockedText}>Unlocked</Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  achievementsScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  achievementCard: {
    width: 140,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 180,
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  achievementIconContainerLocked: {
    backgroundColor: colors.highlight,
  },
  achievementTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementTitleUnlocked: {
    color: colors.card,
  },
  achievementDescription: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  achievementDescriptionUnlocked: {
    color: colors.card,
    opacity: 0.9,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.sm,
  },
  unlockedText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '600',
  },
});
