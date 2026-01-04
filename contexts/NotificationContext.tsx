
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  prayerReminders: boolean;
  dailyQuran: boolean;
  dailyHadith: boolean;
  imanTrackerReminders: boolean;
}

interface NotificationContextType {
  notificationPermissionGranted: boolean;
  settings: NotificationSettings;
  requestPermission: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  loading: boolean;
}

const SETTINGS_KEY = '@notification_settings';

const defaultSettings: NotificationSettings = {
  prayerReminders: true,
  dailyQuran: true,
  dailyHadith: true,
  imanTrackerReminders: true
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await checkPermission();
      await loadSettings();
      setLoading(false);
    };
    initialize();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Failed to check notification permission:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setNotificationPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationPermissionGranted,
        settings,
        requestPermission,
        updateSettings,
        loading
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
