
import AsyncStorage from '@react-native-async-storage/async-storage';

// ʿIbādah (Worship) Goals Interface
export interface IbadahGoals {
  // Salah (Prayer)
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
  
  // Quran
  quranDailyPagesGoal: number;
  quranDailyPagesCompleted: number;
  quranDailyVersesGoal: number;
  quranDailyVersesCompleted: number;
  quranWeeklyMemorizationGoal: number;
  quranWeeklyMemorizationCompleted: number;
  
  // Dhikr & Dua
  dhikrDailyGoal: number;
  dhikrDailyCompleted: number;
  dhikrWeeklyGoal: number;
  dhikrWeeklyCompleted: number;
  duaDailyGoal: number;
  duaDailyCompleted: number;
  
  // Fasting (optional)
  fastingWeeklyGoal: number;
  fastingWeeklyCompleted: number;
  
  score?: number;
}

// ʿIlm (Knowledge & Understanding) Goals Interface
export interface IlmGoals {
  // Lectures
  weeklyLecturesGoal: number; // number of lectures per week
  weeklyLecturesCompleted: number;
  
  // Quran Recitations
  weeklyRecitationsGoal: number; // number of recitations per week
  weeklyRecitationsCompleted: number;
  
  // Quizzes
  weeklyQuizzesGoal: number; // number of quizzes per week
  weeklyQuizzesCompleted: number;
  
  // Reflection prompts
  weeklyReflectionGoal: number;
  weeklyReflectionCompleted: number;
  
  score?: number;
}

// Amanah (Well-Being & Balance) Goals Interface
export interface AmanahGoals {
  // Physical health
  dailyExerciseGoal: number; // minutes per day
  dailyExerciseCompleted: number;
  dailyWaterGoal: number; // glasses per day
  dailyWaterCompleted: number;
  weeklyWorkoutGoal: number; // sessions per week
  weeklyWorkoutCompleted: number;
  
  // Mental health
  weeklyMentalHealthGoal: number; // activities per week (meditation, journaling, etc.)
  weeklyMentalHealthCompleted: number;
  
  // Sleep
  dailySleepGoal: number; // hours per night
  dailySleepCompleted: number;
  
  // Stress management
  weeklyStressManagementGoal: number;
  weeklyStressManagementCompleted: number;
  
  score?: number;
}

// Individual section scores
export interface SectionScores {
  ibadah: number; // 0-100
  ilm: number; // 0-100
  amanah: number; // 0-100
}

// Decay configuration
const DECAY_CONFIG = {
  BASE_DECAY_RATE_PER_HOUR: 1.2,
  DAILY_GOAL_PENALTY: 15,
  WEEKLY_GOAL_PENALTY: 25,
  MAX_DECAY_PER_DAY: 30,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  
  DECAY_MULTIPLIERS: {
    ALL_GOALS_MET: 0,
    MOST_GOALS_MET: 0.3,
    SOME_GOALS_MET: 0.7,
    FEW_GOALS_MET: 1.2,
    NO_GOALS_MET: 2.0,
  },
};

// Calculate ʿIbādah (Worship) Score (0-100)
export function calculateIbadahScore(goals: IbadahGoals): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Salah (55% of ʿIbādah) - INCREASED from 40%
  const fardCount = Object.values(goals.fardPrayers).filter(Boolean).length;
  const fardScore = (fardCount / 5) * 45; // 45% for 5 daily prayers - INCREASED from 30%
  totalScore += fardScore;
  totalWeight += 45;
  
  const sunnahScore = goals.sunnahDailyGoal > 0 
    ? Math.min(1, goals.sunnahCompleted / goals.sunnahDailyGoal) * 7 // 7% for sunnah
    : 7;
  totalScore += sunnahScore;
  totalWeight += 7;
  
  const tahajjudScore = goals.tahajjudWeeklyGoal > 0
    ? Math.min(1, goals.tahajjudCompleted / goals.tahajjudWeeklyGoal) * 3 // 3% for tahajjud
    : 3;
  totalScore += tahajjudScore;
  totalWeight += 3;
  
  // Quran (23% of ʿIbādah) - DECREASED from 30%
  const pagesScore = goals.quranDailyPagesGoal > 0
    ? Math.min(1, goals.quranDailyPagesCompleted / goals.quranDailyPagesGoal) * 9 // 9% - DECREASED from 12%
    : 0;
  totalScore += pagesScore;
  totalWeight += 9;
  
  const versesScore = goals.quranDailyVersesGoal > 0
    ? Math.min(1, goals.quranDailyVersesCompleted / goals.quranDailyVersesGoal) * 8 // 8% - DECREASED from 10%
    : 0;
  totalScore += versesScore;
  totalWeight += 8;
  
  const memorizationScore = goals.quranWeeklyMemorizationGoal > 0
    ? Math.min(1, goals.quranWeeklyMemorizationCompleted / goals.quranWeeklyMemorizationGoal) * 6 // 6% - DECREASED from 8%
    : 6;
  totalScore += memorizationScore;
  totalWeight += 6;
  
  // Dhikr & Dua (19% of ʿIbādah) - DECREASED from 25%
  const dhikrDailyScore = goals.dhikrDailyGoal > 0
    ? Math.min(1, goals.dhikrDailyCompleted / goals.dhikrDailyGoal) * 8 // 8% - DECREASED from 10%
    : 0;
  totalScore += dhikrDailyScore;
  totalWeight += 8;
  
  const dhikrWeeklyScore = goals.dhikrWeeklyGoal > 0
    ? Math.min(1, goals.dhikrWeeklyCompleted / goals.dhikrWeeklyGoal) * 6 // 6% - DECREASED from 8%
    : 6;
  totalScore += dhikrWeeklyScore;
  totalWeight += 6;
  
  const duaScore = goals.duaDailyGoal > 0
    ? Math.min(1, goals.duaDailyCompleted / goals.duaDailyGoal) * 5 // 5% - DECREASED from 7%
    : 5;
  totalScore += duaScore;
  totalWeight += 5;
  
  // Fasting (3% of ʿIbādah - optional) - DECREASED from 5%
  const fastingScore = goals.fastingWeeklyGoal > 0
    ? Math.min(1, goals.fastingWeeklyCompleted / goals.fastingWeeklyGoal) * 3 // 3% - DECREASED from 5%
    : 3;
  totalScore += fastingScore;
  totalWeight += 3;
  
  return Math.min(100, totalScore);
}

// Calculate ʿIlm (Knowledge) Score (0-100)
export function calculateIlmScore(goals: IlmGoals): number {
  let totalScore = 0;
  
  // Weekly lectures (35%)
  const lecturesScore = goals.weeklyLecturesGoal > 0
    ? Math.min(1, goals.weeklyLecturesCompleted / goals.weeklyLecturesGoal) * 35
    : 35;
  totalScore += lecturesScore;
  
  // Weekly recitations (30%)
  const recitationsScore = goals.weeklyRecitationsGoal > 0
    ? Math.min(1, goals.weeklyRecitationsCompleted / goals.weeklyRecitationsGoal) * 30
    : 30;
  totalScore += recitationsScore;
  
  // Weekly quizzes (20%)
  const quizzesScore = goals.weeklyQuizzesGoal > 0
    ? Math.min(1, goals.weeklyQuizzesCompleted / goals.weeklyQuizzesGoal) * 20
    : 20;
  totalScore += quizzesScore;
  
  // Weekly reflection (15%)
  const reflectionScore = goals.weeklyReflectionGoal > 0
    ? Math.min(1, goals.weeklyReflectionCompleted / goals.weeklyReflectionGoal) * 15
    : 15;
  totalScore += reflectionScore;
  
  return Math.min(100, totalScore);
}

// Calculate Amanah (Well-Being) Score (0-100)
export function calculateAmanahScore(goals: AmanahGoals): number {
  let totalScore = 0;
  
  // Physical health (50%)
  const exerciseScore = goals.dailyExerciseGoal > 0
    ? Math.min(1, goals.dailyExerciseCompleted / goals.dailyExerciseGoal) * 20 // 20%
    : 0;
  totalScore += exerciseScore;
  
  const waterScore = goals.dailyWaterGoal > 0
    ? Math.min(1, goals.dailyWaterCompleted / goals.dailyWaterGoal) * 15 // 15%
    : 0;
  totalScore += waterScore;
  
  const workoutScore = goals.weeklyWorkoutGoal > 0
    ? Math.min(1, goals.weeklyWorkoutCompleted / goals.weeklyWorkoutGoal) * 15 // 15%
    : 15;
  totalScore += workoutScore;
  
  // Mental health (30%)
  const mentalHealthScore = goals.weeklyMentalHealthGoal > 0
    ? Math.min(1, goals.weeklyMentalHealthCompleted / goals.weeklyMentalHealthGoal) * 20 // 20%
    : 20;
  totalScore += mentalHealthScore;
  
  const stressScore = goals.weeklyStressManagementGoal > 0
    ? Math.min(1, goals.weeklyStressManagementCompleted / goals.weeklyStressManagementGoal) * 10 // 10%
    : 10;
  totalScore += stressScore;
  
  // Sleep (20%)
  const sleepScore = goals.dailySleepGoal > 0
    ? Math.min(1, goals.dailySleepCompleted / goals.dailySleepGoal) * 20 // 20%
    : 0;
  totalScore += sleepScore;
  
  return Math.min(100, totalScore);
}

// Calculate all section scores
export function calculateAllSectionScores(
  ibadahGoals: IbadahGoals,
  ilmGoals: IlmGoals,
  amanahGoals: AmanahGoals
): SectionScores {
  return {
    ibadah: calculateIbadahScore(ibadahGoals),
    ilm: calculateIlmScore(ilmGoals),
    amanah: calculateAmanahScore(amanahGoals),
  };
}

// Get decay multiplier based on completion percentage
function getDecayMultiplier(completionPercentage: number): number {
  if (completionPercentage >= 100) return DECAY_CONFIG.DECAY_MULTIPLIERS.ALL_GOALS_MET;
  if (completionPercentage >= 80) return DECAY_CONFIG.DECAY_MULTIPLIERS.MOST_GOALS_MET;
  if (completionPercentage >= 50) return DECAY_CONFIG.DECAY_MULTIPLIERS.SOME_GOALS_MET;
  if (completionPercentage >= 25) return DECAY_CONFIG.DECAY_MULTIPLIERS.FEW_GOALS_MET;
  return DECAY_CONFIG.DECAY_MULTIPLIERS.NO_GOALS_MET;
}

// Apply decay to a section score
export function applyDecayToSection(
  currentScore: number,
  lastUpdated: string,
  currentCompletion: number
): number {
  const now = new Date();
  const lastUpdate = new Date(lastUpdated);
  const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate < 0.1) {
    return currentScore;
  }
  
  const decayMultiplier = getDecayMultiplier(currentCompletion);
  const decayPerHour = DECAY_CONFIG.BASE_DECAY_RATE_PER_HOUR * decayMultiplier;
  const totalDecay = Math.min(
    decayPerHour * hoursSinceUpdate,
    DECAY_CONFIG.MAX_DECAY_PER_DAY
  );
  
  const newScore = currentScore - totalDecay;
  return Math.max(DECAY_CONFIG.MIN_SCORE, newScore);
}

// Apply penalty for unmet daily goals
export function applyDailyGoalPenalty(currentScore: number, goalsMet: boolean): number {
  if (goalsMet) {
    return currentScore;
  }
  
  const newScore = currentScore - DECAY_CONFIG.DAILY_GOAL_PENALTY;
  return Math.max(DECAY_CONFIG.MIN_SCORE, newScore);
}

// Apply penalty for unmet weekly goals
export function applyWeeklyGoalPenalty(currentScore: number, goalsMet: boolean): number {
  if (goalsMet) {
    return currentScore;
  }
  
  const newScore = currentScore - DECAY_CONFIG.WEEKLY_GOAL_PENALTY;
  return Math.max(DECAY_CONFIG.MIN_SCORE, newScore);
}

// Load ʿIbādah Goals from AsyncStorage
export async function loadIbadahGoals(): Promise<IbadahGoals> {
  try {
    const saved = await AsyncStorage.getItem('ibadahGoals');
    if (saved) {
      return JSON.parse(saved);
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
  } catch (error) {
    console.log('Error loading ibadah goals:', error);
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
}

// Load ʿIlm Goals from AsyncStorage
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
      // Remove old dailyLearningGoal if it exists
      if (Object.prototype.hasOwnProperty.call(parsed, 'dailyLearningGoal')) {
        delete parsed.dailyLearningGoal;
        delete parsed.dailyLearningCompleted;
      }
      return parsed;
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
  } catch (error) {
    console.log('Error loading ilm goals:', error);
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
}

// Load Amanah Goals from AsyncStorage
export async function loadAmanahGoals(): Promise<AmanahGoals> {
  try {
    const saved = await AsyncStorage.getItem('amanahGoals');
    if (saved) {
      return JSON.parse(saved);
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
  } catch (error) {
    console.log('Error loading amanah goals:', error);
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
}

// Save goals
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

// Get current section scores with decay applied
export async function getCurrentSectionScores(): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
    const freshScores = calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals);
    
    const lastUpdated = await AsyncStorage.getItem('sectionScoresLastUpdated');
    const storedScores = await AsyncStorage.getItem('sectionScores');
    
    if (!lastUpdated || !storedScores) {
      await AsyncStorage.setItem('sectionScores', JSON.stringify(freshScores));
      await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
      return freshScores;
    }
    
    const stored: SectionScores = JSON.parse(storedScores);
    
    const decayedScores: SectionScores = {
      ibadah: applyDecayToSection(stored.ibadah, lastUpdated, freshScores.ibadah),
      ilm: applyDecayToSection(stored.ilm, lastUpdated, freshScores.ilm),
      amanah: applyDecayToSection(stored.amanah, lastUpdated, freshScores.amanah),
    };
    
    const finalScores: SectionScores = {
      ibadah: Math.max(decayedScores.ibadah, freshScores.ibadah),
      ilm: Math.max(decayedScores.ilm, freshScores.ilm),
      amanah: Math.max(decayedScores.amanah, freshScores.amanah),
    };
    
    await AsyncStorage.setItem('sectionScores', JSON.stringify(finalScores));
    await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    
    return finalScores;
  } catch (error) {
    console.log('Error getting current section scores:', error);
    return { ibadah: 0, ilm: 0, amanah: 0 };
  }
}

// Update section scores
export async function updateSectionScores(): Promise<SectionScores> {
  return await getCurrentSectionScores();
}

// Check if daily goals were met
async function checkDailyGoalsMet(): Promise<{ ibadah: boolean; ilm: boolean; amanah: boolean }> {
  const ibadahGoals = await loadIbadahGoals();
  const ilmGoals = await loadIlmGoals();
  const amanahGoals = await loadAmanahGoals();
  
  const ibadahMet = Object.values(ibadahGoals.fardPrayers).every(Boolean) && 
                    ibadahGoals.sunnahCompleted >= ibadahGoals.sunnahDailyGoal &&
                    ibadahGoals.dhikrDailyCompleted >= ibadahGoals.dhikrDailyGoal &&
                    ibadahGoals.duaDailyCompleted >= ibadahGoals.duaDailyGoal;
  
  const ilmMet = true; // No daily goals for ilm anymore
  
  const amanahMet = amanahGoals.dailyExerciseCompleted >= amanahGoals.dailyExerciseGoal &&
                    amanahGoals.dailyWaterCompleted >= amanahGoals.dailyWaterGoal &&
                    amanahGoals.dailySleepCompleted >= amanahGoals.dailySleepGoal;
  
  return { ibadah: ibadahMet, ilm: ilmMet, amanah: amanahMet };
}

// Check if weekly goals were met
async function checkWeeklyGoalsMet(): Promise<{ ibadah: boolean; ilm: boolean; amanah: boolean }> {
  const ibadahGoals = await loadIbadahGoals();
  const ilmGoals = await loadIlmGoals();
  const amanahGoals = await loadAmanahGoals();
  
  const ibadahMet = ibadahGoals.tahajjudCompleted >= ibadahGoals.tahajjudWeeklyGoal &&
                    ibadahGoals.dhikrWeeklyCompleted >= ibadahGoals.dhikrWeeklyGoal &&
                    ibadahGoals.quranWeeklyMemorizationCompleted >= ibadahGoals.quranWeeklyMemorizationGoal;
  
  const ilmMet = ilmGoals.weeklyLecturesCompleted >= ilmGoals.weeklyLecturesGoal &&
                 ilmGoals.weeklyRecitationsCompleted >= ilmGoals.weeklyRecitationsGoal &&
                 ilmGoals.weeklyQuizzesCompleted >= ilmGoals.weeklyQuizzesGoal;
  
  const amanahMet = amanahGoals.weeklyWorkoutCompleted >= amanahGoals.weeklyWorkoutGoal &&
                    amanahGoals.weeklyMentalHealthCompleted >= amanahGoals.weeklyMentalHealthGoal;
  
  return { ibadah: ibadahMet, ilm: ilmMet, amanah: amanahMet };
}

// Reset daily goals
export async function resetDailyGoals(): Promise<void> {
  try {
    console.log('Resetting daily goals...');
    
    const goalsMet = await checkDailyGoalsMet();
    
    const currentScores = await getCurrentSectionScores();
    const penalizedScores: SectionScores = {
      ibadah: applyDailyGoalPenalty(currentScores.ibadah, goalsMet.ibadah),
      ilm: applyDailyGoalPenalty(currentScores.ilm, goalsMet.ilm),
      amanah: applyDailyGoalPenalty(currentScores.amanah, goalsMet.amanah),
    };
    
    await AsyncStorage.setItem('sectionScores', JSON.stringify(penalizedScores));
    await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
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
    
    // No daily goals for ilm anymore
    
    amanahGoals.dailyExerciseCompleted = 0;
    amanahGoals.dailyWaterCompleted = 0;
    amanahGoals.dailySleepCompleted = 0;
    
    await AsyncStorage.setItem('ibadahGoals', JSON.stringify(ibadahGoals));
    await AsyncStorage.setItem('ilmGoals', JSON.stringify(ilmGoals));
    await AsyncStorage.setItem('amanahGoals', JSON.stringify(amanahGoals));
    
    console.log('Daily goals reset.');
  } catch (error) {
    console.log('Error resetting daily goals:', error);
  }
}

// Reset weekly goals
export async function resetWeeklyGoals(): Promise<void> {
  try {
    console.log('Resetting weekly goals...');
    
    const goalsMet = await checkWeeklyGoalsMet();
    
    const currentScores = await getCurrentSectionScores();
    const penalizedScores: SectionScores = {
      ibadah: applyWeeklyGoalPenalty(currentScores.ibadah, goalsMet.ibadah),
      ilm: applyWeeklyGoalPenalty(currentScores.ilm, goalsMet.ilm),
      amanah: applyWeeklyGoalPenalty(currentScores.amanah, goalsMet.amanah),
    };
    
    await AsyncStorage.setItem('sectionScores', JSON.stringify(penalizedScores));
    await AsyncStorage.setItem('sectionScoresLastUpdated', new Date().toISOString());
    
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
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
    
    console.log('Weekly goals reset.');
  } catch (error) {
    console.log('Error resetting weekly goals:', error);
  }
}

// Get overall Iman score with weighted sections
// UPDATED: Ibadah now has 50% weight, Ilm 25%, Amanah 25%
export async function getOverallImanScore(): Promise<number> {
  const scores = await getCurrentSectionScores();
  // Weighted average: Ibadah 50%, Ilm 25%, Amanah 25%
  const weightedScore = (scores.ibadah * 0.5) + (scores.ilm * 0.25) + (scores.amanah * 0.25);
  return Math.round(weightedScore);
}

// Check and handle time-based resets
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

// Legacy compatibility - keep old interfaces for backward compatibility
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
