
import { StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPhone 13 dimensions: 390 x 844
// Optimize spacing and sizing for smaller screens
const isSmallScreen = SCREEN_WIDTH < 400;

export const colors = {
  // Light mode colors - ENHANCED MODERN PURPLE/TEAL THEME
  background: '#F8F9FD',        // Soft Lavender-Gray
  backgroundAlt: '#EEF0F8',     // Slightly darker background
  text: '#1E1B4B',              // Deep Indigo
  textSecondary: '#64748B',     // Slate Gray
  primary: '#8B5CF6',           // Vibrant Purple
  primaryLight: '#A78BFA',      // Lighter Purple
  primaryDark: '#7C3AED',       // Darker Purple
  secondary: '#14B8A6',         // Teal
  secondaryLight: '#2DD4BF',    // Light Teal
  secondaryDark: '#0D9488',     // Darker Teal
  accent: '#EC4899',            // Pink Accent
  accentDark: '#DB2777',        // Darker Pink
  card: '#FFFFFF',              // White
  cardAlt: '#FAFBFF',           // Off-white with hint of blue
  highlight: '#EDE9FE',         // Very Light Purple
  success: '#10B981',           // Success Green
  successDark: '#059669',       // Darker Success Green
  error: '#EF4444',             // Error Red
  errorBackground: '#FEE2E2',   // Light Error Background
  warning: '#F59E0B',           // Warning Amber
  warningLight: '#FEF3C7',      // Light Warning Background
  warningDark: '#D97706',       // Darker Warning Amber
  info: '#3B82F6',              // Info Blue
  border: '#E2E8F0',            // Light Border
  borderDark: '#CBD5E1',        // Darker Border
  shadow: 'rgba(139, 92, 246, 0.1)', // Purple-tinted Shadow
  shadowDark: 'rgba(139, 92, 246, 0.2)', // Darker Purple Shadow
  overlay: 'rgba(30, 27, 75, 0.5)', // Modal overlay
  
  // Gradient colors - Enhanced with new theme
  gradientPrimary: ['#8B5CF6', '#7C3AED'],      // Purple gradient
  gradientSecondary: ['#14B8A6', '#0D9488'],    // Teal gradient
  gradientAccent: ['#EC4899', '#DB2777'],       // Pink gradient
  gradientInfo: ['#3B82F6', '#2563EB'],         // Blue gradient
  gradientPurple: ['#A855F7', '#7C3AED'],       // Purple variant
  gradientRed: ['#EF4444', '#DC2626'],          // Red gradient
  gradientTeal: ['#14B8A6', '#0891B2'],         // Teal variant
  gradientPink: ['#EC4899', '#DB2777'],         // Pink variant
  gradientSunset: ['#F59E0B', '#EC4899'],       // Sunset gradient
  gradientOcean: ['#14B8A6', '#8B5CF6'],        // Ocean gradient (Teal to Purple)
  gradientWarning: ['#F59E0B', '#D97706'],      // Warning gradient (Amber)
  gradientSuccess: ['#10B981', '#059669'],      // Success gradient (Green)
};

// Typography scale - optimized for smaller screens
export const typography = {
  h1: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '800' as const,
    lineHeight: isSmallScreen ? 36 : 40,
  },
  h2: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '700' as const,
    lineHeight: isSmallScreen ? 32 : 36,
  },
  h3: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700' as const,
    lineHeight: isSmallScreen ? 28 : 32,
  },
  h4: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600' as const,
    lineHeight: isSmallScreen ? 24 : 28,
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

// Spacing scale - optimized for smaller screens
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: isSmallScreen ? 14 : 16,
  xl: isSmallScreen ? 18 : 20,
  xxl: isSmallScreen ? 20 : 24,
  xxxl: isSmallScreen ? 26 : 32,
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
    boxShadow: '0px 2px 8px rgba(139, 92, 246, 0.08)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 12px rgba(139, 92, 246, 0.12)',
    elevation: 3,
  },
  large: {
    boxShadow: '0px 6px 16px rgba(139, 92, 246, 0.16)',
    elevation: 4,
  },
  colored: {
    boxShadow: '0px 6px 20px rgba(139, 92, 246, 0.25)',
    elevation: 5,
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
