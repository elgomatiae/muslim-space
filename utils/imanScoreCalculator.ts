/**
 * ============================================================================
 * IMAN SCORE CALCULATION SYSTEM - LONG-TERM TRACKING
 * ============================================================================
 * 
 * CORE PRINCIPLES:
 * 1. Long-term consistency matters - score reflects historical performance
 * 2. Daily resets don't crash your score - gradual decay over time
 * 3. Today's progress blends with historical average (70% history, 30% today)
 * 4. Score only decays slowly when you're inactive, not at midnight
 * 5. Completing goals builds up your long-term score over time
 * 
 * CALCULATION METHOD:
 * - Today's score = (completed actions / enabled goals) * 100
 * - Long-term score = blend of historical average + today's contribution
 * - Historical average decays slowly (loses ~5% per day of inactivity)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// INTERFACES
// ============================================================================

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
  
  // Quran - Daily
  quranDailyPagesGoal: number;
  quranDailyPagesCompleted: number;
  quranDailyVersesGoal: number;
  quranDailyVersesCompleted: number;
  
  // Quran - Weekly
  quranWeeklyMemorizationGoal: number;
  quranWeeklyMemorizationCompleted: number;
  
  // Dhikr & Dua - Daily
  dhikrDailyGoal: number;
  dhikrDailyCompleted: number;
  duaDailyGoal: number;
  duaDailyCompleted: number; // Note: Also supports legacy 'duaCompleted' field name
  
  // Dhikr - Weekly
  dhikrWeeklyGoal: number;
  dhikrWeeklyCompleted: number;
  
  // Fasting - Weekly (optional)
  fastingWeeklyGoal: number;
  fastingWeeklyCompleted: number;
  
  score?: number;
}

export interface IlmGoals {
  weeklyLecturesGoal: number;
  weeklyLecturesCompleted: number;
  weeklyRecitationsGoal: number;
  weeklyRecitationsCompleted: number;
  weeklyQuizzesGoal: number;
  weeklyQuizzesCompleted: number;
  weeklyReflectionGoal: number;
  weeklyReflectionCompleted: number;
  
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
  
  // Mental health - Weekly (SEPARATED)
  weeklyMeditationGoal: number;
  weeklyMeditationCompleted: number;
  weeklyJournalGoal: number;
  weeklyJournalCompleted: number;
  
  // Legacy field for backward compatibility
  weeklyMentalHealthGoal: number;
  weeklyMentalHealthCompleted: number;
  weeklyStressManagementGoal: number;
  weeklyStressManagementCompleted: number;
  
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

const WEIGHTS = {
  // Overall ring weights for overall Iman score
  ibadah: 0.60,  // 60% - Most important (Worship is the foundation)
  ilm: 0.25,     // 25% - Knowledge (Understanding and learning)
  amanah: 0.15,  // 15% - Well-being (Physical and mental health)
};

// ============================================================================
// DECAY + WEIGHT CONFIG
// ============================================================================

type RingType = 'ibadah' | 'ilm' | 'amanah';

const IBADAH_GOAL_WEIGHTS = {
  // Fard should dominate ibadah
  fard: 5,        // << HEAVY
  normal: 1,
};

const DECAY_CONFIG: Record<RingType, { halfLifeHours: number; floor: number }> = {
  // tweak these freely
  ibadah: { halfLifeHours: 30, floor: 0.35 },  // decays slower, but not zero
  ilm:    { halfLifeHours: 42, floor: 0.30 },
  amanah: { halfLifeHours: 36, floor: 0.30 },
};

function nowISO() {
  return new Date().toISOString();
}

function hoursBetween(a: Date, b: Date) {
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60));
}

/**
 * Exponential decay:
 * multiplier = floor + (1 - floor) * 0.5^(hours / halfLifeHours)
 */
function applyDecay(rawScore: number, hoursInactive: number, ring: RingType) {
  const { halfLifeHours, floor } = DECAY_CONFIG[ring];
  const multiplier = floor + (1 - floor) * Math.pow(0.5, hoursInactive / halfLifeHours);
  return Math.round(rawScore * multiplier);
}

async function getLastActivity(userId: string | null | undefined, ring: RingType): Promise<Date | null> {
  try {
    if (!userId) return null;
    const key = `iman_lastActivity_${ring}_${userId}`;
    const v = await AsyncStorage.getItem(key);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

async function setLastActivity(userId: string | null | undefined, ring: RingType): Promise<void> {
  try {
    if (!userId) return;
    const key = `iman_lastActivity_${ring}_${userId}`;
    await AsyncStorage.setItem(key, nowISO());
  } catch {
    // ignore
  }
}

function weightedAverage(items: Array<{ label: string; progress: number; weight: number }>): number {
  if (items.length === 0) return 0;
  const totalW = items.reduce((s, x) => s + x.weight, 0);
  if (totalW <= 0) return 0;
  const sum = items.reduce((s, x) => s + x.progress * x.weight, 0);
  return (sum / totalW) * 100;
}

// ============================================================================
// IBADAH SCORE CALCULATION - NEW SIMPLE SYSTEM
// ============================================================================

/**
 * Calculate Ibadah score based purely on completed actions vs enabled goals
 * Each enabled goal contributes equally to the final score
 */
export async function calculateIbadahScore(goals: IbadahGoals, userId?: string | null): Promise<number> {
  console.log('\n🕌 ========== IBADAH SCORE CALCULATION (WEIGHTED + DECAY) ==========');

  const items: Array<{ label: string; progress: number; weight: number }> = [];

  // ===== FARD PRAYERS (ALWAYS ENABLED + HEAVY) =====
  const totalFardPrayers = 5;
  const completedFardPrayers =
    (goals.fardPrayers.fajr ? 1 : 0) +
    (goals.fardPrayers.dhuhr ? 1 : 0) +
    (goals.fardPrayers.asr ? 1 : 0) +
    (goals.fardPrayers.maghrib ? 1 : 0) +
    (goals.fardPrayers.isha ? 1 : 0);

  const fardProgress = completedFardPrayers / totalFardPrayers;
  items.push({ label: 'Fard Prayers', progress: fardProgress, weight: IBADAH_GOAL_WEIGHTS.fard });
  console.log(`📿 Fard: ${completedFardPrayers}/${totalFardPrayers} = ${(fardProgress * 100).toFixed(1)}% (weight ${IBADAH_GOAL_WEIGHTS.fard})`);

  // ===== OPTIONAL GOALS: ONLY IF ENABLED (goal > 0) =====

  if (goals.sunnahDailyGoal > 0) {
    const p = Math.min(1, goals.sunnahCompleted / goals.sunnahDailyGoal);
    items.push({ label: 'Sunnah', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  if (goals.tahajjudWeeklyGoal > 0) {
    const p = Math.min(1, goals.tahajjudCompleted / goals.tahajjudWeeklyGoal);
    items.push({ label: 'Tahajjud', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  // Quran: if user enabled both pages + verses, BOTH count
  if (goals.quranDailyPagesGoal > 0) {
    const p = Math.min(1, goals.quranDailyPagesCompleted / goals.quranDailyPagesGoal);
    items.push({ label: "Qur'an Pages", progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }
  if (goals.quranDailyVersesGoal > 0) {
    const p = Math.min(1, goals.quranDailyVersesCompleted / goals.quranDailyVersesGoal);
    items.push({ label: "Qur'an Verses", progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  if (goals.quranWeeklyMemorizationGoal > 0) {
    const p = Math.min(1, goals.quranWeeklyMemorizationCompleted / goals.quranWeeklyMemorizationGoal);
    items.push({ label: 'Memorization', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  // Dhikr: if user enabled both daily + weekly, BOTH count
  if (goals.dhikrDailyGoal > 0) {
    const p = Math.min(1, goals.dhikrDailyCompleted / goals.dhikrDailyGoal);
    items.push({ label: 'Dhikr Daily', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }
  if (goals.dhikrWeeklyGoal > 0) {
    const p = Math.min(1, goals.dhikrWeeklyCompleted / goals.dhikrWeeklyGoal);
    items.push({ label: 'Dhikr Weekly', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  if (goals.duaDailyGoal > 0) {
    const completed = goals.duaDailyCompleted || 0;
    const p = Math.min(1, completed / goals.duaDailyGoal);
    items.push({ label: "Du'a", progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  if (goals.fastingWeeklyGoal > 0) {
    const p = Math.min(1, goals.fastingWeeklyCompleted / goals.fastingWeeklyGoal);
    items.push({ label: 'Fasting', progress: p, weight: IBADAH_GOAL_WEIGHTS.normal });
  }

  // Weighted score
  const rawScore = weightedAverage(items);
  console.log(`📊 Raw weighted score: ${rawScore.toFixed(2)}%`);
  console.log(`   Items: ${items.map(i => `${i.label} (${(i.progress * 100).toFixed(1)}% × weight ${i.weight})`).join(', ')}`);

  // Check if ALL enabled goals are 100% complete
  const allGoalsComplete = items.every(item => item.progress >= 1.0);
  
  let finalScore: number;
  
  if (allGoalsComplete) {
    // All tracked goals are complete - always return 100%, no decay
    finalScore = 100;
    console.log(`✅ All enabled goals complete - returning 100% (no decay applied)`);
  } else if (userId) {
    // Not all goals complete - apply decay
    finalScore = Math.round(rawScore);
    const last = await getLastActivity(userId, 'ibadah');
    const inactiveHours = last ? hoursBetween(last, new Date()) : 0;
    const beforeDecay = finalScore;
    finalScore = applyDecay(finalScore, inactiveHours, 'ibadah');
    console.log(`⏳ Decay: inactive ${inactiveHours.toFixed(1)}h, ${beforeDecay}% -> ${finalScore}%`);
  } else {
    finalScore = Math.round(rawScore);
    console.log(`ℹ️ No userId provided - skipping decay`);
  }

  console.log(`✨ IBADAH FINAL: ${finalScore}% (raw ${rawScore.toFixed(1)}%)`);
  console.log(`Enabled items: ${items.map(i => i.label).join(', ')}`);
  console.log(`================================================\n`);

  return finalScore;
}

// ============================================================================
// ILM SCORE CALCULATION - NEW SIMPLE SYSTEM
// ============================================================================

/**
 * Calculate Ilm score based purely on completed actions vs enabled goals
 * Each enabled goal contributes equally to the final score
 */
export function calculateIlmScore(goals: IlmGoals): number {
  console.log('\n📚 ========== ILM SCORE CALCULATION (NEW SYSTEM) ==========');
  
  const progressions: number[] = [];
  const enabledGoals: string[] = [];
  
  if (goals.weeklyLecturesGoal > 0) {
    const progress = Math.min(1, goals.weeklyLecturesCompleted / goals.weeklyLecturesGoal);
    progressions.push(progress);
    enabledGoals.push('Lectures');
    console.log(`🎓 Lectures: ${goals.weeklyLecturesCompleted}/${goals.weeklyLecturesGoal} = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyRecitationsGoal > 0) {
    const progress = Math.min(1, goals.weeklyRecitationsCompleted / goals.weeklyRecitationsGoal);
    progressions.push(progress);
    enabledGoals.push('Recitations');
    console.log(`🎵 Recitations: ${goals.weeklyRecitationsCompleted}/${goals.weeklyRecitationsGoal} = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyQuizzesGoal > 0) {
    const progress = Math.min(1, goals.weeklyQuizzesCompleted / goals.weeklyQuizzesGoal);
    progressions.push(progress);
    enabledGoals.push('Quizzes');
    console.log(`❓ Quizzes: ${goals.weeklyQuizzesCompleted}/${goals.weeklyQuizzesGoal} = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyReflectionGoal > 0) {
    const progress = Math.min(1, goals.weeklyReflectionCompleted / goals.weeklyReflectionGoal);
    progressions.push(progress);
    enabledGoals.push('Reflection');
    console.log(`💭 Reflection: ${goals.weeklyReflectionCompleted}/${goals.weeklyReflectionGoal} = ${(progress * 100).toFixed(1)}%`);
  }
  
  // Calculate final score: average of all enabled goal progressions
  let finalScore = 0;
  if (progressions.length > 0) {
    const sum = progressions.reduce((acc, p) => acc + p, 0);
    finalScore = (sum / progressions.length) * 100;
  }
  
  console.log(`\n✨ ILM FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`   Enabled goals: ${enabledGoals.length} (${enabledGoals.join(', ')})`);
  console.log(`   Average progress: ${finalScore.toFixed(1)}%`);
  if (progressions.length === 0) {
    console.log(`   ⚠️ No goals enabled - returning 0%`);
  }
  console.log(`================================================\n`);
  
  return Math.round(finalScore);
}

// ============================================================================
// AMANAH SCORE CALCULATION - NEW SIMPLE SYSTEM
// ============================================================================

/**
 * Calculate Amanah score based purely on completed actions vs enabled goals
 * Each enabled goal contributes equally to the final score
 */
export function calculateAmanahScore(goals: AmanahGoals): number {
  console.log('\n💪 ========== AMANAH SCORE CALCULATION (NEW SYSTEM) ==========');
  
  const progressions: number[] = [];
  const enabledGoals: string[] = [];
  
  if (goals.dailyExerciseGoal > 0) {
    const progress = Math.min(1, goals.dailyExerciseCompleted / goals.dailyExerciseGoal);
    progressions.push(progress);
    enabledGoals.push('Exercise');
    console.log(`🏃 Exercise: ${goals.dailyExerciseCompleted}/${goals.dailyExerciseGoal} min = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.dailyWaterGoal > 0) {
    const progress = Math.min(1, goals.dailyWaterCompleted / goals.dailyWaterGoal);
    progressions.push(progress);
    enabledGoals.push('Water');
    console.log(`💧 Water: ${goals.dailyWaterCompleted}/${goals.dailyWaterGoal} glasses = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.dailySleepGoal > 0) {
    const progress = Math.min(1, goals.dailySleepCompleted / goals.dailySleepGoal);
    progressions.push(progress);
    enabledGoals.push('Sleep');
    console.log(`😴 Sleep: ${goals.dailySleepCompleted}/${goals.dailySleepGoal} hrs = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyWorkoutGoal > 0) {
    const progress = Math.min(1, goals.weeklyWorkoutCompleted / goals.weeklyWorkoutGoal);
    progressions.push(progress);
    enabledGoals.push('Workout');
    console.log(`🏋️ Workout: ${goals.weeklyWorkoutCompleted}/${goals.weeklyWorkoutGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyMeditationGoal > 0) {
    const progress = Math.min(1, goals.weeklyMeditationCompleted / goals.weeklyMeditationGoal);
    progressions.push(progress);
    enabledGoals.push('Meditation');
    console.log(`🧘 Meditation: ${goals.weeklyMeditationCompleted}/${goals.weeklyMeditationGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyJournalGoal > 0) {
    const progress = Math.min(1, goals.weeklyJournalCompleted / goals.weeklyJournalGoal);
    progressions.push(progress);
    enabledGoals.push('Journal');
    console.log(`📔 Journal: ${goals.weeklyJournalCompleted}/${goals.weeklyJournalGoal} entries = ${(progress * 100).toFixed(1)}%`);
  }
  
  if (goals.weeklyStressManagementGoal > 0) {
    const progress = Math.min(1, goals.weeklyStressManagementCompleted / goals.weeklyStressManagementGoal);
    progressions.push(progress);
    enabledGoals.push('Stress Management');
    console.log(`🧘 Stress: ${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  }
  
  // Calculate final score: average of all enabled goal progressions
  let finalScore = 0;
  if (progressions.length > 0) {
    const sum = progressions.reduce((acc, p) => acc + p, 0);
    finalScore = (sum / progressions.length) * 100;
  }
  
  console.log(`\n✨ AMANAH FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`   Enabled goals: ${enabledGoals.length} (${enabledGoals.join(', ')})`);
  console.log(`   Average progress: ${finalScore.toFixed(1)}%`);
  if (progressions.length === 0) {
    console.log(`   ⚠️ No goals enabled - returning 0%`);
  }
  console.log(`================================================\n`);
  
  return Math.round(finalScore);
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS - SIMPLIFIED
// ============================================================================

/**
 * Calculate all section scores using the new simple system
 * No momentum, no decay - just pure completion percentages
 */
export async function calculateAllSectionScores(
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals,
  userId?: string | null
): Promise<SectionScores> {
  const scores: SectionScores = {
    ibadah: await calculateIbadahScore(ibadahGoals, userId),
    ilm: calculateIlmScore(ilmGoals),
    amanah: calculateAmanahScore(amanahGoals),
  };

  // save section scores (your existing logic)
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

export async function getCurrentSectionScores(userId?: string | null): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);

    // compute raw
    const scores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals, userId);

    // apply decay to ILM + AMANAH here (ibadah already decays inside calculateIbadahScore)
    if (userId) {
      const ilmLast = await getLastActivity(userId, 'ilm');
      const amanahLast = await getLastActivity(userId, 'amanah');

      const ilmInactive = ilmLast ? hoursBetween(ilmLast, new Date()) : 0;
      const amanahInactive = amanahLast ? hoursBetween(amanahLast, new Date()) : 0;

      return {
        ...scores,
        ilm: applyDecay(scores.ilm, ilmInactive, 'ilm'),
        amanah: applyDecay(scores.amanah, amanahInactive, 'amanah'),
      };
    }

    return scores;
  } catch (error) {
    console.error('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

// Long-term score blending configuration
const LONG_TERM_CONFIG = {
  historyWeight: 0.7, // 70% historical average, 30% today's progress
  minHistoryScore: 20, // Minimum baseline score (never drops below this)
  dailyDecayRate: 0.05, // 5% decay per day of complete inactivity
};

/**
 * Get and update historical score average
 */
async function getHistoricalScore(userId: string | null): Promise<{ average: number; lastUpdate: string | null }> {
  try {
    const key = userId ? `imanHistoricalScore_${userId}` : 'imanHistoricalScore';
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.log('Error loading historical score:', error);
  }
  return { average: 50, lastUpdate: null }; // Start at 50% baseline
}

async function saveHistoricalScore(userId: string | null, average: number): Promise<void> {
  try {
    const key = userId ? `imanHistoricalScore_${userId}` : 'imanHistoricalScore';
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(key, JSON.stringify({ average, lastUpdate: today }));
  } catch (error) {
    console.log('Error saving historical score:', error);
  }
}

/**
 * Get overall Iman score with long-term tracking
 * Blends historical average with today's progress for stability
 */
export async function getOverallImanScore(userId?: string | null): Promise<number> {
  const scores = await getCurrentSectionScores(userId);
  
  // Calculate today's weighted score: Ibadah (60%) > Ilm (25%) > Amanah (15%)
  const todayScore = 
    (scores.ibadah * WEIGHTS.ibadah) +
    (scores.ilm * WEIGHTS.ilm) +
    (scores.amanah * WEIGHTS.amanah);
  
  // Get historical average
  const { average: historicalAvg, lastUpdate } = await getHistoricalScore(userId ?? null);
  
  // Apply decay to historical score if there's been inactivity
  let decayedHistorical = historicalAvg;
  if (lastUpdate) {
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 0) {
      // Gradual decay: lose 5% per day of inactivity, but never below minimum
      const decayMultiplier = Math.pow(1 - LONG_TERM_CONFIG.dailyDecayRate, daysSinceUpdate);
      decayedHistorical = Math.max(
        LONG_TERM_CONFIG.minHistoryScore,
        historicalAvg * decayMultiplier
      );
    }
  }
  
  // Blend historical with today's score
  // If today's score is higher, it pulls up the average faster
  // If today's score is lower (e.g., after reset), historical cushions the drop
  let blendedScore: number;
  if (todayScore >= decayedHistorical) {
    // Good day - let today's progress have more influence (40% history, 60% today)
    blendedScore = (decayedHistorical * 0.4) + (todayScore * 0.6);
  } else {
    // Lower today (maybe just reset) - historical cushions the drop (70% history, 30% today)
    blendedScore = (decayedHistorical * LONG_TERM_CONFIG.historyWeight) + 
                   (todayScore * (1 - LONG_TERM_CONFIG.historyWeight));
  }
  
  // Update historical average (moving average)
  const newHistoricalAvg = (historicalAvg * 0.8) + (todayScore * 0.2);
  await saveHistoricalScore(userId ?? null, Math.max(LONG_TERM_CONFIG.minHistoryScore, newHistoricalAvg));
  
  const finalScore = Math.round(Math.max(LONG_TERM_CONFIG.minHistoryScore, blendedScore));
  
  console.log(`\n🌟 ========== OVERALL IMAN SCORE (LONG-TERM) ==========`);
  console.log(`   Today's Score: ${Math.round(todayScore)}%`);
  console.log(`   Historical Avg: ${Math.round(historicalAvg)}% → ${Math.round(decayedHistorical)}% (after decay)`);
  console.log(`   Blended Score: ${finalScore}%`);
  console.log(`   Ring Breakdown: Ibadah ${scores.ibadah}%, Ilm ${scores.ilm}%, Amanah ${scores.amanah}%`);
  console.log(`================================================\n`);
  
  return finalScore;
}

export async function updateSectionScores(userId?: string | null): Promise<SectionScores> {
  return await getCurrentSectionScores(userId);
}

// ============================================================================
// RESET FUNCTIONS
// ============================================================================

export async function resetDailyGoals(userId?: string | null): Promise<void> {
  try {
    console.log(`🔄 Resetting daily goals for user: ${userId || 'unknown'}...`);
    
    const ibadahGoals = await loadIbadahGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);
    
    // Reset daily counters
    ibadahGoals.fardPrayers = {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
    ibadahGoals.sunnahCompleted = 0;
    ibadahGoals.quranDailyPagesCompleted = 0;
    ibadahGoals.quranDailyVersesCompleted = 0;
    ibadahGoals.dhikrDailyCompleted = 0;
    ibadahGoals.duaDailyCompleted = 0;
    
    amanahGoals.dailyExerciseCompleted = 0;
    amanahGoals.dailyWaterCompleted = 0;
    amanahGoals.dailySleepCompleted = 0;
    
    const ibadahKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
    const amanahKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    await AsyncStorage.setItem(ibadahKey, JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem(amanahKey, JSON.stringify(amanahGoals));
    
    console.log('✅ Daily goals reset successfully');
  } catch (error) {
    console.error('❌ Error resetting daily goals:', error);
  }
}

export async function resetWeeklyGoals(userId?: string | null): Promise<void> {
  try {
    console.log(`🔄 Resetting weekly goals for user: ${userId || 'unknown'}...`);
    
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);
    
    // Reset weekly counters
    ibadahGoals.tahajjudCompleted = 0;
    ibadahGoals.dhikrWeeklyCompleted = 0;
    ibadahGoals.quranWeeklyMemorizationCompleted = 0;
    ibadahGoals.fastingWeeklyCompleted = 0;
    
    ilmGoals.weeklyLecturesCompleted = 0;
    ilmGoals.weeklyRecitationsCompleted = 0;
    ilmGoals.weeklyQuizzesCompleted = 0;
    ilmGoals.weeklyReflectionCompleted = 0;
    
    amanahGoals.weeklyWorkoutCompleted = 0;
    amanahGoals.weeklyMeditationCompleted = 0;
    amanahGoals.weeklyJournalCompleted = 0;
    amanahGoals.weeklyMentalHealthCompleted = 0;
    amanahGoals.weeklyStressManagementCompleted = 0;
    
    const ibadahKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
    const ilmKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
    const amanahKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    await AsyncStorage.setItem(ibadahKey, JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem(ilmKey, JSON.stringify(ilmGoals));
    await AsyncStorage.setItem(amanahKey, JSON.stringify(amanahGoals));
    
    console.log('✅ Weekly goals reset successfully');
  } catch (error) {
    console.error('❌ Error resetting weekly goals:', error);
  }
}

/**
 * Get the user's local midnight date string
 */
function getLocalMidnightDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const localMidnight = new Date(year, month, date, 0, 0, 0, 0);
  return localMidnight.toDateString();
}

function isNewDay(lastDateString: string | null, currentDateString: string): boolean {
  if (!lastDateString) {
    return true;
  }
  return lastDateString !== currentDateString;
}

function isSundayMidnight(now: Date): boolean {
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  return dayOfWeek === 0 && hours === 0;
}

function hasResetThisWeek(lastWeeklyResetDate: string | null, currentSundayDate: string): boolean {
  if (!lastWeeklyResetDate) {
    return false;
  }
  return lastWeeklyResetDate === currentSundayDate;
}

export async function checkAndHandleResets(userId?: string | null): Promise<void> {
  try {
    const today = getLocalMidnightDateString();
    const now = new Date();
    
    const lastDateKey = userId ? `lastImanDate_${userId}` : 'lastImanDate';
    const lastDate = await AsyncStorage.getItem(lastDateKey);
    
    if (isNewDay(lastDate, today)) {
      console.log(`📅 New day detected for user ${userId || 'unknown'} (local time: ${now.toLocaleString()})`);
      await resetDailyGoals(userId);
      await AsyncStorage.setItem(lastDateKey, today);
    }
    
    const lastWeeklyResetKey = userId ? `lastWeeklyResetDate_${userId}` : 'lastWeeklyResetDate';
    const lastWeeklyReset = await AsyncStorage.getItem(lastWeeklyResetKey);
    
    if (isSundayMidnight(now)) {
      if (!hasResetThisWeek(lastWeeklyReset, today)) {
        console.log(`📅 Sunday midnight detected for user ${userId || 'unknown'} (local time: ${now.toLocaleString()})`);
        await resetWeeklyGoals(userId);
        await AsyncStorage.setItem(lastWeeklyResetKey, today);
      }
    }
  } catch (error) {
    console.error('❌ Error checking and handling resets:', error);
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
      const parsed = JSON.parse(saved);
      // Handle legacy field name
      if (parsed.duaCompleted !== undefined && parsed.duaDailyCompleted === undefined) {
        parsed.duaDailyCompleted = parsed.duaCompleted;
      }
      return parsed;
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
    quranDailyVersesGoal: 0,
    quranDailyVersesCompleted: 0,
    quranWeeklyMemorizationGoal: 0,
    quranWeeklyMemorizationCompleted: 0,
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

export async function loadIlmGoals(userId?: string | null): Promise<IlmGoals> {
  try {
    const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Object.prototype.hasOwnProperty.call(parsed, 'weeklyRecitationsGoal')) {
        parsed.weeklyRecitationsGoal = 0;
        parsed.weeklyRecitationsCompleted = 0;
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading ilm goals:', error);
  }
  
  return {
    weeklyLecturesGoal: 0,
    weeklyLecturesCompleted: 0,
    weeklyRecitationsGoal: 0,
    weeklyRecitationsCompleted: 0,
    weeklyQuizzesGoal: 0,
    weeklyQuizzesCompleted: 0,
    weeklyReflectionGoal: 0,
    weeklyReflectionCompleted: 0,
    score: 0,
  };
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
    score: 0,
  };
}

export async function saveIbadahGoals(goals: IbadahGoals, userId?: string | null): Promise<void> {
  const oldGoals = await loadIbadahGoals(userId);

  // Ring activity detection (IBADAH)
  // Set activity timestamp BEFORE saving to ensure it's available for score calculation
  if (userId) {
    const didAnyPrayerTurnTrue =
      (!oldGoals.fardPrayers.fajr && goals.fardPrayers.fajr) ||
      (!oldGoals.fardPrayers.dhuhr && goals.fardPrayers.dhuhr) ||
      (!oldGoals.fardPrayers.asr && goals.fardPrayers.asr) ||
      (!oldGoals.fardPrayers.maghrib && goals.fardPrayers.maghrib) ||
      (!oldGoals.fardPrayers.isha && goals.fardPrayers.isha);

    const didAnyCountIncrease =
      goals.sunnahCompleted > oldGoals.sunnahCompleted ||
      goals.tahajjudCompleted > oldGoals.tahajjudCompleted ||
      goals.quranDailyPagesCompleted > oldGoals.quranDailyPagesCompleted ||
      goals.quranDailyVersesCompleted > oldGoals.quranDailyVersesCompleted ||
      goals.quranWeeklyMemorizationCompleted > oldGoals.quranWeeklyMemorizationCompleted ||
      goals.dhikrDailyCompleted > oldGoals.dhikrDailyCompleted ||
      goals.dhikrWeeklyCompleted > oldGoals.dhikrWeeklyCompleted ||
      (goals.duaDailyCompleted || 0) > (oldGoals.duaDailyCompleted || 0) ||
      goals.fastingWeeklyCompleted > oldGoals.fastingWeeklyCompleted;

    if (didAnyPrayerTurnTrue || didAnyCountIncrease) {
      await setLastActivity(userId, 'ibadah');
      console.log(`✅ Activity timestamp set for ibadah ring`);
    }
  }

  const storageKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);

  if (userId) {
    try {
      const { trackPrayerCompletion, trackDhikrCompletion, trackQuranReading } = await import('./imanActivityIntegration');

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
      console.log('ℹ️ Activity tracking skipped:', error);
    }
  }
}

export async function saveIlmGoals(goals: IlmGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);

  if (userId) {
    const old = await loadIlmGoals(userId);
    const increased =
      goals.weeklyLecturesCompleted > old.weeklyLecturesCompleted ||
      goals.weeklyRecitationsCompleted > old.weeklyRecitationsCompleted ||
      goals.weeklyQuizzesCompleted > old.weeklyQuizzesCompleted ||
      goals.weeklyReflectionCompleted > old.weeklyReflectionCompleted;

    if (increased) {
      await setLastActivity(userId, 'ilm');
    }
  }
  
  if (userId) {
    try {
      const { checkAndUnlockAchievements } = await import('./achievementService');
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.log('ℹ️ Achievement check skipped:', error);
    }
  }
}

export async function saveAmanahGoals(goals: AmanahGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);

  if (userId) {
    const old = await loadAmanahGoals(userId);
    const increased =
      goals.dailyExerciseCompleted > old.dailyExerciseCompleted ||
      goals.dailyWaterCompleted > old.dailyWaterCompleted ||
      goals.dailySleepCompleted > old.dailySleepCompleted ||
      goals.weeklyWorkoutCompleted > old.weeklyWorkoutCompleted ||
      goals.weeklyMeditationCompleted > old.weeklyMeditationCompleted ||
      goals.weeklyJournalCompleted > old.weeklyJournalCompleted ||
      goals.weeklyStressManagementCompleted > old.weeklyStressManagementCompleted;

    if (increased) {
      await setLastActivity(userId, 'amanah');
    }
  }
  
  if (userId) {
    try {
      const { checkAndUnlockAchievements } = await import('./achievementService');
      await checkAndUnlockAchievements(userId);
    } catch (error) {
      console.log('ℹ️ Achievement check skipped:', error);
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
  dailyVersesGoal: number;
  dailyVersesCompleted: number;
  weeklyMemorizationGoal: number;
  weeklyMemorizationCompleted: number;
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
    dailyVersesGoal: ibadah.quranDailyVersesGoal,
    dailyVersesCompleted: ibadah.quranDailyVersesCompleted,
    weeklyMemorizationGoal: ibadah.quranWeeklyMemorizationGoal,
    weeklyMemorizationCompleted: ibadah.quranWeeklyMemorizationCompleted,
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
  ibadah.quranDailyVersesGoal = goals.dailyVersesGoal;
  ibadah.quranDailyVersesCompleted = goals.dailyVersesCompleted;
  ibadah.quranWeeklyMemorizationGoal = goals.weeklyMemorizationGoal;
  ibadah.quranWeeklyMemorizationCompleted = goals.weeklyMemorizationCompleted;
  await saveIbadahGoals(ibadah);
}
