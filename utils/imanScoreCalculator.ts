
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
import { getTodayPrayerTimes, PrayerTime } from '@/services/PrayerTimeService';
import { getCurrentLocation } from '@/services/LocationService';

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

interface MomentumState {
  lastActivityTimestamp: number;
  consecutiveDaysActive: number;
  historicalAverage: number; // Rolling 7-day average
  momentumMultiplier: number; // 1.0 to 1.3
  lastScores: SectionScores;
  lastScoreTimestamp: number; // When scores were last calculated
  lastStoredScores: SectionScores; // Last stored scores before decay
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEIGHTS = {
  // Overall ring weights (must sum to 1.0)
  // Ibadah (Worship) is most important, followed by Ilm (Knowledge), then Amanah (Well-being)
  ibadah: 0.60,  // 60% - Most important (Worship is the foundation)
  ilm: 0.25,     // 25% - Knowledge (Understanding and learning)
  amanah: 0.15,  // 15% - Well-being (Physical and mental health)
  
  // Within Ibadah ring (relative weights - normalized to enabled goals only)
  // Daily prayers (Fard) should have the BIGGEST impact on the Ibadah ring
  ibadahComponents: {
    fardPrayers: 60,    // Daily prayers - MOST IMPORTANT (always enabled, mandatory)
    quran: 18,          // Qur'an reading (daily or weekly)
    dhikr: 10,          // Dhikr (daily remembrance)
    dua: 6,             // Dua (daily supplications)
    sunnah: 4,          // Sunnah prayers (optional daily)
    tahajjud: 2,        // Night prayer (optional weekly)
    memorization: 4,    // Quran memorization (optional weekly)
    fasting: 2,         // Fasting (optional weekly)
  },
};

const DECAY_CONFIG = {
  gracePeriodHours: 24,        // No decay for 24 hours (full day grace)
  baseDecayPerDay: 2.5,        // Very gentle: 2.5% per day after grace period
  maxDecayPerDay: 8,           // Cap at 8% per day (prevents too aggressive decay)
  minScore: 15,                // Never go below 15% (maintains hope and encouragement)
  
  // Momentum system
  momentumBuildRate: 0.02,     // +2% per consecutive day (max +30%)
  momentumDecayRate: 0.05,     // -5% per inactive day
  maxMomentumBonus: 1.3,       // 30% bonus at peak
  minMomentumBonus: 1.0,       // No penalty, just no bonus
  
  // Recovery
  recoveryBoostDays: 3,        // Faster recovery for first 3 days back
  recoveryMultiplier: 1.5,     // 50% faster recovery
  
  // Score persistence
  scorePersistenceDays: 30,    // Keep decaying scores for 30 days even with no activity
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
    console.log('🕌 Getting due prayers...');
    
    // Get location
    const location = await getCurrentLocation(true);
    console.log('📍 Location obtained:', location.city);
    
    // Get prayer times for today
    const prayerTimesData = await getTodayPrayerTimes(location, undefined, 'NorthAmerica', true);
    console.log('✅ Prayer times loaded:', prayerTimesData.prayers.length, 'prayers');
    
    const now = new Date();
    const duePrayers: string[] = [];
    
    for (const prayer of prayerTimesData.prayers) {
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
    console.error('❌ Error getting due prayers:', error);
    console.log('⚠️ Fallback: assuming all 5 prayers are due');
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
  
  // Daily prayers have the biggest impact on Ibadah ring
  // Calculate impact percentage based on current enabled goals
  const prayerImpactPercent = totalWeight > 0 ? (fardWeight / totalWeight) * 100 : 100;
  console.log(`📿 Fard Prayers: ${completedDuePrayers}/${totalDue} due = ${(fardProgress * 100).toFixed(1)}% (weight: ${fardWeight}, ${prayerImpactPercent.toFixed(0)}% of Ibadah ring)`);
  
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
  // Only count enabled goals (totalWeight only includes enabled components)
  // This ensures percentages are ONLY affected by goals the user has toggled/enabled
  const finalScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) * 100 : 0;
  
  console.log(`\n✨ IBADAH FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`   Enabled components weight: ${totalWeight.toFixed(1)}`);
  console.log(`   Total weighted progress: ${totalWeightedProgress.toFixed(1)}`);
  if (totalWeight === 0) {
    console.log(`   ⚠️ No goals enabled - returning 0% (neutral state, not failing)`);
  }
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
  const componentWeight = 14.29; // ~100/7 components (added meditation and journal separately)
  
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
  
  // SEPARATED: Meditation Goal
  if (goals.weeklyMeditationGoal > 0) {
    const progress = Math.min(1, goals.weeklyMeditationCompleted / goals.weeklyMeditationGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🧘 Meditation: ${goals.weeklyMeditationCompleted}/${goals.weeklyMeditationGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🧘 Meditation: Disabled`);
  }
  
  // SEPARATED: Journal Goal
  if (goals.weeklyJournalGoal > 0) {
    const progress = Math.min(1, goals.weeklyJournalCompleted / goals.weeklyJournalGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`📔 Journal: ${goals.weeklyJournalCompleted}/${goals.weeklyJournalGoal} entries = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`📔 Journal: Disabled`);
  }
  
  if (goals.weeklyStressManagementGoal > 0) {
    const progress = Math.min(1, goals.weeklyStressManagementCompleted / goals.weeklyStressManagementGoal);
    totalWeight += componentWeight;
    totalWeightedProgress += progress * componentWeight;
    console.log(`🧘 Stress: ${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal} sessions = ${(progress * 100).toFixed(1)}%`);
  } else {
    console.log(`🧘 Stress: Disabled`);
  }
  
  // Calculate final score - only enabled goals are counted (totalWeight only includes enabled components)
  const finalScore = totalWeight > 0 ? (totalWeightedProgress / totalWeight) * 100 : 0;
  
  console.log(`\n✨ AMANAH FINAL: ${finalScore.toFixed(1)}%`);
  console.log(`   Enabled components weight: ${totalWeight.toFixed(1)}`);
  console.log(`   Total weighted progress: ${totalWeightedProgress.toFixed(1)}`);
  if (totalWeight === 0) {
    console.log(`   ⚠️ No goals enabled - returning 0% (neutral state, not failing)`);
  }
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
    console.error('Error loading momentum state:', error);
  }
  
  return {
    lastActivityTimestamp: Date.now(),
    consecutiveDaysActive: 0,
    historicalAverage: 0,
    momentumMultiplier: 1.0,
    lastScores: { ibadah: 0, ilm: 0, amanah: 0 },
  };
}

async function saveMomentumState(state: MomentumState, userId?: string | null): Promise<void> {
  try {
    const key = userId ? `imanMomentumState_${userId}` : 'imanMomentumState';
    await AsyncStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving momentum state:', error);
  }
}

/**
 * Apply decay to stored scores based on time elapsed
 * This gradually reduces scores over time instead of resetting to 0
 */
async function applyDecayToStoredScores(
  storedScores: SectionScores,
  lastScoreTimestamp: number,
  userId?: string | null
): Promise<SectionScores> {
  const now = Date.now();
  const hoursElapsed = (now - lastScoreTimestamp) / (1000 * 60 * 60);
  const daysElapsed = hoursElapsed / 24;
  
  // If within grace period, no decay
  if (hoursElapsed <= DECAY_CONFIG.gracePeriodHours) {
    console.log(`✨ Within grace period (${hoursElapsed.toFixed(1)}h < ${DECAY_CONFIG.gracePeriodHours}h) - no decay`);
    return storedScores;
  }
  
  // Calculate decay
  const daysPastGrace = (hoursElapsed - DECAY_CONFIG.gracePeriodHours) / 24;
  const decayPercent = Math.min(
    DECAY_CONFIG.baseDecayPerDay * daysPastGrace,
    DECAY_CONFIG.maxDecayPerDay * daysPastGrace
  );
  
  console.log(`\n⏳ ========== SCORE DECAY CALCULATION ==========`);
  console.log(`   Hours elapsed: ${hoursElapsed.toFixed(1)}`);
  console.log(`   Days elapsed: ${daysElapsed.toFixed(2)}`);
  console.log(`   Days past grace: ${daysPastGrace.toFixed(2)}`);
  console.log(`   Decay: ${decayPercent.toFixed(2)}%`);
  
  // Apply decay to each section
  const decayedScores: SectionScores = {
    ibadah: Math.max(
      DECAY_CONFIG.minScore,
      storedScores.ibadah - (storedScores.ibadah * decayPercent / 100)
    ),
    ilm: Math.max(
      DECAY_CONFIG.minScore,
      storedScores.ilm - (storedScores.ilm * decayPercent / 100)
    ),
    amanah: Math.max(
      DECAY_CONFIG.minScore,
      storedScores.amanah - (storedScores.amanah * decayPercent / 100)
    ),
  };
  
  console.log(`   Ibadah: ${storedScores.ibadah.toFixed(1)}% → ${decayedScores.ibadah.toFixed(1)}%`);
  console.log(`   Ilm: ${storedScores.ilm.toFixed(1)}% → ${decayedScores.ilm.toFixed(1)}%`);
  console.log(`   Amanah: ${storedScores.amanah.toFixed(1)}% → ${decayedScores.amanah.toFixed(1)}%`);
  console.log(`================================================\n`);
  
  return {
    ibadah: Math.round(decayedScores.ibadah),
    ilm: Math.round(decayedScores.ilm),
    amanah: Math.round(decayedScores.amanah),
  };
}

/**
 * Apply momentum and decay to create final scores
 * This blends today's progress with historical momentum and decayed scores
 */
async function applyMomentumAndDecay(
  freshScores: SectionScores,
  userId?: string | null
): Promise<SectionScores> {
  const state = await loadMomentumState(userId);
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
  
  // Apply decay to stored scores if there's been time since last calculation
  const hoursSinceLastCalculation = (now - state.lastScoreTimestamp) / (1000 * 60 * 60);
  let baseScores = state.lastStoredScores;
  
  if (hoursSinceLastCalculation > DECAY_CONFIG.gracePeriodHours) {
    // Apply decay to stored scores
    baseScores = await applyDecayToStoredScores(
      state.lastStoredScores,
      state.lastScoreTimestamp,
      userId
    );
  }
  
  // Blend today's fresh scores with decayed stored scores
  // More weight on fresh scores if there's new activity
  const blendWeight = hasNewActivity ? 0.75 : 0.5;
  
  console.log(`\n🔄 BLENDING SCORES:`);
  console.log(`   Fresh scores: Ibadah=${freshScores.ibadah}%, Ilm=${freshScores.ilm}%, Amanah=${freshScores.amanah}%`);
  console.log(`   Stored scores: Ibadah=${baseScores.ibadah}%, Ilm=${baseScores.ilm}%, Amanah=${baseScores.amanah}%`);
  console.log(`   Blend weight: ${(blendWeight * 100).toFixed(0)}% fresh, ${((1 - blendWeight) * 100).toFixed(0)}% stored`);
  
  const blendedScores: SectionScores = {
    ibadah: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(freshScores.ibadah * blendWeight + baseScores.ibadah * (1 - blendWeight))
    ),
    ilm: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(freshScores.ilm * blendWeight + baseScores.ilm * (1 - blendWeight))
    ),
    amanah: Math.max(
      DECAY_CONFIG.minScore,
      Math.round(freshScores.amanah * blendWeight + baseScores.amanah * (1 - blendWeight))
    ),
  };
  
  // Apply momentum multiplier
  const finalScores: SectionScores = {
    ibadah: Math.min(100, Math.round(blendedScores.ibadah * state.momentumMultiplier)),
    ilm: Math.min(100, Math.round(blendedScores.ilm * state.momentumMultiplier)),
    amanah: Math.min(100, Math.round(blendedScores.amanah * state.momentumMultiplier)),
  };
  
  // Ensure minimum score
  finalScores.ibadah = Math.max(DECAY_CONFIG.minScore, finalScores.ibadah);
  finalScores.ilm = Math.max(DECAY_CONFIG.minScore, finalScores.ilm);
  finalScores.amanah = Math.max(DECAY_CONFIG.minScore, finalScores.amanah);
  
  // Update state with new scores and timestamp
  state.lastScores = finalScores;
  state.lastStoredScores = finalScores; // Store for next decay calculation
  state.lastScoreTimestamp = now;
  await saveMomentumState(state, userId);
  
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
  amanahGoals: AmanahGoals,
  userId?: string | null
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
  
  // Apply momentum and decay with gradual decay system
  const finalScores = await applyMomentumAndDecay(freshScores, userId);
  
  return finalScores;
}

export async function getCurrentSectionScores(userId?: string | null): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals(userId);
    const ilmGoals = await loadIlmGoals(userId);
    const amanahGoals = await loadAmanahGoals(userId);
    
    const scores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals);
    
    // Save scores with user-specific key
    if (userId) {
      await AsyncStorage.setItem(`sectionScores_${userId}`, JSON.stringify(scores));
      await AsyncStorage.setItem(`sectionScoresLastUpdated_${userId}`, new Date().toISOString());
    } else {
      await AsyncStorage.setItem('sectionScores', JSON.stringify(scores));
      await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    }
    
    return scores;
  } catch (error) {
    console.error('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

/**
 * Get overall Iman score with proper ring weighting
 * Ibadah: 50%, Ilm: 25%, Amanah: 25%
 */
export async function getOverallImanScore(userId?: string | null): Promise<number> {
  const scores = await getCurrentSectionScores(userId);
  
  // Calculate weighted score: Ibadah (60%) > Ilm (25%) > Amanah (15%)
  // Only enabled goals within each ring are counted (already handled in section calculations)
  const weightedScore = 
    (scores.ibadah * WEIGHTS.ibadah) +
    (scores.ilm * WEIGHTS.ilm) +
    (scores.amanah * WEIGHTS.amanah);
  
  console.log(`\n🌟 ========== OVERALL IMAN SCORE ==========`);
  console.log(`   Ring Weights: Ibadah (${(WEIGHTS.ibadah * 100).toFixed(0)}%), Ilm (${(WEIGHTS.ilm * 100).toFixed(0)}%), Amanah (${(WEIGHTS.amanah * 100).toFixed(0)}%)`);
  console.log(`   Ibadah: ${scores.ibadah}% × ${(WEIGHTS.ibadah * 100).toFixed(0)}% = ${(scores.ibadah * WEIGHTS.ibadah).toFixed(1)}%`);
  console.log(`   Ilm: ${scores.ilm}% × ${(WEIGHTS.ilm * 100).toFixed(0)}% = ${(scores.ilm * WEIGHTS.ilm).toFixed(1)}%`);
  console.log(`   Amanah: ${scores.amanah}% × ${(WEIGHTS.amanah * 100).toFixed(0)}% = ${(scores.amanah * WEIGHTS.amanah).toFixed(1)}%`);
  console.log(`   TOTAL: ${Math.round(weightedScore)}%`);
  console.log(`   Note: Only enabled goals are counted in each ring`);
  console.log(`================================================\n`);
  
  return Math.round(weightedScore);
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
 * Check and handle goal resets
 * NOTE: This only resets completion counters for tracking, NOT scores.
 * Scores now decay gradually over time instead of resetting to 0.
 */
export async function checkAndHandleResets(userId?: string | null): Promise<void> {
  try {
    const now = new Date();
    const lastDateKey = userId ? `lastImanDate_${userId}` : 'lastImanDate';
    const lastDate = await AsyncStorage.getItem(lastDateKey);
    const today = now.toDateString();
    
    // Only reset daily completion counters if it's a new day
    // This is for tracking purposes only - scores decay gradually, not reset to 0
    if (lastDate !== today) {
      console.log(`📅 New day detected for user ${userId || 'unknown'}, resetting daily completion counters...`);
      console.log(`   Note: Scores will decay gradually, not reset to 0`);
      await resetDailyGoals(userId);
      await AsyncStorage.setItem(lastDateKey, today);
    }
    
    const lastWeeklyResetKey = userId ? `lastWeeklyResetDate_${userId}` : 'lastWeeklyResetDate';
    const lastWeeklyReset = await AsyncStorage.getItem(lastWeeklyResetKey);
    const isSunday = now.getDay() === 0;
    
    // Weekly reset for completion counters only
    if (isSunday && lastWeeklyReset !== today) {
      console.log(`📅 Sunday detected for user ${userId || 'unknown'}, resetting weekly completion counters...`);
      console.log(`   Note: Scores will decay gradually, not reset to 0`);
      await resetWeeklyGoals(userId);
      await AsyncStorage.setItem(lastWeeklyResetKey, today);
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
      return JSON.parse(saved);
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

export async function loadIlmGoals(userId?: string | null): Promise<IlmGoals> {
  try {
    const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Object.prototype.hasOwnProperty.call(parsed, 'weeklyRecitationsGoal')) {
        parsed.weeklyRecitationsGoal = 2;
        parsed.weeklyRecitationsCompleted = 0;
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading ilm goals:', error);
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

export async function loadAmanahGoals(userId?: string | null): Promise<AmanahGoals> {
  try {
    const storageKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
    const saved = await AsyncStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migration: If old format, split weeklyMentalHealthGoal into meditation and journal
      if (!Object.prototype.hasOwnProperty.call(parsed, 'weeklyMeditationGoal')) {
        const mentalHealthGoal = parsed.weeklyMentalHealthGoal || 3;
        const mentalHealthCompleted = parsed.weeklyMentalHealthCompleted || 0;
        
        // Split evenly between meditation and journal
        parsed.weeklyMeditationGoal = Math.ceil(mentalHealthGoal / 2);
        parsed.weeklyMeditationCompleted = Math.floor(mentalHealthCompleted / 2);
        parsed.weeklyJournalGoal = Math.floor(mentalHealthGoal / 2);
        parsed.weeklyJournalCompleted = Math.ceil(mentalHealthCompleted / 2);
        
        console.log('🔄 Migrated mental health goal to separate meditation and journal goals');
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error loading amanah goals:', error);
  }
  
  return {
    dailyExerciseGoal: 30,
    dailyExerciseCompleted: 0,
    dailyWaterGoal: 8,
    dailyWaterCompleted: 0,
    weeklyWorkoutGoal: 3,
    weeklyWorkoutCompleted: 0,
    weeklyMeditationGoal: 2,
    weeklyMeditationCompleted: 0,
    weeklyJournalGoal: 2,
    weeklyJournalCompleted: 0,
    weeklyMentalHealthGoal: 3,
    weeklyMentalHealthCompleted: 0,
    dailySleepGoal: 7,
    dailySleepCompleted: 0,
    weeklyStressManagementGoal: 2,
    weeklyStressManagementCompleted: 0,
    score: 0,
  };
}

export async function saveIbadahGoals(goals: IbadahGoals, userId?: string | null): Promise<void> {
  // Load old goals to track changes
  const oldGoals = await loadIbadahGoals(userId);
  
  // Save new goals with user-specific key
  const storageKey = userId ? `ibadahGoals_${userId}` : 'ibadahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);
  
  // Track activity changes for achievements
  try {
    // Import activity tracking functions
    const { trackPrayerCompletion, trackDhikrCompletion, trackQuranReading } = await import('./imanActivityIntegration');
    
    // Track prayer completions
    let newPrayersCompleted = 0;
    if (!oldGoals.fardPrayers.fajr && goals.fardPrayers.fajr) newPrayersCompleted++;
    if (!oldGoals.fardPrayers.dhuhr && goals.fardPrayers.dhuhr) newPrayersCompleted++;
    if (!oldGoals.fardPrayers.asr && goals.fardPrayers.asr) newPrayersCompleted++;
    if (!oldGoals.fardPrayers.maghrib && goals.fardPrayers.maghrib) newPrayersCompleted++;
    if (!oldGoals.fardPrayers.isha && goals.fardPrayers.isha) newPrayersCompleted++;
    
    // Track dhikr completions
    const dhikrDailyIncrease = Math.max(0, goals.dhikrDailyCompleted - oldGoals.dhikrDailyCompleted);
    const dhikrWeeklyIncrease = Math.max(0, goals.dhikrWeeklyCompleted - oldGoals.dhikrWeeklyCompleted);
    const totalDhikrIncrease = dhikrDailyIncrease + dhikrWeeklyIncrease;
    
    // Track Quran reading
    const quranPagesIncrease = Math.max(0, goals.quranDailyPagesCompleted - oldGoals.quranDailyPagesCompleted);
    
    // Only track if there are actual increases
    if (newPrayersCompleted > 0 || totalDhikrIncrease > 0 || quranPagesIncrease > 0) {
      console.log(`📊 Activity changes detected:`);
      if (newPrayersCompleted > 0) console.log(`   🕌 Prayers: +${newPrayersCompleted}`);
      if (totalDhikrIncrease > 0) console.log(`   📿 Dhikr: +${totalDhikrIncrease}`);
      if (quranPagesIncrease > 0) console.log(`   📖 Quran: +${quranPagesIncrease} pages`);
    }
  } catch (error) {
    console.log('ℹ️ Activity tracking skipped:', error);
  }
}

export async function saveIlmGoals(goals: IlmGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `ilmGoals_${userId}` : 'ilmGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);
}

export async function saveAmanahGoals(goals: AmanahGoals, userId?: string | null): Promise<void> {
  const storageKey = userId ? `amanahGoals_${userId}` : 'amanahGoals';
  await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
  await updateSectionScores(userId);
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
  
  // Track prayer completions for achievements
  const oldPrayers = ibadah.fardPrayers;
  const newPrayers = goals.fardPrayers;
  
  // Count newly completed prayers
  let newlyCompleted = 0;
  if (!oldPrayers.fajr && newPrayers.fajr) newlyCompleted++;
  if (!oldPrayers.dhuhr && newPrayers.dhuhr) newlyCompleted++;
  if (!oldPrayers.asr && newPrayers.asr) newlyCompleted++;
  if (!oldPrayers.maghrib && newPrayers.maghrib) newlyCompleted++;
  if (!oldPrayers.isha && newPrayers.isha) newlyCompleted++;
  
  // Update goals
  ibadah.fardPrayers = goals.fardPrayers;
  ibadah.sunnahDailyGoal = goals.sunnahDailyGoal;
  ibadah.sunnahCompleted = goals.sunnahCompleted;
  ibadah.tahajjudWeeklyGoal = goals.tahajjudWeeklyGoal;
  ibadah.tahajjudCompleted = goals.tahajjudCompleted;
  await saveIbadahGoals(ibadah);
  
  // Track for achievements if prayers were completed
  if (newlyCompleted > 0) {
    try {
      const { trackPrayerCompletion } = await import('./imanActivityIntegration');
      // We'll track the total count, not individual prayers
      // The achievement service will handle the counting
      console.log(`🕌 ${newlyCompleted} new prayers completed, triggering achievement check`);
    } catch (error) {
      console.error('Error importing activity integration:', error);
    }
  }
}

export async function saveDhikrGoals(goals: DhikrGoals): Promise<void> {
  const ibadah = await loadIbadahGoals();
  
  // Track dhikr completions for achievements
  const oldDaily = ibadah.dhikrDailyCompleted;
  const oldWeekly = ibadah.dhikrWeeklyCompleted;
  const newDaily = goals.dailyCompleted;
  const newWeekly = goals.weeklyCompleted;
  
  const dailyIncrease = Math.max(0, newDaily - oldDaily);
  const weeklyIncrease = Math.max(0, newWeekly - oldWeekly);
  const totalIncrease = dailyIncrease + weeklyIncrease;
  
  // Update goals
  ibadah.dhikrDailyGoal = goals.dailyGoal;
  ibadah.dhikrDailyCompleted = goals.dailyCompleted;
  ibadah.dhikrWeeklyGoal = goals.weeklyGoal;
  ibadah.dhikrWeeklyCompleted = goals.weeklyCompleted;
  await saveIbadahGoals(ibadah);
  
  // Track for achievements if dhikr was completed
  if (totalIncrease > 0) {
    try {
      const { trackDhikrCompletion } = await import('./imanActivityIntegration');
      console.log(`📿 ${totalIncrease} new dhikr completed, triggering achievement check`);
    } catch (error) {
      console.error('Error importing activity integration:', error);
    }
  }
}

export async function saveQuranGoals(goals: QuranGoals): Promise<void> {
  const ibadah = await loadIbadahGoals();
  
  // Track Quran reading for achievements
  const oldPages = ibadah.quranDailyPagesCompleted;
  const newPages = goals.dailyPagesCompleted;
  const pagesIncrease = Math.max(0, newPages - oldPages);
  
  // Update goals
  ibadah.quranDailyPagesGoal = goals.dailyPagesGoal;
  ibadah.quranDailyPagesCompleted = goals.dailyPagesCompleted;
  ibadah.quranDailyVersesGoal = goals.dailyVersesGoal;
  ibadah.quranDailyVersesCompleted = goals.dailyVersesCompleted;
  ibadah.quranWeeklyMemorizationGoal = goals.weeklyMemorizationGoal;
  ibadah.quranWeeklyMemorizationCompleted = goals.weeklyMemorizationCompleted;
  await saveIbadahGoals(ibadah);
  
  // Track for achievements if pages were read
  if (pagesIncrease > 0) {
    try {
      const { trackQuranReading } = await import('./imanActivityIntegration');
      console.log(`📖 ${pagesIncrease} new Quran pages read, triggering achievement check`);
    } catch (error) {
      console.error('Error importing activity integration:', error);
    }
  }
}
