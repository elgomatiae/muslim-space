
/**
 * ============================================================================
 * IMAN SCORE CALCULATION SYSTEM - COMPLETE REBUILD
 * ============================================================================
 * 
 * CORE PRINCIPLES:
 * 1. Spiritual momentum, not daily reset
 * 2. Only enabled goals count (disabled goals = excluded)
 * 3. Time-aware prayer logic (only count due prayers)
 * 4. Ring weighting: Ibadah (prayers > Qur'an > dhikr) > Learning & Wellness
 * 5. Smooth decay over time (gentle, forgiving)
 * 6. Blend today's progress with rolling momentum
 * 
 * EDGE CASES:
 * - All goals disabled in a ring = exclude ring from scoring
 * - All goals disabled = neutral state (not failing)
 * - Mid-day goal changes = immediate fair adjustment
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes, PrayerTime } from './prayerTimeService';

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
  duaDailyCompleted: number;
  
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
  
  // Mental health - Weekly
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

interface MomentumState {
  lastActivityTimestamp: number;
  consecutiveDaysActive: number;
  historicalAverage: number; // Rolling 7-day average
  momentumMultiplier: number; // 1.0 to 1.3
  lastScores: SectionScores;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEIGHTS = {
  // Overall ring weights (must sum to 1.0)
  ibadah: 0.50,  // 50% - Most important
  ilm: 0.25,     // 25% - Knowledge
  amanah: 0.25,  // 25% - Well-being
  
  // Within Ibadah ring (relative weights)
  ibadahComponents: {
    fardPrayers: 50,    // Prayers are most important
    quran: 25,          // Qur'an second
    dhikr: 15,          // Dhikr third
    dua: 10,            // Dua fourth
    sunnah: 8,          // Sunnah prayers
    tahajjud: 7,        // Night prayer
    memorization: 10,   // Memorization
    fasting: 5,         // Fasting
  },
};

const DECAY_CONFIG = {
  gracePeriodHours: 20,        // No decay for 20 hours
  baseDecayPerDay: 3,          // Very gentle: 3% per day
  maxDecayPerDay: 10,          // Cap at 10% per day
  minScore: 20,                // Never go below 20% (encouraging)
  
  // Momentum system
  momentumBuildRate: 0.02,     // +2% per consecutive day (max +30%)
  momentumDecayRate: 0.05,     // -5% per inactive day
  maxMomentumBonus: 1.3,       // 30% bonus at peak
  minMomentumBonus: 1.0,       // No penalty, just no bonus
  
  // Recovery
  recoveryBoostDays: 3,        // Faster recovery for first 3 days back
  recoveryMultiplier: 1.5,     // 50% faster recovery
};

// ============================================================================
// TIME-AWARE PRAYER LOGIC
// ============================================================================

/**
 * Get which prayers are due based on current time
 * Only count prayers whose time has passed
 */
async function getDuePrayers(): Promise<{ duePrayers: string[]; totalDue: number }> {
  try {
    const prayerTimes = await getPrayerTimes();
    const now = new Date();
    
    const duePrayers: string[] = [];
    
    for (const prayer of prayerTimes) {
      if (prayer.date <= now) {
        duePrayers.push(prayer.name.toLowerCase());
      }
    }
    
    console.log(`⏰ Time-aware prayers: ${duePrayers.length} of 5 prayers are due`);
    console.log(`   Due prayers: ${duePrayers.join(', ')}`);
    
    return {
      duePrayers,
      totalDue: duePrayers.length,
    };
  } catch (error) {
    console.log('Error getting due prayers, assuming all 5 are due:', error);
    // Fallback: assume all prayers are due
    return {
      duePrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
      totalDue: 5,
    };
  }
}

// ============================================================================
// IBADAH SCORE CALCULATION
// ============================================================================

/**
 * Calculate Ibadah score with proper weighting and time-aware prayer logic
 */
export async function calculateIbadahScore(goals: IbadahGoals): Promise<number> {
  console.log('\n🕌 ========== IBADAH SCORE CALCULATION ==========');
  
  let totalWeight = 0;
  let totalWeightedProgress = 0;
  const breakdown: Record<string, { progress: number; weight: number; enabled: boolean }> = {};
  
  // ===== FARD PRAYERS (TIME-AWARE) =====
  const { duePrayers, totalDue } = await getDuePrayers();
  
  let completedDuePrayers = 0;
  for (const prayerName of duePrayers) {
    const prayerKey = prayerName as keyof typeof goals.fardPrayers;
    if (goals.fardPrayers[prayerKey]) {
      completedDuePrayers++;
    }
  }
  
  const fardProgress = totalDue > 0 ? completedDuePrayers / totalDue : 0;
  const fardWeight = WEIGHTS.ibadahComponents.fardPrayers;
  
  totalWeight += fardWeight;
  totalWeightedProgress += fardProgress * fardWeight;
  
  breakdown.fardPrayers = { progress: fardProgress, weight: fardWeight, enabled: true };
  
  console.log(`📿 Fard Prayers: ${completedDuePrayers}/${totalDue} due = ${(fardProgress * 100).toFixed(1)}% (weight: ${fardWeight})`);
  
  // ===== SUNNAH PRAYERS =====
  if (goals.sunnahDailyGoal > 0) {
    const progress = Math.min(1, goals.sunnahCompleted / goals.sunnahDailyGoal);
    const weight = WEIGHTS.ibadahComponents.sunnah;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.sunnah = { progress, weight, enabled: true };
    
    console.log(`🌙 Sunnah: ${goals.sunnahCompleted}/${goals.sunnahDailyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`🌙 Sunnah: Disabled (not counted)`);
  }
  
  // ===== TAHAJJUD =====
  if (goals.tahajjudWeeklyGoal > 0) {
    const progress = Math.min(1, goals.tahajjudCompleted / goals.tahajjudWeeklyGoal);
    const weight = WEIGHTS.ibadahComponents.tahajjud;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.tahajjud = { progress, weight, enabled: true };
    
    console.log(`🌙 Tahajjud: ${goals.tahajjudCompleted}/${goals.tahajjudWeeklyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`🌙 Tahajjud: Disabled (not counted)`);
  }
  
  // ===== QURAN (PAGES OR VERSES, MUTUALLY EXCLUSIVE) =====
  if (goals.quranDailyPagesGoal > 0) {
    const progress = Math.min(1, goals.quranDailyPagesCompleted / goals.quranDailyPagesGoal);
    const weight = WEIGHTS.ibadahComponents.quran;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.quran = { progress, weight, enabled: true };
    
    console.log(`📖 Qur'an Pages: ${goals.quranDailyPagesCompleted}/${goals.quranDailyPagesGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else if (goals.quranDailyVersesGoal > 0) {
    const progress = Math.min(1, goals.quranDailyVersesCompleted / goals.quranDailyVersesGoal);
    const weight = WEIGHTS.ibadahComponents.quran;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.quran = { progress, weight, enabled: true };
    
    console.log(`📖 Qur'an Verses: ${goals.quranDailyVersesCompleted}/${goals.quranDailyVersesGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`📖 Qur'an: Disabled (not counted)`);
  }
  
  // ===== QURAN MEMORIZATION =====
  if (goals.quranWeeklyMemorizationGoal > 0) {
    const progress = Math.min(1, goals.quranWeeklyMemorizationCompleted / goals.quranWeeklyMemorizationGoal);
    const weight = WEIGHTS.ibadahComponents.memorization;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.memorization = { progress, weight, enabled: true };
    
    console.log(`📚 Memorization: ${goals.quranWeeklyMemorizationCompleted}/${goals.quranWeeklyMemorizationGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`📚 Memorization: Disabled (not counted)`);
  }
  
  // ===== DHIKR =====
  if (goals.dhikrDailyGoal > 0) {
    const progress = Math.min(1, goals.dhikrDailyCompleted / goals.dhikrDailyGoal);
    const weight = WEIGHTS.ibadahComponents.dhikr;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.dhikr = { progress, weight, enabled: true };
    
    console.log(`📿 Dhikr: ${goals.dhikrDailyCompleted}/${goals.dhikrDailyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else if (goals.dhikrWeeklyGoal > 0) {
    const progress = Math.min(1, goals.dhikrWeeklyCompleted / goals.dhikrWeeklyGoal);
    const weight = WEIGHTS.ibadahComponents.dhikr;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.dhikr = { progress, weight, enabled: true };
    
    console.log(`📿 Dhikr (Weekly): ${goals.dhikrWeeklyCompleted}/${goals.dhikrWeeklyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`📿 Dhikr: Disabled (not counted)`);
  }
  
  // ===== DUA =====
  if (goals.duaDailyGoal > 0) {
    const progress = Math.min(1, goals.duaDailyCompleted / goals.duaDailyGoal);
    const weight = WEIGHTS.ibadahComponents.dua;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.dua = { progress, weight, enabled: true };
    
    console.log(`🤲 Dua: ${goals.duaDailyCompleted}/${goals.duaDailyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`🤲 Dua: Disabled (not counted)`);
  }
  
  // ===== FASTING =====
  if (goals.fastingWeeklyGoal > 0) {
    const progress = Math.min(1, goals.fastingWeeklyCompleted / goals.fastingWeeklyGoal);
    const weight = WEIGHTS.ibadahComponents.fasting;
    
    totalWeight += weight;
    totalWeightedProgress += progress * weight;
    breakdown.fasting = { progress, weight, enabled: true };
    
    console.log(`🌙 Fasting: ${goals.fastingWeeklyCompleted}/${goals.fastingWeeklyGoal} = ${(progress * 100).toFixed(1)}% (weight: ${weight})`);
  } else {
    console.log(`🌙 Fasting: Disabled (not counted)`);
  }
  
  // Calculate final score
  const finalScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) * 100 : 0;
  
  console.log(`\n✨ IBADAH FINAL: ${finalScore.toFixed(1)}% (total weight: ${totalWeight.toFixed(1)})`);
  console.log(`================================================\n`);
  
  return Math.round(finalScore);
}

// ============================================================================
// ILM SCORE CALCULATION
// ============================================================================

export function calculateIlmScore(goals: IlmGoals): number {
  console.log('\n📚 ========== ILM SCORE CALCULATION ==========');
  
  let totalWeight = 0;
  let totalWeightedProgress = 0;
  
  // All Ilm goals have equal weight
  const componentWeight = 25;
  
  if (goals.weeklyLecturesGoal > 0) {
    const progress = Math.min(1, goals.weeklyLecturesCompleted / goals.weeklyLecturesGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🎓 Lectures: ${goals.weeklyLecturesCompleted}/${goals.weeklyLecturesGoal} = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🎓 Lectures: Disabled`);
  }
  
  if (goals.weeklyRecitationsGoal > 0) {
    const progress = Math.min(1, goals.weeklyRecitationsCompleted / goals.weeklyRecitationsGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🎵 Recitations: ${goals.weeklyRecitationsCompleted}/${goals.weeklyRecitationsGoal} = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🎵 Recitations: Disabled`);
  }
  
  if (goals.weeklyQuizzesGoal > 0) {
    const progress = Math.min(1, goals.weeklyQuizzesCompleted / goals.weeklyQuizzesGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`❓ Quizzes: ${goals.weeklyQuizzesCompleted}/${goals.weeklyQuizzesGoal} = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`❓ Quizzes: Disabled`);
  }
  
  if (goals.weeklyReflectionGoal > 0) {
    const progress = Math.min(1, goals.weeklyReflectionCompleted / goals.weeklyReflectionGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`💭 Reflection: ${goals.weeklyReflectionCompleted}/${goals.weeklyReflectionGoal} = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`💭 Reflection: Disabled`);
  }
  
  const finalScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) * 100 : 0;
  
  console.log(`\n✨ ILM FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`================================================\n`);
  
  return Math.round(finalScore);
}

// ============================================================================
// AMANAH SCORE CALCULATION
// ============================================================================

export function calculateAmanahScore(goals: AmanahGoals): number {
  console.log('\n💪 ========== AMANAH SCORE CALCULATION ==========');
  
  let totalWeight = 0;
  let totalWeightedProgress = 0;
  
  // All Amanah goals have equal weight
  const componentWeight = 16.67; // ~100/6 components
  
  if (goals.dailyExerciseGoal > 0) {
    const progress = Math.min(1, goals.dailyExerciseCompleted / goals.dailyExerciseGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🏃 Exercise: ${goals.dailyExerciseCompleted}/${goals.dailyExerciseGoal} min = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🏃 Exercise: Disabled`);
  }
  
  if (goals.dailyWaterGoal > 0) {
    const progress = Math.min(1, goals.dailyWaterCompleted / goals.dailyWaterGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`💧 Water: ${goals.dailyWaterCompleted}/${goals.dailyWaterGoal} glasses = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`💧 Water: Disabled`);
  }
  
  if (goals.dailySleepGoal > 0) {
    const progress = Math.min(1, goals.dailySleepCompleted / goals.dailySleepGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`😴 Sleep: ${goals.dailySleepCompleted}/${goals.dailySleepGoal} hrs = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`😴 Sleep: Disabled`);
  }
  
  if (goals.weeklyWorkoutGoal > 0) {
    const progress = Math.min(1, goals.weeklyWorkoutCompleted / goals.weeklyWorkoutGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🏋️ Workout: ${goals.weeklyWorkoutCompleted}/${goals.weeklyWorkoutGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🏋️ Workout: Disabled`);
  }
  
  if (goals.weeklyMentalHealthGoal > 0) {
    const progress = Math.min(1, goals.weeklyMentalHealthCompleted / goals.weeklyMentalHealthGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🧘 Mental Health: ${goals.weeklyMentalHealthCompleted}/${goals.weeklyMentalHealthGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🧘 Mental Health: Disabled`);
  }
  
  if (goals.weeklyStressManagementGoal > 0) {
    const progress = Math.min(1, goals.weeklyStressManagementCompleted / goals.weeklyStressManagementGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🧘 Stress: ${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🧘 Stress: Disabled`);
  }
  
  const finalScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) * 100 : 0;
  
  console.log(`\n✨ AMANAH FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`================================================\n`);
  
  return Math.round(finalScore);
}

// ============================================================================
// MOMENTUM & DECAY SYSTEM
// ============================================================================

async function loadMomentumState(): Promise<MomentumState> {
  try {
    const saved = await AsyncStorage.getItem('imanMomentumState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Error loading momentum state:', error);
  }
  
  return {
    lastActivityTimestamp: Date.now(),
    consecutiveDaysActive: 0,
    historicalAverage: 0,
    momentumMultiplier: 1.0,
    lastScores: { ibadah: 0, ilm: 0, amanah: 0 },
  };
}

async function saveMomentumState(state: MomentumState): Promise<void> {
  try {
    await AsyncStorage.setItem('imanMomentumState', JSON.stringify(state));
  } catch (error) {
    console.log('Error saving momentum state:', error);
  }
}

/**
 * Apply momentum and decay to create final scores
 * This blends today's progress with historical momentum
 */
async function applyMomentumAndDecay(
  freshScores: SectionScores
): Promise<SectionScores> {
  const state = await loadMomentumState();
  const now = Date.now();
  const hoursSinceLastActivity = (now - state.lastActivityTimestamp) / (1000 * 60 * 60);
  const daysSinceLastActivity = hoursSinceLastActivity / 24;
  
  console.log(`\n⚡ ========== MOMENTUM & DECAY ==========`);
  console.log(`Hours since last activity: ${hoursSinceLastActivity.toFixed(1)}`);
  console.log(`Days since last activity: ${daysSinceLastActivity.toFixed(2)}`);
  console.log(`Current momentum multiplier: ${state.momentumMultiplier.toFixed(2)}x`);
  console.log(`Consecutive days active: ${state.consecutiveDaysActive}`);
  
  // Check if there's new activity
  const hasNewActivity = 
    freshScores.ibadah > state.lastScores.ibadah ||
    freshScores.ilm > state.lastScores.ilm ||
    freshScores.amanah > state.lastScores.amanah;
  
  // Update momentum multiplier
  if (hasNewActivity) {
    if (daysSinceLastActivity <= 1.5) {
      // Active within last 36 hours - build momentum
      state.consecutiveDaysActive++;
      state.momentumMultiplier = Math.min(
        DECAY_CONFIG.maxMomentumBonus,
        state.momentumMultiplier + DECAY_CONFIG.momentumBuildRate
      );
      console.log(`✅ New activity detected! Building momentum...`);
    } else {
      // Returning after break
      const daysInactive = Math.floor(daysSinceLastActivity);
      state.consecutiveDaysActive = 1;
      state.momentumMultiplier = Math.max(
        DECAY_CONFIG.minMomentumBonus,
        state.momentumMultiplier - (DECAY_CONFIG.momentumDecayRate * daysInactive)
      );
      console.log(`🔄 Returning after ${daysInactive} days. Momentum adjusted.`);
    }
    
    state.lastActivityTimestamp = now;
  }
  
  // Calculate decay if no activity in grace period
  let decayFactor = 1.0;
  if (hoursSinceLastActivity > DECAY_CONFIG.gracePeriodHours) {
    const decayDays = (hoursSinceLastActivity - DECAY_CONFIG.gracePeriodHours) / 24;
    const decayPercent = Math.min(
      DECAY_CONFIG.maxDecayPerDay * decayDays,
      DECAY_CONFIG.baseDecayPerDay * decayDays
    );
    decayFactor = 1 - (decayPercent / 100);
    console.log(`⏳ Decay applied: ${decayPercent.toFixed(1)}% (factor: ${decayFactor.toFixed(2)})`);
  } else {
    console.log(`✨ Within grace period - no decay`);
  }
  
  // Blend today's progress with momentum
  // Formula: (today's score * 0.7) + (historical average * 0.3) * momentum * decay
  const blendWeight = hasNewActivity ? 0.7 : 0.5; // More weight on today if active
  
  const finalScores: SectionScores = {
    ibadah: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(
        (freshScores.ibadah * blendWeight + state.lastScores.ibadah * (1 - blendWeight)) *
        state.momentumMultiplier *
        decayFactor
      )
    ),
    ilm: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(
        (freshScores.ilm * blendWeight + state.lastScores.ilm * (1 - blendWeight)) *
        state.momentumMultiplier *
        decayFactor
      )
    ),
    amanah: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(
        (freshScores.amanah * blendWeight + state.lastScores.amanah * (1 - blendWeight)) *
        state.momentumMultiplier *
        decayFactor
      )
    ),
  };
  
  // Cap at 100
  finalScores.ibadah = Math.min(100, finalScores.ibadah);
  finalScores.ilm = Math.min(100, finalScores.ilm);
  finalScores.amanah = Math.min(100, finalScores.amanah);
  
  // Update state
  state.lastScores = finalScores;
  await saveMomentumState(state);
  
  console.log(`\n📊 FINAL SCORES (after momentum & decay):`);
  console.log(`   Ibadah: ${finalScores.ibadah}%`);
  console.log(`   Ilm: ${finalScores.ilm}%`);
  console.log(`   Amanah: ${finalScores.amanah}%`);
  console.log(`================================================\n`);
  
  return finalScores;
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

export async function calculateAllSectionScores(
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals
): Promise<SectionScores> {
  // Calculate fresh scores for today
  const freshScores: SectionScores = {
    ibadah: await calculateIbadahScore(ibadahGoals),
    ilm: calculateIlmScore(ilmGoals),
    amanah: calculateAmanahScore(amanahGoals),
  };
  
  console.log(`\n📈 FRESH SCORES (today's progress):`);
  console.log(`   Ibadah: ${freshScores.ibadah}%`);
  console.log(`   Ilm: ${freshScores.ilm}%`);
  console.log(`   Amanah: ${freshScores.amanah}%`);
  
  // Apply momentum and decay
  const finalScores = await applyMomentumAndDecay(freshScores);
  
  return finalScores;
}

export async function getCurrentSectionScores(): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
    const scores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals);
    
    // Save scores
    await AsyncStorage.setItem('sectionScores', JSON.stringify(scores));
    await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    
    return scores;
  } catch (error) {
    console.log('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

/**
 * Get overall Iman score with proper ring weighting
 * Ibadah: 50%, Ilm: 25%, Amanah: 25%
 */
export async function getOverallImanScore(): Promise<number> {
  const scores = await getCurrentSectionScores();
  
  const weightedScore = 
    (scores.ibadah * WEIGHTS.ibadah) +
    (scores.ilm * WEIGHTS.ilm) +
    (scores.amanah * WEIGHTS.amanah);
  
  console.log(`\n🌟 ========== OVERALL IMAN SCORE ==========`);
  console.log(`   Ibadah: ${scores.ibadah}% × ${WEIGHTS.ibadah} = ${(scores.ibadah * WEIGHTS.ibadah).toFixed(1)}`);
  console.log(`   Ilm: ${scores.ilm}% × ${WEIGHTS.ilm} = ${(scores.ilm * WEIGHTS.ilm).toFixed(1)}`);
  console.log(`   Amanah: ${scores.amanah}% × ${WEIGHTS.amanah} = ${(scores.amanah * WEIGHTS.amanah).toFixed(1)}`);
  console.log(`   TOTAL: ${Math.round(weightedScore)}%`);
  console.log(`================================================\n`);
  
  return Math.round(weightedScore);
}

export async function updateSectionScores(): Promise<SectionScores> {
  return await getCurrentSectionScores();
}

// ============================================================================
// RESET FUNCTIONS
// ============================================================================

export async function resetDailyGoals(): Promise<void> {
  try {
    console.log('🔄 Resetting daily goals...');
    
    const ibadahGoals = await loadIbadahGoals();
    const amanahGoals = await loadAmanahGoals();
    
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
    
    await AsyncStorage.setItem('ibadahGoals', JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem('amanahGoals', JSON.stringify(amanahGoals));
    
    console.log('✅ Daily goals reset successfully');
  } catch (error) {
    console.log('❌ Error resetting daily goals:', error);
  }
}

export async function resetWeeklyGoals(): Promise<void> {
  try {
    console.log('🔄 Resetting weekly goals...');
    
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
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
    amanahGoals.weeklyMentalHealthCompleted = 0;
    amanahGoals.weeklyStressManagementCompleted = 0;
    
    await AsyncStorage.setItem('ibadahGoals', JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem('ilmGoals', JSON.stringify(ilmGoals));
    await AsyncStorage.setItem('amanahGoals', JSON.stringify(amanahGoals));
    
    console.log('✅ Weekly goals reset successfully');
  } catch (error) {
    console.log('❌ Error resetting weekly goals:', error);
  }
}

export async function checkAndHandleResets(): Promise<void> {
  try {
    const now = new Date();
    const lastDate = await AsyncStorage.getItem('lastImanDate');
    const today = now.toDateString();
    
    if (lastDate !== today) {
      console.log('📅 New day detected, applying daily reset...');
      await resetDailyGoals();
      await AsyncStorage.setItem('lastImanDate', today);
    }
    
    const lastWeeklyReset = await AsyncStorage.getItem('lastWeeklyResetDate');
    const isSunday = now.getDay() === 0;
    
    if (isSunday && lastWeeklyReset !== today) {
      console.log('📅 Sunday detected, applying weekly reset...');
      await resetWeeklyGoals();
      await AsyncStorage.setItem('lastWeeklyResetDate', today);
    }
  } catch (error) {
    console.log('❌ Error checking and handling resets:', error);
  }
}

// ============================================================================
// LOAD/SAVE FUNCTIONS
// ============================================================================

export async function loadIbadahGoals(): Promise<IbadahGoals> {
  try {
    const saved = await AsyncStorage.getItem('ibadahGoals');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Error loading ibadah goals:', error);
  }
  
  return {
    fardPrayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    sunnahDailyGoal: 5,
    sunnahCompleted: 0,
    tahajjudWeeklyGoal: 2,
    tahajjudCompleted: 0,
    quranDailyPagesGoal: 2,
    quranDailyPagesCompleted: 0,
    quranDailyVersesGoal: 10,
    quranDailyVersesCompleted: 0,
    quranWeeklyMemorizationGoal: 5,
    quranWeeklyMemorizationCompleted: 0,
    dhikrDailyGoal: 100,
    dhikrDailyCompleted: 0,
    dhikrWeeklyGoal: 1000,
    dhikrWeeklyCompleted: 0,
    duaDailyGoal: 3,
    duaDailyCompleted: 0,
    fastingWeeklyGoal: 2,
    fastingWeeklyCompleted: 0,
    score: 0,
  };
}

export async function loadIlmGoals(): Promise<IlmGoals> {
  try {
    const saved = await AsyncStorage.getItem('ilmGoals');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Object.prototype.hasOwnProperty.call(parsed, 'weeklyRecitationsGoal')) {
        parsed.weeklyRecitationsGoal = 2;
        parsed.weeklyRecitationsCompleted = 0;
      }
      return parsed;
    }
  } catch (error) {
    console.log('Error loading ilm goals:', error);
  }
  
  return {
    weeklyLecturesGoal: 2,
    weeklyLecturesCompleted: 0,
    weeklyRecitationsGoal: 2,
    weeklyRecitationsCompleted: 0,
    weeklyQuizzesGoal: 1,
    weeklyQuizzesCompleted: 0,
    weeklyReflectionGoal: 3,
    weeklyReflectionCompleted: 0,
    score: 0,
  };
}

export async function loadAmanahGoals(): Promise<AmanahGoals> {
  try {
    const saved = await AsyncStorage.getItem('amanahGoals');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Error loading amanah goals:', error);
  }
  
  return {
    dailyExerciseGoal: 30,
    dailyExerciseCompleted: 0,
    dailyWaterGoal: 8,
    dailyWaterCompleted: 0,
    weeklyWorkoutGoal: 3,
    weeklyWorkoutCompleted: 0,
    weeklyMentalHealthGoal: 3,
    weeklyMentalHealthCompleted: 0,
    dailySleepGoal: 7,
    dailySleepCompleted: 0,
    weeklyStressManagementGoal: 2,
    weeklyStressManagementCompleted: 0,
    score: 0,
  };
}

export async function saveIbadahGoals(goals: IbadahGoals): Promise<void> {
  await AsyncStorage.setItem('ibadahGoals', JSON.stringify(goals));
  await updateSectionScores();
}

export async function saveIlmGoals(goals: IlmGoals): Promise<void> {
  await AsyncStorage.setItem('ilmGoals', JSON.stringify(goals));
  await updateSectionScores();
}

export async function saveAmanahGoals(goals: AmanahGoals): Promise<void> {
  await AsyncStorage.setItem('amanahGoals', JSON.stringify(goals));
  await updateSectionScores();
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
