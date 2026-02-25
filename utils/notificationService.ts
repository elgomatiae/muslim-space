
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';

// Configure notification handler - DO NOT call at module load time
// This will be called lazily when first needed to prevent immediate crashes
let notificationHandlerConfigured = false;

function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;
  
  try {
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      notificationHandlerConfigured = true;
    }
  } catch (error) {
    // Native module not ready yet - will be configured when first used
    console.warn('Could not set notification handler:', error);
  }
}

// Request notification permissions
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    if (!Notifications) {
      console.warn('Notifications module not available');
      return undefined;
    }

    let token;

    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      try {
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

        // Create daily goal reminder channel
        await Notifications.setNotificationChannelAsync('daily_goal', {
          name: 'Daily Goal Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });

        // Create weekly goal reminder channel
        await Notifications.setNotificationChannelAsync('weekly_goal', {
          name: 'Weekly Goal Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          sound: 'default',
        });
      } catch (channelError) {
        console.warn('Error setting notification channels:', channelError);
        // Continue - channels might already exist
      }
    }

    if (Device.isDevice) {
      if (typeof Notifications.getPermissionsAsync !== 'function') {
        console.warn('getPermissionsAsync not available');
        return undefined;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
      }
      
      if (typeof Notifications.getExpoPushTokenAsync === 'function') {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
      } else {
        console.warn('getExpoPushTokenAsync not available');
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return undefined;
  }
}

// Check if notifications are enabled (general check - defaults to true)
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const prefs = await AsyncStorage.getItem('notificationPreferences');
    if (!prefs) return true;
    
    const preferences = JSON.parse(prefs);
    // Check if any notification type is explicitly disabled
    // If all are undefined/null, default to enabled
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
    configureNotificationHandler();
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
    configureNotificationHandler();
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
    configureNotificationHandler();
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
      // Handle table not found error gracefully
      if (error.code === 'PGRST205') {
        console.log('⚠️ notification_preferences table not found - saving locally only. Please run migration 012_create_notification_preferences_table.sql');
      } else {
        console.log('Error updating notification preferences:', error);
      }
    }

    // Always save locally as fallback
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  } catch (error: any) {
    console.log('Error in updateNotificationPreferences:', error);
    // Save locally as fallback even on error
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    } catch (storageError) {
      console.log('Error saving to AsyncStorage:', storageError);
    }
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

    if (error) {
      // Handle table not found error gracefully
      if (error.code === 'PGRST205') {
        console.log('⚠️ notification_preferences table not found - using local storage. Please run migration 012_create_notification_preferences_table.sql');
        // Try to load from local storage
        try {
          const localPrefs = await AsyncStorage.getItem('notificationPreferences');
          if (localPrefs) {
            return JSON.parse(localPrefs);
          }
        } catch (storageError) {
          // Ignore storage errors
        }
      }
      
      // Return defaults if no data
      return {
        prayer_notifications: true,
        daily_content_notifications: true,
        iman_score_notifications: true,
        iman_tracker_notifications: true,
        goal_reminder_notifications: true,
        achievement_notifications: true,
      };
    }

    if (!data) {
      // Try local storage as fallback
      try {
        const localPrefs = await AsyncStorage.getItem('notificationPreferences');
        if (localPrefs) {
          return JSON.parse(localPrefs);
        }
      } catch (storageError) {
        // Ignore storage errors
      }
      
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

    // Save locally for offline access
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(data));

    return data;
  } catch (error: any) {
    console.log('Error loading notification preferences:', error);
    
    // Try local storage as fallback
    try {
      const localPrefs = await AsyncStorage.getItem('notificationPreferences');
      if (localPrefs) {
        return JSON.parse(localPrefs);
      }
    } catch (storageError) {
      // Ignore storage errors
    }
    
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
    // Configure notification handler lazily when first needed
    configureNotificationHandler();

    if (!Notifications || typeof Notifications.getPermissionsAsync !== 'function') {
      console.warn('Notifications module not available');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
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
    if (!Location || typeof Location.getForegroundPermissionsAsync !== 'function') {
      console.warn('Location module not available');
      return false;
    }

    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted' && typeof Location.requestForegroundPermissionsAsync === 'function') {
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

// Daily goal reminder notification IDs storage key
const DAILY_GOAL_NOTIFICATION_IDS_KEY = '@daily_goal_notification_ids';
const LAST_DAILY_GOAL_CHECK_KEY = '@last_daily_goal_check_date';

// Weekly goal reminder notification IDs storage key
const WEEKLY_GOAL_NOTIFICATION_IDS_KEY = '@weekly_goal_notification_ids';
const LAST_WEEKLY_GOAL_CHECK_KEY = '@last_weekly_goal_check_date';

// Iman score tracking keys
const IMAN_SCORE_HISTORY_KEY = '@iman_score_daily_history';
const LAST_LOW_SCORE_NOTIFICATION_KEY = '@last_low_score_notification';
const LAST_DROP_NOTIFICATION_KEY = '@last_drop_notification';

/**
 * Check and send Iman score drop notifications
 * - Sends notification if score drops 15% in one day
 * - Sends notification if score drops below 50%
 */
export async function checkImanScoreAndNotify(
  currentScore: number,
  userId?: string
): Promise<void> {
  try {
    // Check if iman score notifications are enabled
    const settings = await getNotificationSettings(userId);
    if (!settings.imanScoreNotifications) {
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Load score history
    const historyStr = await AsyncStorage.getItem(IMAN_SCORE_HISTORY_KEY);
    const history: { date: string; score: number }[] = historyStr ? JSON.parse(historyStr) : [];

    // Get yesterday's score
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayEntry = history.find(h => h.date === yesterdayStr);

    // Check for 15% drop in one day
    if (yesterdayEntry) {
      const drop = yesterdayEntry.score - currentScore;
      if (drop >= 15) {
        // Check if we already sent this notification today
        const lastDropNotif = await AsyncStorage.getItem(LAST_DROP_NOTIFICATION_KEY);
        if (lastDropNotif !== today) {
          await sendImanScoreDropNotification(drop, yesterdayEntry.score, currentScore);
          await AsyncStorage.setItem(LAST_DROP_NOTIFICATION_KEY, today);
        }
      }
    }

    // Check if score is below 50%
    if (currentScore < 50) {
      // Only send once per day
      const lastLowNotif = await AsyncStorage.getItem(LAST_LOW_SCORE_NOTIFICATION_KEY);
      if (lastLowNotif !== today) {
        await sendLowImanScoreNotification(currentScore);
        await AsyncStorage.setItem(LAST_LOW_SCORE_NOTIFICATION_KEY, today);
      }
    }

    // Update today's score in history (keep last 7 days)
    const todayIndex = history.findIndex(h => h.date === today);
    if (todayIndex >= 0) {
      history[todayIndex].score = currentScore;
    } else {
      history.push({ date: today, score: currentScore });
    }
    // Keep only last 7 days
    const recentHistory = history.slice(-7);
    await AsyncStorage.setItem(IMAN_SCORE_HISTORY_KEY, JSON.stringify(recentHistory));
  } catch (error) {
    console.log('Error checking Iman score for notifications:', error);
  }
}

/**
 * Send notification when Iman score drops significantly
 */
async function sendImanScoreDropNotification(
  dropAmount: number,
  previousScore: number,
  currentScore: number
): Promise<void> {
  try {
    configureNotificationHandler();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📉 Iman Score Alert',
        body: `Your Iman score dropped ${Math.round(dropAmount)}% (from ${Math.round(previousScore)}% to ${Math.round(currentScore)}%). Time to reconnect with your spiritual goals!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'iman_drop', dropAmount, previousScore, currentScore },
      },
      trigger: null,
    });
    console.log(`📉 Sent Iman score drop notification: ${dropAmount}% drop`);
  } catch (error) {
    console.log('Error sending Iman score drop notification:', error);
  }
}

/**
 * Send notification when Iman score is below 50%
 */
async function sendLowImanScoreNotification(currentScore: number): Promise<void> {
  try {
    configureNotificationHandler();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Low Iman Score',
        body: `Your Iman score is at ${Math.round(currentScore)}%. Consider completing some of your daily goals to strengthen your connection.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'iman_low', currentScore },
      },
      trigger: null,
    });
    console.log(`⚠️ Sent low Iman score notification: ${currentScore}%`);
  } catch (error) {
    console.log('Error sending low Iman score notification:', error);
  }
}

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
    // Configure notification handler before scheduling
    configureNotificationHandler();

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

/**
 * Interface for incomplete daily goals
 */
interface IncompleteDailyGoal {
  type: string;
  title: string;
  message: string;
  goal: number;
  completed: number;
}

/**
 * Check for incomplete daily goals and schedule notifications
 * Notifications are spread throughout the day (not all at once)
 */
export async function scheduleDailyGoalReminders(userId?: string): Promise<void> {
  try {
    // Check if goal reminder notifications are enabled
    const settings = await getNotificationSettings(userId);
    if (!settings.goalReminderNotifications) {
      console.log('📵 Daily goal reminder notifications are disabled');
      return;
    }

    // Check notification permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('📵 Notification permission not granted');
      return;
    }

    // Configure notification handler before scheduling
    configureNotificationHandler();

    // Check if we've already scheduled notifications for today
    // Note: We still allow rescheduling if goals are updated (checked by caller)
    const today = new Date().toISOString().split('T')[0];
    const lastCheck = await AsyncStorage.getItem(LAST_DAILY_GOAL_CHECK_KEY);
    if (lastCheck === today) {
      console.log('✅ Daily goal reminders already scheduled for today');
      // Still allow rescheduling if called explicitly (e.g., after goal update)
      // The caller should cancel existing notifications first if needed
      return;
    }

    // Cancel existing daily goal notifications
    await cancelDailyGoalNotifications();

    // Load goals
    const { loadIbadahGoals, loadAmanahGoals } = await import('./imanScoreCalculator');
    const ibadahGoals = await loadIbadahGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);

    // Find incomplete daily goals
    const incompleteGoals: IncompleteDailyGoal[] = [];

    // Check Sunnah prayers
    if (ibadahGoals.sunnahDailyGoal > 0 && ibadahGoals.sunnahCompleted < ibadahGoals.sunnahDailyGoal) {
      incompleteGoals.push({
        type: 'sunnah',
        title: 'Sunnah Prayers Reminder',
        message: `You have ${ibadahGoals.sunnahDailyGoal - ibadahGoals.sunnahCompleted} sunnah prayer${ibadahGoals.sunnahDailyGoal - ibadahGoals.sunnahCompleted > 1 ? 's' : ''} remaining today. Keep up the good work!`,
        goal: ibadahGoals.sunnahDailyGoal,
        completed: ibadahGoals.sunnahCompleted,
      });
    }

    // Check Quran pages
    if (ibadahGoals.quranDailyPagesGoal > 0 && ibadahGoals.quranDailyPagesCompleted < ibadahGoals.quranDailyPagesGoal) {
      incompleteGoals.push({
        type: 'quran_pages',
        title: 'Quran Reading Reminder',
        message: `You have ${ibadahGoals.quranDailyPagesGoal - ibadahGoals.quranDailyPagesCompleted} page${ibadahGoals.quranDailyPagesGoal - ibadahGoals.quranDailyPagesCompleted > 1 ? 's' : ''} of Quran remaining to read today.`,
        goal: ibadahGoals.quranDailyPagesGoal,
        completed: ibadahGoals.quranDailyPagesCompleted,
      });
    }

    // Check Quran verses
    if (ibadahGoals.quranDailyVersesGoal > 0 && ibadahGoals.quranDailyVersesCompleted < ibadahGoals.quranDailyVersesGoal) {
      incompleteGoals.push({
        type: 'quran_verses',
        title: 'Quran Verses Reminder',
        message: `You have ${ibadahGoals.quranDailyVersesGoal - ibadahGoals.quranDailyVersesCompleted} verse${ibadahGoals.quranDailyVersesGoal - ibadahGoals.quranDailyVersesCompleted > 1 ? 's' : ''} remaining to read today.`,
        goal: ibadahGoals.quranDailyVersesGoal,
        completed: ibadahGoals.quranDailyVersesCompleted,
      });
    }

    // Check Dhikr
    if (ibadahGoals.dhikrDailyGoal > 0 && ibadahGoals.dhikrDailyCompleted < ibadahGoals.dhikrDailyGoal) {
      incompleteGoals.push({
        type: 'dhikr',
        title: 'Dhikr Reminder',
        message: `You have ${ibadahGoals.dhikrDailyGoal - ibadahGoals.dhikrDailyCompleted} dhikr${ibadahGoals.dhikrDailyGoal - ibadahGoals.dhikrDailyCompleted > 1 ? 's' : ''} remaining today.`,
        goal: ibadahGoals.dhikrDailyGoal,
        completed: ibadahGoals.dhikrDailyCompleted,
      });
    }

    // Check Dua
    if (ibadahGoals.duaDailyGoal > 0 && ibadahGoals.duaDailyCompleted < ibadahGoals.duaDailyGoal) {
      incompleteGoals.push({
        type: 'dua',
        title: 'Dua Reminder',
        message: `You have ${ibadahGoals.duaDailyGoal - ibadahGoals.duaDailyCompleted} dua${ibadahGoals.duaDailyGoal - ibadahGoals.duaDailyCompleted > 1 ? 's' : ''} remaining today.`,
        goal: ibadahGoals.duaDailyGoal,
        completed: ibadahGoals.duaDailyCompleted,
      });
    }

    // NOTE: Fard prayers are NOT included in daily goal reminders
    // Fard prayers have their own prayer time notifications (schedulePrayerNotifications)
    // which notify users at the exact prayer times. We don't send additional
    // daily goal reminders for fard prayers to avoid notification overload.

    // Check Exercise (if goal is set)
    if (amanahGoals.dailyExerciseGoal > 0 && amanahGoals.dailyExerciseCompleted < amanahGoals.dailyExerciseGoal) {
      incompleteGoals.push({
        type: 'exercise',
        title: 'Exercise Reminder',
        message: `You have ${amanahGoals.dailyExerciseGoal - amanahGoals.dailyExerciseCompleted} minute${amanahGoals.dailyExerciseGoal - amanahGoals.dailyExerciseCompleted > 1 ? 's' : ''} of exercise remaining today.`,
        goal: amanahGoals.dailyExerciseGoal,
        completed: amanahGoals.dailyExerciseCompleted,
      });
    }

    // Check Water (if goal is set)
    if (amanahGoals.dailyWaterGoal > 0 && amanahGoals.dailyWaterCompleted < amanahGoals.dailyWaterGoal) {
      incompleteGoals.push({
        type: 'water',
        title: 'Water Intake Reminder',
        message: `You have ${amanahGoals.dailyWaterGoal - amanahGoals.dailyWaterCompleted} glass${amanahGoals.dailyWaterGoal - amanahGoals.dailyWaterCompleted > 1 ? 'es' : ''} of water remaining today.`,
        goal: amanahGoals.dailyWaterGoal,
        completed: amanahGoals.dailyWaterCompleted,
      });
    }

    // Check Sleep (if goal is set)
    if (amanahGoals.dailySleepGoal > 0 && amanahGoals.dailySleepCompleted < amanahGoals.dailySleepGoal) {
      incompleteGoals.push({
        type: 'sleep',
        title: 'Sleep Goal Reminder',
        message: `You have ${amanahGoals.dailySleepGoal - amanahGoals.dailySleepCompleted} hour${amanahGoals.dailySleepGoal - amanahGoals.dailySleepCompleted > 1 ? 's' : ''} of sleep remaining to reach your goal today.`,
        goal: amanahGoals.dailySleepGoal,
        completed: amanahGoals.dailySleepCompleted,
      });
    }

    if (incompleteGoals.length === 0) {
      console.log('✅ All daily goals are complete! No reminders needed.');
      await AsyncStorage.setItem(LAST_DAILY_GOAL_CHECK_KEY, today);
      return;
    }

    // Schedule notifications spread throughout the day
    // Start from 10 AM and space them out evenly until 8 PM
    const startHour = 10; // 10:00 AM
    const endHour = 20; // 8:00 PM
    const minIntervalMinutes = 30; // Minimum 30 minutes between notifications
    const totalMinutes = (endHour - startHour) * 60;
    
    // Calculate interval, ensuring minimum spacing
    let intervalMinutes = Math.floor(totalMinutes / Math.max(1, incompleteGoals.length));
    if (intervalMinutes < minIntervalMinutes && incompleteGoals.length > 1) {
      // If we have too many goals, space them with minimum interval
      intervalMinutes = minIntervalMinutes;
    }
    
    const now = new Date();
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    const nowTotalMinutes = nowHour * 60 + nowMinute;
    
    // If it's after 8 PM, schedule all for tomorrow
    const scheduleForTomorrow = nowTotalMinutes >= endHour * 60;
    
    const notificationIds: string[] = [];
    
    for (let i = 0; i < incompleteGoals.length; i++) {
      const goal = incompleteGoals[i];
      const scheduledMinutes = startHour * 60 + (i * intervalMinutes);
      const scheduledHour = Math.floor(scheduledMinutes / 60);
      const scheduledMinute = scheduledMinutes % 60;
      
      // Create notification date
      const notificationDate = new Date();
      if (scheduleForTomorrow) {
        // Schedule for tomorrow starting from 10 AM
        notificationDate.setDate(notificationDate.getDate() + 1);
        notificationDate.setHours(scheduledHour, scheduledMinute, 0, 0);
      } else {
        // Schedule for today, but if time has passed, schedule for tomorrow
        notificationDate.setHours(scheduledHour, scheduledMinute, 0, 0);
        if (notificationDate <= now) {
          notificationDate.setDate(notificationDate.getDate() + 1);
        }
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📿 ${goal.title}`,
          body: goal.message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'daily_goal',
          channelId: 'daily_goal',
          data: {
            type: 'daily_goal',
            goalType: goal.type,
            goal: goal.goal,
            completed: goal.completed,
          },
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        },
        identifier: `daily_goal_${goal.type}_${notificationDate.toISOString()}`,
      });

      notificationIds.push(notificationId);
      console.log(`✅ Scheduled ${goal.title} notification for ${scheduledHour}:${scheduledMinute.toString().padStart(2, '0')} (ID: ${notificationId})`);
    }

    // Save notification IDs
    await AsyncStorage.setItem(DAILY_GOAL_NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));
    await AsyncStorage.setItem(LAST_DAILY_GOAL_CHECK_KEY, today);
    console.log(`✅ Scheduled ${notificationIds.length} daily goal reminder notifications`);
  } catch (error) {
    console.error('❌ Error scheduling daily goal reminders:', error);
  }
}

/**
 * Cancel all existing daily goal reminder notifications
 */
export async function cancelDailyGoalNotifications(): Promise<void> {
  try {
    // Get stored notification IDs
    const storedIds = await AsyncStorage.getItem(DAILY_GOAL_NOTIFICATION_IDS_KEY);
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

    // Also cancel any notifications with daily_goal identifier pattern
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allNotifications) {
      if (notification.identifier?.startsWith('daily_goal_')) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    await AsyncStorage.removeItem(DAILY_GOAL_NOTIFICATION_IDS_KEY);
    console.log('✅ Cancelled existing daily goal reminder notifications');
  } catch (error) {
    console.error('Error cancelling daily goal reminder notifications:', error);
  }
}

/**
 * Interface for incomplete weekly goals
 */
interface IncompleteWeeklyGoal {
  type: string;
  title: string;
  message: string;
  goal: number;
  completed: number;
}

/**
 * Check for incomplete weekly goals and schedule notifications for Friday
 * Only schedules if it's Thursday or Friday
 */
export async function scheduleWeeklyGoalReminders(userId?: string): Promise<void> {
  try {
    // Check if goal reminder notifications are enabled
    const settings = await getNotificationSettings(userId);
    if (!settings.goalReminderNotifications) {
      console.log('📵 Weekly goal reminder notifications are disabled');
      return;
    }

    // Check notification permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('📵 Notification permission not granted');
      return;
    }

    // Check current day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Only schedule on Thursday (4) or Friday (5)
    if (dayOfWeek < 4) {
      console.log(`📅 Too early in the week (day ${dayOfWeek}). Weekly reminders will be scheduled on Thursday/Friday.`);
      return;
    }

    // Configure notification handler before scheduling
    configureNotificationHandler();

    // Check if we've already scheduled notifications for this week
    // Note: We still allow rescheduling if goals are updated (checked by caller)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek); // Go to Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    const lastCheck = await AsyncStorage.getItem(LAST_WEEKLY_GOAL_CHECK_KEY);
    if (lastCheck === weekKey) {
      console.log('✅ Weekly goal reminders already scheduled for this week');
      // Still allow rescheduling if called explicitly (e.g., after goal update)
      // The caller should cancel existing notifications first if needed
      return;
    }

    // Cancel existing weekly goal notifications
    await cancelWeeklyGoalNotifications();

    // Load goals
    const { loadIbadahGoals, loadIlmGoals, loadAmanahGoals } = await import('./imanScoreCalculator');
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);

    // Find incomplete weekly goals
    const incompleteGoals: IncompleteWeeklyGoal[] = [];

    // Check Tahajjud
    if (ibadahGoals.tahajjudWeeklyGoal > 0 && ibadahGoals.tahajjudCompleted < ibadahGoals.tahajjudWeeklyGoal) {
      incompleteGoals.push({
        type: 'tahajjud',
        title: 'Tahajjud Prayer Reminder',
        message: `You have ${ibadahGoals.tahajjudWeeklyGoal - ibadahGoals.tahajjudCompleted} tahajjud prayer${ibadahGoals.tahajjudWeeklyGoal - ibadahGoals.tahajjudCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: ibadahGoals.tahajjudWeeklyGoal,
        completed: ibadahGoals.tahajjudCompleted,
      });
    }

    // Check Quran Memorization
    if (ibadahGoals.quranWeeklyMemorizationGoal > 0 && ibadahGoals.quranWeeklyMemorizationCompleted < ibadahGoals.quranWeeklyMemorizationGoal) {
      incompleteGoals.push({
        type: 'quran_memorization',
        title: 'Quran Memorization Reminder',
        message: `You have ${ibadahGoals.quranWeeklyMemorizationGoal - ibadahGoals.quranWeeklyMemorizationCompleted} verse${ibadahGoals.quranWeeklyMemorizationGoal - ibadahGoals.quranWeeklyMemorizationCompleted > 1 ? 's' : ''} remaining to memorize this week.`,
        goal: ibadahGoals.quranWeeklyMemorizationGoal,
        completed: ibadahGoals.quranWeeklyMemorizationCompleted,
      });
    }

    // Check Weekly Dhikr
    if (ibadahGoals.dhikrWeeklyGoal > 0 && ibadahGoals.dhikrWeeklyCompleted < ibadahGoals.dhikrWeeklyGoal) {
      incompleteGoals.push({
        type: 'dhikr_weekly',
        title: 'Weekly Dhikr Reminder',
        message: `You have ${ibadahGoals.dhikrWeeklyGoal - ibadahGoals.dhikrWeeklyCompleted} dhikr${ibadahGoals.dhikrWeeklyGoal - ibadahGoals.dhikrWeeklyCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: ibadahGoals.dhikrWeeklyGoal,
        completed: ibadahGoals.dhikrWeeklyCompleted,
      });
    }

    // Check Fasting
    if (ibadahGoals.fastingWeeklyGoal > 0 && ibadahGoals.fastingWeeklyCompleted < ibadahGoals.fastingWeeklyGoal) {
      incompleteGoals.push({
        type: 'fasting',
        title: 'Fasting Reminder',
        message: `You have ${ibadahGoals.fastingWeeklyGoal - ibadahGoals.fastingWeeklyCompleted} day${ibadahGoals.fastingWeeklyGoal - ibadahGoals.fastingWeeklyCompleted > 1 ? 's' : ''} of fasting remaining this week.`,
        goal: ibadahGoals.fastingWeeklyGoal,
        completed: ibadahGoals.fastingWeeklyCompleted,
      });
    }

    // Check Lectures
    if (ilmGoals.weeklyLecturesGoal > 0 && ilmGoals.weeklyLecturesCompleted < ilmGoals.weeklyLecturesGoal) {
      incompleteGoals.push({
        type: 'lectures',
        title: 'Islamic Lectures Reminder',
        message: `You have ${ilmGoals.weeklyLecturesGoal - ilmGoals.weeklyLecturesCompleted} lecture${ilmGoals.weeklyLecturesGoal - ilmGoals.weeklyLecturesCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: ilmGoals.weeklyLecturesGoal,
        completed: ilmGoals.weeklyLecturesCompleted,
      });
    }


    // Check Quizzes
    if (ilmGoals.weeklyQuizzesGoal > 0 && ilmGoals.weeklyQuizzesCompleted < ilmGoals.weeklyQuizzesGoal) {
      incompleteGoals.push({
        type: 'quizzes',
        title: 'Islamic Quizzes Reminder',
        message: `You have ${ilmGoals.weeklyQuizzesGoal - ilmGoals.weeklyQuizzesCompleted} quiz${ilmGoals.weeklyQuizzesGoal - ilmGoals.weeklyQuizzesCompleted > 1 ? 'zes' : ''} remaining this week.`,
        goal: ilmGoals.weeklyQuizzesGoal,
        completed: ilmGoals.weeklyQuizzesCompleted,
      });
    }

    // Check Reflection
    if (ilmGoals.weeklyReflectionGoal > 0 && ilmGoals.weeklyReflectionCompleted < ilmGoals.weeklyReflectionGoal) {
      incompleteGoals.push({
        type: 'reflection',
        title: 'Reflection Reminder',
        message: `You have ${ilmGoals.weeklyReflectionGoal - ilmGoals.weeklyReflectionCompleted} reflection${ilmGoals.weeklyReflectionGoal - ilmGoals.weeklyReflectionCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: ilmGoals.weeklyReflectionGoal,
        completed: ilmGoals.weeklyReflectionCompleted,
      });
    }

    // Check Weekly Workout
    if (amanahGoals.weeklyWorkoutGoal > 0 && amanahGoals.weeklyWorkoutCompleted < amanahGoals.weeklyWorkoutGoal) {
      incompleteGoals.push({
        type: 'workout',
        title: 'Weekly Workout Reminder',
        message: `You have ${amanahGoals.weeklyWorkoutGoal - amanahGoals.weeklyWorkoutCompleted} workout${amanahGoals.weeklyWorkoutGoal - amanahGoals.weeklyWorkoutCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: amanahGoals.weeklyWorkoutGoal,
        completed: amanahGoals.weeklyWorkoutCompleted,
      });
    }

    // Check Meditation
    if (amanahGoals.weeklyMeditationGoal > 0 && amanahGoals.weeklyMeditationCompleted < amanahGoals.weeklyMeditationGoal) {
      incompleteGoals.push({
        type: 'meditation',
        title: 'Meditation Reminder',
        message: `You have ${amanahGoals.weeklyMeditationGoal - amanahGoals.weeklyMeditationCompleted} meditation session${amanahGoals.weeklyMeditationGoal - amanahGoals.weeklyMeditationCompleted > 1 ? 's' : ''} remaining this week.`,
        goal: amanahGoals.weeklyMeditationGoal,
        completed: amanahGoals.weeklyMeditationCompleted,
      });
    }

    // Check Journal
    if (amanahGoals.weeklyJournalGoal > 0 && amanahGoals.weeklyJournalCompleted < amanahGoals.weeklyJournalGoal) {
      incompleteGoals.push({
        type: 'journal',
        title: 'Journaling Reminder',
        message: `You have ${amanahGoals.weeklyJournalGoal - amanahGoals.weeklyJournalCompleted} journal entry${amanahGoals.weeklyJournalGoal - amanahGoals.weeklyJournalCompleted > 1 ? 'ies' : ''} remaining this week.`,
        goal: amanahGoals.weeklyJournalGoal,
        completed: amanahGoals.weeklyJournalCompleted,
      });
    }

    if (incompleteGoals.length === 0) {
      console.log('✅ All weekly goals are complete! No reminders needed.');
      await AsyncStorage.setItem(LAST_WEEKLY_GOAL_CHECK_KEY, weekKey);
      return;
    }

    // Schedule notifications for Friday (or today if it's Friday)
    // Spread them throughout Friday from 10 AM to 6 PM
    const targetDay = new Date(now);
    if (dayOfWeek === 4) {
      // If it's Thursday, schedule for Friday (tomorrow)
      targetDay.setDate(now.getDate() + 1);
    }
    // If it's Friday (dayOfWeek === 5), targetDay is already today
    
    const startHour = 10; // 10:00 AM
    const endHour = 18; // 6:00 PM
    const minIntervalMinutes = 30; // Minimum 30 minutes between notifications
    const totalMinutes = (endHour - startHour) * 60;
    
    // Calculate interval, ensuring minimum spacing
    let intervalMinutes = Math.floor(totalMinutes / Math.max(1, incompleteGoals.length));
    if (intervalMinutes < minIntervalMinutes && incompleteGoals.length > 1) {
      intervalMinutes = minIntervalMinutes;
    }
    
    const notificationIds: string[] = [];
    
    for (let i = 0; i < incompleteGoals.length; i++) {
      const goal = incompleteGoals[i];
      const scheduledMinutes = startHour * 60 + (i * intervalMinutes);
      const scheduledHour = Math.floor(scheduledMinutes / 60);
      const scheduledMinute = scheduledMinutes % 60;
      
      // Create notification date for Friday
      const notificationDate = new Date(targetDay);
      notificationDate.setHours(scheduledHour, scheduledMinute, 0, 0);
      
      // If it's Friday and the time has already passed, schedule for next Friday
      if (dayOfWeek === 5 && notificationDate <= now) {
        notificationDate.setDate(notificationDate.getDate() + 7);
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 ${goal.title}`,
          body: goal.message,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          categoryIdentifier: 'weekly_goal',
          channelId: 'weekly_goal',
          data: {
            type: 'weekly_goal',
            goalType: goal.type,
            goal: goal.goal,
            completed: goal.completed,
          },
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        },
        identifier: `weekly_goal_${goal.type}_${notificationDate.toISOString()}`,
      });

      notificationIds.push(notificationId);
      const dayName = dayOfWeek === 5 ? 'Friday' : 'Friday (tomorrow)';
      console.log(`✅ Scheduled ${goal.title} notification for ${dayName} at ${scheduledHour}:${scheduledMinute.toString().padStart(2, '0')} (ID: ${notificationId})`);
    }

    // Save notification IDs
    await AsyncStorage.setItem(WEEKLY_GOAL_NOTIFICATION_IDS_KEY, JSON.stringify(notificationIds));
    await AsyncStorage.setItem(LAST_WEEKLY_GOAL_CHECK_KEY, weekKey);
    console.log(`✅ Scheduled ${notificationIds.length} weekly goal reminder notifications for Friday`);
  } catch (error) {
    console.error('❌ Error scheduling weekly goal reminders:', error);
  }
}

/**
 * Cancel all existing weekly goal reminder notifications
 */
export async function cancelWeeklyGoalNotifications(): Promise<void> {
  try {
    // Get stored notification IDs
    const storedIds = await AsyncStorage.getItem(WEEKLY_GOAL_NOTIFICATION_IDS_KEY);
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

    // Also cancel any notifications with weekly_goal identifier pattern
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of allNotifications) {
      if (notification.identifier?.startsWith('weekly_goal_')) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    await AsyncStorage.removeItem(WEEKLY_GOAL_NOTIFICATION_IDS_KEY);
    console.log('✅ Cancelled existing weekly goal reminder notifications');
  } catch (error) {
    console.error('Error cancelling weekly goal reminder notifications:', error);
  }
}
