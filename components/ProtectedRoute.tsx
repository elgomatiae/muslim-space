
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router, useSegments, type Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const REDIRECT_DEBOUNCE_MS = 600;

export function ProtectedRoute({ children, redirectTo = '/(auth)/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const lastRedirectToAuthAt = useRef(0);
  const lastRedirectToHomeAt = useRef(0);

  useEffect(() => {
    if (loading) return;

    try {
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        const now = Date.now();
        if (now - lastRedirectToAuthAt.current < REDIRECT_DEBOUNCE_MS) return;
        lastRedirectToAuthAt.current = now;
        console.log('Redirecting to auth - user not authenticated');
        router.replace(redirectTo as Href);
      } else if (user && inAuthGroup) {
        const now = Date.now();
        if (now - lastRedirectToHomeAt.current < REDIRECT_DEBOUNCE_MS) return;
        lastRedirectToHomeAt.current = now;
        console.log('Redirecting to home - user already authenticated');
        router.replace('/(tabs)/(home)/' as Href);
      }
    } catch (error) {
      console.error('Navigation error in ProtectedRoute:', error);
      // Don't crash - continue rendering
    }
  }, [user, loading, segments, redirectTo]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If user is not authenticated, show loading (will redirect in useEffect)
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
