
import { StyleSheet, ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPhone 13 dimensions: 390 x 844
// Optimize spacing and sizing for smaller screens
const isSmallScreen = SCREEN_WIDTH < 400;

export const colors = {
  // Light mode colors - ENHANCED MODERN PURPLE/TEAL THEME
  background: '#FAFBFC',        // Soft off-white with subtle blue tint
  backgroundAlt: '#F4F5F7',     // Slightly darker background
  text: '#1A1F36',              // Deep Indigo (improved contrast)
  textSecondary: '#5A6C7D',     // Slate Gray (improved contrast)
  primary: '#8B5CF6',           // Vibrant Purple
  primaryLight: '#A78BFA',      // Lighter Purple
  primaryDark: '#7C3AED',       // Darker Purple
  secondary: '#14B8A6',         // Teal
  secondaryLight: '#2DD4BF',    // Light Teal
  secondaryDark: '#0D9488',     // Darker Teal
  accent: '#EC4899',            // Pink Accent
  accentDark: '#DB2777',        // Darker Pink
  card: '#FFFFFF',              // Pure White
  cardAlt: '#FEFEFF',           // Off-white with hint of blue
  highlight: '#F3F4F6',         // Subtle highlight (improved from purple)
  highlightPurple: '#EDE9FE',   // Purple highlight for special elements
  success: '#10B981',           // Success Green
  successDark: '#059669',       // Darker Success Green
  error: '#EF4444',             // Error Red
  errorBackground: '#FEE2E2',   // Light Error Background
  warning: '#F59E0B',           // Warning Amber
  warningLight: '#FEF3C7',      // Light Warning Background
  warningDark: '#D97706',       // Darker Warning Amber
  info: '#3B82F6',              // Info Blue
  border: '#E5E7EB',            // Light Border (improved contrast)
  borderDark: '#D1D5DB',        // Darker Border (improved contrast)
  shadow: 'rgba(139, 92, 246, 0.12)', // Purple-tinted Shadow (stronger)
  shadowDark: 'rgba(139, 92, 246, 0.25)', // Darker Purple Shadow (stronger)
  overlay: 'rgba(26, 31, 54, 0.6)', // Modal overlay (improved contrast)
  
  // Enhanced gradient colors - More vibrant and engaging
  gradientPrimary: ['#A78BFA', '#8B5CF6', '#7C3AED'],      // Purple gradient (3-color)
  gradientSecondary: ['#2DD4BF', '#14B8A6', '#0D9488'],    // Teal gradient (3-color)
  gradientAccent: ['#F472B6', '#EC4899', '#DB2777'],       // Pink gradient (3-color)
  gradientInfo: ['#60A5FA', '#3B82F6', '#2563EB'],         // Blue gradient (3-color)
  gradientPurple: ['#C4B5FD', '#A855F7', '#7C3AED'],       // Purple variant (3-color)
  gradientRed: ['#F87171', '#EF4444', '#DC2626'],          // Red gradient (3-color)
  gradientTeal: ['#34D399', '#14B8A6', '#0891B2'],         // Teal variant (3-color)
  gradientPink: ['#F9A8D4', '#EC4899', '#DB2777'],         // Pink variant (3-color)
  gradientSunset: ['#FB923C', '#F59E0B', '#EC4899'],       // Sunset gradient (3-color)
  gradientOcean: ['#2DD4BF', '#14B8A6', '#8B5CF6'],        // Ocean gradient (Teal to Purple, 3-color)
  gradientWarning: ['#FBBF24', '#F59E0B', '#D97706'],      // Warning gradient (Amber, 3-color)
  gradientSuccess: ['#34D399', '#10B981', '#059669'],      // Success gradient (Green, 3-color)
  gradientGold: ['#FCD34D', '#FBBF24', '#F59E0B'],         // New gold gradient
  gradientEmerald: ['#6EE7B7', '#34D399', '#10B981'],      // New emerald gradient
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

// Enhanced spacing scale - optimized for smaller screens with better rhythm
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: isSmallScreen ? 16 : 18,
  xl: isSmallScreen ? 20 : 24,
  xxl: isSmallScreen ? 24 : 28,
  xxxl: isSmallScreen ? 32 : 40,
  xxxxl: isSmallScreen ? 40 : 48,  // New extra large spacing
};

// Enhanced border radius scale for modern aesthetics
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,  // New larger radius for hero cards
  round: 999,
};

// Enhanced shadow styles with more depth and subtlety
export const shadows = {
  small: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  colored: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  // New subtle shadow for cards
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  // New emphasis shadow for important elements
  emphasis: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
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
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginVertical: spacing.sm,
    width: '100%',
    ...shadows.card,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
