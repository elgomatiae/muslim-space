import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "./AccessGate";
import { colors } from "@/styles/commonStyles";

interface WithAccessGateProps {
  children: React.ReactNode;
  featureName?: string;
  featureDescription?: string;
  onAccessGranted?: () => void | Promise<void>;
}

/**
 * Wraps children and mounts an AccessGate for manual `showGate()` use.
 * Does not auto-open the gate on mount (global unlock was removed — gating is per tap in screens).
 */
export function WithAccessGate({
  children,
  featureName = "Premium Feature",
  featureDescription = "Watch a short ad to continue.",
  onAccessGranted,
}: WithAccessGateProps) {
  const { gateVisible, onGateClose, onGateDismissOnly, onGateGranted } = useAccessGate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const handleGateGranted = async () => {
    await onGateGranted();
    onAccessGranted?.();
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {children}
      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onDismissModalOnly={onGateDismissOnly}
        onAccessGranted={handleGateGranted}
        title={featureName}
        description={featureDescription}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
