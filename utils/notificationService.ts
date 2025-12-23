
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
