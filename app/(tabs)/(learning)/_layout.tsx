
import { Stack } from 'expo-router';

export default function LearningLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quizzes" />
      <Stack.Screen name="lectures" />
      <Stack.Screen name="quiz-take" />
      <Stack.Screen name="quiz-result" />
    </Stack>
  );
}
