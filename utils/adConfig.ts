/**
 * ============================================================================
 * ADMOB CONFIGURATION
 * ============================================================================
 * 
 * Configuration file for Google AdMob ads
 * Replace test IDs with your actual Ad Unit IDs from AdMob dashboard
 */

// Check if we're in Expo Go (where native modules don't work)
function isExpoGo(): boolean {
  try {
    // In Expo Go, Constants.executionEnvironment is 'storeClient'
    // In development builds, it's 'standalone' or 'bare'
    const Constants = require('expo-constants');
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    // If we can't check, assume we're in Expo Go to be safe
    return true;
  }
}

// Lazy load mobileAds to avoid crashing in Expo Go
let mobileAdsModule: any = null;
const IS_EXPO_GO = isExpoGo();

async function getMobileAds() {
  // Completely skip in Expo Go - return early before any import
  if (IS_EXPO_GO) {
    return false;
  }
  
  if (mobileAdsModule !== null) {
    return mobileAdsModule;
  }
  
  try {
    // Import will resolve to stub in Expo Go via Metro config
    // In native builds, this will be the real module
    const module = await import('react-native-google-mobile-ads');
    
    // Check if this is the stub (stub has console.log in initialize)
    // Real module will have native methods
    if (module && typeof module.default === 'object' && module.default.initialize) {
      mobileAdsModule = module;
      return mobileAdsModule;
    }
    
    mobileAdsModule = false;
    return false;
  } catch (e: any) {
    // Import failed
    if (__DEV__) {
      console.log('[AdMob] Module import failed:', e?.message || e);
    }
    mobileAdsModule = false;
    return false;
  }
}

// Initialize AdMob (call this once at app startup)
export async function initializeAds() {
  // Skip completely in Expo Go
  if (IS_EXPO_GO) {
    if (__DEV__) {
      console.log('AdMob skipped - running in Expo Go. Rebuild with native code to enable ads.');
    }
    return;
  }
  
  try {
    const module = await getMobileAds();
    if (!module || !module.default) {
      if (__DEV__) {
        console.log('AdMob not available - native module not loaded. Run: npx expo prebuild');
      }
      return;
    }
    await module.default().initialize();
    console.log('AdMob initialized successfully');
  } catch (error) {
    if (__DEV__) {
      console.error('Error initializing AdMob:', error);
    }
    // Don't crash the app if AdMob fails to initialize
  }
}

// ============================================================================
// TEST AD UNIT IDs (Use these during development)
// ============================================================================
// Replace these with your actual Ad Unit IDs from AdMob dashboard before production

export const TEST_AD_UNITS = {
  // Banner Ads
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  // Interstitial Ads (Full-screen)
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
  // Rewarded Ads
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  },
};

// ============================================================================
// PRODUCTION AD UNIT IDs
// ============================================================================
// Your actual Ad Unit IDs from AdMob dashboard

export const PRODUCTION_AD_UNITS = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716', // Using test ID - create banner ad unit in AdMob
    android: 'ca-app-pub-3940256099942544/6300978111', // Using test ID - create banner ad unit in AdMob
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910', // Using test ID - create interstitial ad unit in AdMob
    android: 'ca-app-pub-3940256099942544/1033173712', // Using test ID - create interstitial ad unit in AdMob
  },
  rewarded: {
    ios: 'ca-app-pub-2757517181313212/8725693825', // Your rewarded interstitial ad unit ID
    android: 'ca-app-pub-2757517181313212/8725693825', // Your rewarded interstitial ad unit ID
  },
};

// ============================================================================
// AD CONFIGURATION
// ============================================================================

// Use test ads in development, production ads in production
// Set to true to use production ads
const USE_PRODUCTION_ADS = true; // Using production ads with your real ad unit
const isDevelopment = __DEV__ && !USE_PRODUCTION_ADS;

export const AD_UNITS = isDevelopment ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;

// Get platform-specific ad unit ID
export function getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
  const { Platform } = require('react-native');
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return AD_UNITS[type][platform];
}

// ============================================================================
// AD SHOWING HELPERS
// ============================================================================

let interstitialAd: any = null;
let rewardedAd: any = null;

/**
 * Load an interstitial ad
 */
export async function loadInterstitialAd() {
  // Skip completely in Expo Go
  if (IS_EXPO_GO) {
    return;
  }
  
  try {
    const adModule = await import('react-native-google-mobile-ads').catch(() => null);
    
    if (!adModule || !adModule.InterstitialAd) {
      return;
    }
    
    const { InterstitialAd } = adModule;
    interstitialAd = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
      requestNonPersonalizedAdsOnly: true,
    });

    // Preload the ad
    await interstitialAd.load();
    console.log('Interstitial ad loaded');
  } catch (error: any) {
    // Silently fail - don't log in production
    if (__DEV__) {
      console.error('Error loading interstitial ad:', error?.message || error);
    }
  }
}

/**
 * Show an interstitial ad
 */
export async function showInterstitialAd(): Promise<boolean> {
  try {
    if (!interstitialAd) {
      await loadInterstitialAd();
    }

    if (interstitialAd && interstitialAd.loaded) {
      await interstitialAd.show();
      // Reload for next time
      await loadInterstitialAd();
      return true;
    } else {
      console.log('Interstitial ad not ready');
      return false;
    }
  } catch (error) {
    console.error('Error showing interstitial ad:', error);
    return false;
  }
}

/**
 * Load a rewarded ad
 */
export async function loadRewardedAd() {
  // Skip completely in Expo Go
  if (IS_EXPO_GO) {
    return;
  }
  
  try {
    const adModule = await import('react-native-google-mobile-ads').catch(() => null);
    
    if (!adModule || !adModule.RewardedAd) {
      return;
    }
    
    const { RewardedAd } = adModule;
    rewardedAd = RewardedAd.createForAdRequest(getAdUnitId('rewarded'), {
      requestNonPersonalizedAdsOnly: true,
    });

    // Preload the ad
    await rewardedAd.load();
    console.log('Rewarded ad loaded');
  } catch (error: any) {
    // Silently fail - don't log in production
    if (__DEV__) {
      console.error('Error loading rewarded ad:', error?.message || error);
    }
  }
}

/**
 * Show a rewarded ad
 * @param onReward Callback when user earns reward
 */
export async function showRewardedAd(
  onReward?: (reward: { type: string; amount: number }) => void
): Promise<boolean> {
  // Skip completely in Expo Go
  if (IS_EXPO_GO) {
    return false;
  }
  
  try {
    // Check if native module is available
    const adModule = await import('react-native-google-mobile-ads').catch(() => null);
    
    if (!adModule) {
      return false;
    }

    if (!rewardedAd) {
      await loadRewardedAd();
    }

    if (rewardedAd && rewardedAd.loaded) {
      const { RewardedAdEventType } = adModule;
      
      // Set up reward listener
      if (onReward) {
        const unsubscribe = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          onReward(reward);
          unsubscribe();
        });
      }

      await rewardedAd.show();
      // Reload for next time
      await loadRewardedAd();
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error showing rewarded ad:', error?.message || error);
    }
    return false;
  }
}
