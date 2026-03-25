import type { ComponentType } from "react";

/** Types for `shims/react-native-google-mobile-ads.js` (Expo Go / stub). EAS rewrites imports to the real package. */
declare module "@/shims/react-native-google-mobile-ads.js" {
  export const AdEventType: Record<string, string>;
  export const RewardedAdEventType: Record<string, string>;
  export const TestIds: Record<string, string>;
  export const BannerAdSize: Record<string, string>;
  export const BannerAd: ComponentType<Record<string, unknown>>;
  export function mobileAds(): {
    initialize(): Promise<{ adapterStatuses: unknown[] }>;
  };
  export class RewardedInterstitialAd {
    loaded: boolean;
    static createForAdRequest(
      adUnitId: string,
      requestOptions?: Record<string, unknown>
    ): RewardedInterstitialAd;
    addAdEventListener(
      eventType: string,
      listener: (payload?: unknown) => void
    ): () => void;
    load(): Promise<void>;
    show(): Promise<void>;
  }
}
