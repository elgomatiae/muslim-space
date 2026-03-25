const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Fallback: redirect to flat stub if resolution still hits the real package (before overrides apply).
const stubPath = path.resolve(__dirname, 'shims/react-native-google-mobile-ads.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isEasBuild =
    process.env.EAS_BUILD === 'true' || process.env.EAS_BUILD === '1';
  const useReal =
    process.env.EXPO_PUBLIC_USE_REAL_ADMOB === 'true' && isEasBuild;
  if (
    !useReal &&
    (moduleName === 'react-native-google-mobile-ads' ||
      moduleName.startsWith('react-native-google-mobile-ads/'))
  ) {
    return {
      filePath: stubPath,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
