/**
 * PrayerTimesWidget - Displays the five daily prayers with times
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getTodayPrayerTimes,
  getTomorrowPrayerTimes,
  getNextPrayer, 
  getTimeUntilNextPrayer,
  markPrayerCompleted,
  type PrayerTime,
  type DailyPrayerTimes 
} from '@/services/PrayerTimeService';
import { getCurrentLocation, requestLocationPermission, hasLocationPermission } from '@/services/LocationService';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import * as Haptics from 'expo-haptics';
import { logActivity } from '@/utils/activityLogger';
import { schedulePrayerNotifications } from '@/utils/notificationService';

export default function PrayerTimesWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { ibadahGoals, updateIbadahGoals } = useImanTracker();
  
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const hasPermission = await hasLocationPermission();
    setLocationPermissionGranted(hasPermission);
  };

  const loadPrayerTimes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check location permission
      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert(
            t('prayer.locationRequired'),
            t('prayer.locationRequiredMessage'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('prayer.enable'), onPress: async () => {
                await requestLocationPermission();
                await checkLocationPermission();
                await loadPrayerTimes();
              }},
            ]
          );
          setLoading(false);
          return;
        }
      }

      setLocationPermissionGranted(true);

      // Get prayer times using exact location
      const times = await getTodayPrayerTimes(user?.id);
      setPrayerTimes(times);

      // Get next prayer
      const next = getNextPrayer(times);
      setNextPrayer(next);
      if (next) {
        setTimeUntilNext(getTimeUntilNextPrayer(next));
      }

      // Get tomorrow's prayer times for notification scheduling
      let tomorrowTimes: DailyPrayerTimes | null = null;
      try {
        tomorrowTimes = await getTomorrowPrayerTimes(user?.id);
      } catch (error) {
        console.log('Could not get tomorrow prayer times for notifications:', error);
      }

      // Schedule prayer notifications at exact prayer times
      await schedulePrayerNotifications(
        {
          fajr: times.fajr,
          dhuhr: times.dhuhr,
          asr: times.asr,
          maghrib: times.maghrib,
          isha: times.isha,
        },
        user?.id,
        tomorrowTimes ? {
          fajr: tomorrowTimes.fajr,
          dhuhr: tomorrowTimes.dhuhr,
          asr: tomorrowTimes.asr,
          maghrib: tomorrowTimes.maghrib,
          isha: tomorrowTimes.isha,
        } : undefined
      );

      console.log('✅ Prayer times loaded for:', times.city);
    } catch (error: any) {
      console.error('Error loading prayer times:', error);
      const { getErrorMessage } = require('@/utils/errorHandler');
      Alert.alert(t('common.error'), getErrorMessage(error) || t('prayer.failedToLoadPrayerTimes'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  // Update countdown every minute
  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilNextPrayer(nextPrayer));
    }, 60000);

    return () => clearInterval(interval);
  }, [nextPrayer]);

  const handlePrayerPress = async (prayer: PrayerTime) => {
    if (!user) {
      Alert.alert(t('prayer.pleaseLogIn'), t('prayer.mustBeLoggedIn'));
      return;
    }

    if (prayer.completed) {
      Alert.alert(t('prayer.alreadyCompleted'), t('prayer.alreadyCompletedMessage', { prayerName: prayer.name }));
      return;
    }

    Alert.alert(
      t('prayer.markAsCompleted', { prayerName: prayer.name }),
      t('prayer.confirmCompletion', { prayerName: prayer.name, time: prayer.time }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('prayer.markComplete'),
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // Mark prayer as completed (this updates prayer_times and user_stats)
              await markPrayerCompleted(user.id, prayer.name);

              // Log activity immediately to activity_log
              await logActivity({
                userId: user.id,
                activityType: 'prayer_completed',
                activityCategory: 'ibadah',
                activityTitle: `${prayer.name} Prayer Completed`,
                activityDescription: `Completed ${prayer.name} prayer at ${prayer.time}`,
                pointsEarned: 10,
              });

              // Update Iman Tracker (this triggers logIbadahActivity which checks achievements)
              if (ibadahGoals && ibadahGoals.fardPrayers) {
                const prayerKey = prayer.name.toLowerCase() as keyof typeof ibadahGoals.fardPrayers;
                const updatedGoals = {
                  ...ibadahGoals,
                  fardPrayers: {
                    ...ibadahGoals.fardPrayers,
                    [prayerKey]: true,
                  },
                };
                await updateIbadahGoals(updatedGoals);
              }

              // Also check achievements directly after prayer completion
              try {
                const { checkAndUnlockAchievements } = await import('@/utils/achievementService');
                await checkAndUnlockAchievements(user.id);
              } catch (err) {
                console.log('Error checking achievements:', err);
              }

              // Update local state
              if (prayerTimes) {
                const updatedPrayers = prayerTimes.prayers.map(p => 
                  p.name === prayer.name ? { ...p, completed: true } : p
                );
                setPrayerTimes({
                  ...prayerTimes,
                  prayers: updatedPrayers,
                  [prayer.name.toLowerCase()]: { ...prayer, completed: true },
                });
              }

              Alert.alert(t('prayer.success'), t('prayer.markedAsCompleted', { prayerName: prayer.name }));
            } catch (error) {
              console.error('Error marking prayer:', error);
              Alert.alert(t('common.error'), t('prayer.failedToMarkCompleted'));
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrayerTimes();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol ios_icon_name="moon.fill" android_material_icon_name="nightlight" size={18} color={colors.primary} />
          <Text style={styles.title}>{t('prayer.prayerTimes')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{t('prayer.gettingLocation')}</Text>
        </View>
      </View>
    );
  }

  if (!prayerTimes) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol ios_icon_name="moon.fill" android_material_icon_name="nightlight" size={18} color={colors.primary} />
          <Text style={styles.title}>{t('prayer.prayerTimes')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('prayer.unableToLoadPrayerTimes')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPrayerTimes}>
            <Text style={styles.retryButtonText}>{t('prayer.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol ios_icon_name="moon.fill" android_material_icon_name="nightlight" size={18} color={colors.primary} />
          <View>
            <Text style={styles.title}>{t('prayer.prayerTimes')}</Text>
            <Text style={styles.subtitle}>{prayerTimes.city}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {nextPrayer && (
        <View style={styles.nextPrayerCard}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextPrayerGradient}
          >
            <Text style={styles.nextPrayerLabel}>{t('prayer.nextPrayer')}</Text>
            <Text style={styles.nextPrayerName}>{nextPrayer.name} ({nextPrayer.arabicName})</Text>
            <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
            <Text style={styles.nextPrayerCountdown}>{t('prayer.in')} {timeUntilNext}</Text>
          </LinearGradient>
        </View>
      )}

      <View style={styles.prayersList}>
        {prayerTimes.prayers.map((prayer) => (
          <TouchableOpacity
            key={prayer.name}
            style={[styles.prayerCard, prayer.completed && styles.prayerCardCompleted]}
            onPress={() => handlePrayerPress(prayer)}
            activeOpacity={0.7}
          >
            <View style={styles.prayerInfo}>
              <View style={styles.prayerNameContainer}>
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <Text style={styles.prayerArabic}>{prayer.arabicName}</Text>
              </View>
              <View style={styles.prayerTimeContainer}>
                <Text style={[styles.prayerTime, prayer.completed && styles.prayerTimeCompleted]}>
                  {prayer.time}
                </Text>
                {prayer.completed && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={14}
                    color={colors.success}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 1,
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  refreshButton: {
    padding: spacing.xs / 2,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.captionBold,
    color: colors.card,
    fontSize: 12,
  },
  nextPrayerCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    ...shadows.small,
  },
  nextPrayerGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  nextPrayerLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    marginBottom: 2,
    fontSize: 10,
  },
  nextPrayerName: {
    ...typography.h4,
    color: colors.card,
    marginBottom: 2,
    fontSize: 16,
  },
  nextPrayerTime: {
    ...typography.h3,
    color: colors.card,
    marginBottom: 2,
    fontSize: 20,
  },
  nextPrayerCountdown: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    fontSize: 12,
  },
  prayersList: {
    // Removed maxHeight to allow all prayers to be visible
  },
  prayerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prayerCardCompleted: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '40',
  },
  prayerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerNameContainer: {
    flex: 1,
  },
  prayerName: {
    ...typography.body,
    color: colors.text,
    marginBottom: 0,
    fontSize: 13,
    fontWeight: '600',
  },
  prayerArabic: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  prayerTime: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  prayerTimeCompleted: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
});
