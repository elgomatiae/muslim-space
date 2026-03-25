import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAccessGate } from '@/hooks/useAccessGate';
import { AccessGate } from './AccessGate';
import { colors } from '@/styles/commonStyles';

interface WithAccessGateProps {
  children: React.ReactNode;
  featureName?: string;
  featureDescription?: string;
  onAccessGranted?: () => void;
}

/**
 * Higher-order component that wraps content with an access gate.
 * Shows the access gate modal if user doesn't have access, otherwise shows children.
 */
export function WithAccessGate({
  children,
  featureName = 'Premium Feature',
  featureDescription = 'Watch a short ad to unlock this feature',
  onAccessGranted,
}: WithAccessGateProps) {
  const { checkAccess, showGate, gateVisible, onGateClose, onGateGranted } = useAccessGate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAccessStatus();
  }, []);

  const checkAccessStatus = async () => {
    setChecking(true);
    const access = await checkAccess();
    setHasAccess(access);
    setChecking(false);

    if (!access) {
      // Show gate if no access
      showGate(() => {
        setHasAccess(true);
        if (onAccessGranted) {
          onAccessGranted();
        }
      });
    }
  };

  const handleGateGranted = () => {
    onGateGranted();
    setHasAccess(true);
    if (onAccessGranted) {
      onAccessGranted();
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hasAccess) {
    return (
      <>
        {children}
        <AccessGate
          visible={gateVisible}
          onClose={onGateClose}
          onAccessGranted={handleGateGranted}
          title={featureName}
          description={featureDescription}
        />
      </>
    );
  }

  // No access - gate will be shown by the hook
  return (
    <>
      <View style={styles.lockedContainer}>
        {children}
      </View>
      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedContainer: {
    opacity: 0.3,
  },
});
