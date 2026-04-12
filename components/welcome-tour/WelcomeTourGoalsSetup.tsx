import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, ActivityIndicator, Platform, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import {
  hasIlmGoalsEnabled,
  hasAmanahGoalsEnabled,
  hasWorshipGoalsChosen,
  type IbadahGoals,
  type IlmGoals,
  type AmanahGoals,
} from "@/utils/imanScoreCalculator";
import {
  WELCOME_TOUR_IBADAH_TILES,
  WELCOME_TOUR_ILM_TILES,
  WELCOME_TOUR_AMANAH_TILES,
  type WelcomeGoalTileDef,
} from "@/constants/welcomeTourGoalTiles";

const NS = "welcomeMuslimSpace";

function formatSleepHours(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
}

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampSleepHours(n: number): number {
  const step = 0.5;
  const rounded = Math.round(n / step) * step;
  return Math.max(0, Math.min(16, rounded));
}

function TargetField({
  label,
  value,
  min,
  max,
  mode = "int",
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  mode?: "int" | "sleep";
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(() =>
    mode === "sleep" ? formatSleepHours(value) : String(Math.max(min, Math.round(value)))
  );

  useEffect(() => {
    setText(mode === "sleep" ? formatSleepHours(value) : String(Math.max(min, Math.round(value))));
  }, [value, mode, min]);

  const commitInt = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setText(String(clampInt(value, min, max)));
      return;
    }
    const n = clampInt(parseInt(digits, 10), min, max);
    onCommit(n);
    setText(String(n));
  };

  const commitSleep = (raw: string) => {
    const normalized = raw.replace(",", ".").trim();
    if (normalized === "" || normalized === ".") {
      setText(formatSleepHours(value));
      return;
    }
    const parsed = parseFloat(normalized);
    if (Number.isNaN(parsed)) {
      setText(formatSleepHours(value));
      return;
    }
    const n = clampSleepHours(parsed);
    onCommit(n);
    setText(formatSleepHours(n));
  };

  return (
    <View style={styles.targetField}>
      <Text style={styles.targetLabel} numberOfLines={2}>
        {label}
      </Text>
      <TextInput
        style={styles.targetInput}
        value={text}
        onChangeText={(raw) => {
          if (mode === "sleep") {
            const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
            const parts = cleaned.split(".");
            if (parts.length > 2) return;
            setText(cleaned);
          } else {
            setText(raw.replace(/\D/g, ""));
          }
        }}
        onBlur={() => (mode === "sleep" ? commitSleep(text) : commitInt(text))}
        onSubmitEditing={() => (mode === "sleep" ? commitSleep(text) : commitInt(text))}
        keyboardType={mode === "sleep" ? "decimal-pad" : "number-pad"}
        selectTextOnFocus
        returnKeyType="done"
        maxLength={mode === "sleep" ? 5 : String(max).length + 1}
      />
    </View>
  );
}

/** Match ImanRingsDisplay pillar hues */
const RING_WORSHIP = "#10B981";
const RING_KNOWLEDGE = "#3B82F6";
const RING_TRUST = "#F59E0B";

type Props = {
  t: (key: string) => string;
  onCompleteChange: (complete: boolean) => void;
};

export function WelcomeTourGoalsSetup({ t, onCompleteChange }: Props) {
  const {
    ibadahGoals,
    ilmGoals,
    amanahGoals,
    updateIbadahGoals,
    updateIlmGoals,
    updateAmanahGoals,
    isLoading,
  } = useImanTracker();

  useEffect(() => {
    const ok =
      hasWorshipGoalsChosen(ibadahGoals) &&
      hasIlmGoalsEnabled(ilmGoals) &&
      hasAmanahGoalsEnabled(amanahGoals);
    onCompleteChange(ok);
  }, [ibadahGoals, ilmGoals, amanahGoals, onCompleteChange]);

  const toggleIbadahTile = useCallback(
    (tile: WelcomeGoalTileDef, on: boolean) => {
      switch (tile.id) {
        case "sunnahTahajjud":
          void updateIbadahGoals(
            on
              ? { sunnahDailyGoal: 2, tahajjudWeeklyGoal: 2 }
              : { sunnahDailyGoal: 0, tahajjudWeeklyGoal: 0 }
          ).catch(() => {});
          break;
        case "quran":
          void updateIbadahGoals(
            on
              ? {
                  quranDailyPagesGoal: 3,
                  quranWeeklyMemorizationGoal: 1,
                  quranPagesFrequency: "daily",
                  quranMemorizationFrequency: "weekly",
                }
              : { quranDailyPagesGoal: 0, quranWeeklyMemorizationGoal: 0 }
          ).catch(() => {});
          break;
        case "dhikrDua":
          void updateIbadahGoals(
            on ? { dhikrDailyGoal: 33, duaDailyGoal: 3 } : { dhikrDailyGoal: 0, duaDailyGoal: 0 }
          ).catch(() => {});
          break;
        case "fasting":
          void updateIbadahGoals({ fastingWeeklyGoal: on ? 1 : 0 }).catch(() => {});
          break;
        default:
          break;
      }
    },
    [updateIbadahGoals]
  );

  const ibadahOn = useCallback(
    (tile: WelcomeGoalTileDef): boolean => {
      switch (tile.id) {
        case "sunnahTahajjud":
          return ibadahGoals.sunnahDailyGoal > 0 || ibadahGoals.tahajjudWeeklyGoal > 0;
        case "quran":
          return ibadahGoals.quranDailyPagesGoal > 0 || ibadahGoals.quranWeeklyMemorizationGoal > 0;
        case "dhikrDua":
          return ibadahGoals.dhikrDailyGoal > 0 || ibadahGoals.duaDailyGoal > 0;
        case "fasting":
          return ibadahGoals.fastingWeeklyGoal > 0;
        default:
          return false;
      }
    },
    [ibadahGoals]
  );

  const toggleIlmTile = useCallback(
    (tile: WelcomeGoalTileDef, on: boolean) => {
      const v = on ? (tile.id === "reflection" || tile.id === "stories" || tile.id === "allahNames" ? 1 : 2) : 0;
      const patch: Partial<IlmGoals> = {};
      switch (tile.id) {
        case "lectures":
          patch.weeklyLecturesGoal = v;
          break;
        case "quizzes":
          patch.weeklyQuizzesGoal = v;
          break;
        case "reflection":
          patch.weeklyReflectionGoal = v;
          break;
        case "stories":
          patch.weeklyStoriesGoal = v;
          break;
        case "allahNames":
          patch.weeklyAllahNamesGoal = v;
          break;
        default:
          return;
      }
      void updateIlmGoals(patch).catch(() => {});
    },
    [updateIlmGoals]
  );

  const ilmOn = useCallback(
    (tile: WelcomeGoalTileDef): boolean => {
      switch (tile.id) {
        case "lectures":
          return ilmGoals.weeklyLecturesGoal > 0;
        case "quizzes":
          return ilmGoals.weeklyQuizzesGoal > 0;
        case "reflection":
          return ilmGoals.weeklyReflectionGoal > 0;
        case "stories":
          return ilmGoals.weeklyStoriesGoal > 0;
        case "allahNames":
          return ilmGoals.weeklyAllahNamesGoal > 0;
        default:
          return false;
      }
    },
    [ilmGoals]
  );

  const toggleAmanahTile = useCallback(
    (tile: WelcomeGoalTileDef, on: boolean) => {
      switch (tile.id) {
        case "exercise":
          void updateAmanahGoals({ dailyExerciseGoal: on ? 30 : 0 }).catch(() => {});
          break;
        case "water":
          void updateAmanahGoals({ dailyWaterGoal: on ? 8 : 0 }).catch(() => {});
          break;
        case "sleep":
          void updateAmanahGoals({ dailySleepGoal: on ? 7 : 0 }).catch(() => {});
          break;
        case "workouts":
          void updateAmanahGoals({ weeklyWorkoutGoal: on ? 3 : 0 }).catch(() => {});
          break;
        case "meditation":
          void updateAmanahGoals({ weeklyMeditationGoal: on ? 2 : 0 }).catch(() => {});
          break;
        case "journal":
          void updateAmanahGoals({ weeklyJournalGoal: on ? 2 : 0 }).catch(() => {});
          break;
        default:
          break;
      }
    },
    [updateAmanahGoals]
  );

  const amanahOn = useCallback(
    (tile: WelcomeGoalTileDef): boolean => {
      switch (tile.id) {
        case "exercise":
          return amanahGoals.dailyExerciseGoal > 0;
        case "water":
          return amanahGoals.dailyWaterGoal > 0;
        case "sleep":
          return amanahGoals.dailySleepGoal > 0;
        case "workouts":
          return amanahGoals.weeklyWorkoutGoal > 0;
        case "meditation":
          return amanahGoals.weeklyMeditationGoal > 0;
        case "journal":
          return amanahGoals.weeklyJournalGoal > 0;
        default:
          return false;
      }
    },
    [amanahGoals]
  );

  const patchIbadah = useCallback(
    (patch: Partial<IbadahGoals>) => {
      void updateIbadahGoals(patch).catch(() => {});
    },
    [updateIbadahGoals]
  );

  const patchIlm = useCallback(
    (patch: Partial<IlmGoals>) => {
      void updateIlmGoals(patch).catch(() => {});
    },
    [updateIlmGoals]
  );

  const patchAmanah = useCallback(
    (patch: Partial<AmanahGoals>) => {
      void updateAmanahGoals(patch).catch(() => {});
    },
    [updateAmanahGoals]
  );

  const ibadahTargetsBelow = useCallback(
    (tile: WelcomeGoalTileDef) => {
      if (!ibadahOn(tile)) return null;
      switch (tile.id) {
        case "sunnahTahajjud":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.sunnahDaily`)}
                value={ibadahGoals.sunnahDailyGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIbadah({ sunnahDailyGoal: n })}
              />
              <TargetField
                label={t(`${NS}.goalTargets.tahajjudWeekly`)}
                value={ibadahGoals.tahajjudWeeklyGoal}
                min={0}
                max={50}
                onCommit={(n) => patchIbadah({ tahajjudWeeklyGoal: n })}
              />
            </View>
          );
        case "quran":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.quranPages`)}
                value={ibadahGoals.quranDailyPagesGoal}
                min={0}
                max={604}
                onCommit={(n) => patchIbadah({ quranDailyPagesGoal: n })}
              />
              <TargetField
                label={t(`${NS}.goalTargets.quranVerses`)}
                value={ibadahGoals.quranWeeklyMemorizationGoal}
                min={0}
                max={500}
                onCommit={(n) => patchIbadah({ quranWeeklyMemorizationGoal: n })}
              />
            </View>
          );
        case "dhikrDua":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.dhikr`)}
                value={ibadahGoals.dhikrDailyGoal}
                min={0}
                max={500000}
                onCommit={(n) => patchIbadah({ dhikrDailyGoal: n })}
              />
              <TargetField
                label={t(`${NS}.goalTargets.dua`)}
                value={ibadahGoals.duaDailyGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIbadah({ duaDailyGoal: n })}
              />
            </View>
          );
        case "fasting":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.fastingDays`)}
                value={ibadahGoals.fastingWeeklyGoal}
                min={0}
                max={7}
                onCommit={(n) => patchIbadah({ fastingWeeklyGoal: n })}
              />
            </View>
          );
        default:
          return null;
      }
    },
    [ibadahGoals, ibadahOn, patchIbadah, t]
  );

  const ilmTargetsBelow = useCallback(
    (tile: WelcomeGoalTileDef) => {
      if (!ilmOn(tile)) return null;
      switch (tile.id) {
        case "lectures":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.perWeek`)}
                value={ilmGoals.weeklyLecturesGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIlm({ weeklyLecturesGoal: n })}
              />
            </View>
          );
        case "quizzes":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.perWeek`)}
                value={ilmGoals.weeklyQuizzesGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIlm({ weeklyQuizzesGoal: n })}
              />
            </View>
          );
        case "reflection":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.perWeek`)}
                value={ilmGoals.weeklyReflectionGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIlm({ weeklyReflectionGoal: n })}
              />
            </View>
          );
        case "stories":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.perWeek`)}
                value={ilmGoals.weeklyStoriesGoal}
                min={0}
                max={100}
                onCommit={(n) => patchIlm({ weeklyStoriesGoal: n })}
              />
            </View>
          );
        case "allahNames":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.perWeek`)}
                value={ilmGoals.weeklyAllahNamesGoal}
                min={0}
                max={99}
                onCommit={(n) => patchIlm({ weeklyAllahNamesGoal: n })}
              />
            </View>
          );
        default:
          return null;
      }
    },
    [ilmGoals, ilmOn, patchIlm, t]
  );

  const amanahTargetsBelow = useCallback(
    (tile: WelcomeGoalTileDef) => {
      if (!amanahOn(tile)) return null;
      switch (tile.id) {
        case "exercise":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.minutes`)}
                value={amanahGoals.dailyExerciseGoal}
                min={0}
                max={300}
                onCommit={(n) => patchAmanah({ dailyExerciseGoal: n })}
              />
            </View>
          );
        case "water":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.glasses`)}
                value={amanahGoals.dailyWaterGoal}
                min={0}
                max={40}
                onCommit={(n) => patchAmanah({ dailyWaterGoal: n })}
              />
            </View>
          );
        case "sleep":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.hoursSleep`)}
                value={amanahGoals.dailySleepGoal}
                min={0}
                max={16}
                mode="sleep"
                onCommit={(n) => patchAmanah({ dailySleepGoal: n })}
              />
            </View>
          );
        case "workouts":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.workoutsWeek`)}
                value={amanahGoals.weeklyWorkoutGoal}
                min={0}
                max={14}
                onCommit={(n) => patchAmanah({ weeklyWorkoutGoal: n })}
              />
            </View>
          );
        case "meditation":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.meditationWeek`)}
                value={amanahGoals.weeklyMeditationGoal}
                min={0}
                max={100}
                onCommit={(n) => patchAmanah({ weeklyMeditationGoal: n })}
              />
            </View>
          );
        case "journal":
          return (
            <View style={styles.targetsRow}>
              <TargetField
                label={t(`${NS}.goalTargets.journalWeek`)}
                value={amanahGoals.weeklyJournalGoal}
                min={0}
                max={100}
                onCommit={(n) => patchAmanah({ weeklyJournalGoal: n })}
              />
            </View>
          );
        default:
          return null;
      }
    },
    [amanahGoals, amanahOn, patchAmanah, t]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const worshipOk = hasWorshipGoalsChosen(ibadahGoals);
  const ilmOk = hasIlmGoalsEnabled(ilmGoals);
  const amanahOk = hasAmanahGoalsEnabled(amanahGoals);

  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>{t(`${NS}.goalsSetupIntro`)}</Text>

      <RingBlock
        title={t(`${NS}.ringLabels.outer`)}
        status={worshipOk}
        statusLabel={t(`${NS}.goalsSetupStatus.${worshipOk ? "ok" : "needOne"}`)}
        accent={RING_WORSHIP}
      >
        {WELCOME_TOUR_IBADAH_TILES.map((tile, i, arr) => (
          <GoalToggleRow
            key={tile.id}
            tile={tile}
            value={ibadahOn(tile)}
            onValueChange={(v) => toggleIbadahTile(tile, v)}
            accent={RING_WORSHIP}
            isLast={i === arr.length - 1}
            t={t}
            below={ibadahTargetsBelow(tile)}
          />
        ))}
      </RingBlock>

      <RingBlock
        title={t(`${NS}.ringLabels.mid`)}
        status={ilmOk}
        statusLabel={t(`${NS}.goalsSetupStatus.${ilmOk ? "ok" : "needOne"}`)}
        accent={RING_KNOWLEDGE}
      >
        {WELCOME_TOUR_ILM_TILES.map((tile, i, arr) => (
          <GoalToggleRow
            key={tile.id}
            tile={tile}
            value={ilmOn(tile)}
            onValueChange={(v) => toggleIlmTile(tile, v)}
            accent={RING_KNOWLEDGE}
            isLast={i === arr.length - 1}
            t={t}
            below={ilmTargetsBelow(tile)}
          />
        ))}
      </RingBlock>

      <RingBlock
        title={t(`${NS}.ringLabels.inner`)}
        status={amanahOk}
        statusLabel={t(`${NS}.goalsSetupStatus.${amanahOk ? "ok" : "needOne"}`)}
        accent={RING_TRUST}
      >
        {WELCOME_TOUR_AMANAH_TILES.map((tile, i, arr) => (
          <GoalToggleRow
            key={tile.id}
            tile={tile}
            value={amanahOn(tile)}
            onValueChange={(v) => toggleAmanahTile(tile, v)}
            accent={RING_TRUST}
            isLast={i === arr.length - 1}
            t={t}
            below={amanahTargetsBelow(tile)}
          />
        ))}
      </RingBlock>

      <Text style={styles.footerHint}>{t(`${NS}.goalsSetupFineTune`)}</Text>
    </View>
  );
}

function RingBlock({
  title,
  status,
  statusLabel,
  accent,
  children,
}: {
  title: string;
  status: boolean;
  statusLabel: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.ringBlock, { borderColor: `${accent}35` }]}>
      <LinearGradient colors={[`${accent}14`, `${accent}06`]} style={styles.ringBlockHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.ringDot, { backgroundColor: accent }]} />
        <View style={styles.ringHeaderText}>
          <Text style={styles.ringTitle}>{title}</Text>
          <Text style={[styles.ringStatus, { color: status ? colors.successDark : colors.textSecondary }]}>{statusLabel}</Text>
        </View>
      </LinearGradient>
      <View style={styles.ringRows}>{children}</View>
    </View>
  );
}

function GoalToggleRow({
  tile,
  value,
  onValueChange,
  accent,
  isLast,
  t,
  below,
}: {
  tile: WelcomeGoalTileDef;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accent: string;
  isLast: boolean;
  t: (key: string) => string;
  below?: React.ReactNode;
}) {
  return (
    <View style={[styles.goalBlock, !isLast && styles.goalBlockSep]}>
      <View style={styles.row}>
        <LinearGradient colors={[`${accent}12`, `${accent}05`]} style={[styles.thumb, { borderColor: `${accent}28` }]}>
          <View style={styles.thumbInner}>
            <IconSymbol
              ios_icon_name={tile.ios as any}
              android_material_icon_name={tile.android}
              size={26}
              color={accent}
            />
          </View>
        </LinearGradient>
        <Text style={styles.rowLabel} numberOfLines={2}>
          {t(`${NS}.goalTiles.${tile.labelKey}`)}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: `${accent}55` }}
          thumbColor={Platform.OS === "android" ? (value ? accent : colors.borderDark) : undefined}
          ios_backgroundColor={colors.border}
        />
      </View>
      {below}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ringBlock: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: colors.card,
    ...shadows.card,
  },
  ringBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  ringDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ringHeaderText: {
    flex: 1,
  },
  ringTitle: {
    ...typography.bodyBold,
    fontSize: 17,
    color: colors.text,
    fontWeight: "800",
  },
  ringStatus: {
    ...typography.small,
    fontWeight: "600",
    marginTop: 2,
  },
  ringRows: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  goalBlock: {
    paddingBottom: spacing.xs,
  },
  goalBlockSep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  targetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginLeft: 56,
    marginRight: spacing.xs,
    paddingBottom: spacing.xs,
  },
  targetField: {
    minWidth: 96,
    flex: 1,
    maxWidth: 200,
  },
  targetLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  targetInput: {
    ...typography.bodyBold,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    textAlign: "center",
    minHeight: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbInner: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm + 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    ...typography.bodyBold,
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  footerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
