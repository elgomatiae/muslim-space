import { useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Legacy key from when a single ad unlocked premium for 24h — cleared once so old installs don’t behave oddly. */
const LEGACY_ACCESS_STORAGE_KEY = "@access_granted";

export function useAccessGate() {
  const [gateVisible, setGateVisible] = useState(false);
  /** Optional callback after a successful reward (e.g. navigate). Kept in a ref so `onGateGranted` stays stable. */
  const onGrantedRef = useRef<(() => void) | null>(null);
  const legacyClearedRef = useRef(false);

  /**
   * Access is never “cached” — each protected tap shows the ad gate.
   * We still clear any legacy 24h token once per JS session so it cannot affect behavior.
   */
  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!legacyClearedRef.current) {
      legacyClearedRef.current = true;
      try {
        await AsyncStorage.removeItem(LEGACY_ACCESS_STORAGE_KEY);
      } catch {
        /* non-fatal */
      }
    }
    return false;
  }, []);

  /** No-op: we do not store a global unlock anymore. */
  const grantAccess = useCallback(async (): Promise<void> => {}, []);

  const revokeAccess = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LEGACY_ACCESS_STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
  }, []);

  const showGate = useCallback((onGranted?: () => void) => {
    onGrantedRef.current = onGranted ?? null;
    setGateVisible(true);
  }, []);

  const onGateClose = useCallback(() => {
    setGateVisible(false);
    onGrantedRef.current = null;
  }, []);

  /** Hide the gate modal without clearing the pending `showGate` callback (used after EARNED_REWARD). */
  const onGateDismissOnly = useCallback(() => {
    setGateVisible(false);
  }, []);

  const onGateGranted = useCallback(async () => {
    try {
      await grantAccess();
      onGrantedRef.current?.();
    } finally {
      setGateVisible(false);
      onGrantedRef.current = null;
    }
  }, [grantAccess]);

  return {
    hasAccess: false,
    showGate,
    checkAccess,
    grantAccess,
    revokeAccess,
    gateVisible,
    onGateClose,
    onGateDismissOnly,
    onGateGranted,
  };
}
