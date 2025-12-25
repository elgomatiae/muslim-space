
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes } from './prayerTimeService';

/**
 * REDESIGNED IMAN SCORE CALCULATION SYSTEM - FIXED IBADAH RING
 * 
 * KEY FIX: Ibadah ring now properly reaches 100% when all goals are completed.
 * 
 * CORE PRINCIPLES:
 * 1. Score is based on ENABLED goals only (goal > 0)
 * 2. Completing all enabled goals = 100% for that ring
 * 3. Fard prayers are ALWAYS enabled and count all 5 prayers
 * 4. Quran Pages and Verses are mutually exclusive (only one counts)
 * 5. Score calculation is simple: (completed / total) * 100
 */

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
  // All weekly goals (knowledge is accumulated over time)
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
  dailyExerciseGoal: number; // minutes
  dailyExerciseCompleted: number;
  dailyWaterGoal: number; // glasses
  dailyWaterCompleted: number;
  dailySleepGoal: number; // hours
  dailySleepCompleted: number;
  
  // Physical health - Weekly
  weeklyWorkoutGoal: number; // sessions
  weeklyWorkoutCompleted: number;
  
  // Mental health - Weekly
  weeklyMentalHealthGoal: number; // activities
  weeklyMentalHealthCompleted: number;
  weeklyStressManagementGoal: number;
  weeklyStressManagementCompleted: number;
  
  score?: number;
}

export interface SectionScores {
  ibadah: number; // 0-100
  ilm: number; // 0-100
  amanah: number; // 0-100
}

// ============================================================================
// SCORING WEIGHTS & CONFIGURATION
// ============================================================================

/**
 * SIMPLIFIED WEIGHTING SYSTEM
 * 
 * Each activity contributes equally within its category.
 * The score is simply: (completed activities / total enabled activities) * 100
 * 
 * This ensures that completing all enabled goals = 100%
 */

const IBADAH_WEIGHTS = {
  // DAILY ACTIVITIES (70 points total)
  daily: {
    fardPrayers: 40,      // Most important - foundation of Islam (ALWAYS ENABLED)
    sunnahPrayers: 10,    // Recommended daily practice
    quranPages: 8,        // Daily Quran reading (MUTUALLY EXCLUSIVE with verses)
    quranVerses: 7,       // Alternative to pages (MUTUALLY EXCLUSIVE with pages)
    dhikrDaily: 5,        // Daily remembrance
    duaDaily: 7,          // Daily supplications
  },
  
  // WEEKLY ACTIVITIES (30 points total)
  weekly: {
    tahajjud: 8,          // Night prayer
    quranMemorization: 10, // Long-term Quran goal
    dhikrWeekly: 7,       // Weekly dhikr target
    fasting: 5,           // Optional fasting
  },
};

const ILM_WEIGHTS = {
  // ALL WEEKLY (knowledge accumulates over time)
  weekly: {
    lectures: 35,         // Primary learning source
    recitations: 30,      // Listening to Quran
    quizzes: 20,          // Testing knowledge
    reflection: 15,       // Deep understanding
  },
};

const AMANAH_WEIGHTS = {
  // DAILY ACTIVITIES (60 points total)
  daily: {
    exercise: 20,         // Daily movement
    water: 15,            // Hydration
    sleep: 25,            // Rest and recovery
  },
  
  // WEEKLY ACTIVITIES (40 points total)
  weekly: {
    workout: 20,          // Structured exercise
    mentalHealth: 12,     // Mental wellness
    stressManagement: 8,  // Stress reduction
  },
};

// ============================================================================
// DECAY CONFIGURATION
// ============================================================================

interface DecayState {
  lastActivityDate: string;
  lastScoreUpdate: string;
  consecutiveDaysActive: number;
  consecutiveDaysInactive: number;
  momentumMultiplier: number; // 1.0 to 1.5 (builds with consistency)
}

const DECAY_CONFIG = {
  // Grace period before decay starts (hours)
  gracePeriodHours: 18, // Almost a full day
  
  // Decay rates (percentage points per day)
  baseDecayPerDay: 8, // Gentle decay
  maxDecayPerDay: 20, // Cap on daily decay
  
  // Momentum system
  momentumBuildRate: 0.05, // +5% per consecutive day (max 50% bonus)
  momentumDecayRate: 0.1,  // -10% per inactive day
  maxMomentumMultiplier: 1.5,
  minMomentumMultiplier: 1.0,
  
  // Recovery boost
  recoveryMultiplier: 1.3, // 30% faster recovery when returning
  
  // Minimum score floor
  minScore: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateProgress(completed: number, goal: number): number {
  if (goal === 0) return 0; // No credit if goal not set
  return Math.min(1, completed / goal); // Cap at 100%
}

// ============================================================================
// SCORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Ibadah (Worship) Score - COMPLETELY REWRITTEN
 * 
 * NEW LOGIC:
 * - Fard prayers are ALWAYS counted (all 5 prayers)
 * - Each enabled goal contributes to the total score
 * - Score = (sum of all progress percentages) / (number of enabled goals) * 100
 * - If all enabled goals are completed = 100%
 * - Quran Pages and Verses are MUTUALLY EXCLUSIVE (pages takes priority)
 */
export async function calculateIbadahScore(goals: IbadahGoals): Promise<number> {
  console.log('\n========================================');
  console.log('🕌 IBADAH SCORE CALCULATION START');
  console.log('========================================');
  
  let totalProgress = 0; // Sum of all progress percentages (0-1)
  let enabledGoalsCount = 0; // Number of enabled goals
  const breakdown: Record<string, { progress: number; completed: number; goal: number; weight: number }> = {};
  
  // ===== FARD PRAYERS (ALWAYS ENABLED - ALL 5 PRAYERS) =====
  console.log(`\n📿 FARD PRAYERS (ALWAYS ENABLED - ALL 5 PRAYERS)`);
  
  const fardPrayersArray = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let completedFardPrayers = 0;
  
  for (const prayerName of fardPrayersArray) {
    const prayerKey = prayerName as keyof typeof goals.fardPrayers;
    if (goals.fardPrayers[prayerKey]) {
      completedFardPrayers++;
      console.log(`  ✅ ${prayerName}: Completed`);
    } else {
      console.log(`  ❌ ${prayerName}: Not completed`);
    }
  }
  
  const fardProgress = completedFardPrayers / 5; // Always divide by 5
  totalProgress += fardProgress;
  enabledGoalsCount += 1;
  
  breakdown.fardPrayers = { 
    progress: fardProgress, 
    completed: completedFardPrayers,
    goal: 5,
    weight: IBADAH_WEIGHTS.daily.fardPrayers
  };
  
  console.log(`  Score: ${completedFardPrayers}/5 prayers = ${(fardProgress * 100).toFixed(0)}% progress`);
  if (fardProgress >= 1) console.log(`  ✅ COMPLETED`);
  else console.log(`  ❌ NOT COMPLETED (${5 - completedFardPrayers} remaining)`);
  
  // ===== DAILY ACTIVITIES (OPTIONAL) =====
  
  // Sunnah Prayers
  console.log(`\n🌙 SUNNAH PRAYERS`);
  if (goals.sunnahDailyGoal > 0) {
    const progress = calculateProgress(goals.sunnahCompleted, goals.sunnahDailyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.sunnah = { 
      progress, 
      completed: goals.sunnahCompleted,
      goal: goals.sunnahDailyGoal,
      weight: IBADAH_WEIGHTS.daily.sunnahPrayers
    };
    console.log(`  Goal: ${goals.sunnahCompleted}/${goals.sunnahDailyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Quran Pages OR Verses (MUTUALLY EXCLUSIVE - Pages takes priority)
  console.log(`\n📖 QURAN READING`);
  if (goals.quranDailyPagesGoal > 0) {
    const progress = calculateProgress(goals.quranDailyPagesCompleted, goals.quranDailyPagesGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.quranPages = { 
      progress, 
      completed: goals.quranDailyPagesCompleted,
      goal: goals.quranDailyPagesGoal,
      weight: IBADAH_WEIGHTS.daily.quranPages
    };
    console.log(`  Pages Goal: ${goals.quranDailyPagesCompleted}/${goals.quranDailyPagesGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
    console.log(`  ⚪ Verses Goal: Disabled (using Pages instead)`);
  } else if (goals.quranDailyVersesGoal > 0) {
    const progress = calculateProgress(goals.quranDailyVersesCompleted, goals.quranDailyVersesGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.quranVerses = { 
      progress, 
      completed: goals.quranDailyVersesCompleted,
      goal: goals.quranDailyVersesGoal,
      weight: IBADAH_WEIGHTS.daily.quranVerses
    };
    console.log(`  Verses Goal: ${goals.quranDailyVersesCompleted}/${goals.quranDailyVersesGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Pages Goal: Disabled (0)');
    console.log('  ⚪ Verses Goal: Disabled (0)');
  }
  
  // Daily Dhikr
  console.log(`\n📿 DHIKR (DAILY)`);
  if (goals.dhikrDailyGoal > 0) {
    const progress = calculateProgress(goals.dhikrDailyCompleted, goals.dhikrDailyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.dhikrDaily = { 
      progress, 
      completed: goals.dhikrDailyCompleted,
      goal: goals.dhikrDailyGoal,
      weight: IBADAH_WEIGHTS.daily.dhikrDaily
    };
    console.log(`  Goal: ${goals.dhikrDailyCompleted}/${goals.dhikrDailyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Daily Dua
  console.log(`\n🤲 DUA (DAILY)`);
  if (goals.duaDailyGoal > 0) {
    const progress = calculateProgress(goals.duaDailyCompleted, goals.duaDailyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.duaDaily = { 
      progress, 
      completed: goals.duaDailyCompleted,
      goal: goals.duaDailyGoal,
      weight: IBADAH_WEIGHTS.daily.duaDaily
    };
    console.log(`  Goal: ${goals.duaDailyCompleted}/${goals.duaDailyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // ===== WEEKLY ACTIVITIES (OPTIONAL) =====
  
  // Tahajjud
  console.log(`\n🌙 TAHAJJUD (WEEKLY)`);
  if (goals.tahajjudWeeklyGoal > 0) {
    const progress = calculateProgress(goals.tahajjudCompleted, goals.tahajjudWeeklyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.tahajjud = { 
      progress, 
      completed: goals.tahajjudCompleted,
      goal: goals.tahajjudWeeklyGoal,
      weight: IBADAH_WEIGHTS.weekly.tahajjud
    };
    console.log(`  Goal: ${goals.tahajjudCompleted}/${goals.tahajjudWeeklyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Quran Memorization
  console.log(`\n📚 QURAN MEMORIZATION (WEEKLY)`);
  if (goals.quranWeeklyMemorizationGoal > 0) {
    const progress = calculateProgress(goals.quranWeeklyMemorizationCompleted, goals.quranWeeklyMemorizationGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.memorization = { 
      progress, 
      completed: goals.quranWeeklyMemorizationCompleted,
      goal: goals.quranWeeklyMemorizationGoal,
      weight: IBADAH_WEIGHTS.weekly.quranMemorization
    };
    console.log(`  Goal: ${goals.quranWeeklyMemorizationCompleted}/${goals.quranWeeklyMemorizationGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Weekly Dhikr
  console.log(`\n📿 DHIKR (WEEKLY)`);
  if (goals.dhikrWeeklyGoal > 0) {
    const progress = calculateProgress(goals.dhikrWeeklyCompleted, goals.dhikrWeeklyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.dhikrWeekly = { 
      progress, 
      completed: goals.dhikrWeeklyCompleted,
      goal: goals.dhikrWeeklyGoal,
      weight: IBADAH_WEIGHTS.weekly.dhikrWeekly
    };
    console.log(`  Goal: ${goals.dhikrWeeklyCompleted}/${goals.dhikrWeeklyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Fasting
  console.log(`\n🌙 FASTING (WEEKLY)`);
  if (goals.fastingWeeklyGoal > 0) {
    const progress = calculateProgress(goals.fastingWeeklyCompleted, goals.fastingWeeklyGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.fasting = { 
      progress, 
      completed: goals.fastingWeeklyCompleted,
      goal: goals.fastingWeeklyGoal,
      weight: IBADAH_WEIGHTS.weekly.fasting
    };
    console.log(`  Goal: ${goals.fastingWeeklyCompleted}/${goals.fastingWeeklyGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Calculate final score as average of all enabled goals
  let finalScore = 0;
  if (enabledGoalsCount > 0) {
    finalScore = (totalProgress / enabledGoalsCount) * 100;
  }
  
  console.log('\n========================================');
  console.log('📊 IBADAH SCORE SUMMARY');
  console.log('========================================');
  console.log(`Total Progress: ${totalProgress.toFixed(2)} (sum of all progress)`);
  console.log(`Enabled Goals: ${enabledGoalsCount}`);
  console.log(`Average Progress: ${(totalProgress / enabledGoalsCount).toFixed(2)}`);
  console.log(`Final Score: ${finalScore.toFixed(1)}%`);
  console.log('\n🎯 BREAKDOWN BY ACTIVITY:');
  Object.entries(breakdown).forEach(([key, value]) => {
    const percentage = value.progress * 100;
    const status = percentage >= 100 ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${value.completed}/${value.goal} = ${percentage.toFixed(0)}% progress`);
  });
  console.log('========================================\n');
  
  return Math.min(100, Math.round(finalScore));
}

/**
 * Calculate Ilm (Knowledge) Score
 * 
 * NEW LOGIC:
 * - Only count goals that are enabled (goal > 0)
 * - Score = (sum of all progress percentages) / (number of enabled goals) * 100
 */
export function calculateIlmScore(goals: IlmGoals): number {
  console.log('\n========================================');
  console.log('📚 ILM SCORE CALCULATION START');
  console.log('========================================');
  
  let totalProgress = 0;
  let enabledGoalsCount = 0;
  const breakdown: Record<string, { progress: number; completed: number; goal: number }> = {};
  
  // Lectures
  console.log(`\n🎓 LECTURES`);
  if (goals.weeklyLecturesGoal > 0) {
    const progress = calculateProgress(goals.weeklyLecturesCompleted, goals.weeklyLecturesGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.lectures = { progress, completed: goals.weeklyLecturesCompleted, goal: goals.weeklyLecturesGoal };
    console.log(`  Goal: ${goals.weeklyLecturesCompleted}/${goals.weeklyLecturesGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Recitations
  console.log(`\n🎵 RECITATIONS`);
  if (goals.weeklyRecitationsGoal > 0) {
    const progress = calculateProgress(goals.weeklyRecitationsCompleted, goals.weeklyRecitationsGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.recitations = { progress, completed: goals.weeklyRecitationsCompleted, goal: goals.weeklyRecitationsGoal };
    console.log(`  Goal: ${goals.weeklyRecitationsCompleted}/${goals.weeklyRecitationsGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Quizzes
  console.log(`\n❓ QUIZZES`);
  if (goals.weeklyQuizzesGoal > 0) {
    const progress = calculateProgress(goals.weeklyQuizzesCompleted, goals.weeklyQuizzesGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.quizzes = { progress, completed: goals.weeklyQuizzesCompleted, goal: goals.weeklyQuizzesGoal };
    console.log(`  Goal: ${goals.weeklyQuizzesCompleted}/${goals.weeklyQuizzesGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Reflection
  console.log(`\n💭 REFLECTION`);
  if (goals.weeklyReflectionGoal > 0) {
    const progress = calculateProgress(goals.weeklyReflectionCompleted, goals.weeklyReflectionGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.reflection = { progress, completed: goals.weeklyReflectionCompleted, goal: goals.weeklyReflectionGoal };
    console.log(`  Goal: ${goals.weeklyReflectionCompleted}/${goals.weeklyReflectionGoal}`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Calculate final score
  let finalScore = 0;
  if (enabledGoalsCount > 0) {
    finalScore = (totalProgress / enabledGoalsCount) * 100;
  }
  
  console.log('\n========================================');
  console.log('📊 ILM SCORE SUMMARY');
  console.log('========================================');
  console.log(`Total Progress: ${totalProgress.toFixed(2)}`);
  console.log(`Enabled Goals: ${enabledGoalsCount}`);
  console.log(`Final Score: ${finalScore.toFixed(1)}%`);
  console.log('========================================\n');
  
  return Math.min(100, Math.round(finalScore));
}

/**
 * Calculate Amanah (Well-Being) Score
 * 
 * NEW LOGIC:
 * - Only count goals that are enabled (goal > 0)
 * - Score = (sum of all progress percentages) / (number of enabled goals) * 100
 */
export function calculateAmanahScore(goals: AmanahGoals): number {
  console.log('\n========================================');
  console.log('💪 AMANAH SCORE CALCULATION START');
  console.log('========================================');
  
  let totalProgress = 0;
  let enabledGoalsCount = 0;
  const breakdown: Record<string, { progress: number; completed: number; goal: number }> = {};
  
  // ===== DAILY ACTIVITIES =====
  
  // Exercise
  console.log(`\n🏃 EXERCISE`);
  if (goals.dailyExerciseGoal > 0) {
    const progress = calculateProgress(goals.dailyExerciseCompleted, goals.dailyExerciseGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.exercise = { progress, completed: goals.dailyExerciseCompleted, goal: goals.dailyExerciseGoal };
    console.log(`  Goal: ${goals.dailyExerciseCompleted}/${goals.dailyExerciseGoal} minutes`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Water
  console.log(`\n💧 WATER`);
  if (goals.dailyWaterGoal > 0) {
    const progress = calculateProgress(goals.dailyWaterCompleted, goals.dailyWaterGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.water = { progress, completed: goals.dailyWaterCompleted, goal: goals.dailyWaterGoal };
    console.log(`  Goal: ${goals.dailyWaterCompleted}/${goals.dailyWaterGoal} glasses`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Sleep
  console.log(`\n😴 SLEEP`);
  if (goals.dailySleepGoal > 0) {
    const progress = calculateProgress(goals.dailySleepCompleted, goals.dailySleepGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.sleep = { progress, completed: goals.dailySleepCompleted, goal: goals.dailySleepGoal };
    console.log(`  Goal: ${goals.dailySleepCompleted}/${goals.dailySleepGoal} hours`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // ===== WEEKLY ACTIVITIES =====
  
  // Workout
  console.log(`\n🏋️ WORKOUT`);
  if (goals.weeklyWorkoutGoal > 0) {
    const progress = calculateProgress(goals.weeklyWorkoutCompleted, goals.weeklyWorkoutGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.workout = { progress, completed: goals.weeklyWorkoutCompleted, goal: goals.weeklyWorkoutGoal };
    console.log(`  Goal: ${goals.weeklyWorkoutCompleted}/${goals.weeklyWorkoutGoal} sessions`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Mental Health
  console.log(`\n🧘 MENTAL HEALTH`);
  if (goals.weeklyMentalHealthGoal > 0) {
    const progress = calculateProgress(goals.weeklyMentalHealthCompleted, goals.weeklyMentalHealthGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.mentalHealth = { progress, completed: goals.weeklyMentalHealthCompleted, goal: goals.weeklyMentalHealthGoal };
    console.log(`  Goal: ${goals.weeklyMentalHealthCompleted}/${goals.weeklyMentalHealthGoal} sessions`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Stress Management
  console.log(`\n🧘 STRESS MANAGEMENT`);
  if (goals.weeklyStressManagementGoal > 0) {
    const progress = calculateProgress(goals.weeklyStressManagementCompleted, goals.weeklyStressManagementGoal);
    totalProgress += progress;
    enabledGoalsCount += 1;
    breakdown.stress = { progress, completed: goals.weeklyStressManagementCompleted, goal: goals.weeklyStressManagementGoal };
    console.log(`  Goal: ${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal} sessions`);
    console.log(`  Progress: ${(progress * 100).toFixed(0)}%`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Calculate final score
  let finalScore = 0;
  if (enabledGoalsCount > 0) {
    finalScore = (totalProgress / enabledGoalsCount) * 100;
  }
  
  console.log('\n========================================');
  console.log('📊 AMANAH SCORE SUMMARY');
  console.log('========================================');
  console.log(`Total Progress: ${totalProgress.toFixed(2)}`);
  console.log(`Enabled Goals: ${enabledGoalsCount}`);
  console.log(`Final Score: ${finalScore.toFixed(1)}%`);
  console.log('========================================\n');
  
  return Math.min(100, Math.round(finalScore));
}

// ============================================================================
// DECAY SYSTEM
// ============================================================================

async function loadDecayState(): Promise<DecayState> {
  try {
    const saved = await AsyncStorage.getItem('imanDecayState');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Error loading decay state:', error);
  }
  
  // Default state
  return {
    lastActivityDate: new Date().toISOString(),
    lastScoreUpdate: new Date().toISOString(),
    consecutiveDaysActive: 0,
    consecutiveDaysInactive: 0,
    momentumMultiplier: 1.0,
  };
}

async function saveDecayState(state: DecayState): Promise<void> {
  try {
    await AsyncStorage.setItem('imanDecayState', JSON.stringify(state));
  } catch (error) {
    console.log('Error saving decay state:', error);
  }
}

/**
 * Apply decay to a score based on inactivity
 * 
 * Decay is gentle and encourages return:
 * - Grace period of 18 hours (almost a full day)
 * - Base decay of 8% per day (gentle)
 * - Momentum system rewards consistency
 * - Recovery is 30% faster when returning
 */
async function applyDecayToScore(
  currentScore: number,
  freshScore: number,
  isNewActivity: boolean
): Promise<number> {
  const state = await loadDecayState();
  const now = new Date();
  const lastActivity = new Date(state.lastActivityDate);
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  
  // Update activity tracking
  if (isNewActivity) {
    const daysSinceActivity = Math.floor(hoursSinceActivity / 24);
    
    if (daysSinceActivity <= 1) {
      // Active today or yesterday - build momentum
      state.consecutiveDaysActive++;
      state.consecutiveDaysInactive = 0;
      state.momentumMultiplier = Math.min(
        DECAY_CONFIG.maxMomentumMultiplier,
        state.momentumMultiplier + DECAY_CONFIG.momentumBuildRate
      );
    } else {
      // Returning after inactivity - reset streak but keep some momentum
      state.consecutiveDaysActive = 1;
      state.consecutiveDaysInactive = daysSinceActivity;
      state.momentumMultiplier = Math.max(
        DECAY_CONFIG.minMomentumMultiplier,
        state.momentumMultiplier - (DECAY_CONFIG.momentumDecayRate * daysSinceActivity)
      );
    }
    
    state.lastActivityDate = now.toISOString();
    await saveDecayState(state);
    
    // Apply recovery boost when returning
    if (daysSinceActivity > 1) {
      const recoveredScore = currentScore + ((freshScore - currentScore) * DECAY_CONFIG.recoveryMultiplier);
      return Math.min(100, Math.max(freshScore, recoveredScore));
    }
  }
  
  // No decay during grace period
  if (hoursSinceActivity < DECAY_CONFIG.gracePeriodHours) {
    return Math.max(currentScore, freshScore);
  }
  
  // Calculate decay
  const daysSinceActivity = hoursSinceActivity / 24;
  const decayAmount = Math.min(
    DECAY_CONFIG.maxDecayPerDay * daysSinceActivity,
    DECAY_CONFIG.baseDecayPerDay * daysSinceActivity
  );
  
  const decayedScore = Math.max(DECAY_CONFIG.minScore, currentScore - decayAmount);
  
  // Always take the higher of decayed score or fresh score
  return Math.max(decayedScore, freshScore);
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

export async function calculateAllSectionScores(
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals
): Promise<SectionScores> {
  return {
    ibadah: await calculateIbadahScore(ibadahGoals),
    ilm: calculateIlmScore(ilmGoals),
    amanah: calculateAmanahScore(amanahGoals),
  };
}

export async function getCurrentSectionScores(): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
    // Calculate fresh scores
    const freshScores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals);
    
    // Load previous scores
    const savedScoresStr = await AsyncStorage.getItem('sectionScores');
    const previousScores = savedScoresStr ? JSON.parse(savedScoresStr) : { ibadah: 0, ilm: 0, amanah: 0 };
    
    // Check if there's new activity
    const hasNewActivity = 
      freshScores.ibadah > previousScores.ibadah ||
      freshScores.ilm > previousScores.ilm ||
      freshScores.amanah > previousScores.amanah;
    
    // Apply decay to each section
    const finalScores: SectionScores = {
      ibadah: await applyDecayToScore(previousScores.ibadah, freshScores.ibadah, hasNewActivity),
      ilm: await applyDecayToScore(previousScores.ilm, freshScores.ilm, hasNewActivity),
      amanah: await applyDecayToScore(previousScores.amanah, freshScores.amanah, hasNewActivity),
    };
    
    // Save final scores
    await AsyncStorage.setItem('sectionScores', JSON.stringify(finalScores));
    await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    
    console.log('Fresh Scores:', freshScores);
    console.log('Final Scores (after decay):', finalScores);
    
    return finalScores;
  } catch (error) {
    console.log('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

/**
 * Get overall Iman score with weighted sections
 * 
 * Weighting:
 * - Ibadah: 50% (most important - foundation of faith)
 * - Ilm: 25% (knowledge and understanding)
 * - Amanah: 25% (well-being and balance)
 */
export async function getOverallImanScore(): Promise<number> {
  const scores = await getCurrentSectionScores();
  const weightedScore = (scores.ibadah * 0.5) + (scores.ilm * 0.25) + (scores.amanah * 0.25);
  
  console.log(`Overall Iman Score: ${Math.round(weightedScore)}% (Ibadah: ${scores.ibadah}%, Ilm: ${scores.ilm}%, Amanah: ${scores.amanah}%)`);
  
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
    console.log('Resetting daily goals...');
    
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
    
    console.log('Daily goals reset successfully');
  } catch (error) {
    console.log('Error resetting daily goals:', error);
  }
}

export async function resetWeeklyGoals(): Promise<void> {
  try {
    console.log('Resetting weekly goals...');
    
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
    
    console.log('Weekly goals reset successfully');
  } catch (error) {
    console.log('Error resetting weekly goals:', error);
  }
}

export async function checkAndHandleResets(): Promise<void> {
  try {
    const now = new Date();
    const lastDate = await AsyncStorage.getItem('lastImanDate');
    const today = now.toDateString();
    
    if (lastDate !== today) {
      console.log('New day detected, applying daily reset...');
      await resetDailyGoals();
      await AsyncStorage.setItem('lastImanDate', today);
    }
    
    const lastWeeklyReset = await AsyncStorage.getItem('lastWeeklyResetDate');
    const isSunday = now.getDay() === 0;
    
    if (isSunday && lastWeeklyReset !== today) {
      console.log('Sunday detected, applying weekly reset...');
      await resetWeeklyGoals();
      await AsyncStorage.setItem('lastWeeklyResetDate', today);
    }
  } catch (error) {
    console.log('Error checking and handling resets:', error);
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
      // Ensure new fields exist for backward compatibility
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
