# AdMob + Expo Go

Expo Go does **not** include the native `RNGoogleMobileAds` module.

## What we do

1. **`shims/react-native-google-mobile-ads.js`** – JS-only stub (no native module).
2. **App code** imports **`@/shims/react-native-google-mobile-ads.js`** (never loads real package in Expo Go).
3. **`babel-plugins/rewrite-admob-shim-import.js`** – rewrites shim imports to **`react-native-google-mobile-ads`** only when **`EXPO_PUBLIC_USE_REAL_ADMOB=true` and `EAS_BUILD`** (EAS cloud/local build). Local `expo start` keeps the shim even if `.env` sets `EXPO_PUBLIC_USE_REAL_ADMOB=true`.
4. **`metro.config.js`** – same rule: only resolves to the real package on EAS builds; otherwise forces the flat stub.

## Commands

- **Expo Go / local dev:** run `npx expo start -c` after changing Babel or Metro.
- **EAS builds:** `eas.json` sets `EXPO_PUBLIC_USE_REAL_ADMOB=true` so Babel rewrites to the real package.

If TurboModule errors persist, clear Metro cache and ensure **`EXPO_PUBLIC_USE_REAL_ADMOB` is not `true` in your shell** while using Expo Go.
