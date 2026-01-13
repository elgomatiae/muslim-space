/**
 * PrayerTimesWidget - Displays the five daily prayers with times
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
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
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import * as Haptics from 'expo-haptics';
import { logActivity } from '@/utils/activityLogger';
import { schedulePrayerNotifications } from '@/utils/notificationService';

export default function PrayerTimesWidget() {
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
            'Location Required',
            'We need your location to calculate accurate prayer times for your city. Please enable location permissions in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Enable', onPress: async () => {
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
      Alert.alert('Error', getErrorMessage(error) || 'Failed to load prayer times. Please check your location settings.');
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
      Alert.alert('Please Log In', 'You must be logged in to track prayers');
      return;
    }

    if (prayer.completed) {
      Alert.alert('Already Completed', `${prayer.name} has already been marked as completed today.`);
      return;
    }

    Alert.alert(
      `Mark ${prayer.name} as Completed?`,
      `Did you complete ${prayer.name} prayer at ${prayer.time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // Mark prayer as completed
              await markPrayerCompleted(user.id, prayer.name);

              // Log activity immediately
              await logActivity({
                userId: user.id,
                activityType: 'prayer_completed',
                activityCategory: 'ibadah',
                activityTitle: `${prayer.name} Prayer Completed`,
                activityDescription: `Completed ${prayer.name} prayer at ${prayer.time}`,
                pointsEarned: 10,
              });

              // Update Iman Tracker
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

              Alert.alert('Success', `${prayer.name} marked as completed!`);
            } catch (error) {
              console.error('Error marking prayer:', error);
              Alert.alert('Error', 'Failed to mark prayer as completed');
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
          <Text style={styles.title}>Prayer Times</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  if (!prayerTimes) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol ios_icon_name="moon.fill" android_material_icon_name="nightlight" size={18} color={colors.primary} />
          <Text style={styles.title}>Prayer Times</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load prayer times</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPrayerTimes}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
            <Text style={styles.title}>Prayer Times</Text>
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
            <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
            <Text style={styles.nextPrayerName}>{nextPrayer.name} ({nextPrayer.arabicName})</Text>
            <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
            <Text style={styles.nextPrayerCountdown}>in {timeUntilNext}</Text>
          </LinearGradient>
        </View>
      )}

      <ScrollView
        style={styles.prayersList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
                    size={16}
                    color={colors.success}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  nextPrayerGradient: {
    padding: spacing.md,
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
    maxHeight: 280,
  },
  prayerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
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
    marginBottom: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  prayerArabic: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prayerTime: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  prayerTimeCompleted: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
});
