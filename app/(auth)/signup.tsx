import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { spacing, typography } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';
import * as Haptics from 'expo-haptics';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { useTranslation } from '@/contexts/I18nContext';
import { getErrorMessage } from '@/utils/errorHandler';
import { AuthMarketingShell } from '@/components/auth/AuthMarketingShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { signInWithGoogle } from '@/utils/googleSignIn';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async () => {
    setErrorMessage('');
    if (!username || !email || !password || !confirmPassword) {
      const msg = t('auth.fillAllFields');
      setErrorMessage(msg);
      Alert.alert(t('common.error'), msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = t('auth.passwordsDoNotMatch');
      setErrorMessage(msg);
      Alert.alert(t('common.error'), msg);
      return;
    }
    if (password.length < 6) {
      const msg = t('auth.passwordMinLength');
      setErrorMessage(msg);
      Alert.alert(t('common.error'), msg);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthEmailRedirectTo(),
          data: { username: username.trim() },
        },
      });

      if (error) {
        const msg = getErrorMessage(error);
        setErrorMessage(msg);
        Alert.alert(t('auth.signupFailed'), msg);
        setLoading(false);
        return;
      }

      if (data.user) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setErrorMessage('');

        if (data.session) {
          try {
            await initializeUserProfile(data.user.id, username.trim(), email.trim());
          } catch (profileError) {
            console.error('Profile init after signup:', profileError);
          }
          try {
            router.replace('/(tabs)/(home)');
          } catch (navError) {
            console.error('Navigation after signup:', navError);
          }
        } else {
          Alert.alert(t('auth.signupAlmostThere'), t('auth.signupEnableAutoConfirm'), [
            { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
          ]);
        }
      }
    } catch (error: unknown) {
      const msg = t('auth.unexpectedError');
      setErrorMessage(msg);
      Alert.alert(t('common.error'), getErrorMessage(error) || msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const result = await signInWithGoogle();
      if (!result.ok) {
        setErrorMessage(result.error.message);
        Alert.alert(t('common.error'), result.error.message);
        return;
      }
      if (result.cancelled) {
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setErrorMessage(msg);
      Alert.alert(t('common.error'), msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthMarketingShell
      eyebrow={t('auth.brandEyebrow')}
      title={t('auth.createAccount')}
      subtitle={t('auth.signupSubtitle')}
    >
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <GoogleAuthButton
        label={t('auth.signUpWithGoogle')}
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={loading}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{t('auth.orUseEmail')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <AuthField
        label={t('auth.username')}
        value={username}
        onChangeText={(x) => {
          setUsername(x);
          setErrorMessage('');
        }}
        placeholder={t('auth.usernamePlaceholder')}
        iconIos="person.fill"
        iconAndroid="person"
        editable={!busy}
      />

      <AuthField
        label={t('auth.email')}
        value={email}
        onChangeText={(x) => {
          setEmail(x);
          setErrorMessage('');
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        iconIos="envelope.fill"
        iconAndroid="email"
        editable={!busy}
      />

      <AuthField
        label={t('auth.password')}
        value={password}
        onChangeText={(x) => {
          setPassword(x);
          setErrorMessage('');
        }}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry={!showPassword}
        showSecureToggle
        onToggleSecure={() => setShowPassword((s) => !s)}
        iconIos="lock.fill"
        iconAndroid="lock"
        editable={!busy}
      />

      <AuthField
        label={t('auth.confirmPassword')}
        value={confirmPassword}
        onChangeText={(x) => {
          setConfirmPassword(x);
          setErrorMessage('');
        }}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry={!showConfirmPassword}
        showSecureToggle
        onToggleSecure={() => setShowConfirmPassword((s) => !s)}
        iconIos="lock.fill"
        iconAndroid="lock"
        editable={!busy}
      />

      <AuthPrimaryButton
        label={t('auth.createAccountCta')}
        onPress={handleSignup}
        loading={loading}
        disabled={googleLoading}
      />

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.back();
        }}
        disabled={busy}
      >
        <Text style={styles.switchMuted}>{t('auth.alreadyHaveAccount')} </Text>
        <Text style={styles.switchAccent}>{t('auth.signInLink')}</Text>
      </TouchableOpacity>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: '#fecaca',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  dividerLabel: {
    ...typography.small,
    color: 'rgba(148, 163, 184, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  switchMuted: {
    ...typography.body,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  switchAccent: {
    ...typography.bodyBold,
    color: 'rgba(94, 234, 212, 0.95)',
  },
});
