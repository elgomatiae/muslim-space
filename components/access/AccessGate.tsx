import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { RewardedInterstitialAd, AdEventType, RewardedAdEventType } from '@/shims/react-native-google-mobile-ads.js';
import { colors } from '@/styles/commonStyles';
import { useAdMob } from '@/contexts/AdMobContext';

// Test ad unit ID for rewarded interstitial (use your production ID in production)
const ACCESS_GATE_AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6978759866' // Test rewarded interstitial ad unit ID
  : 'ca-app-pub-2757517181313212/8725693825'; // Production ad unit ID

interface AccessGateProps {
  visible: boolean;
  onClose: () => void;
  onAccessGranted: () => void;
  title?: string;
  description?: string;
}

export function AccessGate({
  visible,
  onClose,
  onAccessGranted,
  title = 'Unlock Access',
  description = 'Watch a short ad to unlock this feature',
}: AccessGateProps) {
  const { isInitialized, isInitializing, initializationError, retryInitialization } = useAdMob();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  // Use a ref for the ad instance to avoid stale closures
  const adRef = useRef<RewardedInterstitialAd | null>(null);
  const unsubscribeFunctionsRef = useRef<Array<() => void>>([]);
  const webAutoGrantedRef = useRef(false);

  // Cleanup function to remove all event listeners
  const cleanupAdListeners = useCallback(() => {
    unsubscribeFunctionsRef.current.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from ad event:', error);
      }
    });
    unsubscribeFunctionsRef.current = [];
  }, []);

  const loadAd = async () => {
    try {
      // Clean up any existing listeners first
      cleanupAdListeners();

      setAdLoading(true);
      setAdLoaded(false);

      const ad = RewardedInterstitialAd.createForAdRequest(ACCESS_GATE_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Single unified event listener – avoids passing an invalid type value
      // ✅ Use documented per-event API
      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('✅ Access Gate ad loaded');
        setAdLoaded(true);
        setAdLoading(false);
      });

      const unsubReward = ad.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('✅ User earned reward:', reward);
          console.log(`Reward: ${reward.type} - ${reward.amount}`);
          cleanupAdListeners();
          adRef.current = null;
          setAdLoaded(false);
          onAccessGranted();
          onClose();
        }
      );

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('❌ Ad error:', error);
        const errorMessage = (error as any)?.message || (error as any)?.code || 'Unknown error';
        setAdLoading(false);
        setAdLoaded(false);
        cleanupAdListeners();
        adRef.current = null;

        if (visible) {
          Alert.alert(
            'Ad Error',
            `Unable to load ad: ${errorMessage}\n\nPlease check your internet connection and try again.`,
            [{ text: 'OK', onPress: () => {} }]
          );
        }
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📺 Ad closed');
        cleanupAdListeners();
        setAdLoaded(false);
        adRef.current = null;
      });

      unsubscribeFunctionsRef.current.push(
        unsubLoaded,
        unsubReward,
        unsubError,
        unsubClosed
      );

      // Load the ad
      await ad.load();
      adRef.current = ad;
    } catch (error) {
      console.error('❌ Error loading ad:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setAdLoading(false);
      setAdLoaded(false);
      cleanupAdListeners();
      adRef.current = null;

      if (visible) {
        Alert.alert(
          'Error',
          `Failed to load ad: ${errorMessage}\n\nPlease try again later.`,
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    }
  };

  // Web: no rewarded ads — grant access immediately (no modal, no spinner).
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!visible) {
      webAutoGrantedRef.current = false;
      return;
    }
    if (webAutoGrantedRef.current) return;
    webAutoGrantedRef.current = true;
    onAccessGranted();
  }, [visible, onAccessGranted]);

  // When AdMob is ready and the gate is visible, ensure an ad is loaded
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (visible && isInitialized && !adRef.current && !adLoading) {
      loadAd();
    }
  }, [visible, isInitialized, adLoading]);

  // Show retry / error only when AdMob init fails while gate is visible
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (visible && !isInitialized && !isInitializing && initializationError) {
      const errorMessage = initializationError.message || 'Unknown error';
      Alert.alert(
        'Ad Service Unavailable',
        `Unable to initialize ad service: ${errorMessage}\n\nPlease check your internet connection and try again.`,
        [
          { text: 'Cancel', onPress: onClose, style: 'cancel' },
          { text: 'Retry', onPress: retryInitialization },
        ]
      );
    }
  }, [visible, isInitialized, isInitializing, initializationError, onClose, retryInitialization]);

  // Cleanup listeners and ad only on unmount
  useEffect(() => {
    return () => {
      cleanupAdListeners();
      adRef.current = null;
    };
  }, [cleanupAdListeners]);

  const showAd = async () => {
    const ad = adRef.current;
    if (!ad || !adLoaded) {
      Alert.alert('Ad Not Ready', 'Please wait for the ad to load.');
      return;
    }

    try {
      // Check if ad is still loaded before showing
      if (!ad.loaded) {
        console.warn('⚠️ Ad is no longer loaded, reloading...');
        setAdLoaded(false);
        adRef.current = null;
        cleanupAdListeners();
        await loadAd();
        return;
      }

      await ad.show();
    } catch (error) {
      console.error('❌ Error showing ad:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Clean up on error
      cleanupAdListeners();
      setAdLoaded(false);
      adRef.current = null;
      
      Alert.alert(
        'Error',
        `Failed to show ad: ${errorMessage}\n\nPlease try again.`,
        [
          { text: 'Cancel', onPress: onClose, style: 'cancel' },
          { text: 'Retry', onPress: loadAd },
        ]
      );
    }
  };

  const handleClose = () => {
    cleanupAdListeners();
    setAdLoaded(false);
    adRef.current = null;
    onClose();
  };

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {(!isInitialized || isInitializing) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  {isInitializing ? 'Initializing ad service...' : 'Preparing ad service...'}
                </Text>
              </View>
            )}

            {isInitialized && adLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading ad...</Text>
              </View>
            )}

            {isInitialized && !adLoading && adLoaded && (
              <TouchableOpacity
                style={styles.watchButton}
                onPress={showAd}
                activeOpacity={0.8}
              >
                <Text style={styles.watchButtonText}>Watch Ad to Unlock</Text>
              </TouchableOpacity>
            )}

            {isInitialized && !adLoading && !adLoaded && (
              <TouchableOpacity
                style={[styles.watchButton, styles.retryButton]}
                onPress={loadAd}
                activeOpacity={0.8}
              >
                <Text style={styles.watchButtonText}>Retry Loading Ad</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.card || '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text || '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text || '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary || '#007AFF',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text || '#666666',
  },
  watchButton: {
    backgroundColor: colors.primary || '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary || '#007AFF',
    opacity: 0.7,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text || '#666666',
    fontSize: 16,
  },
});
