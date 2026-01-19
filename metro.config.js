const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

// Stub paths - try .js first, then .ts
const stubPathJs = path.resolve(__dirname, 'utils', 'adMobStub.js');
const stubPathTs = path.resolve(__dirname, 'utils', 'adMobStub.ts');
const stubPath = fs.existsSync(stubPathJs) ? stubPathJs : stubPathTs;

// Custom resolver to redirect AdMob module to stub
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Redirect react-native-google-mobile-ads to our stub
    if (moduleName === 'react-native-google-mobile-ads') {
      // Check if stub file exists
      if (fs.existsSync(stubPath)) {
        console.log(`[Metro Resolver] Redirecting ${moduleName} to stub: ${stubPath}`);
        return {
          type: 'sourceFile',
          filePath: stubPath,
        };
      } else {
        console.warn(`[Metro Resolver] Stub file not found at ${stubPath}`);
      }
    }
    
    // Use default resolution for everything else
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
