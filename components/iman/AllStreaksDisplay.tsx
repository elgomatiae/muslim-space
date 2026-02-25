/**
 * ============================================================================
 * ALL STREAKS DISPLAY COMPONENT
 * ============================================================================
 * 
 * Displays all streak types: General, Prayer, Workout, and Quran
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { getAllStreaks, AllStreaksData, loadStreaksFromSupabase } from '@/utils/multiStreakTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';
import ShareButton from '@/components/share/ShareButton';
import { generatePrayerStreakCard, generateWorkoutStreakCard, generateQuranStreakCard } from '@/utils/shareCardGenerator';

export default function AllStreaksDisplay() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [streaks, setStreaks] = useState<AllStreaksData>({
    general: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
    prayer: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
    workout: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
    quran: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
  });

  useEffect(() => {
    loadStreaks();
    const interval = setInterval(loadStreaks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadStreaks = async () => {
    if (!user?.id) return;
    
    try {
      // Try to load from Supabase first
      const supabaseData = await loadStreaksFromSupabase(user.id);
      if (supabaseData) {
        setStreaks(supabaseData);
        return;
      }
      
      // Fallback to local storage
      const localData = await getAllStreaks(user.id);
      setStreaks(localData);
    } catch (error) {
      console.error('Error loading streaks:', error);
    }
  };

  const getStreakColor = (streakType: string): string => {
    switch (streakType) {
      case 'prayer':
        return '#10B981'; // Green
      case 'workout':
        return '#F59E0B'; // Amber
      case 'quran':
        return '#3B82F6'; // Blue
      default:
        return '#FF6B6B'; // Red
    }
  };

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'prayer':
        return { ios: 'moon.stars.fill', android: 'self-improvement' };
      case 'workout':
        return { ios: 'figure.run', android: 'fitness-center' };
      case 'quran':
        return { ios: 'book.fill', android: 'menu-book' };
      default:
        return { ios: 'flame.fill', android: 'local-fire-department' };
    }
  };

  const getStreakTitle = (streakType: string): string => {
    switch (streakType) {
      case 'prayer':
        return t('home.prayerStreak');
      case 'workout':
        return t('home.workoutStreak');
      case 'quran':
        return t('home.quranStreak');
      default:
        return t('home.activityStreak');
    }
  };

  const renderStreakCard = (streakType: 'general' | 'prayer' | 'workout' | 'quran', data: AllStreaksData[typeof streakType]) => {
    const color = getStreakColor(streakType);
    const icon = getStreakIcon(streakType);
    const title = getStreakTitle(streakType);

    // Generate share card data - always allow sharing regardless of streak length
    let shareCardData;
    if (streakType === 'prayer') {
      shareCardData = generatePrayerStreakCard(data.currentStreak || 0);
    } else if (streakType === 'workout') {
      shareCardData = generateWorkoutStreakCard(data.currentStreak || 0);
    } else if (streakType === 'quran') {
      shareCardData = generateQuranStreakCard(data.currentStreak || 0);
    } else if (streakType === 'general') {
      // For general streak, use a generic milestone card
      shareCardData = {
        type: 'milestone' as const,
        title: t('home.daysActive', { days: data.currentStreak || 0 }),
        subtitle: t('home.activityStreak'),
        value: data.currentStreak || 0,
        description: data.currentStreak === 0 
          ? t('home.startJourneyToday')
          : t('home.keepUpAmazingWork'),
        gradient: ['#FF6B6B', '#FF5252', '#FF1744'],
      };
    }

    return (
      <LinearGradient
        key={streakType}
        colors={[color + 'FF', color + 'DD', color + 'AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakCard}
      >
        <View style={styles.cardHeader}>
          <IconSymbol
            ios_icon_name={icon.ios}
            android_material_icon_name={icon.android}
            size={32}
            color={colors.card}
          />
          <Text style={styles.cardTitle}>{title}</Text>
          {shareCardData && (
            <View style={styles.shareButtonContainer}>
              <ShareButton data={shareCardData} size={24} color={colors.card} />
            </View>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.mainStat}>
            <Text style={styles.streakNumber}>{data.currentStreak}</Text>
            <Text style={styles.streakLabel}>{t('home.days', { count: data.currentStreak })}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={16}
                color={colors.card + 'CC'}
              />
              <Text style={styles.statText}>{data.longestStreak}</Text>
              <Text style={styles.statLabel}>{t('home.best')}</Text>
            </View>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={16}
                color={colors.card + 'CC'}
              />
              <Text style={styles.statText}>{data.totalDays}</Text>
              <Text style={styles.statLabel}>{t('home.total')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {renderStreakCard('general', streaks.general)}
      {renderStreakCard('prayer', streaks.prayer)}
      {renderStreakCard('workout', streaks.workout)}
      {renderStreakCard('quran', streaks.quran)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  streakCard: {
    width: 200,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    marginRight: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.bold,
    fontSize: 16,
    color: colors.card,
    flex: 1,
  },
  shareButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.round,
    padding: spacing.xs / 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakNumber: {
    ...typography.bold,
    fontSize: 48,
    color: colors.card,
    marginBottom: spacing.xs / 2,
  },
  streakLabel: {
    ...typography.regular,
    fontSize: 14,
    color: colors.card + 'DD',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  statText: {
    ...typography.bold,
    fontSize: 18,
    color: colors.card,
  },
  statLabel: {
    ...typography.regular,
    fontSize: 12,
    color: colors.card + 'CC',
  },
});
