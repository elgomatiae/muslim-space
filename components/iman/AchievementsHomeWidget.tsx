/**
 * Achievements Home Widget
 * Displays achievements preview on the home screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LOCAL_ACHIEVEMENTS } from '@/data/localAchievements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '@/contexts/I18nContext';
import { supabase } from '@/lib/supabase';

interface Achievement {
  id: string;
  title: string;
  icon_name: string;
  tier: string;
  unlocked: boolean;
  progress: number;
}

export default function AchievementsHomeWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Try Supabase first, fallback to local
      let allAchievements: any[] = [];
      let userAchievements: any[] = [];
      let progressData: any[] = [];

      try {
        const [achievementsResult, userAchievementsResult] = await Promise.all([
          supabase
            .from('achievements')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true })
            .limit(10),
          supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', user.id),
        ]);

        if (!achievementsResult.error && achievementsResult.data && achievementsResult.data.length > 0) {
          allAchievements = achievementsResult.data;
          userAchievements = userAchievementsResult.data || [];
        } else {
          // Use local fallback
          allAchievements = LOCAL_ACHIEVEMENTS.filter(a => a.is_active).slice(0, 10);
          const unlockedData = await AsyncStorage.getItem(`user_achievements_${user.id}`);
          if (unlockedData) {
            userAchievements = JSON.parse(unlockedData);
          }
        }
      } catch (error) {
        // Use local fallback
        allAchievements = LOCAL_ACHIEVEMENTS.filter(a => a.is_active).slice(0, 10);
        const unlockedData = await AsyncStorage.getItem(`user_achievements_${user.id}`);
        if (unlockedData) {
          userAchievements = JSON.parse(unlockedData);
        }
      }

      const unlockedMap = new Map(
        userAchievements.map((ua: any) => [ua.achievement_id || ua.id, true])
      );

      const merged = allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: !!unlockedMap.get(achievement.id),
        progress: unlockedMap.get(achievement.id) ? 100 : 0,
      }));

      const unlocked = merged.filter(a => a.unlocked).length;

      // Get recent achievements (last 3 unlocked or top 3 in progress)
      const sorted = merged
        .sort((a, b) => {
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return b.progress - a.progress;
        })
        .slice(0, 3);

      setAchievements(sorted);
      setUnlockedCount(unlocked);
    } catch (error) {
      console.log('Error loading achievements widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#A78BFA';
      case 'gold': return '#FBBF24';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#CD7F32';
      default: return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={24}
                color="#FFFFFF"
              />
            </LinearGradient>
            <Text style={styles.title}>{t('home.achievements')}</Text>
          </View>
        </View>
        <ActivityIndicator size="small" color={colors.primary} style={styles.loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/(iman)')}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={24}
                color="#FFFFFF"
              />
            </LinearGradient>
            <View>
              <Text style={styles.title}>{t('home.achievements')}</Text>
              <Text style={styles.subtitle}>
                {t('home.achievementsSubtitle', { unlocked: unlockedCount, shown: achievements.length })}
              </Text>
            </View>
          </View>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </View>

        {achievements.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsScroll}
            contentContainerStyle={styles.achievementsScrollContent}
          >
            {achievements.map((achievement, index) => (
              <View
                key={achievement.id || index}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementCardUnlocked,
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.unlocked
                        ? getTierColor(achievement.tier) + '20'
                        : colors.highlight,
                    },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={
                      achievement.unlocked
                        ? achievement.icon_name || 'star.fill'
                        : 'lock.fill'
                    }
                    android_material_icon_name={
                      achievement.unlocked ? 'star' : 'lock'
                    }
                    size={24}
                    color={
                      achievement.unlocked
                        ? getTierColor(achievement.tier)
                        : colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                  numberOfLines={1}
                >
                  {achievement.title}
                </Text>
                {achievement.unlocked ? (
                  <View style={styles.unlockedBadge}>
                    <IconSymbol
                      ios_icon_name="checkmark.seal.fill"
                      android_material_icon_name="verified"
                      size={12}
                      color={colors.success}
                    />
                  </View>
                ) : (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${achievement.progress}%`,
                          backgroundColor: getTierColor(achievement.tier),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {t('home.completeActivitiesForAchievements')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.medium,
    overflow: 'hidden',
  },
  touchable: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  achievementsScroll: {
    marginHorizontal: -spacing.lg,
  },
  achievementsScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  achievementCard: {
    width: 120,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementCardUnlocked: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.card,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 11,
  },
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  unlockedBadge: {
    marginTop: spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
