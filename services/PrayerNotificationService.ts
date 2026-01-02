
/**
 * PrayerNotificationService - Fresh implementation for prayer notifications
 * Schedules notifications for each prayer time
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyPrayerTimes, PrayerTime } from './PrayerTimeService';

const NOTIFICATION_IDS_KEY = '@prayer_notification_ids';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if notification permission is granted
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

/**
 * Get saved notification IDs
 */
async function getSavedNotificationIds(): Promise<string[]> {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading notification IDs:', error);
    return [];
  }
}

/**
 * Save notification IDs
 */
async function saveNotificationIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving notification IDs:', error);
  }
}

/**
 * Cancel all scheduled prayer notifications
 */
export async function cancelAllPrayerNotifications(): Promise<void> {
  try {
    const ids = await getSavedNotificationIds();
    
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
    console.log(`Cancelled ${ids.length} prayer notifications`);
  } catch (error) {
    console.error('Error cancelling prayer notifications:', error);
  }
}

/**
 * Schedule notifications for all prayer times
 */
export async function schedulePrayerNotifications(
  prayerTimes: DailyPrayerTimes
): Promise<void> {
  try {
    // Check permission
    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    // Cancel existing notifications
    await cancelAllPrayerNotifications();

    const notificationIds: string[] = [];
    const now = new Date();

    // Schedule notification for each prayer
    for (const prayer of prayerTimes.prayers) {
      // Only schedule for future prayers
      if (prayer.date > now) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 ${prayer.name} Prayer Time`,
              body: `It's time for ${prayer.name} prayer (${prayer.arabicName})`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              categoryIdentifier: 'prayer',
              data: {
                type: 'prayer',
                prayerName: prayer.name,
                prayerTime: prayer.time,
              },
            },
            trigger: {
              date: prayer.date,
            },
          });

          notificationIds.push(id);
          console.log(`Scheduled notification for ${prayer.name} at ${prayer.time}`);
        } catch (error) {
          console.error(`Error scheduling notification for ${prayer.name}:`, error);
        }
      }
    }

    // Save notification IDs
    await saveNotificationIds(notificationIds);
    console.log(`Scheduled ${notificationIds.length} prayer notifications`);
  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
}

/**
 * Get count of scheduled notifications
 */
export async function getScheduledNotificationCount(): Promise<number> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch (error) {
    console.error('Error getting scheduled notification count:', error);
    return 0;
  }
}

/**
 * Schedule a reminder notification before prayer time
 */
export async function scheduleReminderNotification(
  prayer: PrayerTime,
  minutesBefore: number = 15
): Promise<string | null> {
  try {
    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) return null;

    const reminderDate = new Date(prayer.date);
    reminderDate.setMinutes(reminderDate.getMinutes() - minutesBefore);

    // Only schedule if reminder is in the future
    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${prayer.name} Prayer Soon`,
        body: `${prayer.name} prayer is in ${minutesBefore} minutes`,
        sound: 'default',
        data: {
          type: 'prayer_reminder',
          prayerName: prayer.name,
          minutesBefore,
        },
      },
      trigger: {
        date: reminderDate,
      },
    });

    console.log(`Scheduled reminder for ${prayer.name} ${minutesBefore} minutes before`);
    return id;
  } catch (error) {
    console.error('Error scheduling reminder notification:', error);
    return null;
  }
}
