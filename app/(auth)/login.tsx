import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { spacing, typography } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/contexts/I18nContext';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { getErrorMessage } from '@/utils/errorHandler';
import { AuthMarketingShell } from '@/components/auth/AuthMarketingShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { signInWithGoogle } from '@/utils/googleSignIn';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      const msg = t('auth.fillAllFields');
      setErrorMessage(msg);
      Alert.alert(t('common.error'), msg);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = getErrorMessage(error);
        setErrorMessage(msg);
        Alert.alert(t('auth.loginFailed'), msg);
        setLoading(false);
        return;
      }

      if (data.user) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setErrorMessage('');
        try {
          const usernameFromMeta =
            (data.user.user_metadata as { username?: string })?.username || email.trim().split('@')[0];
          await initializeUserProfile(data.user.id, usernameFromMeta, data.user.email ?? email.trim());
        } catch (profileError) {
          console.error('Profile init after login:', profileError);
        }
      }
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      setErrorMessage(msg);
      Alert.alert(t('auth.loginFailed'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(t('auth.emailRequired'), t('auth.enterEmailToReset'));
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: getAuthEmailRedirectTo(),
      });
      if (error) {
        Alert.alert(t('common.error'), getErrorMessage(error));
      } else {
        Alert.alert(t('auth.checkYourEmail'), t('auth.passwordResetSent'));
      }
    } catch (error: unknown) {
      Alert.alert(t('common.error'), getErrorMessage(error) || t('common.tryAgain'));
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
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
    >
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <GoogleAuthButton
        label={t('auth.continueWithGoogle')}
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
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        showSecureToggle
        onToggleSecure={() => setShowPassword((s) => !s)}
        autoComplete="password"
        iconIos="lock.fill"
        iconAndroid="lock"
        editable={!busy}
      />

      <Pressable onPress={handleForgotPassword} disabled={busy} style={styles.forgotWrap}>
        <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
      </Pressable>

      <AuthPrimaryButton label={t('auth.signIn')} onPress={handleLogin} loading={loading} disabled={googleLoading} />

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push('/(auth)/signup');
        }}
        disabled={busy}
      >
        <Text style={styles.switchMuted}>{t('auth.dontHaveAccount')} </Text>
        <Text style={styles.switchAccent}>{t('auth.signUp')}</Text>
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgot: {
    ...typography.captionBold,
    color: 'rgba(167, 139, 250, 0.95)',
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
