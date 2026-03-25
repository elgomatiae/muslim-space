import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "@/contexts/I18nContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  TabHubHeaderRow,
  tabHubHeaderShellBase,
  TabHubHeaderIconButton,
  TabHubHeaderGradientBackdrop,
} from "@/components/navigation/TabHubHeader";

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import IbadahSection from "./ibadah-section";
import IlmSection from "./ilm-section";
import AmanahSection from "./amanah-section";
import AchievementsBadges from "@/components/iman/AchievementsBadges";

type TabType = "tracker" | "achievements";

function QuickLinkRow({
  title,
  subtitle,
  icon,
  androidIcon,
  tint,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  androidIcon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.92 }]}
      android_ripple={{ color: "rgba(139,92,246,0.08)" }}
    >
      <View style={[styles.linkIcon, { backgroundColor: tint + "22" }]}>
        <IconSymbol ios_icon_name={icon} android_material_icon_name={androidIcon} size={22} color={tint} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.linkSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function ImanTrackerScreen() {
  const { refreshScores } = useImanTracker();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("tracker");
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const scrollBottomSpacer = Math.max(120, insets.bottom + 150);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false });

  const headerPadV = scrollY.interpolate({
    inputRange: [0, 56],
    outputRange: [10, 4],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, 72],
    outputRange: [1, 0.94],
    extrapolate: "clamp",
  });
  const tabMarginBottom = scrollY.interpolate({
    inputRange: [0, 48],
    outputRange: [12, 6],
    extrapolate: "clamp",
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshScores();
    setRefreshing(false);
  }, [refreshScores]);

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const open = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.flex}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobPurple]} />
          <View style={[styles.blob, styles.blobTeal]} />
          <View style={[styles.blob, styles.blobPink]} />
        </View>

        <Animated.View style={[tabHubHeaderShellBase, { paddingVertical: headerPadV, zIndex: 1 }]}>
          <TabHubHeaderGradientBackdrop />
          <TabHubHeaderRow
            title={t("iman.hubTitle")}
            subtitle={t("home.imanTrackerSubtitle")}
            titleScale={titleScale}
            left={
              <TabHubHeaderIconButton onPress={() => open("/(tabs)/(iman)/activity")}>
                <IconSymbol ios_icon_name="list.bullet.clipboard.fill" android_material_icon_name="assignment" size={22} color={colors.primary} />
              </TabHubHeaderIconButton>
            }
            right={
              <TabHubHeaderIconButton onPress={() => open("/(tabs)/(iman)/communities")}>
                <IconSymbol ios_icon_name="person.3.fill" android_material_icon_name="groups" size={22} color={colors.primary} />
              </TabHubHeaderIconButton>
            }
          />
        </Animated.View>

        <Animated.View style={[styles.tabPillWrap, { marginBottom: tabMarginBottom }]}>
          <View style={styles.tabPill}>
            <Pressable
              onPress={() => handleTabChange("tracker")}
              style={[styles.tabPillSeg, activeTab === "tracker" && styles.tabPillSegOn]}
            >
              <IconSymbol
                ios_icon_name="chart.pie.fill"
                android_material_icon_name="pie-chart"
                size={18}
                color={activeTab === "tracker" ? colors.primaryDark : colors.textSecondary}
              />
              <Text style={[styles.tabPillText, activeTab === "tracker" && styles.tabPillTextOn]} numberOfLines={1}>
                {t("iman.tabTracker")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleTabChange("achievements")}
              style={[styles.tabPillSeg, activeTab === "achievements" && styles.tabPillSegOnAchievements]}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={18}
                color={activeTab === "achievements" ? colors.warningDark : colors.textSecondary}
              />
              <Text style={[styles.tabPillText, activeTab === "achievements" && styles.tabPillTextOnAchievements]} numberOfLines={1}>
                {t("iman.tabAchievements")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }}>
          {activeTab === "tracker" && (
            <Animated.ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomSpacer }]}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onScroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
              <ImanRingsDisplay onRefresh={onRefresh} />

              <Text style={styles.sectionLabel}>{t("iman.shortcuts")}</Text>

              <View style={styles.groupCard}>
                <QuickLinkRow
                  title={t("iman.qaActivity")}
                  subtitle={t("iman.qaActivityHint")}
                  icon="list.bullet.clipboard.fill"
                  androidIcon="assignment"
                  tint={colors.primaryDark}
                  onPress={() => open("/(tabs)/(iman)/activity")}
                />
                <View style={styles.rowDivider} />
                <QuickLinkRow
                  title={t("iman.qaTrends")}
                  subtitle={t("iman.qaTrendsHint")}
                  icon="chart.line.uptrend.xyaxis"
                  androidIcon="trending-up"
                  tint={colors.warningDark}
                  onPress={() => open("/(tabs)/(iman)/trends")}
                />
                <View style={styles.rowDivider} />
                <QuickLinkRow
                  title={t("iman.qaGoals")}
                  subtitle={t("iman.qaGoalsHint")}
                  icon="target"
                  androidIcon="flag"
                  tint={colors.successDark}
                  onPress={() => open("/(tabs)/(iman)/goals-settings")}
                />
              </View>

              <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t("iman.sectionGoals")}</Text>

              <IbadahSection />
              <IlmSection />
              <AmanahSection />
            </Animated.ScrollView>
          )}

          {activeTab === "achievements" && (
            <Animated.ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomSpacer }]}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onScroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
              <View style={styles.achievementsFrame}>
                <AchievementsBadges />
              </View>
            </Animated.ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.45,
  },
  blobPurple: {
    width: 240,
    height: 240,
    top: -60,
    right: -45,
    backgroundColor: "rgba(167, 139, 250, 0.28)",
  },
  blobTeal: {
    width: 170,
    height: 170,
    top: 90,
    left: -55,
    backgroundColor: "rgba(45, 212, 191, 0.18)",
  },
  blobPink: {
    width: 100,
    height: 100,
    top: 28,
    left: "36%",
    backgroundColor: "rgba(236, 72, 153, 0.08)",
  },
  tabPillWrap: {
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  tabPill: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.round,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
    gap: 4,
  },
  tabPillSeg: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.round,
  },
  tabPillSegOn: {
    backgroundColor: colors.highlightPurple,
  },
  tabPillSegOnAchievements: {
    backgroundColor: colors.warningLight,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    flexShrink: 1,
  },
  tabPillTextOn: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  tabPillTextOnAchievements: {
    color: colors.warningDark,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  sectionLabelSpaced: {
    marginTop: spacing.lg,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  linkCopy: {
    flex: 1,
    minWidth: 0,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  linkSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 44 + spacing.md * 2,
  },
  achievementsFrame: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
});
