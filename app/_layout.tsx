
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImanTrackerProvider } from "@/contexts/ImanTrackerContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@/styles/commonStyles";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ImanTrackerProvider>
        <WidgetProvider>
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
        </WidgetProvider>
      </ImanTrackerProvider>
    </AuthProvider>
  );
}
