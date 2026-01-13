
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="notification-settings"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Notification Settings',
        }}
      />
      <Stack.Screen 
        name="health-check"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Health Check',
        }}
      />
    </Stack>
  );
}
