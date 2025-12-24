
import { Stack } from 'expo-router';

export default function ImanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="communities" />
      <Stack.Screen name="community-detail" />
      <Stack.Screen name="invite-user" />
      <Stack.Screen name="invites-inbox" />
    </Stack>
  );
}
