/**
 * Activity Logging Helper
 * 
 * This utility helps log activities to the activity_log table
 * whenever actions are completed in the Iman Tracker.
 */

import { logActivity, ActivityType, ActivityCategory } from './activityLogger';
import { IbadahGoals, IlmGoals, AmanahGoals } from './imanScoreCalculator';
import { checkAndUnlockAchievements } from './achievementService';

/**
 * Log activity when Ibadah goals are updated
 */
export async function logIbadahActivity(
  userId: string,
  oldGoals: IbadahGoals,
  newGoals: IbadahGoals
): Promise<void> {
  if (!userId || !newGoals) return;
  
  // Don't log if oldGoals is empty (initial load)
  if (!oldGoals || Object.keys(oldGoals).length === 0) {
    return;
  }

  try {
    // Check for fard prayer completions
    const fardPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
    for (const prayer of fardPrayers) {
      const oldValue = oldGoals?.fardPrayers?.[prayer] || false;
      const newValue = newGoals.fardPrayers?.[prayer] || false;
      if (!oldValue && newValue) {
        await logActivity({
          userId,
          activityType: 'prayer_completed',
          activityCategory: 'ibadah',
          activityTitle: `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} Prayer Completed`,
          activityDescription: `Completed ${prayer} prayer`,
          pointsEarned: 10,
        });
      }
    }

    // Check for sunnah prayer completion
    if (newGoals.sunnahCompleted > (oldGoals.sunnahCompleted || 0)) {
      const increase = newGoals.sunnahCompleted - (oldGoals.sunnahCompleted || 0);
      await logActivity({
        userId,
        activityType: 'sunnah_prayer',
        activityCategory: 'ibadah',
        activityTitle: `Sunnah Prayer Completed`,
        activityDescription: `Completed ${increase} sunnah prayer(s)`,
        activityValue: increase,
        activityUnit: 'prayers',
        pointsEarned: increase * 5,
      });
    }

    // Check for tahajjud prayer completion
    if (newGoals.tahajjudCompleted > (oldGoals.tahajjudCompleted || 0)) {
      const increase = newGoals.tahajjudCompleted - (oldGoals.tahajjudCompleted || 0);
      await logActivity({
        userId,
        activityType: 'tahajjud_prayer',
        activityCategory: 'ibadah',
        activityTitle: `Tahajjud Prayer Completed`,
        activityDescription: `Completed ${increase} tahajjud prayer(s)`,
        activityValue: increase,
        activityUnit: 'prayers',
        pointsEarned: increase * 15,
      });
    }

    // Check for Quran reading (pages)
    if (newGoals.quranDailyPagesCompleted > (oldGoals.quranDailyPagesCompleted || 0)) {
      const increase = newGoals.quranDailyPagesCompleted - (oldGoals.quranDailyPagesCompleted || 0);
      await logActivity({
        userId,
        activityType: 'quran_reading',
        activityCategory: 'ibadah',
        activityTitle: `Quran Reading`,
        activityDescription: `Read ${increase} page(s) of Quran`,
        activityValue: increase,
        activityUnit: 'pages',
        pointsEarned: increase * 3,
      });
    }

    // Check for Quran verses
    if (newGoals.quranDailyVersesCompleted > (oldGoals.quranDailyVersesCompleted || 0)) {
      const increase = newGoals.quranDailyVersesCompleted - (oldGoals.quranDailyVersesCompleted || 0);
      await logActivity({
        userId,
        activityType: 'quran_reading',
        activityCategory: 'ibadah',
        activityTitle: `Quran Verses Read`,
        activityDescription: `Read ${increase} verse(s)`,
        activityValue: increase,
        activityUnit: 'verses',
        pointsEarned: increase * 1,
      });
    }

    // Check for Quran memorization
    if (newGoals.quranWeeklyMemorizationCompleted > (oldGoals.quranWeeklyMemorizationCompleted || 0)) {
      const increase = newGoals.quranWeeklyMemorizationCompleted - (oldGoals.quranWeeklyMemorizationCompleted || 0);
      await logActivity({
        userId,
        activityType: 'quran_memorization',
        activityCategory: 'ibadah',
        activityTitle: `Quran Memorization`,
        activityDescription: `Memorized ${increase} verse(s)`,
        activityValue: increase,
        activityUnit: 'verses',
        pointsEarned: increase * 10,
      });
    }

    // Check for dhikr completion
    if (newGoals.dhikrDailyCompleted > (oldGoals.dhikrDailyCompleted || 0)) {
      const increase = newGoals.dhikrDailyCompleted - (oldGoals.dhikrDailyCompleted || 0);
      await logActivity({
        userId,
        activityType: 'dhikr_session',
        activityCategory: 'ibadah',
        activityTitle: `Dhikr Session`,
        activityDescription: `Completed ${increase} dhikr`,
        activityValue: increase,
        activityUnit: 'count',
        pointsEarned: Math.floor(increase / 33) * 2, // 2 points per 33 dhikr
      });
    }

    // Check for dua completion
    if (newGoals.duaDailyCompleted > (oldGoals.duaDailyCompleted || 0)) {
      const increase = newGoals.duaDailyCompleted - (oldGoals.duaDailyCompleted || 0);
      await logActivity({
        userId,
        activityType: 'dua_completed',
        activityCategory: 'ibadah',
        activityTitle: `Duʿāʾ Completed`,
        activityDescription: `Completed ${increase} dua(s)`,
        activityValue: increase,
        activityUnit: 'duas',
        pointsEarned: increase * 3,
      });
    }

    // Check for fasting
    if (newGoals.fastingWeeklyCompleted > (oldGoals.fastingWeeklyCompleted || 0)) {
      const increase = newGoals.fastingWeeklyCompleted - (oldGoals.fastingWeeklyCompleted || 0);
      await logActivity({
        userId,
        activityType: 'fasting',
        activityCategory: 'ibadah',
        activityTitle: `Fasting Completed`,
        activityDescription: `Completed ${increase} day(s) of fasting`,
        activityValue: increase,
        activityUnit: 'days',
        pointsEarned: increase * 20,
      });
    }

    // Check for goal completions (reaching 100%)
    const checkGoalCompletion = (
      completed: number,
      goal: number,
      oldCompleted: number,
      goalName: string,
      category: ActivityCategory
    ) => {
      if (goal > 0 && completed >= goal && oldCompleted < goal) {
        return logActivity({
          userId,
          activityType: 'goal_completed',
          activityCategory: category,
          activityTitle: `Goal Completed: ${goalName}`,
          activityDescription: `Reached your ${goalName} goal!`,
          activityValue: completed,
          activityUnit: goalName.toLowerCase(),
          pointsEarned: 25,
        });
      }
      return Promise.resolve();
    };

    // Check Ibadah goal completions
    if (newGoals.dhikrDailyGoal > 0) {
      await checkGoalCompletion(
        newGoals.dhikrDailyCompleted,
        newGoals.dhikrDailyGoal,
        oldGoals.dhikrDailyCompleted || 0,
        'Daily Dhikr',
        'ibadah'
      );
    }
    if (newGoals.quranDailyPagesGoal > 0) {
      await checkGoalCompletion(
        newGoals.quranDailyPagesCompleted,
        newGoals.quranDailyPagesGoal,
        oldGoals.quranDailyPagesCompleted || 0,
        'Daily Quran Pages',
        'ibadah'
      );
    }
  } catch (error) {
    // Silently fail - activity logging is non-critical
    if (__DEV__) {
      console.log('Error logging Ibadah activity:', error);
    }
  }

  // Check achievements after logging activities (non-blocking)
  if (userId) {
    checkAndUnlockAchievements(userId).catch(err => {
      if (__DEV__) {
        console.log('Error checking achievements after Ibadah activity:', err);
      }
    });
  }
}

/**
 * Log activity when Ilm goals are updated
 */
export async function logIlmActivity(
  userId: string,
  oldGoals: IlmGoals,
  newGoals: IlmGoals
): Promise<void> {
  if (!userId || !newGoals) return;
  
  // Don't log if oldGoals is empty (initial load)
  if (!oldGoals || Object.keys(oldGoals).length === 0) {
    return;
  }

  try {
    // Check for lecture completion
    if (newGoals.weeklyLecturesCompleted > (oldGoals.weeklyLecturesCompleted || 0)) {
      const increase = newGoals.weeklyLecturesCompleted - (oldGoals.weeklyLecturesCompleted || 0);
      await logActivity({
        userId,
        activityType: 'lecture_watched',
        activityCategory: 'ilm',
        activityTitle: `Islamic Lecture Watched`,
        activityDescription: `Watched ${increase} lecture(s)`,
        activityValue: increase,
        activityUnit: 'lectures',
        pointsEarned: increase * 8,
      });
    }

    // Check for recitation completion
    if (newGoals.weeklyRecitationsCompleted > (oldGoals.weeklyRecitationsCompleted || 0)) {
      const increase = newGoals.weeklyRecitationsCompleted - (oldGoals.weeklyRecitationsCompleted || 0);
      await logActivity({
        userId,
        activityType: 'recitation_listened',
        activityCategory: 'ilm',
        activityTitle: `Quran Recitation Listened`,
        activityDescription: `Listened to ${increase} recitation(s)`,
        activityValue: increase,
        activityUnit: 'recitations',
        pointsEarned: increase * 5,
      });
    }

    // Check for quiz completion
    if (newGoals.weeklyQuizzesCompleted > (oldGoals.weeklyQuizzesCompleted || 0)) {
      const increase = newGoals.weeklyQuizzesCompleted - (oldGoals.weeklyQuizzesCompleted || 0);
      await logActivity({
        userId,
        activityType: 'quiz_completed',
        activityCategory: 'ilm',
        activityTitle: `Knowledge Quiz Completed`,
        activityDescription: `Completed ${increase} quiz(zes)`,
        activityValue: increase,
        activityUnit: 'quizzes',
        pointsEarned: increase * 10,
      });
    }

    // Check for reflection completion
    if (newGoals.weeklyReflectionCompleted > (oldGoals.weeklyReflectionCompleted || 0)) {
      const increase = newGoals.weeklyReflectionCompleted - (oldGoals.weeklyReflectionCompleted || 0);
      await logActivity({
        userId,
        activityType: 'reflection_written',
        activityCategory: 'ilm',
        activityTitle: `Reflection Written`,
        activityDescription: `Wrote ${increase} reflection(s)`,
        activityValue: increase,
        activityUnit: 'reflections',
        pointsEarned: increase * 5,
      });
    }

    // Check for goal completions (reaching 100%)
    const checkGoalCompletion = (
      completed: number,
      goal: number,
      oldCompleted: number,
      goalName: string,
      category: ActivityCategory
    ) => {
      if (goal > 0 && completed >= goal && oldCompleted < goal) {
        return logActivity({
          userId,
          activityType: 'goal_completed',
          activityCategory: category,
          activityTitle: `Goal Completed: ${goalName}`,
          activityDescription: `Reached your ${goalName} goal!`,
          activityValue: completed,
          activityUnit: goalName.toLowerCase(),
          pointsEarned: 25,
        });
      }
      return Promise.resolve();
    };

    // Check Ilm goal completions
    if (newGoals.weeklyLecturesGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyLecturesCompleted,
        newGoals.weeklyLecturesGoal,
        oldGoals.weeklyLecturesCompleted || 0,
        'Weekly Lectures',
        'ilm'
      );
    }
    if (newGoals.weeklyRecitationsGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyRecitationsCompleted,
        newGoals.weeklyRecitationsGoal,
        oldGoals.weeklyRecitationsCompleted || 0,
        'Weekly Recitations',
        'ilm'
      );
    }
    if (newGoals.weeklyQuizzesGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyQuizzesCompleted,
        newGoals.weeklyQuizzesGoal,
        oldGoals.weeklyQuizzesCompleted || 0,
        'Weekly Quizzes',
        'ilm'
      );
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Error logging Ilm activity:', error);
    }
  }

  // Check achievements after logging activities (non-blocking)
  if (userId) {
    checkAndUnlockAchievements(userId).catch(err => {
      if (__DEV__) {
        console.log('Error checking achievements after Ilm activity:', err);
      }
    });
  }
}

/**
 * Log activity when Amanah goals are updated
 */
export async function logAmanahActivity(
  userId: string,
  oldGoals: AmanahGoals,
  newGoals: AmanahGoals
): Promise<void> {
  if (!userId || !newGoals) return;
  
  // Don't log if oldGoals is empty (initial load)
  if (!oldGoals || Object.keys(oldGoals).length === 0) {
    return;
  }

  try {
    // Check for exercise completion
    if (newGoals.dailyExerciseCompleted > (oldGoals.dailyExerciseCompleted || 0)) {
      const increase = newGoals.dailyExerciseCompleted - (oldGoals.dailyExerciseCompleted || 0);
      await logActivity({
        userId,
        activityType: 'exercise_completed',
        activityCategory: 'amanah',
        activityTitle: `Exercise Completed`,
        activityDescription: `Completed ${increase} minute(s) of exercise`,
        activityValue: increase,
        activityUnit: 'minutes',
        pointsEarned: Math.floor(increase / 10) * 2, // 2 points per 10 minutes
      });
    }

    // Check for water intake
    if (newGoals.dailyWaterCompleted > (oldGoals.dailyWaterCompleted || 0)) {
      const increase = newGoals.dailyWaterCompleted - (oldGoals.dailyWaterCompleted || 0);
      await logActivity({
        userId,
        activityType: 'water_logged',
        activityCategory: 'amanah',
        activityTitle: `Water Intake Logged`,
        activityDescription: `Drank ${increase} glass(es) of water`,
        activityValue: increase,
        activityUnit: 'glasses',
        pointsEarned: increase * 1,
      });
    }

    // Check for workout completion
    if (newGoals.weeklyWorkoutCompleted > (oldGoals.weeklyWorkoutCompleted || 0)) {
      const increase = newGoals.weeklyWorkoutCompleted - (oldGoals.weeklyWorkoutCompleted || 0);
      await logActivity({
        userId,
        activityType: 'workout_completed',
        activityCategory: 'amanah',
        activityTitle: `Workout Completed`,
        activityDescription: `Completed ${increase} workout session(s)`,
        activityValue: increase,
        activityUnit: 'sessions',
        pointsEarned: increase * 15,
      });
    }

    // Check for meditation
    if (newGoals.weeklyMeditationCompleted > (oldGoals.weeklyMeditationCompleted || 0)) {
      const increase = newGoals.weeklyMeditationCompleted - (oldGoals.weeklyMeditationCompleted || 0);
      await logActivity({
        userId,
        activityType: 'meditation_session',
        activityCategory: 'amanah',
        activityTitle: `Meditation Session`,
        activityDescription: `Completed ${increase} meditation session(s)`,
        activityValue: increase,
        activityUnit: 'sessions',
        pointsEarned: increase * 8,
      });
    }

    // Check for sleep
    if (newGoals.dailySleepCompleted > (oldGoals.dailySleepCompleted || 0)) {
      const increase = newGoals.dailySleepCompleted - (oldGoals.dailySleepCompleted || 0);
      await logActivity({
        userId,
        activityType: 'sleep_logged',
        activityCategory: 'amanah',
        activityTitle: `Sleep Logged`,
        activityDescription: `Logged ${increase} hour(s) of sleep`,
        activityValue: increase,
        activityUnit: 'hours',
        pointsEarned: Math.floor(increase / 7) * 3, // 3 points per 7 hours
      });
    }

    // Check for journal entry
    if (newGoals.weeklyJournalCompleted > (oldGoals.weeklyJournalCompleted || 0)) {
      const increase = newGoals.weeklyJournalCompleted - (oldGoals.weeklyJournalCompleted || 0);
      await logActivity({
        userId,
        activityType: 'journal_entry',
        activityCategory: 'amanah',
        activityTitle: `Journal Entry Written`,
        activityDescription: `Wrote ${increase} journal entry(ies)`,
        activityValue: increase,
        activityUnit: 'entries',
        pointsEarned: increase * 5,
      });
    }

    // Check for mental health activity (legacy field - also tracks journal entries)
    if (newGoals.weeklyMentalHealthCompleted > (oldGoals.weeklyMentalHealthCompleted || 0)) {
      const increase = newGoals.weeklyMentalHealthCompleted - (oldGoals.weeklyMentalHealthCompleted || 0);
      // Only log if it's not already logged as journal entry
      if (newGoals.weeklyJournalCompleted <= (oldGoals.weeklyJournalCompleted || 0)) {
        await logActivity({
          userId,
          activityType: 'journal_entry',
          activityCategory: 'amanah',
          activityTitle: `Mental Health Activity`,
          activityDescription: `Completed ${increase} mental health activity(ies)`,
          activityValue: increase,
          activityUnit: 'activities',
          pointsEarned: increase * 5,
        });
      }
    }

    // Check for goal completions (reaching 100%)
    const checkGoalCompletion = (
      completed: number,
      goal: number,
      oldCompleted: number,
      goalName: string,
      category: ActivityCategory
    ) => {
      if (goal > 0 && completed >= goal && oldCompleted < goal) {
        return logActivity({
          userId,
          activityType: 'goal_completed',
          activityCategory: category,
          activityTitle: `Goal Completed: ${goalName}`,
          activityDescription: `Reached your ${goalName} goal!`,
          activityValue: completed,
          activityUnit: goalName.toLowerCase(),
          pointsEarned: 25,
        });
      }
      return Promise.resolve();
    };

    // Check Amanah goal completions
    if (newGoals.dailyExerciseGoal > 0) {
      await checkGoalCompletion(
        newGoals.dailyExerciseCompleted,
        newGoals.dailyExerciseGoal,
        oldGoals.dailyExerciseCompleted || 0,
        'Daily Exercise',
        'amanah'
      );
    }
    if (newGoals.dailyWaterGoal > 0) {
      await checkGoalCompletion(
        newGoals.dailyWaterCompleted,
        newGoals.dailyWaterGoal,
        oldGoals.dailyWaterCompleted || 0,
        'Daily Water',
        'amanah'
      );
    }
    if (newGoals.dailySleepGoal > 0) {
      await checkGoalCompletion(
        newGoals.dailySleepCompleted,
        newGoals.dailySleepGoal,
        oldGoals.dailySleepCompleted || 0,
        'Daily Sleep',
        'amanah'
      );
    }
    if (newGoals.weeklyWorkoutGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyWorkoutCompleted,
        newGoals.weeklyWorkoutGoal,
        oldGoals.weeklyWorkoutCompleted || 0,
        'Weekly Workout',
        'amanah'
      );
    }
    if (newGoals.weeklyMeditationGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyMeditationCompleted,
        newGoals.weeklyMeditationGoal,
        oldGoals.weeklyMeditationCompleted || 0,
        'Weekly Meditation',
        'amanah'
      );
    }
    if (newGoals.weeklyJournalGoal > 0) {
      await checkGoalCompletion(
        newGoals.weeklyJournalCompleted,
        newGoals.weeklyJournalGoal,
        oldGoals.weeklyJournalCompleted || 0,
        'Weekly Journal',
        'amanah'
      );
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Error logging Amanah activity:', error);
    }
  }

  // Check achievements after logging activities (non-blocking)
  if (userId) {
    checkAndUnlockAchievements(userId).catch(err => {
      if (__DEV__) {
        console.log('Error checking achievements after Amanah activity:', err);
      }
    });
  }
}
