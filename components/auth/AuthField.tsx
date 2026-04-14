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
import { colors, spacing, typography, borderRadius } from '@/styles/commonStyles';

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
        <View style={styles.iconCol}>
          <IconSymbol
            ios_icon_name={iconIos}
            android_material_icon_name={iconAndroid}
            size={20}
            color={colors.primary}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          underlineColorAndroid="transparent"
        />
        {showSecureToggle ? (
          <View style={styles.iconCol}>
            <TouchableOpacity onPress={onToggleSecure} hitSlop={12} disabled={!editable}>
              <IconSymbol
                ios_icon_name={secureTextEntry ? 'eye.fill' : 'eye.slash.fill'}
                android_material_icon_name={secureTextEntry ? 'visibility' : 'visibility-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
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
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    minHeight: Platform.OS === 'ios' ? 58 : 60,
    overflow: 'visible',
  },
  iconCol: {
    justifyContent: 'center',
    minWidth: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    /* Omit lineHeight: fixed lineHeight on single-line TextInput often clips descenders (g, y, p). */
    color: colors.text,
    paddingTop: Platform.OS === 'ios' ? 2 : 2,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    marginTop: 0,
    marginBottom: 0,
    minHeight: Platform.OS === 'ios' ? 36 : 40,
  },
});
