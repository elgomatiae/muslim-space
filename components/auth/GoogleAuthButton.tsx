import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '@/styles/commonStyles';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function GoogleAuthButton({ label, onPress, loading, disabled }: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        pressed && !off && styles.pressed,
        off && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#0f172a" />
      ) : (
        <View style={styles.row}>
          <Ionicons name="logo-google" size={22} color="#0f172a" />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.bodyBold,
    color: '#0f172a',
    fontSize: 16,
  },
});
