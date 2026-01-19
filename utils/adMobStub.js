/**
 * Stub module for react-native-google-mobile-ads (JavaScript version)
 * This prevents crashes in Expo Go where the native module doesn't exist
 * 
 * This file replaces the real react-native-google-mobile-ads module
 * when Metro resolves imports, preventing Metro from trying to load
 * the native module which causes TurboModuleRegistry errors.
 */

// Export stub implementations that match the real module's API
export const mobileAds = {
  initialize: async () => {
    if (__DEV__) {
      console.log('[AdMob Stub] initialize() called - native module not available in Expo Go');
    }
    return Promise.resolve();
  },
};

// BannerAd component stub
export const BannerAd = () => null;

// InterstitialAd stub
export const InterstitialAd = {
  createForAdRequest: (adUnitId, requestOptions) => {
    if (__DEV__) {
      console.log('[AdMob Stub] InterstitialAd.createForAdRequest() called');
    }
    return {
      load: async () => Promise.resolve(),
      show: async () => Promise.resolve(),
      loaded: false,
      addAdEventListener: (eventType, listener) => () => {},
      removeAllListeners: () => {},
    };
  },
};

// RewardedAd stub
export const RewardedAd = {
  createForAdRequest: (adUnitId, requestOptions) => {
    if (__DEV__) {
      console.log('[AdMob Stub] RewardedAd.createForAdRequest() called');
    }
    return {
      load: async () => Promise.resolve(),
      show: async () => Promise.resolve(),
      loaded: false,
      addAdEventListener: (eventType, listener) => () => {},
      removeAllListeners: () => {},
    };
  },
};

// BannerAdSize constants
export const BannerAdSize = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  SMART_BANNER: 'SMART_BANNER',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
};

// TestIds for development
export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
};

// RewardedAdEventType constants
export const RewardedAdEventType = {
  EARNED_REWARD: 'rewarded',
  LOADED: 'loaded',
  ERROR: 'error',
};

// Default export
export default mobileAds;
