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

// Overall ring weights for final Iman score
const SECTION_WEIGHTS = {
  ibadah: 0.60,  // 60% - Most important (Worship is the foundation)
  ilm: 0.25,     // 25% - Knowledge
  amanah: 0.15,  // 15% - Well-being
};

// Ibadah goal weights (Fard prayers are most important)
const IBADAH_WEIGHTS = {
  fard: 5,       // Fard prayers weighted 5x
  normal: 1,     // Other goals weighted 1x
};

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
export function calculateIbadahScore(goals: IbadahGoals): number {
  const items: Array<{ progress: number; weight: number }> = [];

  // Fard Prayers (always enabled, heavily weighted)
  const fardCompleted = 
    (goals.fardPrayers.fajr ? 1 : 0) +
    (goals.fardPrayers.dhuhr ? 1 : 0) +
    (goals.fardPrayers.asr ? 1 : 0) +
    (goals.fardPrayers.maghrib ? 1 : 0) +
    (goals.fardPrayers.isha ? 1 : 0);
  const fardProgress = calculateProgress(fardCompleted, 5);
  items.push({ progress: fardProgress, weight: IBADAH_WEIGHTS.fard });

  // Optional goals (only if enabled)
  if (goals.sunnahDailyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.sunnahCompleted, goals.sunnahDailyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.tahajjudWeeklyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.tahajjudCompleted, goals.tahajjudWeeklyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.quranDailyPagesGoal > 0) {
    items.push({
      progress: calculateProgress(goals.quranDailyPagesCompleted, goals.quranDailyPagesGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.quranDailyVersesGoal > 0) {
    items.push({
      progress: calculateProgress(goals.quranDailyVersesCompleted, goals.quranDailyVersesGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.quranWeeklyMemorizationGoal > 0) {
    items.push({
      progress: calculateProgress(goals.quranWeeklyMemorizationCompleted, goals.quranWeeklyMemorizationGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.dhikrDailyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.dhikrDailyCompleted, goals.dhikrDailyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.dhikrWeeklyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.dhikrWeeklyCompleted, goals.dhikrWeeklyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.duaDailyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.duaDailyCompleted || 0, goals.duaDailyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  if (goals.fastingWeeklyGoal > 0) {
    items.push({
      progress: calculateProgress(goals.fastingWeeklyCompleted, goals.fastingWeeklyGoal),
      weight: IBADAH_WEIGHTS.normal,
    });
  }

  return Math.round(weightedAverage(items));
}

/**
 * Calculate Ilm (Knowledge) score
 */
export function calculateIlmScore(goals: IlmGoals): number {
  const items: Array<{ progress: number; weight: number }> = [];

  if (goals.weeklyLecturesGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyLecturesCompleted, goals.weeklyLecturesGoal),
      weight: 1,
    });
  }


  if (goals.weeklyQuizzesGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyQuizzesCompleted, goals.weeklyQuizzesGoal),
      weight: 1,
    });
  }

  if (goals.weeklyReflectionGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyReflectionCompleted, goals.weeklyReflectionGoal),
      weight: 1,
    });
  }

  return Math.round(weightedAverage(items));
}

/**
 * Calculate Amanah (Well-Being) score
 */
export function calculateAmanahScore(goals: AmanahGoals): number {
  const items: Array<{ progress: number; weight: number }> = [];

  // Daily goals
  if (goals.dailyExerciseGoal > 0) {
    items.push({
      progress: calculateProgress(goals.dailyExerciseCompleted, goals.dailyExerciseGoal),
      weight: 1,
    });
  }

  if (goals.dailyWaterGoal > 0) {
    items.push({
      progress: calculateProgress(goals.dailyWaterCompleted, goals.dailyWaterGoal),
      weight: 1,
    });
  }

  if (goals.dailySleepGoal > 0) {
    items.push({
      progress: calculateProgress(goals.dailySleepCompleted, goals.dailySleepGoal),
      weight: 1,
    });
  }

  // Weekly goals
  if (goals.weeklyWorkoutGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyWorkoutCompleted, goals.weeklyWorkoutGoal),
      weight: 1,
    });
  }

  if (goals.weeklyMeditationGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyMeditationCompleted, goals.weeklyMeditationGoal),
      weight: 1,
    });
  }

  if (goals.weeklyJournalGoal > 0) {
    items.push({
      progress: calculateProgress(goals.weeklyJournalCompleted, goals.weeklyJournalGoal),
      weight: 1,
    });
  }

  // Workout type goals (if enabled)
  if (goals.workoutTypeGoals) {
    for (const [type, typeGoals] of Object.entries(goals.workoutTypeGoals)) {
      if (typeGoals?.daily && typeGoals.daily > 0) {
        const completed = goals.workoutTypeCompleted?.[type as keyof typeof goals.workoutTypeCompleted]?.daily || 0;
        items.push({
          progress: calculateProgress(completed, typeGoals.daily),
          weight: 1,
        });
      }
      if (typeGoals?.weekly && typeGoals.weekly > 0) {
        const completed = goals.workoutTypeCompleted?.[type as keyof typeof goals.workoutTypeCompleted]?.weekly || 0;
        items.push({
          progress: calculateProgress(completed, typeGoals.weekly),
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
  const scores: SectionScores = {
    ibadah: calculateIbadahScore(ibadahGoals),
    ilm: calculateIlmScore(ilmGoals),
    amanah: calculateAmanahScore(amanahGoals),
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
        
        // Use cache if less than 1 hour old
        if (hoursSinceUpdate < 1) {
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
 * Get overall Iman score (weighted combination of sections)
 */
export async function getOverallImanScore(userId?: string | null): Promise<number> {
  const scores = await getCurrentSectionScores(userId);
  
  const overallScore = 
    (scores.ibadah * SECTION_WEIGHTS.ibadah) +
    (scores.ilm * SECTION_WEIGHTS.ilm) +
    (scores.amanah * SECTION_WEIGHTS.amanah);
  
  return Math.round(overallScore);
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
    
    // Reset weekly counters
    ibadahGoals.tahajjudCompleted = 0;
    ibadahGoals.dhikrWeeklyCompleted = 0;
    ibadahGoals.quranWeeklyMemorizationCompleted = 0;
    ibadahGoals.fastingWeeklyCompleted = 0;
    
    ilmGoals.weeklyLecturesCompleted = 0;
    ilmGoals.weeklyQuizzesCompleted = 0;
    ilmGoals.weeklyReflectionCompleted = 0;
    
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
  if (!lastDateString) return true;
  return lastDateString !== currentDateString;
}

function isSundayMidnight(now: Date): boolean {
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  return dayOfWeek === 0 && hours === 0;
}

function hasResetThisWeek(lastWeeklyResetDate: string | null, currentSundayDate: string): boolean {
  if (!lastWeeklyResetDate) return false;
  return lastWeeklyResetDate === currentSundayDate;
}

export async function checkAndHandleResets(userId?: string | null): Promise<void> {
  try {
    const today = getLocalMidnightDateString();
    const now = new Date();
    
    const lastDateKey = userId ? `lastImanDate_${userId}` : 'lastImanDate';
    const lastDate = await AsyncStorage.getItem(lastDateKey);
    
    if (isNewDay(lastDate, today)) {
      await resetDailyGoals(userId);
      await AsyncStorage.setItem(lastDateKey, today);
    }
    
    const lastWeeklyResetKey = userId ? `lastWeeklyResetDate_${userId}` : 'lastWeeklyResetDate';
    const lastWeeklyReset = await AsyncStorage.getItem(lastWeeklyResetKey);
    
    if (isSundayMidnight(now)) {
      if (!hasResetThisWeek(lastWeeklyReset, today)) {
        await resetWeeklyGoals(userId);
        await AsyncStorage.setItem(lastWeeklyResetKey, today);
      }
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
      return parsed;
    }
  } catch (error) {
    console.error('Error loading ilm goals:', error);
  }
  
  return {
    weeklyLecturesGoal: 0,
    weeklyLecturesCompleted: 0,
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
