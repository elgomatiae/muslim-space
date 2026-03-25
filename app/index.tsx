import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';

/**
 * Root index screen - handles initial routing based on auth state
 * This is the first screen that loads when the app opens
 */
export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      // Still checking auth state, wait
      return;
    }

    try {
      if (user) {
        // User is signed in, redirect to home
        console.log('✅ User authenticated, redirecting to home');
        router.replace('/(tabs)/(home)/');
      } else {
        // User is not signed in, redirect to login
        console.log('❌ User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Navigation error in index:', error);
      // Don't crash - stay on loading screen
    }
  }, [user, loading]);

  return (
    <AppLoadingScreen message="Checking your session…" />
  );
}
