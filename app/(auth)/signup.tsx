
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { initializeUserProfile } from '@/utils/profileSupabaseSync';
import { useTranslation } from '@/contexts/I18nContext';

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
    // Clear any previous error messages
    setErrorMessage('');

    if (!username || !email || !password || !confirmPassword) {
      const errorMsg = t('auth.fillAllFields');
      setErrorMessage(errorMsg);
      Alert.alert(t('common.error'), errorMsg);
      return;
    }

    if (password !== confirmPassword) {
      const errorMsg = t('auth.passwordsDoNotMatch');
      setErrorMessage(errorMsg);
      Alert.alert(t('common.error'), errorMsg);
      return;
    }

    if (password.length < 6) {
      const errorMsg = t('auth.passwordMinLength');
      setErrorMessage(errorMsg);
      Alert.alert(t('common.error'), errorMsg);
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        console.log('Signup error:', error);
        
        // Use error handler for user-friendly messages
        const { getErrorMessage } = require('@/utils/errorHandler');
        const errorMessage = getErrorMessage(error);
        
        setErrorMessage(errorMessage);
        Alert.alert(t('auth.signupFailed'), errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('Signup successful:', data.user.id);
        console.log('Username from form:', username.trim());

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Clear error message on success
        setErrorMessage('');

        // If Supabase returned a session, the user is already signed in and RLS permits profile upserts.
        // If email confirmation is required, `data.session` will be null; in that case we must NOT
        // attempt to write to `profiles` yet, because `auth.uid()` is null and RLS will reject it.
        if (!data.session) {
          Alert.alert(
            t('auth.verifyYourEmail'),
            t('auth.verificationEmailSent'),
            [
              {
                text: t('common.ok'),
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
        } else {
          // Now that we have an authenticated session, initialize/update the profile row.
          try {
            console.log('📝 Initializing user profile in Supabase...');
            await initializeUserProfile(
              data.user.id,
              username.trim(),
              email.trim()
            );
            console.log('✅ Profile initialized');
          } catch (profileError) {
            console.error('⚠️ Error initializing profile (non-critical):', profileError);
            // Continue: profile will also be initialized on login via AuthContext.
          }

          // Navigation is normally handled by AuthContext, but we can also move the user forward.
          try {
            // Keep route consistent with other parts of the app/AuthContext
            router.replace('/(tabs)/(home)/');
          } catch (navError) {
            console.error('Navigation error after signup:', navError);
          }
        }

        setLoading(false);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMsg = t('auth.unexpectedError');
      setErrorMessage(errorMsg);
      Alert.alert(t('common.error'), errorMsg);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <IconSymbol
              ios_icon_name="person.badge.plus.fill"
              android_material_icon_name="person-add"
              size={60}
              color={colors.card}
            />
          </LinearGradient>
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.joinUs')}</Text>
        </View>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={20}
                color={colors.error}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.primary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('auth.username')}
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrorMessage(''); // Clear error when user starts typing
              }}
              autoCapitalize="none"
              editable={!loading}
              textAlignVertical="center"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={colors.primary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage(''); // Clear error when user starts typing
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              textAlignVertical="center"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.primary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage(''); // Clear error when user starts typing
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                android_material_icon_name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.primary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrorMessage(''); // Clear error when user starts typing
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
                android_material_icon_name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? [colors.textSecondary, colors.textSecondary] : colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signupButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.signupButtonText}>{t('auth.createAccount')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>
              {t('auth.alreadyHaveAccount')} <Text style={styles.loginButtonTextBold}>{t('auth.signInLink')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground || '#fee',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  inputIconContainer: {
    paddingLeft: spacing.lg,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    minHeight: 56,
    textAlignVertical: 'center',
  },
  eyeIcon: {
    paddingRight: spacing.lg,
  },
  signupButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    ...typography.h4,
    color: colors.card,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginButtonTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
