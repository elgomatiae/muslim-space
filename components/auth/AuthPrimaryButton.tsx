import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/styles/commonStyles';

const GRAD = ['#a78bfa', '#8b5cf6', '#14b8a6'] as const;

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
        colors={off ? (['#475569', '#475569'] as const) : GRAD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color="#f8fafc" />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    borderRadius: 16,
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
    color: '#f8fafc',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
