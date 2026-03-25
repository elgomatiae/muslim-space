import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { useTranslation } from "@/contexts/I18nContext";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TabHubHeader, TabHubHeaderIconDecoration } from "@/components/navigation/TabHubHeader";

type WellnessTab = "mental" | "physical";

type LinkItem = {
  title: string;
  subtitle: string;
  icon: string;
  androidIcon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  route: string;
};

function HubLinkRow({
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

export default function WellnessScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { sectionScores } = useImanTracker();
  const [activeTab, setActiveTab] = useState<WellnessTab>("mental");

  const bottomPad = Math.max(100, insets.bottom + 88);

  const amanahScore = sectionScores.amanah || 0;

  const mentalLinks: LinkItem[] = useMemo(
    () => [
      {
        title: t("wellness.journal"),
        subtitle: t("wellness.journalSubtitle"),
        icon: "book.fill",
        androidIcon: "menu-book",
        tint: colors.primaryDark,
        route: "/(tabs)/(wellness)/journal",
      },
      {
        title: t("wellness.meditation"),
        subtitle: t("wellness.meditationSubtitle"),
        icon: "leaf.fill",
        androidIcon: "spa",
        tint: colors.secondaryDark,
        route: "/(tabs)/(wellness)/meditation",
      },
      {
        title: t("wellness.healingDuas"),
        subtitle: t("wellness.healingDuasSubtitle"),
        icon: "hands.sparkles.fill",
        androidIcon: "self-improvement",
        tint: "#7C3AED",
        route: "/(tabs)/(wellness)/mental-duas",
      },
      {
        title: t("wellness.support"),
        subtitle: t("wellness.supportSubtitle"),
        icon: "heart.fill",
        androidIcon: "favorite",
        tint: colors.accentDark,
        route: "/(tabs)/(wellness)/emotional-support",
      },
    ],
    [t]
  );

  const physicalLinks: LinkItem[] = useMemo(
    () => [
      {
        title: t("wellness.activity"),
        subtitle: t("wellness.activitySubtitle"),
        icon: "figure.mixed.cardio",
        androidIcon: "fitness-center",
        tint: colors.warningDark,
        route: "/(tabs)/(wellness)/activity-tracker",
      },
      {
        title: t("wellness.sleep"),
        subtitle: t("wellness.sleepSubtitle"),
        icon: "moon.stars.fill",
        androidIcon: "bedtime",
        tint: colors.secondaryDark,
        route: "/(tabs)/(wellness)/sleep-tracker",
      },
      {
        title: t("wellness.goals"),
        subtitle: t("wellness.goalsSubtitle"),
        icon: "target",
        androidIcon: "track-changes",
        tint: colors.info,
        route: "/(tabs)/(wellness)/physical-goals",
      },
      {
        title: t("wellness.history"),
        subtitle: t("wellness.historySubtitle"),
        icon: "chart.line.uptrend.xyaxis",
        androidIcon: "trending-up",
        tint: "#7C3AED",
        route: "/(tabs)/(wellness)/activity-history",
      },
    ],
    [t]
  );

  const activeLinks = activeTab === "mental" ? mentalLinks : physicalLinks;

  const handleTab = (tab: WellnessTab) => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const openRoute = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.flex}>
        <TabHubHeader
          title={t("tabs.wellness")}
          subtitle={t("wellness.hubTagline")}
          left={
            <TabHubHeaderIconDecoration>
              <IconSymbol ios_icon_name="heart.circle.fill" android_material_icon_name="favorite" size={22} color={colors.secondaryDark} />
            </TabHubHeaderIconDecoration>
          }
        />

        <View style={styles.tabPillWrap}>
          <View style={styles.tabPill}>
            <Pressable
              onPress={() => handleTab("mental")}
              style={[styles.tabPillSeg, activeTab === "mental" && styles.tabPillSegOn]}
            >
              <IconSymbol
                ios_icon_name="brain.head.profile"
                android_material_icon_name="psychology"
                size={18}
                color={activeTab === "mental" ? colors.primaryDark : colors.textSecondary}
              />
              <Text style={[styles.tabPillText, activeTab === "mental" && styles.tabPillTextOn]} numberOfLines={1}>
                {t("wellness.mentalHealth")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleTab("physical")}
              style={[styles.tabPillSeg, activeTab === "physical" && styles.tabPillSegOnPhysical]}
            >
              <IconSymbol
                ios_icon_name="figure.run"
                android_material_icon_name="directions-run"
                size={18}
                color={activeTab === "physical" ? colors.warningDark : colors.textSecondary}
              />
              <Text style={[styles.tabPillText, activeTab === "physical" && styles.tabPillTextOnPhysical]} numberOfLines={1}>
                {t("wellness.physicalHealth")}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.snapshot}>
            <Text style={styles.snapshotLabel}>{t("wellness.hubAmanah")}</Text>
            <View style={styles.snapshotScoreRow}>
              <Text style={styles.snapshotValue}>{Math.round(amanahScore)}</Text>
              <Text style={styles.snapshotPct}>%</Text>
            </View>
          </View>

          <View style={styles.groupCard}>
            {activeLinks.map((item, index) => (
              <View key={item.route}>
                <HubLinkRow
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  androidIcon={item.androidIcon}
                  tint={item.tint}
                  onPress={() => openRoute(item.route)}
                />
                {index < activeLinks.length - 1 ? <View style={styles.rowDivider} /> : null}
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.sourcesRow, pressed && { opacity: 0.92 }]}
            onPress={() => openRoute("/(tabs)/(wellness)/sources")}
            android_ripple={{ color: "rgba(20,184,166,0.12)" }}
          >
            <View style={[styles.sourcesIcon, { backgroundColor: colors.secondary + "22" }]}>
              <IconSymbol ios_icon_name="book.pages.fill" android_material_icon_name="menu-book" size={22} color={colors.secondaryDark} />
            </View>
            <Text style={styles.sourcesLabel}>{t("wellness.sourcesAndRefs")}</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.quoteCard}>
            <View style={styles.quoteAccent} />
            <View style={styles.quoteBody}>
              <Text style={styles.quoteText}>{t("wellness.quoteEase")}</Text>
              <Text style={styles.quoteRef}>{t("wellness.quoteEaseRef")}</Text>
            </View>
          </View>
        </ScrollView>
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
  tabPillWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  tabPillSegOnPhysical: {
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
  tabPillTextOnPhysical: {
    color: colors.warningDark,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  snapshot: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  snapshotScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  snapshotValue: {
    fontSize: Platform.OS === "ios" ? 44 : 40,
    fontWeight: "800",
    color: colors.secondaryDark,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  snapshotPct: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 2,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadows.small,
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
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.small,
  },
  sourcesIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sourcesLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  quoteCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  quoteAccent: {
    width: 4,
    backgroundColor: colors.secondary,
  },
  quoteBody: {
    flex: 1,
    padding: spacing.lg,
  },
  quoteText: {
    ...typography.body,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 22,
    fontWeight: "600",
  },
  quoteRef: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
