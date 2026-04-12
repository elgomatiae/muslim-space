/**
 * ============================================================================
 * IMAN SCORE CALCULATION SYSTEM - SIMPLE & CLEAN
 * ============================================================================
 * 
 * CORE PRINCIPLES:
 * 1. Simple percentage calculation: (completed / goal) * 100
 * 2. Weighted average for multiple goals
 * 3. Each section (Ibadah, Ilm, Amanah) calculated independently
 * 4. Overall score is weighted combination of sections
 * 5. No complex decay - scores reflect current progress
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrayerTimes } from '@/services/PrayerTimeService';

// ============================================================================
// INTERFACES
// ============================================================================

export type QuranGoalPeriod = 'daily' | 'weekly';

export interface IbadahGoals {
  // Salah (Prayer) - Daily
  fardPrayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  sunnahDailyGoal: number;
  sunnahCompleted: number;
  
  // Salah (Prayer) - Weekly
  tahajjudWeeklyGoal: number;
  tahajjudCompleted: number;
  
  // Quran reading — pages (goal applies per day or per week; see quranPagesFrequency)
  quranDailyPagesGoal: number;
  quranDailyPagesCompleted: number;
  quranPagesFrequency?: QuranGoalPeriod;

  // Quran memorization — verses (same storage fields; period via quranMemorizationFrequency)
  quranWeeklyMemorizationGoal: number;
  quranWeeklyMemorizationCompleted: number;
  quranMemorizationFrequency?: QuranGoalPeriod;
  
  // Dhikr & Dua - Daily
  dhikrDailyGoal: number;
  dhikrDailyCompleted: number;
  duaDailyGoal: number;
  duaDailyCompleted: number;
  
  // Dhikr - Weekly
  dhikrWeeklyGoal: number;
  dhikrWeeklyCompleted: number;
  
  // Fasting - Weekly
  fastingWeeklyGoal: number;
  fastingWeeklyCompleted: number;
  
  score?: number;
}

export interface IlmGoals {
  weeklyLecturesGoal: number;
  weeklyLecturesCompleted: number;
  weeklyQuizzesGoal: number;
  weeklyQuizzesCompleted: number;
  weeklyReflectionGoal: number;
  weeklyReflectionCompleted: number;
  weeklyStoriesGoal: number;
  weeklyStoriesCompleted: number;
  weeklyAllahNamesGoal: number;
  weeklyAllahNamesCompleted: number;
  
  score?: number;
}

export interface AmanahGoals {
  // Physical health - Daily
  dailyExerciseGoal: number;
  dailyExerciseCompleted: number;
  dailyWaterGoal: number;
  dailyWaterCompleted: number;
  dailySleepGoal: number;
  dailySleepCompleted: number;
  
  // Physical health - Weekly
  weeklyWorkoutGoal: number;
  weeklyWorkoutCompleted: number;
  
  // Mental health - Weekly
  weeklyMeditationGoal: number;
  weeklyMeditationCompleted: number;
  weeklyJournalGoal: number;
  weeklyJournalCompleted: number;
  
  // Legacy fields for backward compatibility
  weeklyMentalHealthGoal: number;
  weeklyMentalHealthCompleted: number;
  weeklyStressManagementGoal: number;
  weeklyStressManagementCompleted: number;
  
  // Workout type goals (per type, per frequency)
  workoutTypeGoals?: {
    general?: { daily?: number; weekly?: number };
    cardio?: { daily?: number; weekly?: number };
    strength?: { daily?: number; weekly?: number };
    yoga?: { daily?: number; weekly?: number };
    walking?: { daily?: number; weekly?: number };
    running?: { daily?: number; weekly?: number };
    sports?: { daily?: number; weekly?: number };
  };
  workoutTypeCompleted?: {
    general?: { daily?: number; weekly?: number };
    cardio?: { daily?: number; weekly?: number };
    strength?: { daily?: number; weekly?: number };
    yoga?: { daily?: number; weekly?: number };
    walking?: { daily?: number; weekly?: number };
    running?: { daily?: number; weekly?: number };
    sports?: { daily?: number; weekly?: number };
  };
  
  score?: number;
}

export interface SectionScores {
  ibadah: number;
  ilm: number;
  amanah: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Overall ring weights for final Iman score (renormalized over active sections only)
const SECTION_WEIGHTS = {
  ibadah: 0.60,  // 60% - Most important (Worship is the foundation)
  ilm: 0.25,     // 25% - Knowledge
  amanah: 0.15,  // 15% - Well-being
};

/** Ilm section contributes to overall score only if at least one Ilm goal is enabled */
export function hasIlmGoalsEnabled(goals: IlmGoals): boolean {
  return (
    goals.weeklyLecturesGoal > 0 ||
    goals.weeklyQuizzesGoal > 0 ||
    goals.weeklyReflectionGoal > 0 ||
    goals.weeklyStoriesGoal > 0 ||
    goals.weeklyAllahNamesGoal > 0
  );
}

/** True when exercise/workout is tracked via per-type targets (goals settings), not legacy aggregate fields */
function hasActiveWorkoutTypeTargets(goals: AmanahGoals): boolean {
  if (!goals.workoutTypeGoals) return false;
  for (const typeGoals of Object.values(goals.workoutTypeGoals)) {
    if (typeGoals?.daily && typeGoals.daily > 0) return true;
    if (typeGoals?.weekly && typeGoals.weekly > 0) return true;
  }
  return false;
}

function countAmanahDailyWorkoutTargets(goals: AmanahGoals): number {
  if (!goals.workoutTypeGoals) return 0;
  let n = 0;
  for (const typeGoals of Object.values(goals.workoutTypeGoals)) {
    if (typeGoals?.daily && typeGoals.daily > 0) n += 1;
  }
  return n;
}

function countAmanahWeeklyWorkoutTargets(goals: AmanahGoals): number {
  if (!goals.workoutTypeGoals) return 0;
  let n = 0;
  for (const typeGoals of Object.values(goals.workoutTypeGoals)) {
    if (typeGoals?.weekly && typeGoals.weekly > 0) n += 1;
  }
  return n;
}

/** Amanah section contributes only if at least one wellness goal is enabled */
export function hasAmanahGoalsEnabled(goals: AmanahGoals): boolean {
  if (
    goals.dailyExerciseGoal > 0 ||
    goals.dailyWaterGoal > 0 ||
    goals.dailySleepGoal > 0 ||
    goals.weeklyWorkoutGoal > 0 ||
    goals.weeklyMeditationGoal > 0 ||
    goals.weeklyJournalGoal > 0
  ) {
    return true;
  }
  if (goals.workoutTypeGoals) {
    for (const typeGoals of Object.values(goals.workoutTypeGoals)) {
      if (typeGoals?.daily && typeGoals.daily > 0) return true;
      if (typeGoals?.weekly && typeGoals.weekly > 0) return true;
    }
  }
  return false;
}

/**
 * Ibadah always participates: fard prayers are always tracked, plus any optional toggles.
 */
export function hasIbadahSectionActive(_goals: IbadahGoals): boolean {
  return true;
}

/** True when the user has enabled at least one optional worship goal. Fard is tracked in Iman, not as a configurable goal. Used by welcome tour. */
export function hasWorshipGoalsChosen(goals: IbadahGoals): boolean {
  return (
    goals.sunnahDailyGoal > 0 ||
    goals.tahajjudWeeklyGoal > 0 ||
    goals.quranDailyPagesGoal > 0 ||
    goals.quranWeeklyMemorizationGoal > 0 ||
    goals.dhikrDailyGoal > 0 ||
    goals.duaDailyGoal > 0 ||
    goals.fastingWeeklyGoal > 0 ||
    goals.dhikrWeeklyGoal > 0
  );
}

export function getQuranPagesPeriod(goalsPick: Pick<IbadahGoals, 'quranPagesFrequency'>): QuranGoalPeriod {
  return goalsPick.quranPagesFrequency === 'weekly' ? 'weekly' : 'daily';
}

export function getQuranMemorizationPeriod(
  goalsPick: Pick<IbadahGoals, 'quranMemorizationFrequency'>
): QuranGoalPeriod {
  return goalsPick.quranMemorizationFrequency === 'daily' ? 'daily' : 'weekly';
}

/**
 * Overall Iman score: weighted blend of section scores, counting only sections with
 * at least one enabled goal (Ilm / Amanah). Weights are renormalized so they sum to 1
 * among active sections — completing every enabled goal yields 100%.
 */
export function calculateOverallImanScore(
  scores: SectionScores,
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals
): number {
  let wIbadah = hasIbadahSectionActive(ibadahGoals) ? SECTION_WEIGHTS.ibadah : 0;
  let wIlm = hasIlmGoalsEnabled(ilmGoals) ? SECTION_WEIGHTS.ilm : 0;
  let wAmanah = hasAmanahGoalsEnabled(amanahGoals) ? SECTION_WEIGHTS.amanah : 0;

  const sum = wIbadah + wIlm + wAmanah;
  if (sum <= 0) return 0;

  wIbadah /= sum;
  wIlm /= sum;
  wAmanah /= sum;

  return Math.round(
    scores.ibadah * wIbadah +
    scores.ilm * wIlm +
    scores.amanah * wAmanah
  );
}

// Ibadah goal weights (Fard prayers are most important)
const IBADAH_WEIGHTS = {
  fard: 5,       // Fard prayers weighted 5x
  normal: 1,     // Other goals weighted 1x
};

type GoalPeriod = 'daily' | 'weekly';

interface DecayCarryoverSnapshot {
  daily: Record<string, number>;
  weekly: Record<string, number>;
}

const EMPTY_DECAY_CARRYOVER: DecayCarryoverSnapshot = { daily: {}, weekly: {} };

function getDecayCarryoverKey(userId?: string | null): string {
  return userId ? `imanDecayCarryover_${userId}` : 'imanDecayCarryover';
}

async function loadDecayCarryover(userId?: string | null): Promise<DecayCarryoverSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(getDecayCarryoverKey(userId));
    if (!raw) return EMPTY_DECAY_CARRYOVER;
    const parsed = JSON.parse(raw) as Partial<DecayCarryoverSnapshot>;
    return {
      daily: parsed.daily ?? {},
      weekly: parsed.weekly ?? {},
    };
  } catch {
    return EMPTY_DECAY_CARRYOVER;
  }
}

async function saveDecayCarryover(snapshot: DecayCarryoverSnapshot, userId?: string | null): Promise<void> {
  await AsyncStorage.setItem(getDecayCarryoverKey(userId), JSON.stringify(snapshot));
}

function getDayElapsedRatio(now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start) / Math.max(1, end - start)));
}

function getWeekElapsedRatio(now: Date = new Date()): number {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday local start
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setMilliseconds(-1);
  return Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())));
}

function applyProgressDecay(
  goalKey: string,
  currentProgress: number,
  period: GoalPeriod,
  carryover: DecayCarryoverSnapshot
): number {
  const carryMap = period === 'daily' ? carryover.daily : carryover.weekly;
  const elapsed = period === 'daily' ? getDayElapsedRatio() : getWeekElapsedRatio();
  const priorProgress = Math.min(1, Math.max(0, carryMap[goalKey] ?? 0));
  // Decay-floor model:
  // - At the start of the period, show prior-period progress.
  // - As time passes, prior progress fades out.
  // - If the user makes progress in the current period, it becomes the floor (so it doesn't
  //   drop back down just because the day/week is moving forward).
  const decayedPrior = priorProgress * (1 - elapsed);
  const blended = Math.max(currentProgress, decayedPrior);
  return Math.min(1, Math.max(0, blended));
}

type FardPrayerKey = keyof IbadahGoals['fardPrayers'];

let dueFardCache:
  | {
      key: string; // YYYY-MM-DD-HH
      due: FardPrayerKey[];
    }
  | null = null;

function formatLocalHourCacheKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const h = `${d.getHours()}`.padStart(2, '0');
  return `${y}-${m}-${day}-${h}`;
}

function dueFardFallbackFromClock(now: Date): FardPrayerKey[] {
  const hour = now.getHours();
  const due: FardPrayerKey[] = ['fajr'];
  if (hour >= 12) due.push('dhuhr');
  if (hour >= 15) due.push('asr');
  if (hour >= 18) due.push('maghrib');
  if (hour >= 20) due.push('isha');
  return due;
}

/**
 * Determine which fard prayers should currently affect score.
 * A prayer only counts once its prayer time has begun.
 */
async function getDueFardPrayersNow(): Promise<FardPrayerKey[]> {
  const now = new Date();
  const cacheKey = formatLocalHourCacheKey(now);
  if (dueFardCache?.key === cacheKey) return dueFardCache.due;

  try {
    const today = await getTodayPrayerTimes();
    const due: FardPrayerKey[] = [];

    const map: Record<FardPrayerKey, Date> = {
      fajr: today.fajr.date,
      dhuhr: today.dhuhr.date,
      asr: today.asr.date,
      maghrib: today.maghrib.date,
      isha: today.isha.date,
    };

    (Object.keys(map) as FardPrayerKey[]).forEach((k) => {
      if (now >= map[k]) due.push(k);
    });

    const normalized: FardPrayerKey[] = due.length > 0 ? due : ['fajr'];
    dueFardCache = { key: cacheKey, due: normalized };
    return normalized;
  } catch {
    const fallback = dueFardFallbackFromClock(now);
    dueFardCache = { key: cacheKey, due: fallback };
    return fallback;
  }
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate progress percentage for a single goal
 */
function calculateProgress(completed: number, goal: number): number {
  if (goal <= 0) return 0; // Goal not enabled
  return Math.min(1, completed / goal); // Cap at 100%
}

/**
 * Calculate weighted average of progress items
 */
function weightedAverage(items: Array<{ progress: number; weight: number }>): number {
  if (items.length === 0) return 0;
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  
  const weightedSum = items.reduce((sum, item) => sum + (item.progress * item.weight), 0);
  return (weightedSum / totalWeight) * 100;
}

/**
 * Calculate Ibadah (Worship) score
 */
export async function calculateIbadahScore(
  goals: IbadahGoals,
  carryover: DecayCarryoverSnapshot = EMPTY_DECAY_CARRYOVER
): Promise<number> {
  const items: Array<{ progress: number; weight: number }> = [];

  // Fard prayers: only due prayers (time started) affect score.
  const dueFard = await getDueFardPrayersNow();
  const fardCompleted = dueFard.reduce(
    (sum, p) => sum + (goals.fardPrayers[p] ? 1 : 0),
    0
  );
  const fardProgress = calculateProgress(fardCompleted, Math.max(1, dueFard.length));
  items.push({
    progress: applyProgressDecay('ibadah.fard', fardProgress, 'daily', carryover),
    weight: IBADAH_WEIGHTS.fard,
  });

  // Optional goals (only if enabled)
  if (goals.sunnahDailyGoal > 0) {
    const current = calculateProgress(goals.sunnahCompleted, goals.sunnahDailyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.sunnah', current, 'daily', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.tahajjudWeeklyGoal > 0) {
    const current = calculateProgress(goals.tahajjudCompleted, goals.tahajjudWeeklyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.tahajjud', current, 'weekly', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.quranDailyPagesGoal > 0) {
    const current = calculateProgress(goals.quranDailyPagesCompleted, goals.quranDailyPagesGoal);
    const period = getQuranPagesPeriod(goals);
    const decayKey =
      period === 'daily' ? 'ibadah.quranDailyPages' : 'ibadah.quranPagesWeekly';
    items.push({
      progress: applyProgressDecay(decayKey, current, period, carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.quranWeeklyMemorizationGoal > 0) {
    const current = calculateProgress(goals.quranWeeklyMemorizationCompleted, goals.quranWeeklyMemorizationGoal);
    const period = getQuranMemorizationPeriod(goals);
    const decayKey =
      period === 'daily' ? 'ibadah.quranMemorizationDaily' : 'ibadah.quranWeeklyMemorization';
    items.push({
      progress: applyProgressDecay(decayKey, current, period, carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.dhikrDailyGoal > 0) {
    const current = calculateProgress(goals.dhikrDailyCompleted, goals.dhikrDailyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.dhikrDaily', current, 'daily', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.dhikrWeeklyGoal > 0) {
    const current = calculateProgress(goals.dhikrWeeklyCompleted, goals.dhikrWeeklyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.dhikrWeekly', current, 'weekly', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.duaDailyGoal > 0) {
    const current = calculateProgress(goals.duaDailyCompleted || 0, goals.duaDailyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.duaDaily', current, 'daily', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.fastingWeeklyGoal > 0) {
    const current = calculateProgress(goals.fastingWeeklyCompleted, goals.fastingWeeklyGoal);
    items.push({
      progress: applyProgressDecay('ibadah.fastingWeekly', current, 'weekly', carryover),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  return Math.round(weightedAverage(items));
}

/**
 * Calculate Ilm (Knowledge) score
 */
export async function calculateIlmScore(
  goals: IlmGoals,
  carryover: DecayCarryoverSnapshot = EMPTY_DECAY_CARRYOVER
): Promise<number> {
  const items: Array<{ progress: number; weight: number }> = [];

  if (goals.weeklyLecturesGoal > 0) {
    const current = calculateProgress(goals.weeklyLecturesCompleted, goals.weeklyLecturesGoal);
    items.push({
      progress: applyProgressDecay('ilm.weeklyLectures', current, 'weekly', carryover),
      weight: 1,
    });
  }


  if (goals.weeklyQuizzesGoal > 0) {
    const current = calculateProgress(goals.weeklyQuizzesCompleted, goals.weeklyQuizzesGoal);
    items.push({
      progress: applyProgressDecay('ilm.weeklyQuizzes', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (goals.weeklyReflectionGoal > 0) {
    const current = calculateProgress(goals.weeklyReflectionCompleted, goals.weeklyReflectionGoal);
    items.push({
      progress: applyProgressDecay('ilm.weeklyReflection', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (goals.weeklyStoriesGoal > 0) {
    const current = calculateProgress(goals.weeklyStoriesCompleted, goals.weeklyStoriesGoal);
    items.push({
      progress: applyProgressDecay('ilm.weeklyStories', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (goals.weeklyAllahNamesGoal > 0) {
    const current = calculateProgress(goals.weeklyAllahNamesCompleted, goals.weeklyAllahNamesGoal);
    items.push({
      progress: applyProgressDecay('ilm.weeklyAllahNames', current, 'weekly', carryover),
      weight: 1,
    });
  }

  return Math.round(weightedAverage(items));
}

/**
 * Calculate Amanah (Well-Being) score
 *
 * Exercise: when workoutTypeGoals has any target, that is the only source for exercise/workout
 * (avoids double-counting the same toggles as both dailyExerciseGoal and per-type rows).
 * Per-type completion falls back to dailyExerciseCompleted / weeklyWorkoutCompleted when there is
 * exactly one active daily or weekly workout target — those fields are what physical-health updates.
 */
export async function calculateAmanahScore(
  goals: AmanahGoals,
  carryover: DecayCarryoverSnapshot = EMPTY_DECAY_CARRYOVER
): Promise<number> {
  const items: Array<{ progress: number; weight: number }> = [];
  const useWorkoutTypeBreakdown = hasActiveWorkoutTypeTargets(goals);
  const dailyWorkoutTargetCount = countAmanahDailyWorkoutTargets(goals);
  const weeklyWorkoutTargetCount = countAmanahWeeklyWorkoutTargets(goals);

  // Daily goals — aggregate exercise only when not using per-type workout goals
  if (!useWorkoutTypeBreakdown && goals.dailyExerciseGoal > 0) {
    const current = calculateProgress(goals.dailyExerciseCompleted, goals.dailyExerciseGoal);
    items.push({
      progress: applyProgressDecay('amanah.dailyExercise', current, 'daily', carryover),
      weight: 1,
    });
  }

  if (goals.dailyWaterGoal > 0) {
    const current = calculateProgress(goals.dailyWaterCompleted, goals.dailyWaterGoal);
    items.push({
      progress: applyProgressDecay('amanah.dailyWater', current, 'daily', carryover),
      weight: 1,
    });
  }

  if (goals.dailySleepGoal > 0) {
    const current = calculateProgress(goals.dailySleepCompleted, goals.dailySleepGoal);
    items.push({
      progress: applyProgressDecay('amanah.dailySleep', current, 'daily', carryover),
      weight: 1,
    });
  }

  // Legacy weekly workout count — skip when using workout-type weekly targets
  if (!useWorkoutTypeBreakdown && goals.weeklyWorkoutGoal > 0) {
    const current = calculateProgress(goals.weeklyWorkoutCompleted, goals.weeklyWorkoutGoal);
    items.push({
      progress: applyProgressDecay('amanah.weeklyWorkout', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (goals.weeklyMeditationGoal > 0) {
    const current = calculateProgress(goals.weeklyMeditationCompleted, goals.weeklyMeditationGoal);
    items.push({
      progress: applyProgressDecay('amanah.weeklyMeditation', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (goals.weeklyJournalGoal > 0) {
    const current = calculateProgress(goals.weeklyJournalCompleted, goals.weeklyJournalGoal);
    items.push({
      progress: applyProgressDecay('amanah.weeklyJournal', current, 'weekly', carryover),
      weight: 1,
    });
  }

  if (useWorkoutTypeBreakdown && goals.workoutTypeGoals) {
    for (const [type, typeGoals] of Object.entries(goals.workoutTypeGoals)) {
      if (typeGoals?.daily && typeGoals.daily > 0) {
        const fromType =
          goals.workoutTypeCompleted?.[type as keyof NonNullable<typeof goals.workoutTypeCompleted>]?.daily ?? 0;
        const completed =
          fromType ||
          (dailyWorkoutTargetCount === 1 ? (goals.dailyExerciseCompleted ?? 0) : 0);
        const current = calculateProgress(completed, typeGoals.daily);
        items.push({
          progress: applyProgressDecay(`amanah.workoutTypeDaily.${type}`, current, 'daily', carryover),
          weight: 1,
        });
      }
      if (typeGoals?.weekly && typeGoals.weekly > 0) {
        const fromType =
          goals.workoutTypeCompleted?.[type as keyof NonNullable<typeof goals.workoutTypeCompleted>]?.weekly ?? 0;
        const completed =
          fromType ||
          (weeklyWorkoutTargetCount === 1 ? (goals.weeklyWorkoutCompleted ?? 0) : 0);
        const current = calculateProgress(completed, typeGoals.weekly);
        items.push({
          progress: applyProgressDecay(`amanah.workoutTypeWeekly.${type}`, current, 'weekly', carryover),
          weight: 1,
        });
      }
    }
  }

  return Math.round(weightedAverage(items));
}

/**
 * Calculate all section scores
 */
export async function calculateAllSectionScores(
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals,
  userId?: string | null
): Promise<SectionScores> {
  const carryover = await loadDecayCarryover(userId);
  const ibadahScore = await calculateIbadahScore(ibadahGoals, carryover);
  const ilmScore = await calculateIlmScore(ilmGoals, carryover);
  const amanahScore = await calculateAmanahScore(amanahGoals, carryover);
  const scores: SectionScores = {
    ibadah: ibadahScore,
    ilm: ilmScore,
    amanah: amanahScore,
  };

  // Save scores to storage
  if (userId) {
    try {
      await AsyncStorage.setItem(`sectionScores_${userId}`, JSON.stringify(scores));
      await AsyncStorage.setItem(`sectionScoresLastUpdated_${userId}`, new Date().toISOString());
    } catch (error) {
      console.error('Error saving section scores:', error);
    }
  }

  return scores;
}

/**
 * Get current section scores
 */
export async function getCurrentSectionScores(userId?: string | null, forceRecalculate?: boolean): Promise<SectionScores> {
  try {
    // Check cache if not forcing recalculation
    if (!forceRecalculate && userId) {
      const cached = await AsyncStorage.getItem(`sectionScores_${userId}`);
      const lastUpdated = await AsyncStorage.getItem(`sectionScoresLastUpdated_${userId}`);
      
      if (cached && lastUpdated) {
        const lastUpdateTime = new Date(lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
        
        // Scores are time-decayed; keep cache short so decay stays smooth.
        if (hoursSinceUpdate < (5 / 60)) {
          return JSON.parse(cached);
        }
      }
    }

    // Recalculate
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);

    return await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals, userId);
  } catch (error) {
    console.error('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

/**
 * Get overall Iman score (weighted combination of active sections only)
 */
export async function getOverallImanScore(userId?: string | null): Promise<number> {
  const [ibadahGoals, ilmGoals, amanahGoals] = await Promise.all([
    loadIbadahGoals(userId),
    loadIlmGoals(userId),
    loadAmanahGoals(userId),
  ]);
  const scores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals, userId);
  return calculateOverallImanScore(scores, ibadahGoals, ilmGoals, amanahGoals);
}

/**
 * Update section scores (alias for getCurrentSectionScores)
 */
export async function updateSectionScores(userId?: string | null): Promise<SectionScores> {
  return await getCurrentSectionScores(userId, true);
}

// ============================================================================
// RESET FUNCTIONS
// ============================================================================

export async function resetDailyGoals(userId?: string | null): Promise<void> {
  try {
    const ibadahGoals = await loadIbadahGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);
    const carryover = await loadDecayCarryover(userId);
    const nextDailyCarryover: Record<string, number> = {};

    const fardCompletedCount = Object.values(ibadahGoals.fardPrayers).reduce(
      (sum, v) => sum + (v ? 1 : 0),
      0
    );
    // Store as a ratio so scoring can treat it as progress (0..1).
    nextDailyCarryover['ibadah.fard'] = fardCompletedCount / 5;

    nextDailyCarryover['ibadah.sunnah'] = calculateProgress(ibadahGoals.sunnahCompleted, ibadahGoals.sunnahDailyGoal);
    if (getQuranPagesPeriod(ibadahGoals) === 'daily' && ibadahGoals.quranDailyPagesGoal > 0) {
      nextDailyCarryover['ibadah.quranDailyPages'] = calculateProgress(
        ibadahGoals.quranDailyPagesCompleted,
        ibadahGoals.quranDailyPagesGoal
      );
    }
    if (getQuranMemorizationPeriod(ibadahGoals) === 'daily' && ibadahGoals.quranWeeklyMemorizationGoal > 0) {
      nextDailyCarryover['ibadah.quranMemorizationDaily'] = calculateProgress(
        ibadahGoals.quranWeeklyMemorizationCompleted,
        ibadahGoals.quranWeeklyMemorizationGoal
      );
    }
    nextDailyCarryover['ibadah.dhikrDaily'] = calculateProgress(ibadahGoals.dhikrDailyCompleted, ibadahGoals.dhikrDailyGoal);
    nextDailyCarryover['ibadah.duaDaily'] = calculateProgress(ibadahGoals.duaDailyCompleted || 0, ibadahGoals.duaDailyGoal);
    nextDailyCarryover['amanah.dailyExercise'] = calculateProgress(amanahGoals.dailyExerciseCompleted, amanahGoals.dailyExerciseGoal);
    nextDailyCarryover['amanah.dailyWater'] = calculateProgress(amanahGoals.dailyWaterCompleted, amanahGoals.dailyWaterGoal);
    nextDailyCarryover['amanah.dailySleep'] = calculateProgress(amanahGoals.dailySleepCompleted, amanahGoals.dailySleepGoal);
    const dailyWorkoutTargetCount = countAmanahDailyWorkoutTargets(amanahGoals);
    if (amanahGoals.workoutTypeGoals) {
      for (const [type, typeGoals] of Object.entries(amanahGoals.workoutTypeGoals)) {
        if (typeGoals?.daily && typeGoals.daily > 0) {
          const completed =
            amanahGoals.workoutTypeCompleted?.[type as keyof NonNullable<typeof amanahGoals.workoutTypeCompleted>]?.daily ??
            (dailyWorkoutTargetCount === 1 ? (amanahGoals.dailyExerciseCompleted ?? 0) : 0);
          nextDailyCarryover[`amanah.workoutTypeDaily.${type}`] = calculateProgress(completed, typeGoals.daily);
        }
      }
    }
    await saveDecayCarryover({ ...carryover, daily: nextDailyCarryover }, userId);
    
    // Reset daily counters
    ibadahGoals.fardPrayers = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    ibadahGoals.sunnahCompleted = 0;
    if (getQuranPagesPeriod(ibadahGoals) === 'daily') {
      ibadahGoals.quranDailyPagesCompleted = 0;
    }
    if (getQuranMemorizationPeriod(ibadahGoals) === 'daily') {
      ibadahGoals.quranWeeklyMemorizationCompleted = 0;
    }
    ibadahGoals.dhikrDailyCompleted = 0;
    ibadahGoals.duaDailyCompleted = 0;
    
    amanahGoals.dailyExerciseCompleted = 0;
    amanahGoals.dailyWaterCompleted = 0;
    amanahGoals.dailySleepCompleted = 0;
    
    // Reset workout type daily goals
    if (amanahGoals.workoutTypeCompleted) {
      for (const type in amanahGoals.workoutTypeCompleted) {
        if (amanahGoals.workoutTypeCompleted[type as keyof typeof amanahGoals.workoutTypeCompleted]) {
          const typeData = amanahGoals.workoutTypeCompleted[type as keyof typeof amanahGoals.workoutTypeCompleted];
          if (typeData) {
            typeData.daily = 0;
          }
        }
      }
    }
    
    const ibadahKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
    const amanahKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    await AsyncStorage.setItem(ibadahKey, JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem(amanahKey, JSON.stringify(amanahGoals));
  } catch (error) {
    console.error('Error resetting daily goals:', error);
  }
}

export async function resetWeeklyGoals(userId?: string | null): Promise<void> {
  try {
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);
    const carryover = await loadDecayCarryover(userId);
    const nextWeeklyCarryover: Record<string, number> = {};
    nextWeeklyCarryover['ibadah.tahajjud'] = calculateProgress(ibadahGoals.tahajjudCompleted, ibadahGoals.tahajjudWeeklyGoal);
    nextWeeklyCarryover['ibadah.dhikrWeekly'] = calculateProgress(ibadahGoals.dhikrWeeklyCompleted, ibadahGoals.dhikrWeeklyGoal);
    if (getQuranPagesPeriod(ibadahGoals) === 'weekly' && ibadahGoals.quranDailyPagesGoal > 0) {
      nextWeeklyCarryover['ibadah.quranPagesWeekly'] = calculateProgress(
        ibadahGoals.quranDailyPagesCompleted,
        ibadahGoals.quranDailyPagesGoal
      );
    }
    if (getQuranMemorizationPeriod(ibadahGoals) === 'weekly' && ibadahGoals.quranWeeklyMemorizationGoal > 0) {
      nextWeeklyCarryover['ibadah.quranWeeklyMemorization'] = calculateProgress(
        ibadahGoals.quranWeeklyMemorizationCompleted,
        ibadahGoals.quranWeeklyMemorizationGoal
      );
    }
    nextWeeklyCarryover['ibadah.fastingWeekly'] = calculateProgress(ibadahGoals.fastingWeeklyCompleted, ibadahGoals.fastingWeeklyGoal);
    nextWeeklyCarryover['ilm.weeklyLectures'] = calculateProgress(ilmGoals.weeklyLecturesCompleted, ilmGoals.weeklyLecturesGoal);
    nextWeeklyCarryover['ilm.weeklyQuizzes'] = calculateProgress(ilmGoals.weeklyQuizzesCompleted, ilmGoals.weeklyQuizzesGoal);
    nextWeeklyCarryover['ilm.weeklyReflection'] = calculateProgress(ilmGoals.weeklyReflectionCompleted, ilmGoals.weeklyReflectionGoal);
    nextWeeklyCarryover['ilm.weeklyStories'] = calculateProgress(ilmGoals.weeklyStoriesCompleted, ilmGoals.weeklyStoriesGoal);
    nextWeeklyCarryover['ilm.weeklyAllahNames'] = calculateProgress(ilmGoals.weeklyAllahNamesCompleted, ilmGoals.weeklyAllahNamesGoal);
    nextWeeklyCarryover['amanah.weeklyWorkout'] = calculateProgress(amanahGoals.weeklyWorkoutCompleted, amanahGoals.weeklyWorkoutGoal);
    const weeklyWorkoutTargetCount = countAmanahWeeklyWorkoutTargets(amanahGoals);
    nextWeeklyCarryover['amanah.weeklyMeditation'] = calculateProgress(
      amanahGoals.weeklyMeditationCompleted,
      amanahGoals.weeklyMeditationGoal
    );
    nextWeeklyCarryover['amanah.weeklyJournal'] = calculateProgress(amanahGoals.weeklyJournalCompleted, amanahGoals.weeklyJournalGoal);
    if (amanahGoals.workoutTypeGoals) {
      for (const [type, typeGoals] of Object.entries(amanahGoals.workoutTypeGoals)) {
        if (typeGoals?.weekly && typeGoals.weekly > 0) {
          const completed =
            amanahGoals.workoutTypeCompleted?.[type as keyof NonNullable<typeof amanahGoals.workoutTypeCompleted>]?.weekly ??
            (weeklyWorkoutTargetCount === 1 ? (amanahGoals.weeklyWorkoutCompleted ?? 0) : 0);
          nextWeeklyCarryover[`amanah.workoutTypeWeekly.${type}`] = calculateProgress(completed, typeGoals.weekly);
        }
      }
    }
    await saveDecayCarryover({ ...carryover, weekly: nextWeeklyCarryover }, userId);
    
    // Reset weekly counters
    ibadahGoals.tahajjudCompleted = 0;
    ibadahGoals.dhikrWeeklyCompleted = 0;
    if (getQuranPagesPeriod(ibadahGoals) === 'weekly') {
      ibadahGoals.quranDailyPagesCompleted = 0;
    }
    if (getQuranMemorizationPeriod(ibadahGoals) === 'weekly') {
      ibadahGoals.quranWeeklyMemorizationCompleted = 0;
    }
    ibadahGoals.fastingWeeklyCompleted = 0;
    
    ilmGoals.weeklyLecturesCompleted = 0;
    ilmGoals.weeklyQuizzesCompleted = 0;
    ilmGoals.weeklyReflectionCompleted = 0;
    ilmGoals.weeklyStoriesCompleted = 0;
    ilmGoals.weeklyAllahNamesCompleted = 0;
    
    amanahGoals.weeklyWorkoutCompleted = 0;
    amanahGoals.weeklyMeditationCompleted = 0;
    amanahGoals.weeklyJournalCompleted = 0;
    amanahGoals.weeklyMentalHealthCompleted = 0;
    amanahGoals.weeklyStressManagementCompleted = 0;
    
    // Reset workout type weekly goals
    if (amanahGoals.workoutTypeCompleted) {
      for (const type in amanahGoals.workoutTypeCompleted) {
        if (amanahGoals.workoutTypeCompleted[type as keyof typeof amanahGoals.workoutTypeCompleted]) {
          const typeData = amanahGoals.workoutTypeCompleted[type as keyof typeof amanahGoals.workoutTypeCompleted];
          if (typeData) {
            typeData.weekly = 0;
          }
        }
      }
    }
    
    const ibadahKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
    const ilmKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
    const amanahKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    await AsyncStorage.setItem(ibadahKey, JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem(ilmKey, JSON.stringify(ilmGoals));
    await AsyncStorage.setItem(amanahKey, JSON.stringify(amanahGoals));
  } catch (error) {
    console.error('Error resetting weekly goals:', error);
  }
}

function getLocalMidnightDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const localMidnight = new Date(year, month, date, 0, 0, 0, 0);
  return localMidnight.toDateString();
}

function isNewDay(lastDateString: string | null, currentDateString: string): boolean {
  if (!lastDateString) return false;
  return lastDateString !== currentDateString;
}

function getLocalWeekStartDateString(now: Date = new Date()): string {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return start.toDateString();
}

export async function checkAndHandleResets(userId?: string | null): Promise<void> {
  try {
    const today = getLocalMidnightDateString();
    const now = new Date();
    
    const lastDateKey = userId ? `lastImanDate_${userId}` : 'lastImanDate';
    const lastDate = await AsyncStorage.getItem(lastDateKey);
    if (!lastDate) {
      await AsyncStorage.setItem(lastDateKey, today);
    }
    
    if (isNewDay(lastDate, today)) {
      await resetDailyGoals(userId);
      await AsyncStorage.setItem(lastDateKey, today);
    }
    
    const currentWeekStart = getLocalWeekStartDateString(now);
    const lastWeeklyResetKey = userId ? `lastWeeklyResetDate_${userId}` : 'lastWeeklyResetDate';
    const lastWeeklyReset = await AsyncStorage.getItem(lastWeeklyResetKey);
    if (!lastWeeklyReset) {
      await AsyncStorage.setItem(lastWeeklyResetKey, currentWeekStart);
      return;
    }
    if (lastWeeklyReset !== currentWeekStart) {
      await resetWeeklyGoals(userId);
      await AsyncStorage.setItem(lastWeeklyResetKey, currentWeekStart);
    }
  } catch (error) {
    console.error('Error checking and handling resets:', error);
  }
}

// ============================================================================
// LOAD/SAVE FUNCTIONS
// ============================================================================

export async function loadIbadahGoals(userId?: string | null): Promise<IbadahGoals> {
  try {
    const storageKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, unknown> & Partial<IbadahGoals>;
      // Handle legacy field name
      if (parsed.duaCompleted !== undefined && parsed.duaDailyCompleted === undefined) {
        const dc = parsed.duaCompleted;
        parsed.duaDailyCompleted = typeof dc === 'number' ? dc : Number(dc) || 0;
      }
      delete parsed.quranDailyVersesGoal;
      delete parsed.quranDailyVersesCompleted;
      parsed.quranPagesFrequency = parsed.quranPagesFrequency === 'weekly' ? 'weekly' : 'daily';
      parsed.quranMemorizationFrequency = parsed.quranMemorizationFrequency === 'daily' ? 'daily' : 'weekly';
      return parsed as IbadahGoals;
    }
  } catch (error) {
    console.error('Error loading ibadah goals:', error);
  }
  
  return {
    fardPrayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    sunnahDailyGoal: 0,
    sunnahCompleted: 0,
    tahajjudWeeklyGoal: 0,
    tahajjudCompleted: 0,
    quranDailyPagesGoal: 0,
    quranDailyPagesCompleted: 0,
    quranPagesFrequency: 'daily',
    quranWeeklyMemorizationGoal: 0,
    quranWeeklyMemorizationCompleted: 0,
    quranMemorizationFrequency: 'weekly',
    dhikrDailyGoal: 0,
    dhikrDailyCompleted: 0,
    dhikrWeeklyGoal: 0,
    dhikrWeeklyCompleted: 0,
    duaDailyGoal: 0,
    duaDailyCompleted: 0,
    fastingWeeklyGoal: 0,
    fastingWeeklyCompleted: 0,
    score: 0,
  };
}

const DEFAULT_ILM_GOALS: IlmGoals = {
  weeklyLecturesGoal: 0,
  weeklyLecturesCompleted: 0,
  weeklyQuizzesGoal: 0,
  weeklyQuizzesCompleted: 0,
  weeklyReflectionGoal: 0,
  weeklyReflectionCompleted: 0,
  weeklyStoriesGoal: 0,
  weeklyStoriesCompleted: 0,
  weeklyAllahNamesGoal: 0,
  weeklyAllahNamesCompleted: 0,
  score: 0,
};

export async function loadIlmGoals(userId?: string | null): Promise<IlmGoals> {
  try {
    const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<IlmGoals>;
      return { ...DEFAULT_ILM_GOALS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading ilm goals:', error);
  }
  
  return { ...DEFAULT_ILM_GOALS };
}

export async function loadAmanahGoals(userId?: string | null): Promise<AmanahGoals> {
  try {
    const storageKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      if (!Object.prototype.hasOwnProperty.call(parsed, 'weeklyMeditationGoal')) {
        const mentalHealthGoal = parsed.weeklyMentalHealthGoal || 0;
        const mentalHealthCompleted = parsed.weeklyMentalHealthCompleted || 0;
        parsed.weeklyMeditationGoal = Math.ceil(mentalHealthGoal / 2);
        parsed.weeklyMeditationCompleted = Math.floor(mentalHealthCompleted / 2);
        parsed.weeklyJournalGoal = Math.floor(mentalHealthGoal / 2);
        parsed.weeklyJournalCompleted = Math.ceil(mentalHealthCompleted / 2);
      }
      
      // Initialize workout type structures if missing
      if (!parsed.workoutTypeGoals) {
        parsed.workoutTypeGoals = {};
      }
      if (!parsed.workoutTypeCompleted) {
        parsed.workoutTypeCompleted = {};
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading amanah goals:', error);
  }
  
  return {
    dailyExerciseGoal: 0,
    dailyExerciseCompleted: 0,
    dailyWaterGoal: 0,
    dailyWaterCompleted: 0,
    weeklyWorkoutGoal: 0,
    weeklyWorkoutCompleted: 0,
    weeklyMeditationGoal: 0,
    weeklyMeditationCompleted: 0,
    weeklyJournalGoal: 0,
    weeklyJournalCompleted: 0,
    weeklyMentalHealthGoal: 0,
    weeklyMentalHealthCompleted: 0,
    dailySleepGoal: 0,
    dailySleepCompleted: 0,
    weeklyStressManagementGoal: 0,
    weeklyStressManagementCompleted: 0,
    workoutTypeGoals: {},
    workoutTypeCompleted: {},
    score: 0,
  };
}

export async function saveIbadahGoals(goals: IbadahGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);

  if (userId) {
    try {
      const { trackPrayerCompletion, trackDhikrCompletion, trackQuranReading } = await import('./imanActivityIntegration');
      const oldGoals = await loadIbadahGoals(userId);

      if (!oldGoals.fardPrayers.fajr && goals.fardPrayers.fajr) {
        await trackPrayerCompletion(userId, 'fajr');
      }
      if (!oldGoals.fardPrayers.dhuhr && goals.fardPrayers.dhuhr) {
        await trackPrayerCompletion(userId, 'dhuhr');
      }
      if (!oldGoals.fardPrayers.asr && goals.fardPrayers.asr) {
        await trackPrayerCompletion(userId, 'asr');
      }
      if (!oldGoals.fardPrayers.maghrib && goals.fardPrayers.maghrib) {
        await trackPrayerCompletion(userId, 'maghrib');
      }
      if (!oldGoals.fardPrayers.isha && goals.fardPrayers.isha) {
        await trackPrayerCompletion(userId, 'isha');
      }

      const dhikrDailyIncrease = Math.max(0, goals.dhikrDailyCompleted - oldGoals.dhikrDailyCompleted);
      const dhikrWeeklyIncrease = Math.max(0, goals.dhikrWeeklyCompleted - oldGoals.dhikrWeeklyCompleted);
      const totalDhikrIncrease = dhikrDailyIncrease + dhikrWeeklyIncrease;

      if (totalDhikrIncrease > 0) {
        await trackDhikrCompletion(userId, totalDhikrIncrease);
      }

      const quranPagesIncrease = Math.max(0, goals.quranDailyPagesCompleted - oldGoals.quranDailyPagesCompleted);

      if (quranPagesIncrease > 0) {
        await trackQuranReading(userId, quranPagesIncrease);
      }
    } catch (error) {
      console.log('Activity tracking skipped:', error);
    }
  }
}

export async function saveIlmGoals(goals: IlmGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);
  
  if (userId) {
    try {
      const { checkAndUnlockAchievements } = await import('./achievementService');
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.log('Achievement check skipped:', error);
    }
  }
}

export async function saveAmanahGoals(goals: AmanahGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);
  
  if (userId) {
    try {
      const { checkAndUnlockAchievements } = await import('./achievementService');
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.log('Achievement check skipped:', error);
    }
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

export interface PrayerGoals {
  fardPrayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  sunnahDailyGoal: number;
  sunnahCompleted: number;
  tahajjudWeeklyGoal: number;
  tahajjudCompleted: number;
  score?: number;
}

export interface DhikrGoals {
  dailyGoal: number;
  dailyCompleted: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  score?: number;
}

export interface QuranGoals {
  dailyPagesGoal: number;
  dailyPagesCompleted: number;
  weeklyMemorizationGoal: number;
  weeklyMemorizationCompleted: number;
  pagesFrequency?: QuranGoalPeriod;
  memorizationFrequency?: QuranGoalPeriod;
  score?: number;
}

export async function loadPrayerGoals(): Promise<PrayerGoals> {
  const ibadah = await loadIbadahGoals();
  return {
    fardPrayers: ibadah.fardPrayers,
    sunnahDailyGoal: ibadah.sunnahDailyGoal,
    sunnahCompleted: ibadah.sunnahCompleted,
    tahajjudWeeklyGoal: ibadah.tahajjudWeeklyGoal,
    tahajjudCompleted: ibadah.tahajjudCompleted,
    score: ibadah.score,
  };
}

export async function loadDhikrGoals(): Promise<DhikrGoals> {
  const ibadah = await loadIbadahGoals();
  return {
    dailyGoal: ibadah.dhikrDailyGoal,
    dailyCompleted: ibadah.dhikrDailyCompleted,
    weeklyGoal: ibadah.dhikrWeeklyGoal,
    weeklyCompleted: ibadah.dhikrWeeklyCompleted,
    score: ibadah.score,
  };
}

export async function loadQuranGoals(): Promise<QuranGoals> {
  const ibadah = await loadIbadahGoals();
  return {
    dailyPagesGoal: ibadah.quranDailyPagesGoal,
    dailyPagesCompleted: ibadah.quranDailyPagesCompleted,
    weeklyMemorizationGoal: ibadah.quranWeeklyMemorizationGoal,
    weeklyMemorizationCompleted: ibadah.quranWeeklyMemorizationCompleted,
    pagesFrequency: getQuranPagesPeriod(ibadah),
    memorizationFrequency: getQuranMemorizationPeriod(ibadah),
    score: ibadah.score,
  };
}

export async function savePrayerGoals(goals: PrayerGoals): Promise<void> {
  const ibadah = await loadIbadahGoals();
  ibadah.fardPrayers = goals.fardPrayers;
  ibadah.sunnahDailyGoal = goals.sunnahDailyGoal;
  ibadah.sunnahCompleted = goals.sunnahCompleted;
  ibadah.tahajjudWeeklyGoal = goals.tahajjudWeeklyGoal;
  ibadah.tahajjudCompleted = goals.tahajjudCompleted;
  await saveIbadahGoals(ibadah);
}

export async function saveDhikrGoals(goals: DhikrGoals): Promise<void> {
  const ibadah = await loadIbadahGoals();
  ibadah.dhikrDailyGoal = goals.dailyGoal;
  ibadah.dhikrDailyCompleted = goals.dailyCompleted;
  ibadah.dhikrWeeklyGoal = goals.weeklyGoal;
  ibadah.dhikrWeeklyCompleted = goals.weeklyCompleted;
  await saveIbadahGoals(ibadah);
}

export async function saveQuranGoals(goals: QuranGoals): Promise<void> {
  const ibadah = await loadIbadahGoals();
  ibadah.quranDailyPagesGoal = goals.dailyPagesGoal;
  ibadah.quranDailyPagesCompleted = goals.dailyPagesCompleted;
  ibadah.quranWeeklyMemorizationGoal = goals.weeklyMemorizationGoal;
  ibadah.quranWeeklyMemorizationCompleted = goals.weeklyMemorizationCompleted;
  if (goals.pagesFrequency) {
    ibadah.quranPagesFrequency = goals.pagesFrequency === 'weekly' ? 'weekly' : 'daily';
  }
  if (goals.memorizationFrequency) {
    ibadah.quranMemorizationFrequency = goals.memorizationFrequency === 'daily' ? 'daily' : 'weekly';
  }
  await saveIbadahGoals(ibadah);
}
