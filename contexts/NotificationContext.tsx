
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';
import {
  getNotificationSettings,
  updateNotificationSettings as updateNotificationSettingsService,
  requestNotificationPermissions,
  requestLocationPermissions,
  getScheduledNotifications,
  schedulePrayerNotifications,
  cancelPrayerNotifications,
} from '@/utils/notificationService';
import { getTodayPrayerTimes, getTomorrowPrayerTimes } from '@/services/PrayerTimeService';

export interface NotificationSettings {
  prayerNotifications: boolean;
  dailyContentNotifications: boolean;
  imanScoreNotifications: boolean;
  imanTrackerNotifications: boolean;
  goalReminderNotifications: boolean;
  achievementNotifications: boolean;
  locationPermissionGranted: boolean;
  notificationPermissionGranted: boolean;
  locationServicesEnabled: boolean;
}

interface NotificationContextType {
  settings: NotificationSettings;
  loading: boolean;
  scheduledCount: number;
  requestPermissions: () => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  refreshPrayerTimesAndNotifications: () => Promise<void>;
  refreshScheduledCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    prayerNotifications: true,
    dailyContentNotifications: true,
    imanScoreNotifications: true,
    imanTrackerNotifications: true,
    goalReminderNotifications: true,
    achievementNotifications: true,
    locationPermissionGranted: false,
    notificationPermissionGranted: false,
    locationServicesEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Load settings on mount and when user changes
  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  // Refresh scheduled count periodically
  useEffect(() => {
    refreshScheduledCount();
    const interval = setInterval(() => {
      refreshScheduledCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const loadedSettings = await getNotificationSettings(user?.id);
      
      // Check if location services are enabled
      let locationServicesEnabled = false;
      try {
        // Check if location services are enabled on the device
        if (Location.hasServicesEnabledAsync) {
          locationServicesEnabled = await Location.hasServicesEnabledAsync();
        } else {
          // Fallback: if location permission is granted, assume services are enabled
          const { status } = await Location.getForegroundPermissionsAsync();
          locationServicesEnabled = status === 'granted';
        }
      } catch (error) {
        // If check fails, use permission status as fallback
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          locationServicesEnabled = status === 'granted';
        } catch (permError) {
          locationServicesEnabled = false;
        }
      }
      
      setSettings({
        ...loadedSettings,
        locationServicesEnabled,
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<void> => {
    try {
      // Request notification permissions
      const notificationGranted = await requestNotificationPermissions();
      
      // Request location permissions
      const locationGranted = await requestLocationPermissions();
      
      // Check location services
      let locationServicesEnabled = false;
      try {
        if (Location.hasServicesEnabledAsync) {
          locationServicesEnabled = await Location.hasServicesEnabledAsync();
        } else {
          const { status } = await Location.getForegroundPermissionsAsync();
          locationServicesEnabled = status === 'granted';
        }
      } catch (error) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          locationServicesEnabled = status === 'granted';
        } catch (permError) {
          locationServicesEnabled = false;
        }
      }
      
      // Reload settings to get updated permissions
      await loadSettings();
      
      // Get updated settings after reload
      const updatedSettings = await getNotificationSettings(user?.id);
      
      // If both permissions granted and prayer notifications enabled, schedule notifications
      if (notificationGranted && locationGranted && updatedSettings.prayerNotifications) {
        await refreshPrayerTimesAndNotifications();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Update in service (saves to Supabase and AsyncStorage)
      await updateNotificationSettingsService(newSettings, user?.id);
      
      // If prayer notifications were enabled and we have permissions, schedule them
      if (newSettings.prayerNotifications === true && 
          updatedSettings.notificationPermissionGranted && 
          updatedSettings.locationPermissionGranted) {
        await refreshPrayerTimesAndNotifications();
      }
      
      // Refresh scheduled count
      await refreshScheduledCount();
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  const refreshPrayerTimesAndNotifications = async (): Promise<void> => {
    try {
      if (!user?.id) {
        console.log('No user ID, skipping prayer notification refresh');
        return;
      }

      // Check if prayer notifications are enabled
      const currentSettings = await getNotificationSettings(user.id);
      if (!currentSettings.prayerNotifications) {
        console.log('Prayer notifications disabled, skipping refresh');
        return;
      }

      // Check permissions
      const { status: notificationStatus } = await Notifications.getPermissionsAsync();
      if (notificationStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      // Get today's and tomorrow's prayer times
      const todayPrayerTimes = await getTodayPrayerTimes(user.id);
      const tomorrowPrayerTimes = await getTomorrowPrayerTimes(user.id);

      // Convert to format expected by schedulePrayerNotifications
      const prayerTimes = {
        fajr: {
          time: todayPrayerTimes.fajr.time,
          date: todayPrayerTimes.fajr.date,
          name: todayPrayerTimes.fajr.name,
          arabicName: todayPrayerTimes.fajr.arabicName,
        },
        dhuhr: {
          time: todayPrayerTimes.dhuhr.time,
          date: todayPrayerTimes.dhuhr.date,
          name: todayPrayerTimes.dhuhr.name,
          arabicName: todayPrayerTimes.dhuhr.arabicName,
        },
        asr: {
          time: todayPrayerTimes.asr.time,
          date: todayPrayerTimes.asr.date,
          name: todayPrayerTimes.asr.name,
          arabicName: todayPrayerTimes.asr.arabicName,
        },
        maghrib: {
          time: todayPrayerTimes.maghrib.time,
          date: todayPrayerTimes.maghrib.date,
          name: todayPrayerTimes.maghrib.name,
          arabicName: todayPrayerTimes.maghrib.arabicName,
        },
        isha: {
          time: todayPrayerTimes.isha.time,
          date: todayPrayerTimes.isha.date,
          name: todayPrayerTimes.isha.name,
          arabicName: todayPrayerTimes.isha.arabicName,
        },
      };

      const tomorrowTimes = {
        fajr: {
          time: tomorrowPrayerTimes.fajr.time,
          date: tomorrowPrayerTimes.fajr.date,
          name: tomorrowPrayerTimes.fajr.name,
          arabicName: tomorrowPrayerTimes.fajr.arabicName,
        },
        dhuhr: {
          time: tomorrowPrayerTimes.dhuhr.time,
          date: tomorrowPrayerTimes.dhuhr.date,
          name: tomorrowPrayerTimes.dhuhr.name,
          arabicName: tomorrowPrayerTimes.dhuhr.arabicName,
        },
        asr: {
          time: tomorrowPrayerTimes.asr.time,
          date: tomorrowPrayerTimes.asr.date,
          name: tomorrowPrayerTimes.asr.name,
          arabicName: tomorrowPrayerTimes.asr.arabicName,
        },
        maghrib: {
          time: tomorrowPrayerTimes.maghrib.time,
          date: tomorrowPrayerTimes.maghrib.date,
          name: tomorrowPrayerTimes.maghrib.name,
          arabicName: tomorrowPrayerTimes.maghrib.arabicName,
        },
        isha: {
          time: tomorrowPrayerTimes.isha.time,
          date: tomorrowPrayerTimes.isha.date,
          name: tomorrowPrayerTimes.isha.name,
          arabicName: tomorrowPrayerTimes.isha.arabicName,
        },
      };

      // Schedule notifications
      await schedulePrayerNotifications(prayerTimes, user.id, tomorrowTimes);
      
      // Refresh scheduled count
      await refreshScheduledCount();
    } catch (error) {
      console.error('Error refreshing prayer times and notifications:', error);
      throw error;
    }
  };

  const refreshScheduledCount = async (): Promise<void> => {
    try {
      const notifications = await getScheduledNotifications();
      setScheduledCount(notifications.length);
    } catch (error) {
      console.error('Error refreshing scheduled count:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        settings,
        loading,
        scheduledCount,
        requestPermissions,
        updateSettings,
        refreshPrayerTimesAndNotifications,
        refreshScheduledCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
