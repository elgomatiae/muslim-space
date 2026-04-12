import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  BackHandler,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, useFocusEffect, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { WELCOME_TOUR_CHAPTERS, type WelcomeTourChapterId } from "@/constants/welcomeTourChapters";
import { WELCOME_TOUR_ACCENTS } from "@/constants/welcomeTourAccents";
import { setWelcomeTourAcknowledged } from "@/utils/welcomeTourStorage";
import { WelcomeTourGoalsSetup } from "@/components/welcome-tour/WelcomeTourGoalsSetup";
import { IconSymbol } from "@/components/IconSymbol";
import { FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM } from "@/components/FloatingTabBar";
import { BANNER_AD_MAX_HEIGHT } from "@/components/ads/BannerAdBar";

const NS = "welcomeMuslimSpace";

/** Sit nav row just above the tab-stack banner ad (same stack as Tabs layout). */
function footerPaddingBottomAboveBanner(insetsBottom: number): number {
  if (Platform.OS === "web") {
    return Math.max(insetsBottom, spacing.lg);
  }
  return FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM + BANNER_AD_MAX_HEIGHT + spacing.sm;
}

function collectBullets(t: (k: string) => string, chapterId: WelcomeTourChapterId): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `${NS}.chapters.${chapterId}.b${i}`;
    const v = t(key);
    if (v === key) break;
    out.push(v);
  }
  return out;
}

function chapterHeroIcon(id: WelcomeTourChapterId): {
  ios: string;
  android: React.ComponentProps<typeof IconSymbol>["android_material_icon_name"];
} {
  switch (id) {
    case "welcome":
      return { ios: "moon.stars.fill", android: "nights-stay" };
    case "imanTracker":
      return { ios: "chart.pie.fill", android: "pie-chart" };
    case "goalSetup":
      return { ios: "target", android: "track-changes" };
    case "resources":
      return { ios: "sparkles", android: "auto-awesome" };
    default:
      return { ios: "star.fill", android: "star" };
  }
}

export default function WelcomeMuslimSpaceScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ gate?: string }>();
  const gate = params.gate === "1";

  const [index, setIndex] = useState(0);
  const [goalsSetupComplete, setGoalsSetupComplete] = useState(false);

  const onGoalsSetupValidity = useCallback((ok: boolean) => {
    setGoalsSetupComplete(ok);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIndex(0);
      setGoalsSetupComplete(false);
    }, [])
  );

  const leaveToHome = useCallback(async () => {
    if (user?.id) await setWelcomeTourAcknowledged(user.id);
    router.replace("/(tabs)/(home)/" as Href);
  }, [user?.id]);

  const leavePop = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile" as Href);
  }, []);

  const onExitGate = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await leaveToHome();
  }, [leaveToHome]);

  useEffect(() => {
    if (!gate || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      void onExitGate();
      return true;
    });
    return () => sub.remove();
  }, [gate, onExitGate]);

  const goChapter = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(WELCOME_TOUR_CHAPTERS.length - 1, i));
    setIndex(clamped);
  }, []);

  const onNext = useCallback(() => {
    const cid = WELCOME_TOUR_CHAPTERS[index];
    if (cid === "goalSetup" && !goalsSetupComplete) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      Alert.alert(t(`${NS}.goalsSetupIncompleteTitle`), t(`${NS}.goalsSetupIncompleteBody`));
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    if (index >= WELCOME_TOUR_CHAPTERS.length - 1) {
      void leaveToHome();
      return;
    }
    goChapter(index + 1);
  }, [goalsSetupComplete, goChapter, index, leaveToHome, t]);

  const onPrev = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    goChapter(index - 1);
  }, [goChapter, index]);

  const chapterId = WELCOME_TOUR_CHAPTERS[index];
  const accent = WELCOME_TOUR_ACCENTS[chapterId];
  const title = t(`${NS}.chapters.${chapterId}.title`);
  const taglineKey = `${NS}.chapters.${chapterId}.tagline`;
  const taglineRaw = t(taglineKey);
  const tagline = taglineRaw === taglineKey ? "" : taglineRaw;
  const moodKey = `${NS}.chapters.${chapterId}.mood`;
  const moodRaw = t(moodKey);
  const mood = moodRaw === moodKey ? t(`${NS}.chapterKicker`) : moodRaw;
  const bullets = collectBullets(t, chapterId);
  const heroIcon = chapterHeroIcon(chapterId);
  const showGoalsSetup = chapterId === "goalSetup";
  const blockNextFromGoals = showGoalsSetup && !goalsSetupComplete;
  const isLast = index === WELCOME_TOUR_CHAPTERS.length - 1;
  const stepNum = String(index + 1).padStart(2, "0");
  const footerBottomPad = footerPaddingBottomAboveBanner(insets.bottom);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#F8F5FF", "#EEF2FF", "#FAF5FF"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(139,92,246,0.14)", "rgba(20,184,166,0.06)", "transparent"]}
        style={styles.ambientGlow}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 0.55 }}
      />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.safeInner}>
          <View style={styles.topBar}>
            {gate ? (
              <Pressable onPress={onExitGate} hitSlop={12} style={styles.topSide}>
                <Text style={styles.skipText}>{t(`${NS}.skip`)}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={leavePop} hitSlop={12} style={styles.topSide}>
                <Text style={styles.skipText}>{t("common.close")}</Text>
              </Pressable>
            )}
            <View style={styles.topTitleBlock}>
              <Text style={styles.headerEyebrow}>{t(`${NS}.headerEyebrow`)}</Text>
              <Text style={styles.topTitle} numberOfLines={1}>
                {t(`${NS}.headerTitle`)}
              </Text>
            </View>
            <View style={styles.topSide} />
          </View>

          <View style={styles.stepperBlock}>
            <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ now: index + 1, min: 1, max: WELCOME_TOUR_CHAPTERS.length }}>
              <LinearGradient
                colors={[accent.edge[0], accent.edge[1]]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[
                  styles.progressFill,
                  { width: `${((index + 1) / WELCOME_TOUR_CHAPTERS.length) * 100}%` },
                ]}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dotsScrollOuter}
              contentContainerStyle={styles.dotsRow}
            >
              {WELCOME_TOUR_CHAPTERS.map((id, i) => {
                const active = i === index;
                const dotAccent = WELCOME_TOUR_ACCENTS[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => goChapter(i)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t(`${NS}.stepA11y`, { n: i + 1 })}
                    accessibilityState={{ selected: active }}
                    style={styles.dotHit}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[dotAccent.edge[0], dotAccent.edge[1]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dotStepActive}
                      />
                    ) : (
                      <View style={styles.dotStep} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.progressMeta}>
              {t(`${NS}.progress`, { current: index + 1, total: WELCOME_TOUR_CHAPTERS.length })}
            </Text>
          </View>

          <View style={styles.slideSection}>
            <View style={styles.slideFrame}>
              <ScrollView
                key={chapterId}
                style={styles.slideScroll}
                contentContainerStyle={styles.slideScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.pageInner, styles.pageInnerShadow]}>
                <LinearGradient
                  colors={[accent.edge[0], accent.edge[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardTopStripe}
                />
                <LinearGradient
                  colors={[`${accent.solid}22`, "transparent"]}
                  start={{ x: 0.85, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={styles.cardAmbient}
                  pointerEvents="none"
                />
                <Text style={[styles.watermarkNum, { color: accent.solid }]} accessibilityElementsHidden>
                  {stepNum}
                </Text>

                <View style={styles.heroIconWrap} accessibilityElementsHidden>
                  <LinearGradient
                    colors={[accent.edge[0], accent.edge[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroIconGrad}
                  >
                    <IconSymbol ios_icon_name={heroIcon.ios} android_material_icon_name={heroIcon.android} size={34} color="#fff" />
                  </LinearGradient>
                </View>

                <View style={styles.kickerRow}>
                  <LinearGradient
                    colors={[accent.edge[0], accent.edge[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepPill}
                  >
                    <Text style={styles.stepPillText}>
                      {index + 1}/{WELCOME_TOUR_CHAPTERS.length}
                    </Text>
                  </LinearGradient>
                  <Text style={[styles.moodLabel, { color: accent.solid }]} numberOfLines={1}>
                    {mood}
                  </Text>
                </View>

                <Text style={styles.chapterTitle}>{title}</Text>
                {tagline ? (
                  <Text style={[styles.tagline, { color: accent.solid }]}>{tagline}</Text>
                ) : null}

                {showGoalsSetup ? <WelcomeTourGoalsSetup t={t} onCompleteChange={onGoalsSetupValidity} /> : null}

                {!showGoalsSetup && bullets.length > 0 ? (
                  <View style={styles.bulletBlock}>
                    {bullets.map((line, i) => (
                      <View key={`b-${i}`} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, { backgroundColor: accent.solid }]} />
                        <Text style={styles.bulletText}>{line}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={[styles.footer, styles.footerChrome, { paddingBottom: footerBottomPad }]}>
            <Pressable
              onPress={onPrev}
              disabled={index === 0}
              style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
            >
              <Text style={[styles.navBtnLabel, index === 0 && styles.navBtnLabelDisabled]}>
                {t(`${NS}.prev`)}
              </Text>
            </Pressable>
            <Pressable
              onPress={onNext}
              disabled={blockNextFromGoals}
              style={[styles.navBtnPrimary, shadows.small, blockNextFromGoals && styles.navBtnPrimaryDisabled]}
            >
              <LinearGradient
                colors={
                  [colors.gradientPrimary[0], colors.gradientPrimary[1], colors.gradientPrimary[2]] as const
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.navBtnPrimaryGrad}
              >
                <Text style={[styles.navBtnPrimaryLabel, blockNextFromGoals && styles.navBtnPrimaryLabelDisabled]}>
                  {isLast ? t(`${NS}.finish`) : t(`${NS}.next`)}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  safe: {
    flex: 1,
  },
  safeInner: {
    flex: 1,
    flexDirection: "column",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  topSide: {
    width: 88,
  },
  topTitleBlock: {
    flex: 1,
    alignItems: "center",
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  skipText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  topTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  stepperBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 4,
  },
  progressMeta: {
    textAlign: "center",
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
  },
  dotsScrollOuter: {
    alignSelf: "center",
    maxWidth: "100%",
    backgroundColor: colors.card,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    flexGrow: 1,
    justifyContent: "center",
  },
  dotHit: {
    padding: 6,
  },
  dotStep: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderDark,
  },
  dotStepActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  slideSection: {
    flex: 1,
    minHeight: 0,
  },
  slideFrame: {
    flex: 1,
    minHeight: 0,
  },
  slideScroll: {
    flex: 1,
  },
  slideScrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  pageInner: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderRadius: borderRadius.xxxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.1)",
    overflow: "hidden",
    position: "relative",
  },
  pageInnerShadow: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTopStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  cardAmbient: {
    position: "absolute",
    right: -40,
    top: -24,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.9,
  },
  heroIconWrap: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    zIndex: 1,
    ...shadows.medium,
    shadowColor: "#5B21B6",
    shadowOpacity: 0.18,
  },
  heroIconGrad: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkNum: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.md,
    fontSize: 64,
    fontWeight: "900",
    opacity: 0.055,
    lineHeight: 68,
    fontVariant: ["tabular-nums"],
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  stepPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
  },
  stepPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.4,
  },
  moodLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.92,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
    opacity: 0.95,
    zIndex: 1,
  },
  bulletBlock: {
    marginTop: spacing.xs,
    gap: spacing.md,
    zIndex: 1,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    flexShrink: 0,
  },
  footerChrome: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    ...shadows.small,
  },
  navBtn: {
    minWidth: 100,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnLabel: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
  },
  navBtnLabelDisabled: {
    color: colors.textSecondary,
  },
  navBtnPrimary: {
    flex: 1,
    borderRadius: borderRadius.round,
    overflow: "hidden",
  },
  navBtnPrimaryDisabled: {
    opacity: 0.45,
  },
  navBtnPrimaryGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnPrimaryLabel: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  navBtnPrimaryLabelDisabled: {
    color: "rgba(255,255,255,0.85)",
  },
});
