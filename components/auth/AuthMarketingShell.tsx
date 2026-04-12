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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { spacing, typography } from '@/styles/commonStyles';

const { width: W } = Dimensions.get('window');

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthMarketingShell({ eyebrow, title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#070b14', '#121c33', '#1a0f2e']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbTeal]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbViolet]} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(20,184,166,0.12)', 'transparent']}
        style={styles.vignetteTop}
        pointerEvents="none"
      />

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
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <BlurView intensity={50} tint="dark" style={styles.cardBlur}>
            <View style={styles.cardInner}>{children}</View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  flex: { flex: 1 },
  orb: {
    position: 'absolute',
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.5,
  },
  orbTeal: {
    top: -W * 0.35,
    right: -W * 0.25,
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
  },
  orbViolet: {
    bottom: -W * 0.4,
    left: -W * 0.35,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  vignetteTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 220,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'flex-end',
  },
  header: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.smallBold,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(94, 234, 212, 0.85)',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.md,
    color: 'rgba(248, 250, 252, 0.62)',
    lineHeight: 24,
    maxWidth: 340,
  },
  cardBlur: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardInner: {
    padding: spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
});
