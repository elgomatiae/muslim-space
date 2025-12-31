
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ImanTrackerProvider } from "@/contexts/ImanTrackerContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/styles/commonStyles";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      console.log('No session, redirecting to login');
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      console.log('Session exists, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [session, segments, loading]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="transparent-modal"
        options={{
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="formsheet"
        options={{
          presentation: "formSheet",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ImanTrackerProvider>
          <WidgetProvider>
            <RootLayoutNav />
          </WidgetProvider>
        </ImanTrackerProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
