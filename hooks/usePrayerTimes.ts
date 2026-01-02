
/**
 * usePrayerTimes - React hook for managing prayer times
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DailyPrayerTimes, PrayerTime, getTodayPrayerTimes, getNextPrayer, getTimeUntilNextPrayer, CalculationMethodName } from '@/services/PrayerTimeService';
import { UserLocation, getCurrentLocation, requestLocationPermission } from '@/services/LocationService';
import { schedulePrayerNotifications } from '@/services/PrayerNotificationService';
import { useAuth } from '@/contexts/AuthContext';

export function usePrayerTimes() {
  const { user } = useAuth();
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  /**
   * Load prayer times
   */
  const loadPrayerTimes = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Get location
      const userLocation = await getCurrentLocation(useCache);
      setLocation(userLocation);
      setHasLocationPermission(true);

      // Get prayer times
      const times = await getTodayPrayerTimes(
        userLocation,
        user?.id,
        'NorthAmerica', // Default method, can be made configurable
        useCache
      );

      setPrayerTimes(times);

      // Get next prayer
      const next = getNextPrayer(times);
      setNextPrayer(next);

      // Schedule notifications
      await schedulePrayerNotifications(times);

      console.log('Prayer times loaded successfully');
    } catch (err) {
      console.error('Error loading prayer times:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prayer times');
      setHasLocationPermission(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Request location permission and load prayer times
   */
  const requestPermissionAndLoad = useCallback(async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      await loadPrayerTimes(false);
    } else {
      setError('Location permission is required for accurate prayer times');
      setHasLocationPermission(false);
    }
  }, [loadPrayerTimes]);

  /**
   * Refresh prayer times (force reload)
   */
  const refresh = useCallback(async () => {
    await loadPrayerTimes(false);
  }, [loadPrayerTimes]);

  /**
   * Update time until next prayer
   */
  useEffect(() => {
    if (!nextPrayer) return;

    const updateTime = () => {
      const time = getTimeUntilNextPrayer(nextPrayer);
      setTimeUntilNext(time);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextPrayer]);

  /**
   * Load prayer times on mount
   */
  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  /**
   * Reload prayer times when app comes to foreground
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadPrayerTimes();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [loadPrayerTimes]);

  /**
   * Check if it's a new day and reload prayer times
   */
  useEffect(() => {
    if (!prayerTimes) return;

    const checkNewDay = () => {
      const today = new Date().toISOString().split('T')[0];
      if (prayerTimes.date !== today) {
        console.log('New day detected, reloading prayer times');
        loadPrayerTimes(false);
      }
    };

    // Check every minute
    const interval = setInterval(checkNewDay, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes, loadPrayerTimes]);

  return {
    prayerTimes,
    nextPrayer,
    timeUntilNext,
    location,
    loading,
    error,
    hasLocationPermission,
    refresh,
    requestPermissionAndLoad,
  };
}
