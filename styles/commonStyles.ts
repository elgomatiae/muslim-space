
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // Light mode colors
  background: '#F8F8FF',        // Almost White
  backgroundAlt: '#F0F0F7',     // Slightly darker background
  text: '#212121',              // Dark Gray
  textSecondary: '#757575',     // Medium Gray
  primary: '#388E3C',           // Dark Green
  primaryLight: '#4CAF50',      // Lighter Green
  primaryDark: '#2E7D32',       // Darker Green
  secondary: '#A5D6A7',         // Light Green
  accent: '#FFC107',            // Amber
  accentDark: '#FFA000',        // Darker Amber
  card: '#FFFFFF',              // White
  cardAlt: '#FAFAFA',           // Off-white
  highlight: '#DCEDC8',         // Very Light Green
  success: '#4CAF50',           // Success Green
  error: '#F44336',             // Error Red
  warning: '#FF9800',           // Warning Orange
  info: '#2196F3',              // Info Blue
  border: '#E0E0E0',            // Light Border
  borderDark: '#BDBDBD',        // Darker Border
  shadow: 'rgba(0, 0, 0, 0.08)', // Subtle Shadow
  shadowDark: 'rgba(0, 0, 0, 0.15)', // Darker Shadow
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Gradient colors
  gradientPrimary: ['#388E3C', '#2E7D32'],
  gradientAccent: ['#FFC107', '#FFA000'],
  gradientInfo: ['#2196F3', '#1976D2'],
  gradientPurple: ['#9C27B0', '#7B1FA2'],
  gradientRed: ['#F44336', '#D32F2F'],
};

// Typography scale
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius scale
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Shadow styles
export const shadows = {
  small: {
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  large: {
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
    elevation: 4,
  },
  colored: {
    boxShadow: '0px 6px 16px rgba(56, 142, 60, 0.2)',
    elevation: 4,
  },
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    width: '100%',
    ...shadows.medium,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
