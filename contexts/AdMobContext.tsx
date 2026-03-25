import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface AdMobContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: Error | null;
  retryInitialization: () => void;
}

const AdMobContext = createContext<AdMobContextType>({
  isInitialized: false,
  isInitializing: false,
  initializationError: null,
  retryInitialization: () => {},
});

// AdMob App ID from app.json
const ADMOB_APP_ID = 'ca-app-pub-2757517181313212~3571222456';

export function AdMobProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const hasInitialized = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);

  const initializeAdMob = React.useCallback(async () => {
    // Skip if already initialized or currently initializing
    if (hasInitialized.current && isInitializedRef.current) {
      return;
    }

    if (isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setIsInitializing(true);
    setInitializationError(null);

    try {
      // Wait for React Native bridge to be ready
      const waitForBridge = () => {
        return new Promise<void>((resolve) => {
          if (Platform.OS === 'web') {
            resolve();
            return;
          }

          // Check if React Native bridge is ready
          const checkBridge = () => {
            const g = global as typeof globalThis & { __fbBatchedBridge?: unknown };
            if (
              (typeof global !== "undefined" && g.__fbBatchedBridge) ||
              typeof window !== "undefined"
            ) {
              resolve();
            } else {
              setTimeout(checkBridge, 100);
            }
          };

          // Wait at least 2 seconds for native modules
          setTimeout(() => {
            checkBridge();
          }, 2000);
        });
      };

      await waitForBridge();
      
      console.log('📱 Attempting to initialize AdMob...');
      console.log('📱 Platform:', Platform.OS);
      console.log('📱 App ID:', ADMOB_APP_ID);
      
      // Try to import AdMob module
      // The Expo plugin auto-initializes AdMob when configured in app.json
      // We just need to verify the module is available
      try {
        const adMobModule = await import('@/shims/react-native-google-mobile-ads.js');
        console.log('✅ AdMob module imported successfully');
        console.log('📦 Available exports:', Object.keys(adMobModule));
        
        // Try to initialize if mobileAds is available (optional - plugin may have done it)
        if (adMobModule.mobileAds) {
          try {
            const initResult = await adMobModule.mobileAds().initialize();
            console.log('✅ Manual initialization successful:', initResult);
          } catch (initError) {
            // Initialization might fail if already initialized by plugin
            console.log('⚠️ Manual init failed (likely already initialized by plugin):', initError);
          }
        } else {
          console.log('ℹ️ mobileAds not exported - plugin handles initialization automatically');
        }
      } catch (importError) {
        console.error('❌ Failed to import AdMob module:', importError);
        if (importError instanceof Error && importError.message.includes('Cannot find module')) {
          throw new Error('AdMob module not found. Rebuild the app: eas build --platform ios --profile production --clear-cache');
        }
        // If import fails but we're in a built app, the plugin might still work
        console.warn('⚠️ Import failed, but plugin configuration may still work');
      }
      
      // Mark as initialized - Expo plugin auto-initializes when configured in app.json
      // The plugin reads GADApplicationIdentifier from Info.plist automatically
      console.log('✅ AdMob ready (initialized by Expo plugin)');
      
      setIsInitialized(true);
      isInitializedRef.current = true;
      hasInitialized.current = true;
      retryCount.current = 0;
      console.log('✅ AdMob initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullError = error instanceof Error ? error : new Error(String(error));
      
      console.error('❌ AdMob initialization failed:', {
        message: errorMessage,
        error: fullError,
        retryCount: retryCount.current,
        platform: Platform.OS,
      });

      // Retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        console.log(`🔄 Retrying AdMob initialization (${retryCount.current}/${maxRetries})...`);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount.current));
        
        // Retry
        setIsInitializing(false);
        setTimeout(() => initializeAdMob(), 100);
        return;
      }

      setInitializationError(fullError);
      setIsInitialized(false);
      hasInitialized.current = true; // Mark as attempted even if failed
      console.error('❌ AdMob initialization failed after all retries');
    } finally {
      setIsInitializing(false);
      isInitializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Web: no Google Mobile Ads SDK — treat as "ready" so gated flows never spin forever.
    // AccessGate and BannerAdBar skip real ads on web separately.
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('ℹ️ AdMob: not used on web; UI treats init as complete.');
      }
      setIsInitialized(true);
      setIsInitializing(false);
      setInitializationError(null);
      hasInitialized.current = true;
      return;
    }

    // Expo Go: use JS shim only (no RNGoogleMobileAds native module). Treat as ready.
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      if (__DEV__) {
        console.log(
          'ℹ️ AdMob: Expo Go uses the JavaScript shim only (no native AdMob module).'
        );
      }
      setInitializationError(null);
      setIsInitialized(true);
      hasInitialized.current = true;
      return;
    }

    console.log('📱 Execution environment:', Constants.executionEnvironment);
    console.log('📱 App version:', Constants.expoConfig?.version);
    
    initializeAdMob();
  }, []); // Only run once on mount

  const retryInitialization = React.useCallback(() => {
    if (isInitializingRef.current) return;
    
    hasInitialized.current = false;
    retryCount.current = 0;
    setIsInitialized(false);
    setInitializationError(null);
    initializeAdMob();
  }, [initializeAdMob]);

  return (
    <AdMobContext.Provider
      value={{
        isInitialized,
        isInitializing,
        initializationError,
        retryInitialization,
      }}
    >
      {children}
    </AdMobContext.Provider>
  );
}

export function useAdMob() {
  const context = useContext(AdMobContext);
  // Return default values if not in provider (graceful degradation)
  if (!context) {
    console.warn('useAdMob used outside AdMobProvider, returning default values');
    return {
      isInitialized: false,
      isInitializing: false,
      initializationError: null,
      retryInitialization: () => {},
    };
  }
  return context;
}
