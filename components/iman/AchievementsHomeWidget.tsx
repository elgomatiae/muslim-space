/**
 * Achievements preview on the home screen — compact list + open full achievements.
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { LOCAL_ACHIEVEMENTS } from "@/data/localAchievements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/contexts/I18nContext";
import { supabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

interface Achievement {
  id: string;
  title: string;
  icon_name: string;
  tier: string;
  unlocked: boolean;
  progress: number;
}

function androidIconForAchievement(iosName: string | undefined, unlocked: boolean): keyof typeof MaterialIcons.glyphMap {
  if (!unlocked) return "lock";
  const m: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    "star.fill": "star",
    "trophy.fill": "emoji-events",
    "flame.fill": "local-fire-department",
    "moon.fill": "nightlight",
    "book.fill": "menu-book",
    "heart.fill": "favorite",
    "checkmark.circle.fill": "check-circle",
    "calendar": "calendar-today",
    "target": "track-changes",
    "sparkles": "auto-awesome",
    "leaf.fill": "eco",
    "hands.sparkles.fill": "self-improvement",
  };
  return (iosName && m[iosName]) || "stars";
}

function tierAccent(tier: string): string {
  switch (tier) {
    case "platinum":
      return "#A78BFA";
    case "gold":
      return "#FBBF24";
    case "silver":
      return "#9CA3AF";
    case "bronze":
      return "#CD7F32";
    default:
      return colors.primary;
  }
}

export default function AchievementsHomeWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const openAchievements = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/(iman)/achievements" as any);
  }, []);

  const loadAchievements = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let allAchievements: any[] = [];
      let userAchievements: any[] = [];

      try {
        const [achievementsResult, userAchievementsResult] = await Promise.all([
          supabase.from("achievements").select("*").eq("is_active", true).order("order_index", { ascending: true }).limit(50),
          supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
        ]);

        if (!achievementsResult.error && achievementsResult.data && achievementsResult.data.length > 0) {
          allAchievements = achievementsResult.data;
          userAchievements = userAchievementsResult.data || [];
        } else {
          allAchievements = LOCAL_ACHIEVEMENTS.filter((a) => a.is_active);
          const unlockedData = await AsyncStorage.getItem(`user_achievements_${user.id}`);
          if (unlockedData) userAchievements = JSON.parse(unlockedData);
        }
      } catch {
        allAchievements = LOCAL_ACHIEVEMENTS.filter((a) => a.is_active);
        const unlockedData = await AsyncStorage.getItem(`user_achievements_${user.id}`);
        if (unlockedData) userAchievements = JSON.parse(unlockedData);
      }

      const unlockedMap = new Map(userAchievements.map((ua: any) => [ua.achievement_id || ua.id, true]));

      const merged: Achievement[] = allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: !!unlockedMap.get(achievement.id),
        progress: unlockedMap.get(achievement.id) ? 100 : 0,
      }));

      const unlocked = merged.filter((a) => a.unlocked).length;

      const preview = [...merged]
        .sort((a, b) => {
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return b.progress - a.progress;
        })
        .slice(0, 3);

      setAchievements(preview);
      setTotalCount(merged.length);
      setUnlockedCount(unlocked);
    } catch (e) {
      console.log("AchievementsHomeWidget load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAchievements();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.headRow}>
          <View style={styles.headLeft}>
            <View style={styles.headIcon}>
              <IconSymbol ios_icon_name="trophy.fill" android_material_icon_name="emoji-events" size={20} color={colors.primaryDark} />
            </View>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.sm }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={openAchievements}
        style={({ pressed }) => [styles.headRow, pressed && { opacity: 0.92 }]}
        android_ripple={{ color: "rgba(139,92,246,0.1)" }}
      >
        <View style={styles.headLeft}>
          <View style={styles.headIcon}>
            <IconSymbol ios_icon_name="trophy.fill" android_material_icon_name="emoji-events" size={20} color={colors.primaryDark} />
          </View>
          <Text style={styles.headSummary} numberOfLines={1}>
            {totalCount > 0
              ? t("home.achievementsProgressShort", { unlocked: unlockedCount, total: totalCount })
              : t("home.completeActivitiesForAchievements")}
          </Text>
        </View>
        <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
      </Pressable>

        {achievements.length > 0 ? (
          <View style={styles.list}>
            {achievements.map((a, index) => {
              const accent = tierAccent(a.tier);
              const ios = a.unlocked ? a.icon_name || "star.fill" : "lock.fill";
              const android = androidIconForAchievement(a.icon_name, a.unlocked);
              return (
                <View key={a.id || String(index)}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={openAchievements}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.highlight }]}
                    android_ripple={{ color: "rgba(139,92,246,0.06)" }}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: (a.unlocked ? accent : colors.textSecondary) + "18" }]}>
                      <IconSymbol ios_icon_name={ios} android_material_icon_name={android} size={22} color={a.unlocked ? accent : colors.textSecondary} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, !a.unlocked && styles.rowTitleMuted]} numberOfLines={1}>
                        {a.title}
                      </Text>
                      <Text style={styles.rowStatus}>{a.unlocked ? t("home.achievementUnlocked") : t("home.achievementLocked")}</Text>
                    </View>
                    {a.unlocked ? (
                      <View style={styles.checkWrap}>
                        <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={22} color={colors.success} />
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.empty}>{t("home.completeActivitiesForAchievements")}</Text>
        )}

        <Pressable onPress={openAchievements} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} android_ripple={{ color: "rgba(139,92,246,0.12)" }}>
          <Text style={styles.ctaText}>{t("home.achievementsViewAll")}</Text>
          <IconSymbol ios_icon_name="arrow.right.circle.fill" android_material_icon_name="arrow-forward" size={20} color={colors.primary} />
        </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlightPurple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headSummary: {
    flex: 1,
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.text,
    minWidth: 0,
  },
  list: {
    paddingBottom: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 44 + spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  rowTitleMuted: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  rowStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkWrap: {
    marginLeft: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  ctaText: {
    ...typography.bodyBold,
    fontSize: 15,
    color: colors.primary,
  },
});
