import React, { useCallback } from "react";
import { Pressable, Platform, StyleSheet, I18nManager } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";

/** Same title weight/size as mini-tab hub headers (Iman, etc.). */
export const MINI_TAB_STACK_HEADER_TITLE_STYLE = {
  fontWeight: "800" as const,
  fontSize: Platform.OS === "ios" ? 17 : 18,
  color: colors.text,
};

/** Tab roots for nested stacks under (tabs). */
export const TAB_ROOT_HREFS = {
  learning: "/(tabs)/(learning)/" as Href,
  iman: "/(tabs)/(iman)/" as Href,
  wellness: "/(tabs)/(wellness)/" as Href,
  profile: "/(tabs)/profile" as Href,
} as const;

export type MiniTabBackBehavior = "popToHub" | "popOnce";

/**
 * Uses native stack pop transitions (matches the back chevron) instead of
 * `replace`, which animates like a forward push.
 */
export function MiniTabBackButton({
  href,
  accessibilityLabel = "Back to tab home",
  behavior = "popToHub",
}: {
  href: Href;
  accessibilityLabel?: string;
  /** `popToHub`: pop mini-stack to `index`. `popOnce`: one step back (e.g. story → list). */
  behavior?: MiniTabBackBehavior;
}) {
  const router = useRouter();
  const navigation = useNavigation();

  const onPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (behavior === "popOnce") {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(href as Href);
      }
      return;
    }

    const routes = navigation.getState()?.routes as { name?: string }[] | undefined;
    const firstName = routes?.[0]?.name;
    const looksLikeParentTabNav =
      typeof firstName === "string" && firstName.startsWith("(");
    const looksLikeFileStackHub = firstName === "index";
    if (
      routes &&
      routes.length > 1 &&
      !looksLikeParentTabNav &&
      looksLikeFileStackHub
    ) {
      navigation.dispatch(StackActions.popToTop());
      return;
    }
    router.replace(href as Href);
  }, [behavior, href, navigation, router]);

  const rtl = I18nManager.isRTL;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{
        marginLeft: Platform.OS === "ios" ? 4 : 0,
        paddingVertical: 8,
        paddingRight: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <IconSymbol
        ios_icon_name={rtl ? "chevron.right" : "chevron.left"}
        android_material_icon_name="arrow-back"
        size={24}
        color={colors.text}
      />
    </Pressable>
  );
}

function prettifyRouteTitle(routeName: string): string {
  return routeName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Stack screenOptions: hide header on `index`, show native header elsewhere with
 * a back control that always returns to this mini-tab's root.
 */
export function miniTabStackScreenOptions(tabRootHref: Href) {
  return ({ route }: { route: { name: string } }): NativeStackNavigationOptions => {
    if (route.name === "index") {
      return {
        headerShown: false,
        animationTypeForReplace: "pop",
      };
    }
    return {
      headerShown: true,
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      },
      headerTintColor: colors.text,
      headerTitleStyle: MINI_TAB_STACK_HEADER_TITLE_STYLE,
      headerBackVisible: false,
      headerLeft: () => <MiniTabBackButton href={tabRootHref} />,
      title: prettifyRouteTitle(route.name),
      animationTypeForReplace: "pop",
    };
  };
}
