import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';

/** Matches `colors.gradientPrimary` + teal handoff like rest of app CTAs */
const GRAD = colors.gradientOcean as unknown as readonly [string, string, string];
const DISABLED = [colors.borderDark, colors.textSecondary] as const;

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AuthPrimaryButton({ label, onPress, loading, disabled, style }: Props) {
  const off = !!disabled || !!loading;
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={off}
      style={[styles.touch, style]}
    >
      <LinearGradient
        colors={off ? DISABLED : GRAD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  grad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.bodyBold,
    color: colors.card,
    fontSize: 17,
    letterSpacing: 0.2,
  },
});
