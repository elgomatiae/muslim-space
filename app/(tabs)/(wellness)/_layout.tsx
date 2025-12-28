
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function WellnessLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="mental-health" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="journal-prompts" />
      <Stack.Screen name="prophet-stories" />
      <Stack.Screen name="mental-duas" />
      <Stack.Screen name="emotional-support" />
      <Stack.Screen name="meditation" />
      <Stack.Screen name="physical-health" />
      <Stack.Screen name="activity-tracker" />
      <Stack.Screen name="sleep-tracker" />
      <Stack.Screen name="physical-goals" />
      <Stack.Screen name="activity-history" />
    </Stack>
  );
}
