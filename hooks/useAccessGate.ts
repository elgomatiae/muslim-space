import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_STORAGE_KEY = '@access_granted';
const ACCESS_EXPIRY_HOURS = 24; // Access expires after 24 hours

interface AccessState {
  hasAccess: boolean;
  showGate: (onGranted?: () => void) => void;
  checkAccess: () => Promise<boolean>;
  grantAccess: () => Promise<void>;
  revokeAccess: () => Promise<void>;
}

export function useAccessGate(): AccessState & { gateVisible: boolean; onGateClose: () => void; onGateGranted: () => void } {
  const [gateVisible, setGateVisible] = useState(false);
  const [onAccessGrantedCallback, setOnAccessGrantedCallback] = useState<(() => void) | null>(null);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    try {
      const accessData = await AsyncStorage.getItem(ACCESS_STORAGE_KEY);
      if (!accessData) {
        return false;
      }

      const { timestamp } = JSON.parse(accessData);
      const now = Date.now();
      const expiryTime = timestamp + ACCESS_EXPIRY_HOURS * 60 * 60 * 1000;

      if (now > expiryTime) {
        // Access expired, remove it
        await AsyncStorage.removeItem(ACCESS_STORAGE_KEY);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }, []);

  const grantAccess = useCallback(async (): Promise<void> => {
    try {
      const accessData = {
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(accessData));
    } catch (error) {
      console.error('Error granting access:', error);
    }
  }, []);

  const revokeAccess = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  }, []);

  const showGate = useCallback((onGranted?: () => void) => {
    setOnAccessGrantedCallback(() => onGranted || null);
    setGateVisible(true);
  }, []);

  const onGateClose = useCallback(() => {
    setGateVisible(false);
    setOnAccessGrantedCallback(null);
  }, []);

  const onGateGranted = useCallback(async () => {
    await grantAccess();
    if (onAccessGrantedCallback) {
      onAccessGrantedCallback();
    }
    setGateVisible(false);
    setOnAccessGrantedCallback(null);
  }, [grantAccess, onAccessGrantedCallback]);

  return {
    hasAccess: false, // Will be checked dynamically
    showGate,
    checkAccess,
    grantAccess,
    revokeAccess,
    gateVisible,
    onGateClose,
    onGateGranted,
  };
}
