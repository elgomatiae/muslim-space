/**
 * ============================================================================
 * MULTI-STREAK TRACKING SYSTEM
 * ============================================================================
 * 
 * Tracks multiple types of streaks:
 * - General Activity Streak (any action)
 * - Prayer Streak (all 5 prayers completed)
 * - Workout Streak (workout completed)
 * - Quran Streak (Quran reading)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/integrations/supabase/client';

// ============================================================================
// INTERFACES
// ============================================================================

export type StreakType = 'general' | 'prayer' | 'workout' | 'quran';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastActiveDate: string; // ISO date string (YYYY-MM-DD)
}

export interface AllStreaksData {
  general: StreakData;
  prayer: StreakData;
  workout: StreakData;
  quran: StreakData;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

function getStreakStorageKey(userId: string | null, streakType: StreakType): string {
  const base = userId ? `streak_${streakType}_${userId}` : `streak_${streakType}`;
  return base;
}

async function loadStreakData(userId: string | null, streakType: StreakType): Promise<StreakData> {
  try {
    const key = getStreakStorageKey(userId, streakType);
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        totalDays: data.totalDays || 0,
        lastActiveDate: data.lastActiveDate || '',
      };
    }
  } catch (error) {
    console.log(`Error loading ${streakType} streak data:`, error);
  }
  
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    lastActiveDate: '',
  };
}

async function saveStreakDataLocally(userId: string | null, streakType: StreakType, data: StreakData): Promise<void> {
  try {
    const key = getStreakStorageKey(userId, streakType);
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${streakType} streak data locally:`, error);
  }
}

// ============================================================================
// SUPABASE SYNC
// ============================================================================

async function syncStreakToSupabase(userId: string, streakType: StreakType, data: StreakData): Promise<void> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const updateData: any = {
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      // Map streak type to column names
      switch (streakType) {
        case 'general':
          updateData.current_streak = data.currentStreak;
          updateData.longest_streak = data.longestStreak;
          updateData.total_days_active = data.totalDays;
          updateData.last_active_date = data.lastActiveDate || getTodayDateString();
          break;
        case 'prayer':
          updateData.prayer_current_streak = data.currentStreak;
          updateData.prayer_longest_streak = data.longestStreak;
          updateData.prayer_total_days = data.totalDays;
          updateData.prayer_last_completed_date = data.lastActiveDate || getTodayDateString();
          break;
        case 'workout':
          updateData.workout_current_streak = data.currentStreak;
          updateData.workout_longest_streak = data.longestStreak;
          updateData.workout_total_days = data.totalDays;
          updateData.workout_last_completed_date = data.lastActiveDate || getTodayDateString();
          break;
        case 'quran':
          updateData.quran_current_streak = data.currentStreak;
          updateData.quran_longest_streak = data.longestStreak;
          updateData.quran_total_days = data.totalDays;
          updateData.quran_last_completed_date = data.lastActiveDate || getTodayDateString();
          break;
      }

      const { error } = await supabase
        .from('user_streaks')
        .upsert(updateData, {
          onConflict: 'user_id',
        });

      if (!error) {
        if (__DEV__) {
          console.log(`✅ ${streakType} streak synced to Supabase: ${data.currentStreak} days`);
        }
        return;
      }

      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }

      if (__DEV__) {
        console.error(`❌ Error syncing ${streakType} streak to Supabase:`, error);
      }
      return;
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      if (__DEV__) {
        console.error(`❌ Error syncing ${streakType} streak:`, error);
      }
      return;
    }
  }
}

// ============================================================================
// STREAK UPDATE LOGIC
// ============================================================================

/**
 * Update a specific streak type
 */
export async function updateStreak(
  userId: string | null,
  streakType: StreakType
): Promise<StreakData> {
  if (!userId) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      lastActiveDate: '',
    };
  }

  try {
    const today = getTodayDateString();
    let streakData = await loadStreakData(userId, streakType);

    // If we already marked today as active, no need to update
    if (isToday(streakData.lastActiveDate)) {
      return streakData;
    }

    const oldLastActiveDate = streakData.lastActiveDate;
    const wasTodayAlreadyCounted = isToday(oldLastActiveDate);

    // Calculate days since last active
    let daysSinceLastActive = 0;
    if (oldLastActiveDate) {
      const lastActive = new Date(oldLastActiveDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastActive.getTime();
      daysSinceLastActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastActive = 999; // No previous activity
    }

    // Determine if this continues the streak
    const isConsecutive = daysSinceLastActive === 1;
    const isFirstTime = !oldLastActiveDate;

    if (isConsecutive) {
      // Continue existing streak
      streakData.currentStreak += 1;
      streakData.lastActiveDate = today;
      
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }
    } else if (isFirstTime) {
      // First time ever
      streakData.currentStreak = 1;
      streakData.lastActiveDate = today;
      streakData.longestStreak = 1;
    } else if (daysSinceLastActive > 1) {
      // Streak broken - start new
      streakData.currentStreak = 1;
      streakData.lastActiveDate = today;
    } else {
      // Same day (shouldn't happen due to early return)
      streakData.lastActiveDate = today;
    }

    // Increment total days if this is a new day
    if (!wasTodayAlreadyCounted) {
      streakData.totalDays += 1;
    }

    // Save locally
    await saveStreakDataLocally(userId, streakType, streakData);

    // Sync to Supabase (non-blocking)
    syncStreakToSupabase(userId, streakType, streakData).catch(err => {
      if (__DEV__) {
        console.log(`Error syncing ${streakType} streak to Supabase:`, err);
      }
    });

    console.log(`🔥 ${streakType} streak updated: ${streakData.currentStreak} days (longest: ${streakData.longestStreak})`);
    
    return streakData;
  } catch (error) {
    console.error(`Error updating ${streakType} streak:`, error);
    return await loadStreakData(userId, streakType);
  }
}

/**
 * Update prayer streak - checks if all 5 prayers are completed
 */
export async function updatePrayerStreak(
  userId: string | null,
  allPrayersCompleted: boolean
): Promise<StreakData> {
  if (!userId || !allPrayersCompleted) {
    return await loadStreakData(userId, 'prayer');
  }

  return await updateStreak(userId, 'prayer');
}

/**
 * Update workout streak
 */
export async function updateWorkoutStreak(userId: string | null): Promise<StreakData> {
  return await updateStreak(userId, 'workout');
}

/**
 * Update Quran streak
 */
export async function updateQuranStreak(userId: string | null): Promise<StreakData> {
  return await updateStreak(userId, 'quran');
}

/**
 * Get all streaks for a user
 */
export async function getAllStreaks(userId: string | null): Promise<AllStreaksData> {
  if (!userId) {
    return {
      general: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
      prayer: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
      workout: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
      quran: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: '' },
    };
  }

  const [general, prayer, workout, quran] = await Promise.all([
    loadStreakData(userId, 'general'),
    loadStreakData(userId, 'prayer'),
    loadStreakData(userId, 'workout'),
    loadStreakData(userId, 'quran'),
  ]);

  return { general, prayer, workout, quran };
}

/**
 * Load streaks from Supabase
 */
export async function loadStreaksFromSupabase(userId: string): Promise<AllStreaksData | null> {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      general: {
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        totalDays: data.total_days_active || 0,
        lastActiveDate: data.last_active_date || '',
      },
      prayer: {
        currentStreak: data.prayer_current_streak || 0,
        longestStreak: data.prayer_longest_streak || 0,
        totalDays: data.prayer_total_days || 0,
        lastActiveDate: data.prayer_last_completed_date || '',
      },
      workout: {
        currentStreak: data.workout_current_streak || 0,
        longestStreak: data.workout_longest_streak || 0,
        totalDays: data.workout_total_days || 0,
        lastActiveDate: data.workout_last_completed_date || '',
      },
      quran: {
        currentStreak: data.quran_current_streak || 0,
        longestStreak: data.quran_longest_streak || 0,
        totalDays: data.quran_total_days || 0,
        lastActiveDate: data.quran_last_completed_date || '',
      },
    };
  } catch (error) {
    if (__DEV__) {
      console.log('ℹ️ Could not load streaks from Supabase:', error);
    }
    return null;
  }
}
