
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes } from './prayerTimeService';
import { updateScoresWithDecay, recordActivity } from './imanDecaySystem';

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

// Helper function to determine which prayers have passed
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
    
    console.log('Prayers that have passed:', passedPrayers);
    return passedPrayers;
  } catch (error) {
    console.log('Error getting prayer times for score calculation:', error);
    // Fallback: assume all prayers have passed if we can't get prayer times
    return ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  }
}

// Calculate ʿIbādah (Worship) Score (0-100)
export async function calculateIbadahScore(goals: IbadahGoals): Promise<number> {
  let totalScore = 0;
  let totalWeight = 0;
  
  // Get which prayers have passed
  const passedPrayers = await getPrayersThatHavePassed();
  const totalPassedPrayers = passedPrayers.length;
  
  // Salah (55% of ʿIbādah)
  // Only count prayers that have passed
  let completedPassedPrayers = 0;
  for (const prayerName of passedPrayers) {
    const prayerKey = prayerName as keyof typeof goals.fardPrayers;
    if (goals.fardPrayers[prayerKey]) {
      completedPassedPrayers++;
    }
  }
  
  // Calculate fard score based on prayers that have passed
  const fardScore = totalPassedPrayers > 0 
    ? (completedPassedPrayers / totalPassedPrayers) * 45 // 45% for prayers that have passed
    : 45; // If no prayers have passed yet, give full score
  
  console.log(`Prayer Score: ${completedPassedPrayers}/${totalPassedPrayers} passed prayers completed = ${fardScore.toFixed(1)}%`);
  
  totalScore += fardScore;
  totalWeight += 45;
  
  // FIXED: Only give credit if goal is set AND progress is made
  const sunnahScore = goals.sunnahDailyGoal > 0 
    ? Math.min(1, goals.sunnahCompleted / goals.sunnahDailyGoal) * 7 // 7% for sunnah
    : 0; // NO CREDIT if goal not set
  totalScore += sunnahScore;
  totalWeight += 7;
  
  const tahajjudScore = goals.tahajjudWeeklyGoal > 0
    ? Math.min(1, goals.tahajjudCompleted / goals.tahajjudWeeklyGoal) * 3 // 3% for tahajjud
    : 0; // NO CREDIT if goal not set
  totalScore += tahajjudScore;
  totalWeight += 3;
  
  // Quran (23% of ʿIbādah)
  const pagesScore = goals.quranDailyPagesGoal > 0
    ? Math.min(1, goals.quranDailyPagesCompleted / goals.quranDailyPagesGoal) * 9 // 9%
    : 0; // NO CREDIT if goal not set
  totalScore += pagesScore;
  totalWeight += 9;
  
  const versesScore = goals.quranDailyVersesGoal > 0
    ? Math.min(1, goals.quranDailyVersesCompleted / goals.quranDailyVersesGoal) * 8 // 8%
    : 0; // NO CREDIT if goal not set
  totalScore += versesScore;
  totalWeight += 8;
  
  const memorizationScore = goals.quranWeeklyMemorizationGoal > 0
    ? Math.min(1, goals.quranWeeklyMemorizationCompleted / goals.quranWeeklyMemorizationGoal) * 6 // 6%
    : 0; // NO CREDIT if goal not set
  totalScore += memorizationScore;
  totalWeight += 6;
  
  // Dhikr & Dua (19% of ʿIbādah)
  const dhikrDailyScore = goals.dhikrDailyGoal > 0
    ? Math.min(1, goals.dhikrDailyCompleted / goals.dhikrDailyGoal) * 8 // 8%
    : 0; // NO CREDIT if goal not set
  totalScore += dhikrDailyScore;
  totalWeight += 8;
  
  const dhikrWeeklyScore = goals.dhikrWeeklyGoal > 0
    ? Math.min(1, goals.dhikrWeeklyCompleted / goals.dhikrWeeklyGoal) * 6 // 6%
    : 0; // NO CREDIT if goal not set
  totalScore += dhikrWeeklyScore;
  totalWeight += 6;
  
  const duaScore = goals.duaDailyGoal > 0
    ? Math.min(1, goals.duaDailyCompleted / goals.duaDailyGoal) * 5 // 5%
    : 0; // NO CREDIT if goal not set
  totalScore += duaScore;
  totalWeight += 5;
  
  // Fasting (3% of ʿIbādah - optional)
  const fastingScore = goals.fastingWeeklyGoal > 0
    ? Math.min(1, goals.fastingWeeklyCompleted / goals.fastingWeeklyGoal) * 3 // 3%
    : 0; // NO CREDIT if goal not set
  totalScore += fastingScore;
  totalWeight += 3;
  
  console.log(`Ibadah Score Breakdown:
    - Fard Prayers: ${fardScore.toFixed(1)}% (${completedPassedPrayers}/${totalPassedPrayers})
    - Sunnah: ${sunnahScore.toFixed(1)}% (${goals.sunnahCompleted}/${goals.sunnahDailyGoal})
    - Tahajjud: ${tahajjudScore.toFixed(1)}% (${goals.tahajjudCompleted}/${goals.tahajjudWeeklyGoal})
    - Quran Pages: ${pagesScore.toFixed(1)}% (${goals.quranDailyPagesCompleted}/${goals.quranDailyPagesGoal})
    - Quran Verses: ${versesScore.toFixed(1)}% (${goals.quranDailyVersesCompleted}/${goals.quranDailyVersesGoal})
    - Memorization: ${memorizationScore.toFixed(1)}% (${goals.quranWeeklyMemorizationCompleted}/${goals.quranWeeklyMemorizationGoal})
    - Dhikr Daily: ${dhikrDailyScore.toFixed(1)}% (${goals.dhikrDailyCompleted}/${goals.dhikrDailyGoal})
    - Dhikr Weekly: ${dhikrWeeklyScore.toFixed(1)}% (${goals.dhikrWeeklyCompleted}/${goals.dhikrWeeklyGoal})
    - Dua: ${duaScore.toFixed(1)}% (${goals.duaDailyCompleted}/${goals.duaDailyGoal})
    - Fasting: ${fastingScore.toFixed(1)}% (${goals.fastingWeeklyCompleted}/${goals.fastingWeeklyGoal})
    TOTAL: ${totalScore.toFixed(1)}%`);
  
  return Math.min(100, totalScore);
}

// Calculate ʿIlm (Knowledge) Score (0-100)
export function calculateIlmScore(goals: IlmGoals): number {
  let totalScore = 0;
  
  // FIXED: Only give credit if goal is set AND progress is made
  // Weekly lectures (35%)
  const lecturesScore = goals.weeklyLecturesGoal > 0
    ? Math.min(1, goals.weeklyLecturesCompleted / goals.weeklyLecturesGoal) * 35
    : 0; // NO CREDIT if goal not set
  totalScore += lecturesScore;
  
  // Weekly recitations (30%)
  const recitationsScore = goals.weeklyRecitationsGoal > 0
    ? Math.min(1, goals.weeklyRecitationsCompleted / goals.weeklyRecitationsGoal) * 30
    : 0; // NO CREDIT if goal not set
  totalScore += recitationsScore;
  
  // Weekly quizzes (20%)
  const quizzesScore = goals.weeklyQuizzesGoal > 0
    ? Math.min(1, goals.weeklyQuizzesCompleted / goals.weeklyQuizzesGoal) * 20
    : 0; // NO CREDIT if goal not set
  totalScore += quizzesScore;
  
  // Weekly reflection (15%)
  const reflectionScore = goals.weeklyReflectionGoal > 0
    ? Math.min(1, goals.weeklyReflectionCompleted / goals.weeklyReflectionGoal) * 15
    : 0; // NO CREDIT if goal not set
  totalScore += reflectionScore;
  
  console.log(`Ilm Score Breakdown:
    - Lectures: ${lecturesScore.toFixed(1)}% (${goals.weeklyLecturesCompleted}/${goals.weeklyLecturesGoal})
    - Recitations: ${recitationsScore.toFixed(1)}% (${goals.weeklyRecitationsCompleted}/${goals.weeklyRecitationsGoal})
    - Quizzes: ${quizzesScore.toFixed(1)}% (${goals.weeklyQuizzesCompleted}/${goals.weeklyQuizzesGoal})
    - Reflection: ${reflectionScore.toFixed(1)}% (${goals.weeklyReflectionCompleted}/${goals.weeklyReflectionGoal})
    TOTAL: ${totalScore.toFixed(1)}%`);
  
  return Math.min(100, totalScore);
}

// Calculate Amanah (Well-Being) Score (0-100)
export function calculateAmanahScore(goals: AmanahGoals): number {
  let totalScore = 0;
  
  // FIXED: Only give credit if goal is set AND progress is made
  // Physical health (50%)
  const exerciseScore = goals.dailyExerciseGoal > 0
    ? Math.min(1, goals.dailyExerciseCompleted / goals.dailyExerciseGoal) * 20 // 20%
    : 0; // NO CREDIT if goal not set
  totalScore += exerciseScore;
  
  const waterScore = goals.dailyWaterGoal > 0
    ? Math.min(1, goals.dailyWaterCompleted / goals.dailyWaterGoal) * 15 // 15%
    : 0; // NO CREDIT if goal not set
  totalScore += waterScore;
  
  const workoutScore = goals.weeklyWorkoutGoal > 0
    ? Math.min(1, goals.weeklyWorkoutCompleted / goals.weeklyWorkoutGoal) * 15 // 15%
    : 0; // NO CREDIT if goal not set
  totalScore += workoutScore;
  
  // Mental health (30%)
  const mentalHealthScore = goals.weeklyMentalHealthGoal > 0
    ? Math.min(1, goals.weeklyMentalHealthCompleted / goals.weeklyMentalHealthGoal) * 20 // 20%
    : 0; // NO CREDIT if goal not set
  totalScore += mentalHealthScore;
  
  const stressScore = goals.weeklyStressManagementGoal > 0
    ? Math.min(1, goals.weeklyStressManagementCompleted / goals.weeklyStressManagementGoal) * 10 // 10%
    : 0; // NO CREDIT if goal not set
  totalScore += stressScore;
  
  // Sleep (20%)
  const sleepScore = goals.dailySleepGoal > 0
    ? Math.min(1, goals.dailySleepCompleted / goals.dailySleepGoal) * 20 // 20%
    : 0; // NO CREDIT if goal not set
  totalScore += sleepScore;
  
  console.log(`Amanah Score Breakdown:
    - Exercise: ${exerciseScore.toFixed(1)}% (${goals.dailyExerciseCompleted}/${goals.dailyExerciseGoal})
    - Water: ${waterScore.toFixed(1)}% (${goals.dailyWaterCompleted}/${goals.dailyWaterGoal})
    - Workout: ${workoutScore.toFixed(1)}% (${goals.weeklyWorkoutCompleted}/${goals.weeklyWorkoutGoal})
    - Mental Health: ${mentalHealthScore.toFixed(1)}% (${goals.weeklyMentalHealthCompleted}/${goals.weeklyMentalHealthGoal})
    - Stress: ${stressScore.toFixed(1)}% (${goals.weeklyStressManagementCompleted}/${goals.weeklyStressManagementGoal})
    - Sleep: ${sleepScore.toFixed(1)}% (${goals.dailySleepCompleted}/${goals.dailySleepGoal})
    TOTAL: ${totalScore.toFixed(1)}%`);
  
  return Math.min(100, totalScore);
}

// Calculate all section scores
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

// Get current section scores with NEW DECAY SYSTEM applied
export async function getCurrentSectionScores(): Promise<SectionScores> {
  try {
    const ibadahGoals = await loadIbadahGoals();
    const ilmGoals = await loadIlmGoals();
    const amanahGoals = await loadAmanahGoals();
    
    // Calculate fresh scores based on current goals
    const freshScores = await calculateAllSectionScores(ibadahGoals, ilmGoals, amanahGoals);
    
    console.log('Fresh scores calculated:', freshScores);
    
    // Apply the new momentum-based decay system
    const finalScores = await updateScoresWithDecay(
      { ibadah: ibadahGoals, ilm: ilmGoals, amanah: amanahGoals },
      freshScores
    );
    
    console.log('Final scores after decay:', finalScores);
    
    // Store the final scores
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
  
  // Get which prayers have passed
  const passedPrayers = await getPrayersThatHavePassed();
  
  // Check if all passed prayers are completed
  let allPassedPrayersCompleted = true;
  for (const prayerName of passedPrayers) {
    const prayerKey = prayerName as keyof typeof ibadahGoals.fardPrayers;
    if (!ibadahGoals.fardPrayers[prayerKey]) {
      allPassedPrayersCompleted = false;
      break;
    }
  }
  
  const ibadahMet = allPassedPrayersCompleted && 
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
    
    console.log('Daily goals reset. Decay system will handle score adjustments.');
  } catch (error) {
    console.log('Error resetting daily goals:', error);
  }
}

// Reset weekly goals
export async function resetWeeklyGoals(): Promise<void> {
  try {
    console.log('Resetting weekly goals...');
    
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
    
    console.log('Weekly goals reset. Decay system will handle score adjustments.');
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
  console.log(`Overall Iman Score: ${Math.round(weightedScore)}% (Ibadah: ${scores.ibadah}%, Ilm: ${scores.ilm}%, Amanah: ${scores.amanah}%)`);
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
