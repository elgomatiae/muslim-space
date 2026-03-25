import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from '@/shims/react-native-google-mobile-ads.js';

const BANNER_AD_UNIT_ID =
  __DEV__ ? TestIds.BANNER : 'ca-app-pub-2757517181313212/7182066260';

/** Matches `maxHeight` below — screens above the banner should reserve at least this much. */
export const BANNER_AD_MAX_HEIGHT = 100;

export function BannerAdBar() {
  if (Platform.OS === 'web') return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        // Inline adaptive keeps the banner as part of normal layout flow.
        // Limiting maxHeight prevents the large placeholder "white barrier" before the ad is measured/loaded.
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        width={Dimensions.get('window').width}
        maxHeight={BANNER_AD_MAX_HEIGHT}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Keep this flush so the ad is the only thing visible.
    width: '100%',
    minHeight: 44,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
});

