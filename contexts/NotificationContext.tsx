
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
import { getTodayAndTomorrowPrayerTimes } from '@/services/PrayerTimeService';

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

  // Load settings on mount and when user changes - delay to ensure native modules are ready
  useEffect(() => {
    // Delay loading to ensure React Native and native modules are fully initialized
    const timeout = setTimeout(() => {
      loadSettings().catch((error) => {
        console.warn('Error loading notification settings on mount:', error);
      });
    }, 2000); // Wait 2 seconds for native modules to be ready

    return () => clearTimeout(timeout);
  }, [user?.id]);

  // Refresh scheduled count periodically - wrap in try-catch to prevent crashes
  useEffect(() => {
    // Delay initial call to ensure native modules are ready
    const timeout = setTimeout(() => {
      refreshScheduledCount().catch((error) => {
        console.warn('Error in initial scheduled count refresh:', error);
      });
    }, 1000); // Wait 1 second for native modules to initialize

    const interval = setInterval(() => {
      refreshScheduledCount().catch((error) => {
        console.warn('Error in periodic scheduled count refresh:', error);
      });
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Safety check: ensure we're not calling too early
      // Check if React Native bridge is ready
      const isReactNativeReady = 
        (typeof global !== 'undefined' && global.__fbBatchedBridge) ||
        (typeof window !== 'undefined');
      
      if (!isReactNativeReady) {
        // React Native might not be fully initialized
        console.warn('React Native not fully initialized, delaying settings load');
        setTimeout(() => {
          loadSettings().catch((err) => {
            console.warn('Error in delayed settings load:', err);
          });
        }, 1000);
        setLoading(false);
        return;
      }

      const loadedSettings = await getNotificationSettings(user?.id);
      
      // Check if location services are enabled - wrap in try-catch to prevent native module crashes
      let locationServicesEnabled = false;
      try {
        // Safely check if Location module is available and methods exist
        if (Location && typeof Location.hasServicesEnabledAsync === 'function') {
          try {
            locationServicesEnabled = await Location.hasServicesEnabledAsync();
          } catch (hasServicesError) {
            // If hasServicesEnabledAsync fails, try permission check
            if (typeof Location.getForegroundPermissionsAsync === 'function') {
              try {
                const { status } = await Location.getForegroundPermissionsAsync();
                locationServicesEnabled = status === 'granted';
              } catch (permError) {
                console.warn('Error checking location permissions:', permError);
                locationServicesEnabled = false;
              }
            }
          }
        } else if (Location && typeof Location.getForegroundPermissionsAsync === 'function') {
          // Fallback: if location permission is granted, assume services are enabled
          try {
            const { status } = await Location.getForegroundPermissionsAsync();
            locationServicesEnabled = status === 'granted';
          } catch (permError) {
            console.warn('Error checking location permissions:', permError);
            locationServicesEnabled = false;
          }
        }
      } catch (error) {
        // If all checks fail, default to false - don't crash
        console.warn('Error checking location services:', error);
        locationServicesEnabled = false;
      }
      
      setSettings({
        ...loadedSettings,
        locationServicesEnabled,
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Don't crash - use default settings
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async (): Promise<void> => {
    try {
      console.log('🔔 Starting permission request flow...');
      
      // Request notification permissions - wrap in try-catch
      let notificationGranted = false;
      try {
        console.log('📱 Requesting notification permissions...');
        notificationGranted = await requestNotificationPermissions();
        console.log(`📱 Notification permission result: ${notificationGranted ? 'granted' : 'denied'}`);
      } catch (error) {
        console.error('❌ Error requesting notification permissions:', error);
        // Continue even if notification permission request fails
      }
      
      // Request location permissions - wrap in try-catch
      let locationGranted = false;
      try {
        console.log('📍 Requesting location permissions...');
        locationGranted = await requestLocationPermissions();
        console.log(`📍 Location permission result: ${locationGranted ? 'granted' : 'denied'}`);
      } catch (error) {
        console.error('❌ Error requesting location permissions:', error);
        // Continue even if location permission request fails
      }
      
      // Check location services - wrap in try-catch
      let locationServicesEnabled = false;
      try {
        if (Location && typeof Location.hasServicesEnabledAsync === 'function') {
          try {
            locationServicesEnabled = await Location.hasServicesEnabledAsync();
          } catch (hasServicesError) {
            if (Location && typeof Location.getForegroundPermissionsAsync === 'function') {
              try {
                const { status } = await Location.getForegroundPermissionsAsync();
                locationServicesEnabled = status === 'granted';
              } catch (permError) {
                console.warn('Error checking location permissions:', permError);
                locationServicesEnabled = false;
              }
            }
          }
        } else if (Location && typeof Location.getForegroundPermissionsAsync === 'function') {
          try {
            const { status } = await Location.getForegroundPermissionsAsync();
            locationServicesEnabled = status === 'granted';
          } catch (permError) {
            console.warn('Error checking location permissions:', permError);
            locationServicesEnabled = false;
          }
        }
      } catch (error) {
        console.warn('Error checking location services:', error);
        locationServicesEnabled = false;
      }
      
      console.log('🔄 Reloading settings after permission request...');
      
      // Reload settings to get updated permissions
      try {
        await loadSettings();
        console.log('✅ Settings reloaded successfully');
      } catch (error) {
        console.error('❌ Error reloading settings after permission request:', error);
        // Don't throw - continue with current settings
      }
      
      // Get updated settings after reload
      let updatedSettings;
      try {
        updatedSettings = await getNotificationSettings(user?.id);
        console.log('✅ Updated settings retrieved:', {
          notificationGranted: updatedSettings.notificationPermissionGranted,
          locationGranted: updatedSettings.locationPermissionGranted,
        });
      } catch (error) {
        console.error('❌ Error getting updated settings:', error);
        // Use current settings as fallback
        updatedSettings = settings;
      }
      
      // If both permissions granted and prayer notifications enabled, schedule notifications
      if (notificationGranted && locationGranted && updatedSettings.prayerNotifications) {
        console.log('🕌 Scheduling prayer notifications...');
        try {
          await refreshPrayerTimesAndNotifications();
          console.log('✅ Prayer notifications scheduled');
        } catch (error) {
          console.error('❌ Error refreshing prayer notifications after permission grant:', error);
          // Don't throw - permissions were granted successfully
        }
      } else {
        console.log('ℹ️ Skipping prayer notification scheduling:', {
          notificationGranted,
          locationGranted,
          prayerNotificationsEnabled: updatedSettings.prayerNotifications,
        });
      }
      
      console.log('✅ Permission request flow completed successfully');
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      // Re-throw the error so the caller can handle it
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Update in service (saves to Supabase and AsyncStorage) - wrap in try-catch
      try {
        await updateNotificationSettingsService(newSettings, user?.id);
      } catch (error) {
        console.error('Error updating notification settings in service:', error);
        // Continue - settings were updated in state
      }
      
      // If prayer notifications were enabled and we have permissions, schedule them
      if (newSettings.prayerNotifications === true && 
          updatedSettings.notificationPermissionGranted && 
          updatedSettings.locationPermissionGranted) {
        try {
          await refreshPrayerTimesAndNotifications();
        } catch (error) {
          console.error('Error refreshing prayer notifications after settings update:', error);
          // Don't throw - settings were updated successfully
        }
      }
      
      // Refresh scheduled count - wrap in try-catch
      try {
        await refreshScheduledCount();
      } catch (error) {
        console.warn('Error refreshing scheduled count after settings update:', error);
        // Don't throw - this is not critical
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Don't throw - return gracefully
    }
  };

  const refreshPrayerTimesAndNotifications = async (): Promise<void> => {
    try {
      if (!user?.id) {
        console.log('No user ID, skipping prayer notification refresh');
        return;
      }

      // Check if prayer notifications are enabled
      let currentSettings;
      try {
        currentSettings = await getNotificationSettings(user.id);
      } catch (error) {
        console.error('Error getting notification settings:', error);
        return;
      }

      if (!currentSettings.prayerNotifications) {
        console.log('Prayer notifications disabled, skipping refresh');
        return;
      }

      // Check permissions - wrap in try-catch to prevent native module crashes
      let notificationStatus = 'undetermined';
      try {
        if (Notifications && typeof Notifications.getPermissionsAsync === 'function') {
          const permissions = await Notifications.getPermissionsAsync();
          notificationStatus = permissions.status;
        }
      } catch (error) {
        console.warn('Error checking notification permissions:', error);
        return; // Can't proceed without knowing permission status
      }

      if (notificationStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      let locationStatus = 'undetermined';
      try {
        if (Location && typeof Location.getForegroundPermissionsAsync === 'function') {
          const permissions = await Location.getForegroundPermissionsAsync();
          locationStatus = permissions.status;
        }
      } catch (error) {
        console.warn('Error checking location permissions:', error);
        return; // Can't proceed without knowing permission status
      }

      if (locationStatus !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      // Single location fetch + parallel calculations (avoids duplicate GPS / cache reads)
      let todayPrayerTimes;
      let tomorrowPrayerTimes;
      try {
        const pair = await getTodayAndTomorrowPrayerTimes(user.id);
        todayPrayerTimes = pair.today;
        tomorrowPrayerTimes = pair.tomorrow;
      } catch (error) {
        console.error('Error getting prayer times:', error);
        return; // Can't schedule notifications without prayer times
      }

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

      // Schedule notifications - wrap in try-catch
      try {
        await schedulePrayerNotifications(prayerTimes, user.id, tomorrowTimes);
      } catch (error) {
        console.error('Error scheduling prayer notifications:', error);
        // Don't throw - continue to refresh count
      }
      
      // Refresh scheduled count - wrap in try-catch
      try {
        await refreshScheduledCount();
      } catch (error) {
        console.warn('Error refreshing scheduled count after notification update:', error);
        // Don't throw - this is not critical
      }
    } catch (error) {
      console.error('Error refreshing prayer times and notifications:', error);
      // Don't throw - return gracefully
    }
  };

  const refreshScheduledCount = async (): Promise<void> => {
    try {
      // Safely get scheduled notifications - wrap in try-catch
      const notifications = await getScheduledNotifications();
      setScheduledCount(notifications?.length || 0);
    } catch (error) {
      console.warn('Error refreshing scheduled count:', error);
      // Don't crash - just set count to 0
      setScheduledCount(0);
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
    // Return default values instead of throwing to prevent crashes
    // This allows components to render while NotificationProvider is still loading
    return {
      settings: {
        prayerNotifications: true,
        dailyContentNotifications: true,
        imanScoreNotifications: true,
        imanTrackerNotifications: true,
        goalReminderNotifications: true,
        achievementNotifications: true,
        locationPermissionGranted: false,
        notificationPermissionGranted: false,
        locationServicesEnabled: false,
      },
      loading: true,
      scheduledCount: 0,
      requestPermissions: async () => {},
      updateSettings: async () => {},
      refreshPrayerTimesAndNotifications: async () => {},
      refreshScheduledCount: async () => {},
    };
  }
  return context;
}
