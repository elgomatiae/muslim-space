
/**
 * Iman Activity Integration
 * 
 * This utility ensures that all Iman Tracker activities are properly
 * tracked for achievements. It provides helper functions to increment
 * counters in user_stats whenever activities are completed.
 */

import { incrementPrayerCount, incrementDhikrCount, incrementQuranPagesCount, checkAndUnlockAchievements } from './achievementService';
import { updateStreakOnAction } from './streakTracker';
import { updateWorkoutStreak, updateQuranStreak } from './multiStreakTracker';

/**
 * Track prayer completion
 * Call this whenever a fard prayer is marked as completed
 */
export async function trackPrayerCompletion(userId: string, prayerName: string): Promise<void> {
  try {
    console.log(`🕌 Tracking prayer completion: ${prayerName} for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after prayer:', err);
      }
    });
    
    // Increment prayer count in user_stats
    await incrementPrayerCount(userId, 1);
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Prayer completion tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking prayer completion:`, error);
  }
}

/**
 * Track dhikr completion
 * Call this whenever dhikr count is updated
 */
export async function trackDhikrCompletion(userId: string, count: number): Promise<void> {
  try {
    console.log(`📿 Tracking dhikr completion: ${count} for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after dhikr:', err);
      }
    });
    
    // Increment dhikr count in user_stats
    await incrementDhikrCount(userId, count);
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Dhikr completion tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking dhikr completion:`, error);
  }
}

/**
 * Track Quran reading completion
 * Call this whenever Quran pages are read
 */
export async function trackQuranReading(userId: string, pages: number): Promise<void> {
  try {
    console.log(`📖 Tracking Quran reading: ${pages} pages for user ${userId}`);
    
    // Update streaks (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating general streak after Quran reading:', err);
      }
    });
    
    // Update Quran streak
    updateQuranStreak(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating Quran streak:', err);
      }
    });
    
    // Increment Quran pages count in user_stats
    await incrementQuranPagesCount(userId, pages);
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Quran reading tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking Quran reading:`, error);
  }
}

/**
 * Track lecture completion
 * This is already handled by tracked_content table, but we can
 * trigger achievement check here
 */
export async function trackLectureCompletion(userId: string): Promise<void> {
  try {
    console.log(`🎓 Tracking lecture completion for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after lecture:', err);
      }
    });
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Lecture completion tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking lecture completion:`, error);
  }
}

/**
 * Track quiz completion
 * This is already handled by user_quiz_attempts table, but we can
 * trigger achievement check here
 */
export async function trackQuizCompletion(userId: string): Promise<void> {
  try {
    if (!userId || typeof userId !== 'string') {
      console.warn('Invalid userId provided to trackQuizCompletion');
      return;
    }

    console.log(`❓ Tracking quiz completion for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after quiz:', err);
      }
    });
    
    // Check for new achievements (non-blocking)
    checkAndUnlockAchievements(userId).catch(err => {
      if (__DEV__) {
        console.log('Error checking achievements after quiz:', err);
      }
    });
    
    console.log(`✅ Quiz completion tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking quiz completion:`, error);
    // Don't throw - this is non-critical
  }
}

/**
 * Track workout completion
 * This is already handled by physical_activities table, but we can
 * trigger achievement check here
 */
export async function trackWorkoutCompletion(userId: string): Promise<void> {
  try {
    console.log(`🏋️ Tracking workout completion for user ${userId}`);
    
    // Update streaks (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating general streak after workout:', err);
      }
    });
    
    // Update workout streak
    updateWorkoutStreak(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating workout streak:', err);
      }
    });
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Workout completion tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking workout completion:`, error);
  }
}

/**
 * Track meditation session
 * This is already handled by meditation_sessions table, but we can
 * trigger achievement check here
 */
export async function trackMeditationSession(userId: string): Promise<void> {
  try {
    console.log(`🧘 Tracking meditation session for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after meditation:', err);
      }
    });
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Meditation session tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking meditation session:`, error);
  }
}

/**
 * Track journal entry
 * Call this whenever a journal entry is saved
 */
export async function trackJournalEntry(userId: string): Promise<void> {
  try {
    console.log(`📔 Tracking journal entry for user ${userId}`);
    
    // Update streak (non-blocking)
    updateStreakOnAction(userId).catch(err => {
      if (__DEV__) {
        console.log('Error updating streak after journal entry:', err);
      }
    });
    
    // Check for new achievements
    await checkAndUnlockAchievements(userId);
    
    console.log(`✅ Journal entry tracked successfully`);
  } catch (error) {
    console.log(`❌ Error tracking journal entry:`, error);
  }
}
