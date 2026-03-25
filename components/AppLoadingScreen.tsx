import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing } from '@/styles/commonStyles';

const LOGO = require('../assets/images/app-icon.png');

type Props = {
  /** Shown under the app name (e.g. “Checking your session…”). */
  message?: string;
};

export function AppLoadingScreen({ message }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const appName = Constants.expoConfig?.name ?? 'Muslim-Space';

  const breath = useSharedValue(1);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [breath]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  const gradientColors = isDark
    ? (['#0B0F1A', '#111827', '#1E1B4B'] as const)
    : (['#FFFFFF', '#F5F3FF', '#EEF2FF'] as const);

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.inner}>
        <Animated.View style={[styles.logoCard, logoAnimatedStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Text style={[styles.title, isDark && styles.titleDark]}>{appName}</Text>
        <Text style={[styles.tagline, isDark && styles.taglineDark]}>
          Faith, learning & wellness in one place
        </Text>

        <View style={styles.loaderRow}>
          <ActivityIndicator
            size="small"
            color={isDark ? colors.secondaryLight : colors.primary}
          />
          <Text style={[styles.status, isDark && styles.statusDark]}>
            {message ?? 'Preparing your experience…'}
          </Text>
        </View>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const LOGO_SIZE = Platform.OS === 'web' ? 120 : 132;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCard: {
    width: LOGO_SIZE + 28,
    height: LOGO_SIZE + 28,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: spacing.lg,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 20,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleDark: {
    color: '#F8FAFC',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
    lineHeight: 22,
  },
  taglineDark: {
    color: '#94A3B8',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl * 1.25,
    gap: spacing.md,
  },
  status: {
    ...typography.small,
    color: colors.textSecondary,
    maxWidth: 260,
  },
  statusDark: {
    color: '#94A3B8',
  },
});
