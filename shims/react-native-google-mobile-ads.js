/**
 * JS stub — used when EXPO_PUBLIC_USE_REAL_ADMOB is not "true".
 * Prevents TurboModuleRegistry crashes in Expo Go (no RNGoogleMobileAds native module).
 *
 * Babel `module-resolver` rewrites imports to this file (see babel.config.js).
 * Metro `resolveRequest` also points here as a fallback.
 */

const React = require("react");
const { View, Text, StyleSheet } = require("react-native");

const AdEventType = {
  LOADED: "loaded",
  ERROR: "error",
  OPENED: "opened",
  PAID: "paid",
  CLICKED: "clicked",
  CLOSED: "closed",
};

const RewardedAdEventType = {
  LOADED: "rewarded_loaded",
  EARNED_REWARD: "rewarded_earned_reward",
};

const TestIds = {
  APP_OPEN: "",
  ADAPTIVE_BANNER: "",
  BANNER: "ca-app-pub-3940256099942544/6300978111",
  INTERSTITIAL: "",
  REWARDED: "",
  REWARDED_INTERSTITIAL: "ca-app-pub-3940256099942544/6978759866",
  NATIVE: "",
  NATIVE_VIDEO: "",
  GAM_APP_OPEN: "/21775744923/example/app-open",
  GAM_BANNER: "/21775744923/example/fixed-size-banner",
  GAM_INTERSTITIAL: "/21775744923/example/interstitial",
  GAM_REWARDED: "/21775744923/example/rewarded",
  GAM_REWARDED_INTERSTITIAL: "/21775744923/example/rewarded-interstitial",
  GAM_NATIVE: "/21775744923/example/native",
  GAM_NATIVE_VIDEO: "/21775744923/example/native-video",
};

const BannerAdSize = {
  ANCHORED_ADAPTIVE_BANNER: "anchored_adaptive_banner",
  INLINE_ADAPTIVE_BANNER: "inline_adaptive_banner",
};

/** Reserves real banner height so layout (tabs + home scroll) matches production. */
function BannerAd(props) {
  const width = props.width ?? "100%";
  const maxHeight = props.maxHeight ?? 120;
  return React.createElement(
    View,
    {
      style: [
        stubStyles.banner,
        {
          width,
          maxHeight,
        },
      ],
    },
    typeof __DEV__ !== "undefined" && __DEV__
      ? React.createElement(
          Text,
          { style: stubStyles.label },
          "Banner ad (Expo Go / stub)",
        )
      : null,
  );
}

const stubStyles = StyleSheet.create({
  banner: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  label: {
    fontSize: 11,
    color: "#888",
  },
});

function mobileAds() {
  return {
    initialize: async () => Promise.resolve({ adapterStatuses: [] }),
  };
}

class RewardedInterstitialAd {
  constructor() {
    this.loaded = false;
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  static createForAdRequest(_adUnitId, _requestOptions) {
    return new RewardedInterstitialAd();
  }

  addAdEventListener(eventType, listener) {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType).add(listener);
    return () => {
      this._listeners.get(eventType)?.delete(listener);
    };
  }

  _emit(eventType, payload) {
    const set = this._listeners.get(eventType);
    set?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.warn("[AdMob stub] listener error", e);
      }
    });
  }

  async load() {
    this.loaded = true;
    queueMicrotask(() => this._emit(RewardedAdEventType.LOADED));
  }

  async show() {
    queueMicrotask(() => {
      this._emit(RewardedAdEventType.EARNED_REWARD, { type: "stub", amount: 1 });
      this._emit(AdEventType.CLOSED);
    });
  }
}

module.exports = {
  AdEventType,
  RewardedAdEventType,
  TestIds,
  BannerAdSize,
  BannerAd,
  mobileAds,
  RewardedInterstitialAd,
};
