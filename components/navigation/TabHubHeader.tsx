import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { MINI_TAB_STACK_HEADER_TITLE_STYLE } from "@/components/navigation/miniTabStack";

const SIDE = 44;

/** Soft vertical wash — Iman / Learning / Wellness hub headers (pair with gradient layer). */
export const TAB_HUB_HEADER_GRADIENT_COLORS = [colors.card, "#F3EEFF"] as const;

/** Shell layout without vertical padding — use when animating `paddingVertical` (Iman). Pair with `TabHubHeaderGradientBackdrop`. */
export const tabHubHeaderShellBase: ViewStyle = {
  paddingHorizontal: spacing.md,
  overflow: "hidden",
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "rgba(139, 92, 246, 0.14)",
  ...shadows.small,
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

/** Same gradient stack as `TabHubHeader` — use under `tabHubHeaderShellBase` (e.g. Iman scroll header). */
export function TabHubHeaderGradientBackdrop() {
  return (
    <>
      <LinearGradient
        colors={[...TAB_HUB_HEADER_GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(20, 184, 166, 0.06)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </>
  );
}

export type TabHubHeaderRowProps = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** When set, title block scales on scroll (Iman). */
  titleScale?: Animated.AnimatedInterpolation<number>;
};

/**
 * Center title + optional subtitle, optional left/right slots (44×44).
 * Matches mini-stack native header typography (`MINI_TAB_STACK_HEADER_TITLE_STYLE`).
 */
export function TabHubHeaderRow({ title, subtitle, left, right, titleScale }: TabHubHeaderRowProps) {
  const subtitleLines = subtitle?.includes("\n") ? 2 : 1;

  const titleInner = (
    <Text style={[MINI_TAB_STACK_HEADER_TITLE_STYLE, styles.hubTitle]} numberOfLines={1}>
      {title}
    </Text>
  );

  return (
    <View style={styles.row}>
      <View style={styles.side}>{left ?? <View style={styles.sideSpacer} />}</View>

      <View style={styles.center}>
        {titleScale != null ? (
          <Animated.View style={[styles.titleWrap, { transform: [{ scale: titleScale }] }]}>{titleInner}</Animated.View>
        ) : (
          <View style={styles.titleWrap}>{titleInner}</View>
        )}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.side}>{right ?? <View style={styles.sideSpacer} />}</View>
    </View>
  );
}

export type TabHubHeaderProps = TabHubHeaderRowProps & {
  /** Default vertical padding inside shell. */
  paddingVertical?: number;
};

function TabHubHeaderSurface({ children, paddingVertical }: { children: React.ReactNode; paddingVertical: number }) {
  return (
    <View style={[tabHubHeaderShellBase, { paddingVertical }]}>
      <TabHubHeaderGradientBackdrop />
      {children}
    </View>
  );
}

export function TabHubHeader({ paddingVertical = 12, ...rowProps }: TabHubHeaderProps) {
  return (
    <TabHubHeaderSurface paddingVertical={paddingVertical}>
      <TabHubHeaderRow {...rowProps} />
    </TabHubHeaderSurface>
  );
}

/** Decorative 44×44 slot (same look as interactive hub icons). */
export function TabHubHeaderIconDecoration({ children }: { children: React.ReactNode }) {
  return <View style={styles.iconDecoration}>{children}</View>;
}

type IconPressProps = {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function TabHubHeaderIconButton({ children, onPress, style }: IconPressProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.iconDecoration, pressed && { opacity: 0.85 }, style]}
      android_ripple={{ color: "rgba(139,92,246,0.15)" }}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: SIDE,
    zIndex: 1,
  },
  side: {
    width: SIDE,
    alignItems: "center",
    justifyContent: "center",
  },
  sideSpacer: {
    width: SIDE,
    height: SIDE,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: spacing.xs,
  },
  titleWrap: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  hubTitle: {
    textAlign: "center",
    width: "100%",
    fontSize: Platform.OS === "ios" ? 19 : 20,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.small,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryDark,
    opacity: 0.88,
    textAlign: "center",
    marginTop: 3,
    width: "100%",
  },
  iconDecoration: {
    width: SIDE,
    height: SIDE,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.highlightPurple,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
});
