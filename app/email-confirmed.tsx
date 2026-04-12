import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { colors, spacing, typography } from '@/styles/commonStyles';
import {
  applySupabaseSessionFromUrl,
  parseSupabaseAuthParamsFromUrl,
} from '@/utils/supabaseAuthDeepLink';

export default function EmailConfirmedScreen() {
  const [message, setMessage] = useState('Confirming your account…');

  const tryFinish = useCallback(async (url: string | null) => {
    if (!url) {
      setMessage('Open the link from your email on this device to finish signing in.');
      return;
    }

    const { code, access_token, refresh_token } = parseSupabaseAuthParamsFromUrl(url);
    if (!code && !(access_token && refresh_token)) {
      setMessage('This page is for email confirmation links. Use the link from your inbox.');
      return;
    }

    const { ok, error } = await applySupabaseSessionFromUrl(url);
    if (ok) {
      setMessage('You are signed in. Taking you home…');
      return;
    }

    setMessage(
      error?.message ??
        'We could not complete sign-in from this link. Try opening the link again or log in manually.'
    );
  }, []);

  useEffect(() => {
    void (async () => {
      const initial = await Linking.getInitialURL();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await tryFinish(window.location.href);
        return;
      }
      await tryFinish(initial);
    })();

    const sub = Linking.addEventListener('url', ({ url }) => {
      void tryFinish(url);
    });

    return () => sub.remove();
  }, [tryFinish]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Muslim-Space</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
