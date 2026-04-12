import { Stack } from 'expo-router';
import { miniTabStackScreenOptions, TAB_ROOT_HREFS } from '@/components/navigation/miniTabStack';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={miniTabStackScreenOptions(TAB_ROOT_HREFS.profile)}
      initialRouteName="index"
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome-muslim-space" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="health-check" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
