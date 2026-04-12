import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { spacing, typography } from '@/styles/commonStyles';

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  showSecureToggle?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  iconIos: string;
  iconAndroid: string;
  editable?: boolean;
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  showSecureToggle,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  iconIos,
  iconAndroid,
  editable = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <IconSymbol
          ios_icon_name={iconIos}
          android_material_icon_name={iconAndroid}
          size={20}
          color="rgba(167, 139, 250, 0.95)"
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(148, 163, 184, 0.75)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
        />
        {showSecureToggle ? (
          <TouchableOpacity onPress={onToggleSecure} hitSlop={12} disabled={!editable}>
            <IconSymbol
              ios_icon_name={secureTextEntry ? 'eye.fill' : 'eye.slash.fill'}
              android_material_icon_name={secureTextEntry ? 'visibility' : 'visibility-off'}
              size={20}
              color="rgba(148, 163, 184, 0.9)"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.smallBold,
    color: 'rgba(226, 232, 240, 0.85)',
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: '#f1f5f9',
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
  },
});
