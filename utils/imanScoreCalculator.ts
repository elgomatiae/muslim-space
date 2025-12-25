
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes } from './prayerTimeService';

/**
 * REDESIGNED IMAN SCORE CALCULATION SYSTEM
 * 
 * This system is designed to:
 * 1. Properly weight daily vs weekly goals
 * 2. Encourage consistent engagement through smart decay
 * 3. Make it easy for users to return and recover their score
 * 4. Accurately reflect progress without giving unearned credit
 * 5. ONLY score goals that are enabled (goal > 0)
 * 6. Show 100% when all enabled goals are completed
 * 7. Quran Pages and Verses are mutually exclusive (only count one)
 * 
 * SCORING PHILOSOPHY:
 * - Daily goals are weighted more heavily (they build consistency)
 * - Weekly goals provide flexibility and long-term growth
 * - Decay is gentle but noticeable (encourages return without punishment)
 * - Recovery is fast and rewarding (positive reinforcement)
 * - Disabled goals (set to 0) do NOT affect the score
 * - Completing all enabled goals = 100% for that ring
 * - Quran: Use EITHER pages OR verses, not both (pages takes priority)
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
 * NEW WEIGHTING SYSTEM
 * 
 * Each section has a total of 100 points distributed across:
 * - Daily goals (higher weight - builds consistency)
 * - Weekly goals (lower weight - provides flexibility)
 * 
 * Within each category, activities are weighted by importance
 * 
 * IMPORTANT: These weights are only applied to ENABLED goals (goal > 0)
 * IMPORTANT: Quran Pages and Verses are mutually exclusive (only one counts)
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

async function getPrayersThatHavePassed(): Promise<string[]> {
  try {
    const prayerTimes = await getPrayerTimes();
    const now = new Date();
    const passedPrayers: string[] = [];
    
    for (const prayer of prayerTimes) {
      if (prayer.date <= now) {
        passedPrayers.push(prayer.name.toLowerCase());
      }
    }
    
    return passedPrayers;
  } catch (error) {
    console.log('Error getting prayer times:', error);
    // Fallback: assume all prayers have passed
    return ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  }
}

function calculateProgress(completed: number, goal: number): number {
  if (goal === 0) return 0; // No credit if goal not set
  return Math.min(1, completed / goal); // Cap at 100%
}

// ============================================================================
// SCORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Ibadah (Worship) Score
 * 
 * NEW LOGIC:
 * - Only count goals that are enabled (goal > 0)
 * - Calculate total possible weight from enabled goals
 * - Scale score to 0-100 based on enabled goals only
 * - If all enabled goals are completed = 100%
 * - Quran Pages and Verses are MUTUALLY EXCLUSIVE (pages takes priority)
 */
export async function calculateIbadahScore(goals: IbadahGoals): Promise<number> {
  console.log('\n========================================');
  console.log('🕌 IBADAH SCORE CALCULATION START');
  console.log('========================================');
  
  let earnedPoints = 0;
  let totalPossiblePoints = 0;
  const breakdown: Record<string, { earned: number; possible: number; completed: number; goal: number }> = {};
  
  // ===== FARD PRAYERS (ALWAYS ENABLED) =====
  const passedPrayers = await getPrayersThatHavePassed();
  const totalPassedPrayers = passedPrayers.length;
  
  console.log(`\n📿 FARD PRAYERS (ALWAYS ENABLED)`);
  console.log(`Prayers that have passed: ${passedPrayers.join(', ')}`);
  
  if (totalPassedPrayers > 0) {
    let completedPassedPrayers = 0;
    for (const prayerName of passedPrayers) {
      const prayerKey = prayerName as keyof typeof goals.fardPrayers;
      if (goals.fardPrayers[prayerKey]) {
        completedPassedPrayers++;
        console.log(`  ✅ ${prayerName}: Completed`);
      } else {
        console.log(`  ❌ ${prayerName}: Not completed`);
      }
    }
    const fardProgress = completedPassedPrayers / totalPassedPrayers;
    const fardPoints = fardProgress * IBADAH_WEIGHTS.daily.fardPrayers;
    earnedPoints += fardPoints;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.fardPrayers;
    breakdown.fardPrayers = { 
      earned: fardPoints, 
      possible: IBADAH_WEIGHTS.daily.fardPrayers,
      completed: completedPassedPrayers,
      goal: totalPassedPrayers
    };
    console.log(`  Score: ${fardPoints.toFixed(1)}/${IBADAH_WEIGHTS.daily.fardPrayers} points (${(fardProgress * 100).toFixed(0)}%)`);
  } else {
    console.log('  ⏳ No prayers have passed yet - not counting in total');
  }
  
  // ===== DAILY ACTIVITIES (OPTIONAL) =====
  
  // Sunnah Prayers
  console.log(`\n🌙 SUNNAH PRAYERS`);
  if (goals.sunnahDailyGoal > 0) {
    const progress = calculateProgress(goals.sunnahCompleted, goals.sunnahDailyGoal);
    const points = progress * IBADAH_WEIGHTS.daily.sunnahPrayers;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.sunnahPrayers;
    breakdown.sunnah = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.daily.sunnahPrayers,
      completed: goals.sunnahCompleted,
      goal: goals.sunnahDailyGoal
    };
    console.log(`  Goal: ${goals.sunnahCompleted}/${goals.sunnahDailyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.daily.sunnahPrayers} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Quran Pages OR Verses (MUTUALLY EXCLUSIVE - Pages takes priority)
  console.log(`\n📖 QURAN READING`);
  if (goals.quranDailyPagesGoal > 0) {
    const progress = calculateProgress(goals.quranDailyPagesCompleted, goals.quranDailyPagesGoal);
    const points = progress * IBADAH_WEIGHTS.daily.quranPages;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.quranPages;
    breakdown.quranPages = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.daily.quranPages,
      completed: goals.quranDailyPagesCompleted,
      goal: goals.quranDailyPagesGoal
    };
    console.log(`  Pages Goal: ${goals.quranDailyPagesCompleted}/${goals.quranDailyPagesGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.daily.quranPages} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
    console.log(`  ⚪ Verses Goal: Disabled (using Pages instead)`);
  } else if (goals.quranDailyVersesGoal > 0) {
    const progress = calculateProgress(goals.quranDailyVersesCompleted, goals.quranDailyVersesGoal);
    const points = progress * IBADAH_WEIGHTS.daily.quranVerses;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.quranVerses;
    breakdown.quranVerses = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.daily.quranVerses,
      completed: goals.quranDailyVersesCompleted,
      goal: goals.quranDailyVersesGoal
    };
    console.log(`  Verses Goal: ${goals.quranDailyVersesCompleted}/${goals.quranDailyVersesGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.daily.quranVerses} points (${(progress * 100).toFixed(0)}%)`);
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
    const points = progress * IBADAH_WEIGHTS.daily.dhikrDaily;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.dhikrDaily;
    breakdown.dhikrDaily = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.daily.dhikrDaily,
      completed: goals.dhikrDailyCompleted,
      goal: goals.dhikrDailyGoal
    };
    console.log(`  Goal: ${goals.dhikrDailyCompleted}/${goals.dhikrDailyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.daily.dhikrDaily} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Daily Dua
  console.log(`\n🤲 DUA (DAILY)`);
  if (goals.duaDailyGoal > 0) {
    const progress = calculateProgress(goals.duaDailyCompleted, goals.duaDailyGoal);
    const points = progress * IBADAH_WEIGHTS.daily.duaDaily;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.daily.duaDaily;
    breakdown.duaDaily = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.daily.duaDaily,
      completed: goals.duaDailyCompleted,
      goal: goals.duaDailyGoal
    };
    console.log(`  Goal: ${goals.duaDailyCompleted}/${goals.duaDailyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.daily.duaDaily} points (${(progress * 100).toFixed(0)}%)`);
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
    const points = progress * IBADAH_WEIGHTS.weekly.tahajjud;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.weekly.tahajjud;
    breakdown.tahajjud = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.weekly.tahajjud,
      completed: goals.tahajjudCompleted,
      goal: goals.tahajjudWeeklyGoal
    };
    console.log(`  Goal: ${goals.tahajjudCompleted}/${goals.tahajjudWeeklyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.weekly.tahajjud} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Quran Memorization
  console.log(`\n📚 QURAN MEMORIZATION (WEEKLY)`);
  if (goals.quranWeeklyMemorizationGoal > 0) {
    const progress = calculateProgress(goals.quranWeeklyMemorizationCompleted, goals.quranWeeklyMemorizationGoal);
    const points = progress * IBADAH_WEIGHTS.weekly.quranMemorization;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.weekly.quranMemorization;
    breakdown.memorization = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.weekly.quranMemorization,
      completed: goals.quranWeeklyMemorizationCompleted,
      goal: goals.quranWeeklyMemorizationGoal
    };
    console.log(`  Goal: ${goals.quranWeeklyMemorizationCompleted}/${goals.quranWeeklyMemorizationGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.weekly.quranMemorization} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Weekly Dhikr
  console.log(`\n📿 DHIKR (WEEKLY)`);
  if (goals.dhikrWeeklyGoal > 0) {
    const progress = calculateProgress(goals.dhikrWeeklyCompleted, goals.dhikrWeeklyGoal);
    const points = progress * IBADAH_WEIGHTS.weekly.dhikrWeekly;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.weekly.dhikrWeekly;
    breakdown.dhikrWeekly = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.weekly.dhikrWeekly,
      completed: goals.dhikrWeeklyCompleted,
      goal: goals.dhikrWeeklyGoal
    };
    console.log(`  Goal: ${goals.dhikrWeeklyCompleted}/${goals.dhikrWeeklyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.weekly.dhikrWeekly} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Fasting
  console.log(`\n🌙 FASTING (WEEKLY)`);
  if (goals.fastingWeeklyGoal > 0) {
    const progress = calculateProgress(goals.fastingWeeklyCompleted, goals.fastingWeeklyGoal);
    const points = progress * IBADAH_WEIGHTS.weekly.fasting;
    earnedPoints += points;
    totalPossiblePoints += IBADAH_WEIGHTS.weekly.fasting;
    breakdown.fasting = { 
      earned: points, 
      possible: IBADAH_WEIGHTS.weekly.fasting,
      completed: goals.fastingWeeklyCompleted,
      goal: goals.fastingWeeklyGoal
    };
    console.log(`  Goal: ${goals.fastingWeeklyCompleted}/${goals.fastingWeeklyGoal}`);
    console.log(`  Score: ${points.toFixed(1)}/${IBADAH_WEIGHTS.weekly.fasting} points (${(progress * 100).toFixed(0)}%)`);
    if (progress >= 1) console.log(`  ✅ COMPLETED`);
    else console.log(`  ❌ NOT COMPLETED`);
  } else {
    console.log('  ⚪ Goal disabled (0) - not counting');
  }
  
  // Calculate final score as percentage of enabled goals
  let finalScore = 0;
  if (totalPossiblePoints > 0) {
    finalScore = (earnedPoints / totalPossiblePoints) * 100;
  }
  
  console.log('\n========================================');
  console.log('📊 IBADAH SCORE SUMMARY');
  console.log('========================================');
  console.log(`Total Earned: ${earnedPoints.toFixed(1)} points`);
  console.log(`Total Possible: ${totalPossiblePoints.toFixed(1)} points`);
  console.log(`Final Score: ${finalScore.toFixed(1)}%`);
  console.log('\n🎯 BREAKDOWN BY ACTIVITY:');
  Object.entries(breakdown).forEach(([key, value]) => {
    const percentage = value.possible > 0 ? (value.earned / value.possible) * 100 : 0;
    const status = percentage >= 100 ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${value.completed}/${value.goal} = ${value.earned.toFixed(1)}/${value.possible} points (${percentage.toFixed(0)}%)`);
  });
  console.log('========================================\n');
  
  return Math.min(100, Math.round(finalScore));
}

/**
 * Calculate Ilm (Knowledge) Score
 * 
 * NEW LOGIC:
 * - Only count goals that are enabled (goal > 0)
 * - Calculate total possible weight from enabled goals
 * - Scale score to 0-100 based on enabled goals only
 */
export function calculateIlmScore(goals: IlmGoals): number {
  let earnedPoints = 0;
  let totalPossiblePoints = 0;
  const breakdown: Record<string, number> = {};
  
  // Lectures
  if (goals.weeklyLecturesGoal > 0) {
    const progress = calculateProgress(goals.weeklyLecturesCompleted, goals.weeklyLecturesGoal);
    const points = progress * ILM_WEIGHTS.weekly.lectures;
    earnedPoints += points;
    totalPossiblePoints += ILM_WEIGHTS.weekly.lectures;
    breakdown.lectures = points;
    console.log(`Lectures: ${goals.weeklyLecturesCompleted}/${goals.weeklyLecturesGoal} = ${points.toFixed(1)}/${ILM_WEIGHTS.weekly.lectures} points`);
  } else {
    console.log('Lectures: Goal disabled (0) - not counting');
  }
  
  // Recitations
  if (goals.weeklyRecitationsGoal > 0) {
    const progress = calculateProgress(goals.weeklyRecitationsCompleted, goals.weeklyRecitationsGoal);
    const points = progress * ILM_WEIGHTS.weekly.recitations;
    earnedPoints += points;
    totalPossiblePoints += ILM_WEIGHTS.weekly.recitations;
    breakdown.recitations = points;
    console.log(`Recitations: ${goals.weeklyRecitationsCompleted}/${goals.weeklyRecitationsGoal} = ${points.toFixed(1)}/${ILM_WEIGHTS.weekly.recitations} points`);
  } else {
    console.log('Recitations: Goal disabled (0) - not counting');
  }
  
  // Quizzes
  if (goals.weeklyQuizzesGoal > 0) {
    const progress = calculateProgress(goals.weeklyQuizzesCompleted, goals.weeklyQuizzesGoal);
    const points = progress * ILM_WEIGHTS.weekly.quizzes;
    earnedPoints += points;
    totalPossiblePoints += ILM_WEIGHTS.weekly.quizzes;
    breakdown.quizzes = points;
    console.log(`Quizzes: ${goals.weeklyQuizzesCompleted}/${goals.weeklyQuizzesGoal} = ${points.toFixed(1)}/${ILM_WEIGHTS.weekly.quizzes} points`);
  } else {
    console.log('Quizzes: Goal disabled (0) - not counting');
  }
  
  // Reflection
  if (goals.weeklyReflectionGoal > 0) {
    const progress = calculateProgress(goals.weeklyReflectionCompleted, goals.weeklyReflectionGoal);
    const points = progress * ILM_WEIGHTS.weekly.reflection;
    earnedPoints += points;
    totalPossiblePoints += ILM_WEIGHTS.weekly.reflection;
    breakdown.reflection = points;
    console.log(`Reflection: ${goals.weeklyReflectionCompleted}/${goals.weeklyReflectionGoal} = ${points.toFixed(1)}/${ILM_WEIGHTS.weekly.reflection} points`);
  } else {
    console.log('Reflection: Goal disabled (0) - not counting');
  }
  
  // Calculate final score as percentage of enabled goals
  let finalScore = 0;
  if (totalPossiblePoints > 0) {
    finalScore = (earnedPoints / totalPossiblePoints) * 100;
  }
  
  console.log('Ilm Score Breakdown:', breakdown);
  console.log(`Total Ilm Score: ${earnedPoints.toFixed(1)}/${totalPossiblePoints.toFixed(1)} = ${finalScore.toFixed(1)}%`);
  
  return Math.min(100, Math.round(finalScore));
}

/**
 * Calculate Amanah (Well-Being) Score
 * 
 * NEW LOGIC:
 * - Only count goals that are enabled (goal > 0)
 * - Calculate total possible weight from enabled goals
 * - Scale score to 0-100 based on enabled goals only
 */
export function calculateAmanahScore(goals: AmanahGoals): number {
  let earnedPoints = 0;
  let totalPossiblePoints = 0;
  const breakdown: Record<string, number> = {};
  
  // ===== DAILY ACTIVITIES =====
  
  // Exercise
  if (goals.dailyExerciseGoal > 0) {
    const progress = calculateProgress(goals.dailyExerciseCompleted, goals.dailyExerciseGoal);
    const points = progress * AMANAH_WEIGHTS.daily.exercise;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.daily.exercise;
    breakdown.exercise = points;
    console.log(`Exercise: ${goals.dailyExerciseCompleted}/${goals.dailyExerciseGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.daily.exercise} points`);
  } else {
    console.log('Exercise: Goal disabled (0) - not counting');
  }
  
  // Water
  if (goals.dailyWaterGoal > 0) {
    const progress = calculateProgress(goals.dailyWaterCompleted, goals.dailyWaterGoal);
    const points = progress * AMANAH_WEIGHTS.daily.water;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.daily.water;
    breakdown.water = points;
    console.log(`Water: ${goals.dailyWaterCompleted}/${goals.dailyWaterGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.daily.water} points`);
  } else {
    console.log('Water: Goal disabled (0) - not counting');
  }
  
  // Sleep
  if (goals.dailySleepGoal > 0) {
    const progress = calculateProgress(goals.dailySleepCompleted, goals.dailySleepGoal);
    const points = progress * AMANAH_WEIGHTS.daily.sleep;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.daily.sleep;
    breakdown.sleep = points;
    console.log(`Sleep: ${goals.dailySleepCompleted}/${goals.dailySleepGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.daily.sleep} points`);
  } else {
    console.log('Sleep: Goal disabled (0) - not counting');
  }
  
  // ===== WEEKLY ACTIVITIES =====
  
  // Workout
  if (goals.weeklyWorkoutGoal > 0) {
    const progress = calculateProgress(goals.weeklyWorkoutCompleted, goals.weeklyWorkoutGoal);
    const points = progress * AMANAH_WEIGHTS.weekly.workout;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.weekly.workout;
    breakdown.workout = points;
    console.log(`Workout: ${goals.weeklyWorkoutCompleted}/${goals.weeklyWorkoutGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.weekly.workout} points`);
  } else {
    console.log('Workout: Goal disabled (0) - not counting');
  }
  
  // Mental Health
  if (goals.weeklyMentalHealthGoal > 0) {
    const progress = calculateProgress(goals.weeklyMentalHealthCompleted, goals.weeklyMentalHealthGoal);
    const points = progress * AMANAH_WEIGHTS.weekly.mentalHealth;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.weekly.mentalHealth;
    breakdown.mentalHealth = points;
    console.log(`Mental Health: ${goals.weeklyMentalHealthCompleted}/${goals.weeklyMentalHealthGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.weekly.mentalHealth} points`);
  } else {
    console.log('Mental Health: Goal disabled (0) - not counting');
  }
  
  // Stress Management
  if (goals.weeklyStressManagementGoal > 0) {
    const progress = calculateProgress(goals.weeklyStressManagementCompleted, goals.weeklyStressManagementGoal);
    const points = progress * AMANAH_WEIGHTS.weekly.stressManagement;
    earnedPoints += points;
    totalPossiblePoints += AMANAH_WEIGHTS.weekly.stressManagement;
    breakdown.stress = points;
    console.log(`Stress Management: ${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal} = ${points.toFixed(1)}/${AMANAH_WEIGHTS.weekly.stressManagement} points`);
  } else {
    console.log('Stress Management: Goal disabled (0) - not counting');
  }
  
  // Calculate final score as percentage of enabled goals
  let finalScore = 0;
  if (totalPossiblePoints > 0) {
    finalScore = (earnedPoints / totalPossiblePoints) * 100;
  }
  
  console.log('Amanah Score Breakdown:', breakdown);
  console.log(`Total Amanah Score: ${earnedPoints.toFixed(1)}/${totalPossiblePoints.toFixed(1)} = ${finalScore.toFixed(1)}%`);
  
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
