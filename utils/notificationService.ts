
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Create prayer channel
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
    });

    // Create achievement channel
    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
      sound: 'default',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const prefs = await AsyncStorage.getItem('notificationPreferences');
    if (!prefs) return true;
    
    const preferences = JSON.parse(prefs);
    return preferences.achievement_notifications !== false;
  } catch (error) {
    console.log('Error checking notification preferences:', error);
    return true;
  }
}

// Send achievement unlocked notification
export async function sendAchievementUnlocked(
  title: string,
  message: string
): Promise<void> {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 Achievement Unlocked!`,
        body: `${title}\n\n${message}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'achievement',
        data: { type: 'achievement', title, message },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.log('Error sending achievement notification:', error);
  }
}

// Send milestone reached notification
export async function sendMilestoneReached(
  achievementTitle: string,
  milestone: number,
  message: string
): Promise<void> {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${milestone}% Progress!`,
        body: `${achievementTitle}\n\n${message}`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        categoryIdentifier: 'milestone',
        data: { type: 'milestone', achievementTitle, milestone, message },
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Error sending milestone notification:', error);
  }
}

// Send Iman tracker milestone notification
export async function sendImanTrackerMilestone(
  title: string,
  message: string
): Promise<void> {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `✨ ${title}`,
        body: message,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        categoryIdentifier: 'iman_milestone',
        data: { type: 'iman_milestone', title, message },
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Error sending Iman tracker milestone notification:', error);
  }
}

// Send daily reminder
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string> {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return '';

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    return id;
  } catch (error) {
    console.log('Error scheduling daily reminder:', error);
    return '';
  }
}

// Cancel notification
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.log('Error canceling notification:', error);
  }
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error canceling all notifications:', error);
  }
}

// Get scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Error getting scheduled notifications:', error);
    return [];
  }
}

// Update notification preferences in Supabase
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    prayer_notifications?: boolean;
    daily_content_notifications?: boolean;
    iman_score_notifications?: boolean;
    iman_tracker_notifications?: boolean;
    goal_reminder_notifications?: boolean;
    achievement_notifications?: boolean;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.log('Error updating notification preferences:', error);
    }

    // Also save locally
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.log('Error in updateNotificationPreferences:', error);
  }
}

// Load notification preferences
export async function loadNotificationPreferences(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return defaults
      return {
        prayer_notifications: true,
        daily_content_notifications: true,
        iman_score_notifications: true,
        iman_tracker_notifications: true,
        goal_reminder_notifications: true,
        achievement_notifications: true,
      };
    }

    // Save locally
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(data));

    return data;
  } catch (error) {
    console.log('Error loading notification preferences:', error);
    return {
      prayer_notifications: true,
      daily_content_notifications: true,
      iman_score_notifications: true,
      iman_tracker_notifications: true,
      goal_reminder_notifications: true,
      achievement_notifications: true,
    };
  }
}

// Notification settings interface
export interface NotificationSettings {
  prayerNotifications: boolean;
  dailyContentNotifications: boolean;
  imanScoreNotifications: boolean;
  imanTrackerNotifications: boolean;
  goalReminderNotifications: boolean;
  achievementNotifications: boolean;
  locationPermissionGranted: boolean;
  notificationPermissionGranted: boolean;
}

// Get notification settings - exported function
export async function getNotificationSettings(userId?: string): Promise<NotificationSettings> {
  try {
    // Check permissions
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    const notificationPermissionGranted = notificationStatus === 'granted';

    // Check location permission
    const { status: locationStatus } = await Location.getForegroundPermissionsAsync();
    const locationPermissionGranted = locationStatus === 'granted';

    // Load preferences from Supabase if user is logged in
    if (userId) {
      const preferences = await loadNotificationPreferences(userId);
      return {
        prayerNotifications: preferences.prayer_notifications ?? true,
        dailyContentNotifications: preferences.daily_content_notifications ?? true,
        imanScoreNotifications: preferences.iman_score_notifications ?? true,
        imanTrackerNotifications: preferences.iman_tracker_notifications ?? true,
        goalReminderNotifications: preferences.goal_reminder_notifications ?? true,
        achievementNotifications: preferences.achievement_notifications ?? true,
        locationPermissionGranted,
        notificationPermissionGranted,
      };
    }

    // Return defaults if no user
    return {
      prayerNotifications: true,
      dailyContentNotifications: true,
      imanScoreNotifications: true,
      imanTrackerNotifications: true,
      goalReminderNotifications: true,
      achievementNotifications: true,
      locationPermissionGranted,
      notificationPermissionGranted,
    };
  } catch (error) {
    console.log('Error getting notification settings:', error);
    return {
      prayerNotifications: true,
      dailyContentNotifications: true,
      imanScoreNotifications: true,
      imanTrackerNotifications: true,
      goalReminderNotifications: true,
      achievementNotifications: true,
      locationPermissionGranted: false,
      notificationPermissionGranted: false,
    };
  }
}

// Update notification settings
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
  userId?: string
): Promise<void> {
  try {
    if (userId) {
      // Convert to database format
      const dbPreferences: any = {};
      if (settings.prayerNotifications !== undefined) {
        dbPreferences.prayer_notifications = settings.prayerNotifications;
      }
      if (settings.dailyContentNotifications !== undefined) {
        dbPreferences.daily_content_notifications = settings.dailyContentNotifications;
      }
      if (settings.imanScoreNotifications !== undefined) {
        dbPreferences.iman_score_notifications = settings.imanScoreNotifications;
      }
      if (settings.imanTrackerNotifications !== undefined) {
        dbPreferences.iman_tracker_notifications = settings.imanTrackerNotifications;
      }
      if (settings.goalReminderNotifications !== undefined) {
        dbPreferences.goal_reminder_notifications = settings.goalReminderNotifications;
      }
      if (settings.achievementNotifications !== undefined) {
        dbPreferences.achievement_notifications = settings.achievementNotifications;
      }

      await updateNotificationPreferences(userId, dbPreferences);
    }

    // Save locally
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));

    // If prayer notifications were toggled, cancel or reschedule notifications
    if (settings.prayerNotifications !== undefined) {
      if (!settings.prayerNotifications) {
        // User disabled prayer notifications - cancel all prayer notifications
        await cancelPrayerNotifications();
        console.log('📵 Prayer notifications disabled - cancelled all prayer notifications');
      } else {
        // User enabled prayer notifications - they will be rescheduled when PrayerTimesWidget loads
        console.log('✅ Prayer notifications enabled - will be scheduled when prayer times load');
      }
    }
  } catch (error) {
    console.log('Error updating notification settings:', error);
  }
}

// Initialize notifications
export async function initializeNotifications(): Promise<void> {
  try {
    await registerForPushNotificationsAsync();
  } catch (error) {
    console.log('Error initializing notifications:', error);
  }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting notification permissions:', error);
    return false;
  }
}

// Request location permissions
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting location permissions:', error);
    return false;
  }
}

// Send achievement notification
export async function sendAchievementNotification(
  title: string,
  description: string
): Promise<void> {
  await sendAchievementUnlocked(title, description);
}

// Prayer notification IDs storage key
const PRAYER_NOTIFICATION_IDS_KEY = '@prayer_notification_ids';

/**
 * Schedule prayer time notifications at exact times based on user's location
 * Schedules notifications for today and tomorrow to ensure coverage
 */
export async function schedulePrayerNotifications(
  prayerTimes: {
    fajr: { time: string; date: Date; name: string; arabicName: string };
    dhuhr: { time: string; date: Date; name: string; arabicName: string };
    asr: { time: string; date: Date; name: string; arabicName: string };
    maghrib: { time: string; date: Date; name: string; arabicName: string };
    isha: { time: string; date: Date; name: string; arabicName: string };
  },
  userId?: string,
  tomorrowPrayerTimes?: {
    fajr: { time: string; date: Date; name: string; arabicName: string };
    dhuhr: { time: string; date: Date; name: string; arabicName: string };
    asr: { time: string; date: Date; name: string; arabicName: string };
    maghrib: { time: string; date: Date; name: string; arabicName: string };
    isha: { time: string; date: Date; name: string; arabicName: string };
  }
): Promise<void> {
  try {
    // Check if prayer notifications are enabled
    const settings = await getNotificationSettings(userId);
    if (!settings.prayerNotifications) {
      console.log('📵 Prayer notifications are disabled');
      return;
    }

    // Check notification permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('📵 Notification permission not granted');
      return;
    }

    // Cancel existing prayer notifications
    await cancelPrayerNotifications();

    const now = new Date();
    const notificationIds: string[] = [];

    // Schedule notifications for today's prayers
    const prayers = [
      { key: 'fajr', prayer: prayerTimes.fajr },
      { key: 'dhuhr', prayer: prayerTimes.dhuhr },
      { key: 'asr', prayer: prayerTimes.asr },
      { key: 'maghrib', prayer: prayerTimes.maghrib },
      { key: 'isha', prayer: prayerTimes.isha },
    ];

    for (const { key, prayer } of prayers) {
      // Only schedule if prayer time hasn't passed today
      if (prayer.date > now) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${prayer.name} Prayer Time`,
            body: `It's time for ${prayer.name} (${prayer.arabicName}) prayer`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'prayer',
            channelId: 'prayer',
            data: {
              type: 'prayer',
              prayerName: prayer.name,
              prayerTime: prayer.time,
            },
          },
          trigger: {
            type: 'date',
            date: prayer.date,
          },
          identifier: `prayer_${key}_${prayer.date.toISOString()}`,
        });

        notificationIds.push(notificationId);
        console.log(`✅ Scheduled ${prayer.name} notification for ${prayer.time} (ID: ${notificationId})`);
      } else {
        console.log(`⏭️ Skipped ${prayer.name} - time has passed`);
      }
    }

    // Schedule tomorrow's prayers if provided (for late-day app opens)
    if (tomorrowPrayerTimes) {
      const tomorrowPrayers = [
        { key: 'fajr', prayer: tomorrowPrayerTimes.fajr },
        { key: 'dhuhr', prayer: tomorrowPrayerTimes.dhuhr },
        { key: 'asr', prayer: tomorrowPrayerTimes.asr },
        { key: 'maghrib', prayer: tomorrowPrayerTimes.maghrib },
        { key: 'isha', prayer: tomorrowPrayerTimes.isha },
      ];

      for (const { key, prayer } of tomorrowPrayers) {
        // Schedule all tomorrow's prayers
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${prayer.name} Prayer Time`,
            body: `It's time for ${prayer.name} (${prayer.arabicName}) prayer`,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'prayer',
            channelId: 'prayer',
            data: {
              type: 'prayer',
              prayerName: prayer.name,
              prayerTime: prayer.time,
            },
          },
          trigger: {
            type: 'date',
            date: prayer.date,
          },
          identifier: `prayer_${key}_tomorrow_${prayer.date.toISOString()}`,
        });

        notificationIds.push(notificationId);
        console.log(`✅ Scheduled tomorrow's ${prayer.name} notification for ${prayer.time}`);
      }
    }

    // Save notification IDs for later cancellation
    await AsyncStorage.setItem(PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));
    console.log(`✅ Scheduled ${notificationIds.length} prayer notifications`);
  } catch (error) {
    console.error('❌ Error scheduling prayer notifications:', error);
  }
}

/**
 * Cancel all existing prayer notifications
 */
export async function cancelPrayerNotifications(): Promise<void> {
  try {
    // Get stored notification IDs
    const storedIds = await AsyncStorage.getItem(PRAYER_NOTIFICATION_IDS_KEY);
    if (storedIds) {
      const notificationIds: string[] = JSON.parse(storedIds);
      for (const id of notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (err) {
          // Ignore errors for individual cancellations
        }
      }
    }

    // Also cancel any notifications with prayer identifier pattern
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allNotifications) {
      if (notification.identifier?.startsWith('prayer_')) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    await AsyncStorage.removeItem(PRAYER_NOTIFICATION_IDS_KEY);
    console.log('✅ Cancelled existing prayer notifications');
  } catch (error) {
    console.error('Error cancelling prayer notifications:', error);
  }
}
