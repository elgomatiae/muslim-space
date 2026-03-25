import React, { useCallback, useLayoutEffect, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, I18nManager, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useNavigation, type Href } from "expo-router";
import { MiniTabBackButton } from "@/components/navigation/miniTabStack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { useTranslation } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { getIslamicStoryById, STORY_CATEGORY_LABEL } from "@/data/islamicStories";
import { isStoryTrackedThisWeek, markStoryTrackedThisWeek } from "@/utils/storyReadingTracker";
import { LinearGradient } from "expo-linear-gradient";
import { BANNER_AD_MAX_HEIGHT } from "@/components/ads/BannerAdBar";
import { FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM } from "@/components/FloatingTabBar";

const STORIES_LIST_HREF = "/(tabs)/(learning)/stories" as Href;

export default function StoryDetailScreen() {
  const params = useLocalSearchParams();
  const rawId = params.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const isRTL = I18nManager.isRTL || locale === "ar" || locale === "ur";

  const story = id ? getIslamicStoryById(id) : undefined;
  const categoryLabel = story ? STORY_CATEGORY_LABEL[story.category] : "";
  const [tracked, setTracked] = useState(false);
  const [loadingTracked, setLoadingTracked] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: story?.title ?? t("learning.storyFallbackTitle"),
      headerLeft: () => (
        <MiniTabBackButton
          href={STORIES_LIST_HREF}
          accessibilityLabel="Back to stories"
          behavior="popOnce"
        />
      ),
    });
  }, [navigation, story?.title, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id || !story?.id) {
        setLoadingTracked(false);
        return;
      }
      const v = await isStoryTrackedThisWeek(user.id, story.id);
      if (!cancelled) {
        setTracked(v);
        setLoadingTracked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, story?.id]);

  const onTrack = useCallback(async () => {
    if (!story || !user?.id) {
      Alert.alert(t("learning.storySignInTitle"), t("learning.storySignInBody"));
      return;
    }

    const goal = ilmGoals?.weeklyStoriesGoal ?? 0;
    if (goal <= 0) {
      Alert.alert(t("learning.storyGoalDisabledTitle"), t("learning.storyGoalDisabledBody"));
      return;
    }
    if (tracked) return;

    const completed = ilmGoals?.weeklyStoriesCompleted ?? 0;
    if (completed >= goal) {
      Alert.alert(t("learning.storyAlreadyCapped"), t("learning.storyAlreadyCappedBody"));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    await markStoryTrackedThisWeek(user.id, story.id);
    setTracked(true);

    if (ilmGoals) {
      const updated = {
        ...ilmGoals,
        weeklyStoriesCompleted: Math.min(completed + 1, goal),
      };
      await updateIlmGoals(updated);
    }

    Alert.alert(t("common.success"), t("learning.storyTrackedToast"));
  }, [story, user?.id, ilmGoals, tracked, updateIlmGoals, t]);

  if (!story) {
    return (
      <View style={styles.missing}>
        <Text style={[styles.missingText, isRTL && styles.textRTL]}>{t("learning.storyNotFound")}</Text>
      </View>
    );
  }

  const goalOn = (ilmGoals?.weeklyStoriesGoal ?? 0) > 0;
  const capped =
    goalOn && (ilmGoals?.weeklyStoriesCompleted ?? 0) >= (ilmGoals?.weeklyStoriesGoal ?? 0);
  const trackDisabled = loadingTracked || tracked || (goalOn && capped);

  const bottomClearanceAboveBanner =
    Platform.OS === "web"
      ? Math.max(insets.bottom, spacing.lg)
      : FLOATING_TAB_BAR_OFFSET_FROM_BOTTOM + BANNER_AD_MAX_HEIGHT + spacing.lg;

  const sectionTone = (title?: string) => {
    const lower = (title ?? "").toLowerCase();
    if (!lower) return "default" as const;
    if (lower.includes("qur") || lower.includes("quran")) return "quran" as const;
    if (lower.includes("ḥad") || lower.includes("hadith") || lower.includes("hadīth")) return "hadith" as const;
    return "default" as const;
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomClearanceAboveBanner },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#7C3AED", "#5B21B6", "#4C1D95"] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>{categoryLabel}</Text>
        </View>
        <Text style={[styles.heroTitle, isRTL && styles.textRTL]}>{story.title}</Text>
        <Text style={[styles.heroSubtitle, isRTL && styles.textRTL]}>{story.tagline}</Text>
      </LinearGradient>

      {story.sections.map((section, idx) => {
        const tone = sectionTone(section.title);
        return (
          <View
            key={`${story.id}-${idx}`}
            style={[
              styles.sectionCard,
              tone === "quran" && styles.sectionCardQuran,
              tone === "hadith" && styles.sectionCardHadith,
            ]}
          >
            {section.title ? (
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {section.title}
              </Text>
            ) : null}
            {section.paragraphs.map((p, pIdx) => (
              <Text
                key={`${story.id}-${idx}-${pIdx}`}
                style={[
                  styles.paragraph,
                  isRTL && styles.textRTL,
                  pIdx > 0 && { marginTop: spacing.md },
                ]}
              >
                {p}
              </Text>
            ))}
          </View>
        );
      })}

      <View style={styles.takeawayCard}>
        <Text style={[styles.takeawayLabel, isRTL && styles.textRTL]}>{t("learning.storyTakeaway")}</Text>
        <Text style={[styles.takeawayText, isRTL && styles.textRTL]}>{story.takeaway}</Text>
      </View>

      <View style={styles.sourceCard}>
        <Text style={[styles.sourceLabel, isRTL && styles.textRTL]}>{t("learning.storySources")}</Text>
        <Text style={[styles.sourceText, isRTL && styles.textRTL]}>{story.sourceNote}</Text>
      </View>

      <View style={styles.endCard}>
        <IconSymbol
          ios_icon_name="star.circle.fill"
          android_material_icon_name="stars"
          size={36}
          color={colors.primary}
        />
        <Text style={[styles.endText, isRTL && styles.textRTL]}>
          You reached the end of this story. Track your reading below.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onTrack}
          disabled={trackDisabled}
          style={({ pressed }) => [
            styles.trackBtnOuter,
            trackDisabled && styles.trackBtnDisabled,
            pressed && !trackDisabled && styles.trackBtnPressed,
          ]}
        >
          <LinearGradient
            colors={
              trackDisabled
                ? (["#94a3b8", "#64748b", "#475569"] as const)
                : (colors.gradientSecondary as unknown as readonly [string, string, ...string[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trackGradient}
          >
            <IconSymbol
              ios_icon_name={tracked ? "checkmark.circle.fill" : "bookmark.fill"}
              android_material_icon_name={tracked ? "check-circle" : "bookmark"}
              size={22}
              color="#fff"
            />
            <Text style={styles.trackText}>
              {tracked
                ? t("learning.storyTrackedLabel")
                : capped
                  ? t("learning.storyWeeklyFull")
                  : t("learning.storyTrackReading")}
            </Text>
          </LinearGradient>
        </Pressable>
        {goalOn && tracked ? (
          <Text style={[styles.hint, isRTL && styles.textRTL]}>{t("learning.storyTrackedThisWeek")}</Text>
        ) : null}
        {!goalOn && !tracked && !capped ? (
          <Text style={[styles.hint, isRTL && styles.textRTL]}>{t("learning.storyGoalHintShort")}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  missingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  hero: {
    borderRadius: borderRadius.xxxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.colored,
  },
  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  heroPillText: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.95)",
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#fff",
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  heroSubtitle: {
    ...typography.body,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionCardQuran: {
    borderColor: `${colors.primary}66`,
    backgroundColor: `${colors.primary}10`,
  },
  sectionCardHadith: {
    borderColor: `${colors.info}66`,
    backgroundColor: `${colors.info}10`,
  },
  sectionTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.text,
    lineHeight: 27,
    fontSize: 17,
  },
  takeawayCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.xxxl,
    padding: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  takeawayLabel: {
    ...typography.captionBold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  takeawayText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 28,
    fontSize: 17,
  },
  sourceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  sourceLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sourceText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
  endCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  endText: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 26,
    color: colors.text,
    maxWidth: 320,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  footer: {
    marginTop: spacing.md,
  },
  trackBtnOuter: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.medium,
  },
  trackBtnDisabled: {
    opacity: 0.85,
  },
  trackBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  trackGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  trackText: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 17,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
