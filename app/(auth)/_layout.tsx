
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  // Redirect authenticated users away from auth screens
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ User already authenticated, redirecting from auth screen to home');
      router.replace('/(tabs)/(home)');
    }
  }, [user, loading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#070b14' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
