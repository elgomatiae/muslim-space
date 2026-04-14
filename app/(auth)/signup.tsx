import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';
import {
  resendSignupConfirmationEmail,
  shouldAttemptSignupConfirmationResend,
} from '@/utils/authSignupResend';
import * as Haptics from 'expo-haptics';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { useTranslation } from '@/contexts/I18nContext';
import { getErrorMessage } from '@/utils/errorHandler';
import { AuthMarketingShell } from '@/components/auth/AuthMarketingShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        if (shouldAttemptSignupConfirmationResend(error)) {
          const { error: resendError } = await resendSignupConfirmationEmail(email);
          if (!resendError) {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setErrorMessage('');
            Alert.alert(t('auth.confirmYourEmail'), undefined, [
              { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
            ]);
            setLoading(false);
            return;
          }
        }
        const msg = getErrorMessage(error);
        setErrorMessage(msg);
        Alert.alert(t('auth.signupFailed'), msg);
        setLoading(false);
        return;
      }

      if (data.user) {
        setErrorMessage('');

        // With "Confirm email" on, duplicate signup returns no error but an obfuscated user
        // with identities: []. No confirmation email is sent again unless we resend explicitly.
        const identities = data.user.identities;
        const looksLikeDuplicateEmail =
          !data.session &&
          (!identities || identities.length === 0);

        if (looksLikeDuplicateEmail) {
          const { error: resendError } = await resendSignupConfirmationEmail(email);
          if (!resendError) {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert(t('auth.confirmYourEmail'), undefined, [
              { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
            ]);
            setLoading(false);
            return;
          }
          Alert.alert(t('auth.signupFailed'), getErrorMessage(resendError) || t('auth.unexpectedError'));
          setLoading(false);
          return;
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

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
          Alert.alert(t('auth.confirmYourEmail'), undefined, [
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
        editable={!loading}
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
        editable={!loading}
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
        editable={!loading}
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
        editable={!loading}
      />

      <AuthPrimaryButton
        label={t('auth.createAccountCta')}
        onPress={handleSignup}
        loading={loading}
      />

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.back();
        }}
        disabled={loading}
      >
        <Text style={styles.switchMuted}>{t('auth.alreadyHaveAccount')} </Text>
        <Text style={styles.switchAccent}>{t('auth.signInLink')}</Text>
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
