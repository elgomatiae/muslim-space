
import "react-native-reanimated";
import React, { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert, Platform, View } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
// NotificationProvider is lazy-loaded - don't import at top level
import { ImanTrackerProvider } from "@/contexts/ImanTrackerContext";
import { AchievementCelebrationProvider } from "@/contexts/AchievementCelebrationContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdMobProvider } from "@/contexts/AdMobContext";
import { BannerAdBar } from "@/components/ads/BannerAdBar";

// Lazy NotificationProvider - only loads after React Native is fully initialized
// This prevents native module crashes by delaying NotificationProvider initialization
function LazyNotificationProvider({ children }: { children: React.ReactNode }) {
  const [NotificationProviderComponent, setNotificationProviderComponent] = React.useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    // Wait 5 seconds to ensure React Native and all native modules are fully ready
    const timer = setTimeout(() => {
      // Double-check that React Native bridge is ready
      const isReady = 
        (typeof global !== 'undefined' && (global as any).__fbBatchedBridge) ||
        (typeof window !== 'undefined');
      
      if (isReady) {
        setShouldLoad(true);
      } else {
        // If not ready, wait another 2 seconds
        setTimeout(() => setShouldLoad(true), 2000);
      }
    }, 5000); // Wait 5 seconds before attempting to load

    return () => clearTimeout(timer);
  }, []);

  // Dynamically import NotificationProvider only when ready
  React.useEffect(() => {
    if (!shouldLoad) return;

    // Use dynamic import to load NotificationProvider only when needed
    import('@/contexts/NotificationContext')
      .then((module) => {
        setNotificationProviderComponent(() => module.NotificationProvider);
      })
      .catch((error) => {
        console.error('Error dynamically loading NotificationProvider:', error);
        // Continue without NotificationProvider - app will work without notifications
      });
  }, [shouldLoad]);

  // Don't render NotificationProvider until it's loaded
  if (!NotificationProviderComponent) {
    return <>{children}</>;
  }

  // Now safe to render NotificationProvider
  return (
    <ErrorBoundary fallback={null}>
      <NotificationProviderComponent>
        {children}
      </NotificationProviderComponent>
    </ErrorBoundary>
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen is already prevented
});

/** Minimum time the native splash stays visible so it doesn’t flash away instantly. */
const SPLASH_MIN_VISIBLE_MS = 900;
const splashClockStart = Date.now();

export const unstable_settings = {
  initialRouteName: "index", // Start at index which checks auth and redirects
};

function GlobalBannerAdHost() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  if (Platform.OS === "web") return null;

  // Tabs layout renders BannerAdBar. usePathname() omits (tabs) from the URL, so we
  // must use segments — otherwise a second banner appears on Learning and other tabs.
  const isInTabs = Array.isArray(segments) && segments[0] === "(tabs)";
  if (isInTabs) return null;

  return (
    <View style={{ width: "100%", paddingBottom: insets.bottom, backgroundColor: "transparent" }}>
      <BannerAdBar />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const splashScreenHidden = useRef(false);

  // Global error handler for unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent default crash behavior
      event.preventDefault?.();
    };

    // Add global error handlers - only on web (React Native doesn't have window.addEventListener)
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    // Also handle React Native's global error handler
    // ErrorUtils is available in React Native runtime
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler?.();
      ErrorUtils.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
        console.error('Global error handler:', error, isFatal);
        // Don't crash - log and continue
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    return () => {
      // Only remove listener if it was added (web only)
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);

  useEffect(() => {
    // Handle font loading - continue even if font fails
    if (fontError) {
      console.warn('Font loading error (using system font):', fontError);
      // Continue with app - use system fonts
    }

    if (!loaded && !fontError) {
      return;
    }

    if (splashScreenHidden.current) {
      return;
    }

    const elapsed = Date.now() - splashClockStart;
    const remaining = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);

    const id = setTimeout(() => {
      if (splashScreenHidden.current) return;
      splashScreenHidden.current = true;
      SplashScreen.hideAsync().catch((error) => {
        if (__DEV__) {
          console.log('Splash screen hide error (ignored):', error.message);
        }
      });
    }, remaining);

    return () => clearTimeout(id);
  }, [loaded, fontError]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  // Don't block app if font fails - continue with system fonts
  if (!loaded && !fontError) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" animated />
        <AdMobProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
          >
            <I18nProvider>
              <AuthProvider>
              <AchievementCelebrationProvider>
                {/* Lazy load NotificationProvider to prevent immediate native module crashes */}
                <LazyNotificationProvider>
                  <ImanTrackerProvider>
                    <WidgetProvider>
                      <GestureHandlerRootView>
                        <View style={{ flex: 1 }}>
                          <View style={{ flex: 1 }}>
                            <Stack>
                              {/* Root index - handles auth routing */}
                              <Stack.Screen
                                name="index"
                                options={{ headerShown: false }}
                              />

                              {/* Auth screens */}
                              <Stack.Screen
                                name="(auth)"
                                options={{ headerShown: false }}
                              />

                              {/* Main app with tabs - protected */}
                              <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                              />
                            </Stack>
                          </View>

                          <GlobalBannerAdHost />
                        </View>

                        <SystemBars style={"auto"} />
                      </GestureHandlerRootView>
                    </WidgetProvider>
                  </ImanTrackerProvider>
                </LazyNotificationProvider>
              </AchievementCelebrationProvider>
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </AdMobProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
