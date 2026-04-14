import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles/commonStyles';

const { width: W } = Dimensions.get('window');

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Auth layout aligned with app theme (commonStyles): light surface, purple/teal accents.
 */
export function AuthMarketingShell({ eyebrow, title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[colors.background, colors.highlightPurple, colors.backgroundAlt]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbPurple]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbTeal]} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <LinearGradient
              colors={colors.gradientPrimary as unknown as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentRule}
            />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.card}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  orb: {
    position: 'absolute',
    width: W * 0.75,
    height: W * 0.75,
    borderRadius: W * 0.5,
  },
  orbPurple: {
    top: -W * 0.28,
    right: -W * 0.2,
    backgroundColor: 'rgba(139, 92, 246, 0.09)',
  },
  orbTeal: {
    bottom: -W * 0.32,
    left: -W * 0.25,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.smallBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  accentRule: {
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 24,
    maxWidth: 360,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
});
