
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import PrayerTimesWidget from "@/components/PrayerTimesWidget";

import { getDailyVerse, getDailyHadith, type DailyVerse, type DailyHadith } from "@/services/DailyContentService";
import DailyVerseWidget from "@/components/DailyVerseWidget";
import DailyHadithWidget from "@/components/DailyHadithWidget";
import AchievementsHomeWidget from "@/components/iman/AchievementsHomeWidget";
import { useAchievementCelebration } from "@/contexts/AchievementCelebrationContext";
import { checkAndUnlockAchievements } from "@/utils/achievementService";
import AllStreaksDisplay from "@/components/iman/AllStreaksDisplay";
import { TabHubHeader, TabHubHeaderIconDecoration } from "@/components/navigation/TabHubHeader";
import * as Haptics from "expo-haptics";

const CONTENT_MAX = 600;

/** On-gradient text (matches purple gradient headers elsewhere in the app). */
const ON_GRADIENT_MUTED = "rgba(255,255,255,0.78)";
const ON_GRADIENT_SUBTLE = "rgba(255,255,255,0.55)";

function localeTagFor(locale: string): string {
  const m: Record<string, string> = {
    ar: "ar-SA",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    tr: "tr-TR",
    ur: "ur-PK",
    id: "id-ID",
    ms: "ms-MY",
  };
  return m[locale] ?? "en-US";
}

type AndroidIconName = React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];

function SectionIndex({ n, title, subtitle }: { n: string; title: string; subtitle?: string }) {
  return (
    <View style={idxStyles.row}>
      <Text style={idxStyles.num}>{n}</Text>
      <View style={idxStyles.textCol}>
        <Text style={idxStyles.title}>{title}</Text>
        {subtitle ? <Text style={idxStyles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const idxStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  num: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textSecondary,
    opacity: 0.55,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
    minWidth: 28,
  },
  textCol: { flex: 1, minWidth: 0 },
  title: {
    ...typography.h4,
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});

export default function HomeScreen() {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshScores, imanScore } = useImanTracker();
  const { checkForUncelebratedAchievements } = useAchievementCelebration();

  const [refreshing, setRefreshing] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [contentLoading, setContentLoading] = useState(true);

  const tag = localeTagFor(locale);
  const contentWidth = useMemo(
    () => Math.min(CONTENT_MAX, Math.max(0, windowWidth - spacing.lg * 2)),
    [windowWidth]
  );
  const { currentDate, dateCompact } = useMemo(() => {
    const d = new Date();
    return {
      currentDate: d.toLocaleDateString(tag, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      dateCompact: d.toLocaleDateString(tag, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    };
  }, [tag]);

  const displayName = useMemo(() => {
    const meta = user?.user_metadata as { username?: string; full_name?: string } | undefined;
    const raw = meta?.full_name?.trim() || meta?.username?.trim();
    if (raw) return raw.split(/\s+/)[0];
    const email = user?.email?.split("@")[0];
    return email || "";
  }, [user]);

  useEffect(() => {
    loadDailyContent();
  }, []);

  const loadDailyContent = async () => {
    setContentLoading(true);
    try {
      const [verse, hadith] = await Promise.all([
        getDailyVerse(locale),
        getDailyHadith(locale),
      ]);
      setDailyVerse(verse);
      setDailyHadith(hadith);
    } catch (error) {
      console.error("Error loading daily content:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshScores(), loadDailyContent()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.id) {
      checkAchievementsAndCelebrate();
      checkForUncelebratedAchievements(user.id);
    }
  }, [user?.id]);

  const checkAchievementsAndCelebrate = async () => {
    if (!user?.id) return;
    try {
      await checkAndUnlockAchievements(user.id);
    } catch (error) {
      console.log("Error checking achievements:", error);
    }
  };

  const go = useCallback((path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, []);

  const scrollBottomSpacer = Math.max(120, insets.bottom + 150);
  const gutter = spacing.lg;

  const dock: { label: string; path: string; ios: string; android: AndroidIconName; dot: string }[] = [
    { label: t("tabs.iman"), path: "/(tabs)/(iman)", ios: "sparkles", android: "auto-awesome", dot: colors.primary },
    { label: t("tabs.wellness"), path: "/(tabs)/(wellness)", ios: "leaf.fill", android: "spa", dot: colors.secondary },
    { label: t("tabs.learning"), path: "/(tabs)/(learning)", ios: "book.fill", android: "menu-book", dot: colors.info },
    { label: t("tabs.profile"), path: "/(tabs)/profile", ios: "person.crop.circle.fill", android: "person", dot: colors.primaryDark },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.root, { paddingBottom: insets.bottom > 0 ? Math.min(insets.bottom, 8) : 4 }]}>
        <TabHubHeader
          title={t("tabs.home")}
          subtitle={dateCompact}
          left={
            <TabHubHeaderIconDecoration>
              <IconSymbol ios_icon_name="moon.stars.fill" android_material_icon_name="nightlight" size={22} color={colors.primary} />
            </TabHubHeaderIconDecoration>
          }
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollInner,
            {
              paddingBottom: scrollBottomSpacer,
              paddingHorizontal: gutter,
            },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={[styles.column, { maxWidth: contentWidth, alignSelf: "center", width: "100%" }]}>
            {/* —— Iman hero: same purple system as Iman tab / tracker —— */}
            <View style={styles.imanHero}>
              <LinearGradient
                colors={colors.gradientPrimary as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["rgba(255,255,255,0.14)", "transparent", "rgba(20,184,166,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.heroVeil} />
              <Text style={styles.heroKicker}>{currentDate.toUpperCase()}</Text>
              <Text style={styles.heroGreeting}>{t("home.greeting")}</Text>
              {displayName ? <Text style={styles.heroName}>{displayName}</Text> : null}
              <View style={styles.heroScoreRow}>
                <Text style={styles.heroScoreLabel}>{t("home.imanScore")}</Text>
                <Text style={styles.heroScoreValue}>{Math.round(imanScore)}</Text>
                <Text style={styles.heroScorePct}>%</Text>
              </View>
              <View style={styles.heroRingsFrame}>
                <ImanRingsDisplay embedded hideBreakdownToggle onRefresh={refreshScores} />
              </View>
              <Pressable
                style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.88 }]}
                onPress={() => go("/(tabs)/(iman)")}
                android_ripple={{ color: "rgba(255,255,255,0.12)" }}
              >
                <Text style={styles.heroCtaText}>{t("home.openFullTracker")}</Text>
                <IconSymbol ios_icon_name="arrow.up.right" android_material_icon_name="north-east" size={18} color={colors.card} />
              </Pressable>
            </View>

            {/* —— Dock —— */}
            <View style={styles.dockCard}>
              <Text style={styles.dockTitle}>{t("home.exploreHubs")}</Text>
              <View style={styles.dockRow}>
                {dock.map((d) => (
                  <TouchableOpacity key={d.path} style={styles.dockItem} activeOpacity={0.85} onPress={() => go(d.path)}>
                    <View style={[styles.dockGlyph, { borderColor: d.dot + "40" }]}>
                      <View style={[styles.dockDot, { backgroundColor: d.dot }]} />
                      <IconSymbol ios_icon_name={d.ios} android_material_icon_name={d.android} size={22} color={colors.primaryDark} />
                    </View>
                    <Text style={styles.dockLabel} numberOfLines={2}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* —— 01 Prayer —— */}
            <View style={styles.sectionBlock}>
              <SectionIndex n="01" title={t("home.todaySection")} subtitle={t("prayer.prayerTimes")} />
              <View style={[styles.surfaceCard, styles.accentPrayer]}>
                <PrayerTimesWidget />
              </View>
            </View>

            {/* —— 02 Streaks —— */}
            <View style={styles.sectionBlock}>
              <SectionIndex n="02" title={t("home.yourStreaks")} subtitle={t("home.progressPulse")} />
              <View style={[styles.surfaceCard, styles.accentStreaks]}>
                <AllStreaksDisplay />
              </View>
            </View>

            {/* —— 03 Achievements —— */}
            <View style={styles.sectionBlock}>
              <SectionIndex n="03" title={t("home.achievements")} />
              <View style={[styles.surfaceCard, styles.accentAchieve]}>
                <AchievementsHomeWidget />
              </View>
            </View>

            {/* —— 04 Guidance —— */}
            <View style={styles.sectionBlock}>
              <SectionIndex n="04" title={t("home.dailyGuidance")} />
              <View style={styles.guidanceBlock}>
                <DailyVerseWidget verse={dailyVerse} loading={contentLoading} />
                <View style={styles.guidanceSpacer} />
                <DailyHadithWidget hadith={dailyHadith} loading={contentLoading} />
              </View>
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },
  column: {
    gap: 0,
  },
  imanHero: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
    ...shadows.emphasis,
    shadowColor: colors.shadowDark,
  },
  heroVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: ON_GRADIENT_SUBTLE,
    marginBottom: spacing.sm,
  },
  heroGreeting: {
    fontSize: 15,
    fontWeight: "600",
    color: ON_GRADIENT_MUTED,
  },
  heroName: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.card,
    letterSpacing: -1,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  heroScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: spacing.md,
  },
  heroScoreLabel: {
    ...typography.caption,
    color: ON_GRADIENT_MUTED,
    fontWeight: "600",
    marginRight: 4,
  },
  heroScoreValue: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.card,
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
  },
  heroScorePct: {
    fontSize: 20,
    fontWeight: "700",
    color: ON_GRADIENT_MUTED,
  },
  heroRingsFrame: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  heroCta: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroCtaText: {
    ...typography.bodyBold,
    color: colors.card,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dockCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl + spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dockTitle: {
    ...typography.captionBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  dockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dockItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  dockGlyph: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.highlight,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    position: "relative",
  },
  dockDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dockLabel: {
    ...typography.small,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    lineHeight: 13,
  },
  sectionBlock: {
    marginBottom: spacing.xl + spacing.sm,
  },
  surfaceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  accentPrayer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  accentStreaks: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  accentAchieve: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  guidanceBlock: {},
  guidanceSpacer: {
    height: spacing.md,
  },
});
