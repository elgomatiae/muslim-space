import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/contexts/I18nContext';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { getErrorMessage } from '@/utils/errorHandler';
import { AuthMarketingShell } from '@/components/auth/AuthMarketingShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        editable={!loading}
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
        editable={!loading}
      />

      <Pressable onPress={handleForgotPassword} disabled={loading} style={styles.forgotWrap}>
        <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
      </Pressable>

      <AuthPrimaryButton label={t('auth.signIn')} onPress={handleLogin} loading={loading} />

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push('/(auth)/signup');
        }}
        disabled={loading}
      >
        <Text style={styles.switchMuted}>{t('auth.dontHaveAccount')} </Text>
        <Text style={styles.switchAccent}>{t('auth.signUp')}</Text>
      </TouchableOpacity>
    </AuthMarketingShell>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgot: {
    ...typography.captionBold,
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  switchMuted: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchAccent: {
    ...typography.bodyBold,
    color: colors.secondaryDark,
  },
});
