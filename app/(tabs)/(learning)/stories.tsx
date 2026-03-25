import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "@/contexts/I18nContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getAllIslamicStories,
  getStoriesByCategory,
  STORY_CATEGORY_LABEL,
  type StoryCategory,
} from "@/data/islamicStories";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/access/AccessGate";

type FilterKey = "all" | StoryCategory;

const CATEGORY_META: Record<
  StoryCategory,
  { gradient: readonly [string, string, string]; ios: string; android: keyof typeof MaterialIcons.glyphMap }
> = {
  prophet_muhammad: {
    gradient: ["#7C3AED", "#6D28D9", "#5B21B6"],
    ios: "moon.stars.fill",
    android: "nights-stay",
  },
  prophets: {
    gradient: ["#0EA5E9", "#0284C7", "#0369A1"],
    ios: "book.pages.fill",
    android: "menu-book",
  },
  sahaba: {
    gradient: ["#059669", "#047857", "#065F46"],
    ios: "person.3.fill",
    android: "groups",
  },
};

export default function StoriesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const isRTL = I18nManager.isRTL || locale === "ar" || locale === "ur";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { checkAccess, showGate, gateVisible, onGateClose, onGateGranted } = useAccessGate();

  const stories = useMemo(() => getAllIslamicStories(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (filter !== "all" && s.category !== filter) return false;
      if (!q) return true;
      const blob = `${s.title} ${s.tagline}`.toLowerCase();
      return blob.includes(q);
    });
  }, [stories, query, filter]);

  const featured = useMemo(() => {
    if (filtered.length === 0) return null;
    const d = new Date();
    const idx = (d.getDate() + d.getMonth() * 31 + filtered.length) % filtered.length;
    return filtered[idx];
  }, [filtered]);

  const categories: StoryCategory[] = ["prophet_muhammad", "prophets", "sahaba"];

  const onOpen = useCallback(
    async (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const hasAccess = await checkAccess();
      if (!hasAccess) {
        showGate(() => {
          router.push({
            pathname: "/(tabs)/(learning)/islamic-story",
            params: { id },
          } as Href);
        });
        return;
      }

      router.push({
        pathname: "/(tabs)/(learning)/islamic-story",
        params: { id },
      } as Href);
    },
    [router, checkAccess, showGate]
  );

  const onSurprise = useCallback(async () => {
    const pool = filtered.length > 0 ? filtered : stories;
    if (pool.length === 0) return;
    const i = Math.floor(Math.random() * pool.length);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await onOpen(pool[i].id);
  }, [filtered, stories, onOpen]);

  const bottomPad = Math.max(120, insets.bottom + 100);

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <View style={styles.flex}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
          <View style={[styles.blob, styles.blobC]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        >
          <View style={styles.heroText}>
            <Text style={[styles.eyebrow, isRTL && styles.textRTL]}>{t("learning.storiesHubEyebrow")}</Text>
            <Text style={[styles.heroTitle, isRTL && styles.textRTL]}>{t("learning.storiesHubTitle")}</Text>
            <Text style={[styles.heroSub, isRTL && styles.textRTL]}>{t("learning.storiesHubSubtitle")}</Text>
          </View>

          <View style={[styles.searchWrap, isRTL && styles.searchWrapRTL]}>
            <MaterialIcons name="search" size={22} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("learning.storiesSearchPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, isRTL && styles.textRTL]}
              returnKeyType="search"
              autoCorrect={false}
            />
          </View>

          <Pressable
            onPress={onSurprise}
            style={({ pressed }) => [styles.surpriseBtn, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={["#EC4899", "#DB2777", "#BE185D"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.surpriseGradient}
            >
              <IconSymbol
                ios_icon_name="shuffle"
                android_material_icon_name="shuffle"
                size={22}
                color="#fff"
              />
              <Text style={styles.surpriseText}>{t("learning.storiesSurprise")}</Text>
            </LinearGradient>
          </Pressable>

          {featured ? (
            <View style={styles.featuredSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("learning.storiesFeatured")}</Text>
              <Pressable
                onPress={() => void onOpen(featured.id)}
                style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={CATEGORY_META[featured.category].gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featuredGradient}
                >
                  <View style={[styles.featuredTop, isRTL && styles.rowReverse]}>
                    <View style={styles.featuredPill}>
                      <Text style={styles.featuredPillText}>{STORY_CATEGORY_LABEL[featured.category]}</Text>
                    </View>
                    <IconSymbol
                      ios_icon_name={CATEGORY_META[featured.category].ios}
                      android_material_icon_name={CATEGORY_META[featured.category].android}
                      size={32}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>
                  <Text style={[styles.featuredTitle, isRTL && styles.textRTL]} numberOfLines={3}>
                    {featured.title}
                  </Text>
                  <Text style={[styles.featuredTag, isRTL && styles.textRTL]} numberOfLines={2}>
                    {featured.tagline}
                  </Text>
                  <View style={[styles.featuredCtaRow, isRTL && styles.rowReverse]}>
                    <Text style={styles.featuredCta}>{t("learning.storiesStartJourney")}</Text>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={26}
                      color="rgba(255,255,255,0.95)"
                    />
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("learning.storiesPickPath")}</Text>
          <View style={[styles.portalRow, isRTL && styles.rowReverse]}>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = getStoriesByCategory(cat).length;
              const active = filter === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setFilter(active ? "all" : cat);
                  }}
                  style={({ pressed }) => [
                    styles.portal,
                    active && styles.portalActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient colors={meta.gradient} style={styles.portalIconBg}>
                    <IconSymbol
                      ios_icon_name={meta.ios}
                      android_material_icon_name={meta.android}
                      size={22}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text style={[styles.portalLabel, isRTL && styles.textRTL]} numberOfLines={2}>
                    {STORY_CATEGORY_LABEL[cat]}
                  </Text>
                  <Text style={styles.portalCount}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

          {filter === "all"
            ? categories.map((cat) => {
            const list = getStoriesByCategory(cat).filter((s) => {
              const q = query.trim().toLowerCase();
              if (!q) return true;
              return `${s.title} ${s.tagline}`.toLowerCase().includes(q);
            });

            if (list.length === 0) return null;

            return (
              <View key={cat} style={styles.railSection}>
                <View style={[styles.railHeader, isRTL && styles.rowReverse]}>
                  <Text style={[styles.railTitle, isRTL && styles.textRTL]}>
                    {STORY_CATEGORY_LABEL[cat]}
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setFilter(cat);
                    }}
                  >
                    <Text style={styles.railSeeAll}>{t("learning.storiesSeeAll")}</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.railScroll, isRTL && styles.rowReverse]}
                >
                  {list.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => void onOpen(item.id)}
                      style={({ pressed }) => [styles.railCard, pressed && styles.pressed]}
                    >
                      <LinearGradient
                        colors={CATEGORY_META[item.category].gradient}
                        style={styles.railCardAccent}
                      />
                      <Text style={[styles.railCardTitle, isRTL && styles.textRTL]} numberOfLines={3}>
                        {item.title}
                      </Text>
                      <Text style={[styles.railCardTag, isRTL && styles.textRTL]} numberOfLines={2}>
                        {item.tagline}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            );
          })
            : null}

          <View style={styles.gridSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
              {filter === "all"
                ? t("learning.storiesBrowseAll", { count: filtered.length })
                : t("learning.storiesInSection", { count: filtered.length })}
            </Text>
            <View style={[styles.grid, isRTL && styles.rowReverse]}>
              {filtered.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => void onOpen(item.id)}
                  style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.gridAccent,
                      { backgroundColor: CATEGORY_META[item.category].gradient[0] },
                    ]}
                  />
                  <Text style={[styles.gridTitle, isRTL && styles.textRTL]} numberOfLines={3}>
                    {item.title}
                  </Text>
                  <Text style={[styles.gridTag, isRTL && styles.textRTL]} numberOfLines={2}>
                    {item.tagline}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <IconSymbol
                ios_icon_name="book.closed"
                android_material_icon_name="menu-book"
                size={44}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, isRTL && styles.textRTL]}>{t("learning.storiesEmpty")}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onAccessGranted={onGateGranted}
        title="Unlock Islamic Stories"
        description="Watch a short ad to access Islamic stories for 24 hours"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
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
  blobA: {
    width: 260,
    height: 260,
    top: -60,
    right: -50,
    backgroundColor: "rgba(167, 139, 250, 0.35)",
  },
  blobB: {
    width: 180,
    height: 180,
    top: 120,
    left: -40,
    backgroundColor: "rgba(45, 212, 191, 0.2)",
  },
  blobC: {
    width: 120,
    height: 120,
    top: 40,
    left: "42%",
    backgroundColor: "rgba(236, 72, 153, 0.12)",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  heroText: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.captionBold,
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  searchWrapRTL: {
    flexDirection: "row-reverse",
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  surpriseBtn: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  surpriseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  surpriseText: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 17,
  },
  featuredSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuredCard: {
    borderRadius: borderRadius.xxxl,
    overflow: "hidden",
    ...shadows.colored,
  },
  featuredGradient: {
    padding: spacing.xl,
    minHeight: 200,
  },
  featuredTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  featuredPill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
  },
  featuredPillText: {
    ...typography.smallBold,
    color: "#fff",
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: spacing.sm,
    lineHeight: 30,
  },
  featuredTag: {
    ...typography.body,
    color: "rgba(255,255,255,0.9)",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  featuredCtaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredCta: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 16,
  },
  portalRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    justifyContent: "space-between",
  },
  portal: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  portalActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: `${colors.primary}08`,
  },
  portalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  portalLabel: {
    ...typography.captionBold,
    color: colors.text,
    textAlign: "center",
    fontSize: 11,
    minHeight: 32,
  },
  portalCount: {
    ...typography.smallBold,
    color: colors.textSecondary,
    marginTop: 4,
  },
  railSection: {
    marginBottom: spacing.xl,
  },
  railHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  railTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  railSeeAll: {
    ...typography.captionBold,
    color: colors.primary,
  },
  railScroll: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  railCard: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  railCardAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  railCardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 60,
  },
  railCardTag: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  gridSection: {
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  gridCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
    ...shadows.card,
  },
  gridAccent: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  gridTitle: {
    ...typography.captionBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
    minHeight: 54,
  },
  gridTag: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
