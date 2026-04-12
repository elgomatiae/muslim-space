import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, I18nManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/access/AccessGate";
import { markLearningSectionUnlocked } from "@/utils/learningSectionUnlock";
import { useTranslation } from "@/contexts/I18nContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TabHubHeader, TabHubHeaderIconDecoration } from "@/components/navigation/TabHubHeader";

interface LearningSection {
  titleKey: string;
  descKey: string;
  iosIcon: string;
  androidIcon: string;
  gradientColors: string[];
  route: string;
  accent: string;
  /** larger featured card */
  featured?: boolean;
}

export default function LearningScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const { showGate, gateVisible, onGateClose, onGateDismissOnly, onGateGranted } = useAccessGate();
  const isRTL = I18nManager.isRTL || locale === "ar" || locale === "ur";

  const scrollBottomSpacer = Math.max(120, insets.bottom + 150);

  const sections: LearningSection[] = [
    {
      titleKey: "learning.lecturesTitle",
      descKey: "learning.lecturesDesc",
      iosIcon: "play.rectangle.fill",
      androidIcon: "play-circle",
      gradientColors: colors.gradientPrimary,
      route: "/(tabs)/(learning)/lectures",
      accent: colors.primary,
      featured: true,
    },
    {
      titleKey: "learning.quizzesTitle",
      descKey: "learning.quizzesDesc",
      iosIcon: "questionmark.circle.fill",
      androidIcon: "quiz",
      gradientColors: colors.gradientInfo,
      route: "/(tabs)/(learning)/quizzes",
      accent: colors.info,
    },
    {
      titleKey: "learning.duasTitle",
      descKey: "learning.duasDesc",
      iosIcon: "book.pages.fill",
      androidIcon: "auto-stories",
      gradientColors: colors.gradientSecondary,
      route: "/(tabs)/(wellness)/mental-duas",
      accent: colors.secondary,
    },
  ];

  const featured = sections.find((s) => s.featured)!;
  const compact = sections.filter((s) => !s.featured);

  const handleSectionPress = async (section: LearningSection) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* optional */
    }

    if (!section.route) return;

    const gatedHubRoutes = ["/(tabs)/(learning)/lectures", "/(tabs)/(learning)/quizzes"] as const;
    if (gatedHubRoutes.includes(section.route as (typeof gatedHubRoutes)[number])) {
      showGate(() => {
        if (section.route === "/(tabs)/(learning)/lectures") {
          markLearningSectionUnlocked("lectures");
        } else {
          markLearningSectionUnlocked("quizzes");
        }
        router.push(section.route as any);
      });
      return;
    }

    router.push(section.route as any);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.flex}>
        {/* Soft ambient shapes */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobPurple]} />
          <View style={[styles.blob, styles.blobTeal]} />
          <View style={[styles.blob, styles.blobPink]} />
        </View>

        <TabHubHeader
          title={t("tabs.learning")}
          subtitle={t("learning.heroEyebrow")}
          left={
            <TabHubHeaderIconDecoration>
              <IconSymbol ios_icon_name="book.pages.fill" android_material_icon_name="menu-book" size={22} color={colors.primary} />
            </TabHubHeaderIconDecoration>
          }
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomSpacer },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{t("learning.sectionPaths")}</Text>

          {/* Featured — lectures */}
          <Pressable
            onPress={() => handleSectionPress(featured)}
            style={({ pressed }) => [styles.featuredWrap, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(255,255,255,0.25)" }}
          >
            <LinearGradient
              colors={featured.gradientColors as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredCard}
            >
              <View style={[styles.featuredTop, isRTL && styles.rowReverse]}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t("learning.featuredBadge")}</Text>
                </View>
                <View style={styles.featuredIconCircle}>
                  <IconSymbol
                    ios_icon_name={featured.iosIcon}
                    android_material_icon_name={featured.androidIcon as keyof typeof MaterialIcons.glyphMap}
                    size={28}
                    color="#fff"
                  />
                </View>
              </View>
              <Text style={styles.featuredTitle}>{t(featured.titleKey)}</Text>
              <Text style={styles.featuredDesc}>{t(featured.descKey)}</Text>
              <View style={[styles.featuredFooter, isRTL && styles.rowReverse]}>
                <Text style={styles.featuredCta}>{t("common.continue")}</Text>
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-circle-right"
                  size={26}
                  color="rgba(255,255,255,0.95)"
                />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Bento row — quizzes & duas */}
          <View style={[styles.bentoRow, isRTL && styles.rowReverse]}>
            {compact.map((section) => (
              <Pressable
                key={section.route}
                onPress={() => handleSectionPress(section)}
                style={({ pressed }) => [
                  styles.compactCard,
                  { borderTopColor: section.accent },
                  pressed && styles.pressedCard,
                ]}
                android_ripple={{ color: "rgba(139,92,246,0.12)" }}
              >
                <View style={[styles.compactIconWrap, { backgroundColor: `${section.accent}18` }]}>
                  <IconSymbol
                    ios_icon_name={section.iosIcon}
                    android_material_icon_name={section.androidIcon as keyof typeof MaterialIcons.glyphMap}
                    size={26}
                    color={section.accent}
                  />
                </View>
                <Text style={[styles.compactTitle, isRTL && styles.textRTL]} numberOfLines={2}>
                  {t(section.titleKey)}
                </Text>
                <Text style={[styles.compactDesc, isRTL && styles.textRTL]} numberOfLines={3}>
                  {t(section.descKey)}
                </Text>
                <View style={[styles.compactArrow, isRTL && styles.rowReverse]}>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Islamic stories — full width */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              showGate(() => {
                markLearningSectionUnlocked("stories");
                router.push("/(tabs)/(learning)/stories" as any);
              });
            }}
            style={({ pressed }) => [styles.storiesWide, pressed && styles.pressedCard]}
            android_ripple={{ color: "rgba(245, 158, 11, 0.15)" }}
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706", "#B45309"] as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storiesWideGradient}
            >
              <View style={[styles.storiesWideTop, isRTL && styles.rowReverse]}>
                <View style={styles.storiesIconCircle}>
                  <IconSymbol
                    ios_icon_name="text.book.closed.fill"
                    android_material_icon_name="auto-stories"
                    size={26}
                    color="#fff"
                  />
                </View>
                <View style={styles.storiesBadge}>
                  <Text style={styles.storiesBadgeText}>{t("learning.storiesBadge")}</Text>
                </View>
              </View>
              <Text style={styles.storiesWideTitle}>{t("learning.storiesTitle")}</Text>
              <Text style={styles.storiesWideDesc}>{t("learning.storiesDesc")}</Text>
              <View style={[styles.storiesWideFooter, isRTL && styles.rowReverse]}>
                <Text style={styles.storiesWideCta}>{t("common.continue")}</Text>
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-circle-right"
                  size={24}
                  color="rgba(255,255,255,0.95)"
                />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Allah names — full width */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              showGate(() => {
                markLearningSectionUnlocked("allah_names");
                router.push("/(tabs)/(learning)/allah-names" as any);
              });
            }}
            style={({ pressed }) => [styles.storiesWide, pressed && styles.pressedCard]}
            android_ripple={{ color: "rgba(14, 165, 233, 0.15)" }}
          >
            <LinearGradient
              colors={["#0EA5E9", "#0284C7", "#0369A1"] as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storiesWideGradient}
            >
              <View style={[styles.storiesWideTop, isRTL && styles.rowReverse]}>
                <View style={styles.storiesIconCircle}>
                  <IconSymbol
                    ios_icon_name="sparkles.rectangle.stack.fill"
                    android_material_icon_name="auto-awesome"
                    size={26}
                    color="#fff"
                  />
                </View>
                <View style={styles.storiesBadge}>
                  <Text style={styles.storiesBadgeText}>Asma ul Husna</Text>
                </View>
              </View>
              <Text style={styles.storiesWideTitle}>99 Names of Allah</Text>
              <Text style={styles.storiesWideDesc}>
                Meanings, definitions, and cited Qur'an and Hadith references for every Name.
              </Text>
              <View style={[styles.storiesWideFooter, isRTL && styles.rowReverse]}>
                <Text style={styles.storiesWideCta}>{t("common.continue")}</Text>
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-circle-right"
                  size={24}
                  color="rgba(255,255,255,0.95)"
                />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Quote — editorial card */}
          <View style={styles.quoteOuter}>
            <View style={styles.quoteAccentBar} />
            <View style={styles.quoteInner}>
              <IconSymbol
                ios_icon_name="quote.opening"
                android_material_icon_name="format-quote"
                size={22}
                color={colors.primaryLight}
              />
              <Text style={[styles.quoteText, isRTL && styles.textRTL]}>&ldquo;{t("learning.quote")}&rdquo;</Text>
              <Text style={[styles.quoteSource, isRTL && styles.textRTL]}>— {t("learning.quoteSource")}</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onDismissModalOnly={onGateDismissOnly}
        onAccessGranted={onGateGranted}
        title="Continue"
        description="Watch a short ad to open this section."
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
    opacity: 0.55,
  },
  blobPurple: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: "rgba(167, 139, 250, 0.35)",
  },
  blobTeal: {
    width: 200,
    height: 200,
    top: 120,
    left: -70,
    backgroundColor: "rgba(45, 212, 191, 0.22)",
  },
  blobPink: {
    width: 120,
    height: 120,
    top: 40,
    left: "38%",
    backgroundColor: "rgba(236, 72, 153, 0.12)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  featuredWrap: {
    borderRadius: borderRadius.xxxl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.colored,
  },
  featuredCard: {
    padding: spacing.xl,
    minHeight: 200,
    justifyContent: "space-between",
  },
  featuredTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  badgeText: {
    ...typography.smallBold,
    color: "#fff",
    letterSpacing: 0.5,
  },
  featuredIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredDesc: {
    ...typography.body,
    color: "rgba(255,255,255,0.92)",
    marginBottom: spacing.xl,
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredCta: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 17,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  bentoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  compactCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
    ...shadows.medium,
  },
  pressedCard: {
    opacity: 0.92,
  },
  compactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  compactTitle: {
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  compactDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  compactArrow: {
    marginTop: spacing.md,
    alignSelf: "flex-end",
  },
  storiesWide: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  storiesWideGradient: {
    padding: spacing.xl,
    minHeight: 160,
    justifyContent: "space-between",
  },
  storiesWideTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  storiesIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  storiesBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  storiesBadgeText: {
    ...typography.smallBold,
    color: "#fff",
    letterSpacing: 0.5,
  },
  storiesWideTitle: {
    ...typography.h4,
    color: "#fff",
    marginBottom: spacing.xs,
    fontSize: 22,
    fontWeight: "800",
  },
  storiesWideDesc: {
    ...typography.body,
    color: "rgba(255,255,255,0.92)",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  storiesWideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storiesWideCta: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 16,
  },
  quoteOuter: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quoteAccentBar: {
    width: 5,
    backgroundColor: colors.primary,
  },
  quoteInner: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  quoteText: {
    ...typography.h4,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: 28,
  },
  quoteSource: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
