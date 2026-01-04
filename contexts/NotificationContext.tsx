
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface NotificationContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  permissionStatus: Notifications.PermissionStatus | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_ENABLED_KEY = '@notifications_enabled';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    loadNotificationSettings();
    checkPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      setNotificationsEnabledState(enabled === 'true');
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    try {
      if (enabled && permissionStatus !== 'granted') {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      }
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled.toString());
      setNotificationsEnabledState(enabled);
    } catch (error) {
      console.error('Failed to set notification enabled:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notificationsEnabled,
        setNotificationsEnabled,
        requestPermissions,
        permissionStatus,
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
