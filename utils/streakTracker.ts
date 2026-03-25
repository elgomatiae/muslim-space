/**
 * ============================================================================
 * STREAK TRACKING SYSTEM
 * ============================================================================
 * 
 * Comprehensive streak system that tracks daily activity across all Iman tracker actions.
 * A day is considered "active" if the user completes ANY action (prayer, Quran, dhikr, etc.)
 * 
 * Features:
 * - Tracks current streak (consecutive active days)
 * - Tracks longest streak (best ever)
 * - Tracks total days active
 * - Automatically updates when actions are completed
 * - Handles streak resets when days are missed
 * - Syncs to Supabase for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/integrations/supabase/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActiveDate: string; // ISO date string (YYYY-MM-DD)
  streakStartDate?: string; // When current streak started
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

function getStreakStorageKey(userId: string | null): string {
  return userId ? `streakData_${userId}` : 'streakData';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Check if two dates are consecutive days
 */
function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Check if a date is today
 */
function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Check if a date is yesterday
 */
function isYesterday(dateString: string): boolean {
  return dateString === getYesterdayDateString();
}

// ============================================================================
// LOAD/SAVE FUNCTIONS
// ============================================================================

/**
 * Load streak data from local storage
 */
export async function loadStreakData(userId: string | null): Promise<StreakData> {
  try {
    const key = getStreakStorageKey(userId);
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        totalDaysActive: data.totalDaysActive || 0,
        lastActiveDate: data.lastActiveDate || '',
        streakStartDate: data.streakStartDate,
      };
    }
  } catch (error) {
    console.log('Error loading streak data:', error);
  }
  
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalDaysActive: 0,
    lastActiveDate: '',
  };
}

/**
 * Save streak data to local storage
 */
async function saveStreakDataLocally(userId: string | null, data: StreakData): Promise<void> {
  try {
    const key = getStreakStorageKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving streak data locally:', error);
  }
}

/**
 * Sync streak data to Supabase with retry logic
 */
async function syncStreakToSupabase(userId: string, data: StreakData): Promise<void> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Try to update user_stats table first (uses 'days_active' column)
      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          current_streak: data.currentStreak,
          longest_streak: data.longestStreak,
          days_active: data.totalDaysActive, // Note: column is 'days_active' not 'total_days_active'
          last_active_date: data.lastActiveDate || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (!statsError) {
        // Successfully synced to user_stats
        if (__DEV__) {
          console.log(`✅ Streak synced to Supabase: ${data.currentStreak} days`);
        }
        return;
      }

      // If table doesn't exist, try user_streaks table
      if (statsError.code === 'PGRST116' || statsError.message?.includes('does not exist')) {
        const { error: streakError } = await supabase
          .from('user_streaks')
          .upsert({
            user_id: userId,
            current_streak: data.currentStreak,
            longest_streak: data.longestStreak,
            total_days_active: data.totalDaysActive,
            last_active_date: data.lastActiveDate || new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (!streakError) {
          if (__DEV__) {
            console.log(`✅ Streak synced to user_streaks: ${data.currentStreak} days`);
          }
          return;
        }

        if (streakError.code === 'PGRST116' || streakError.message?.includes('does not exist')) {
          if (__DEV__) {
            console.log('ℹ️ Streak tables not available, using local storage only');
          }
          return;
        }
      }

      // If it's a network error, retry
      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        continue;
      }

      // Final attempt failed
      if (__DEV__) {
        console.error('❌ Error syncing streak to Supabase after retries:', statsError);
      }
      return;
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      if (__DEV__) {
        console.error('❌ Error syncing streak to Supabase:', error);
      }
      return;
    }
  }
}

/**
 * Load streak data from Supabase (if available)
 */
async function loadStreakFromSupabase(userId: string): Promise<StreakData | null> {
  try {
    // Try user_stats first (uses 'days_active' column)
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('current_streak, longest_streak, days_active, last_active_date')
      .eq('user_id', userId)
      .single();

    if (!statsError && statsData) {
      return {
        currentStreak: statsData.current_streak || 0,
        longestStreak: statsData.longest_streak || 0,
        totalDaysActive: statsData.days_active || 0, // Note: column is 'days_active'
        lastActiveDate: statsData.last_active_date || '',
      };
    }

    // Try user_streaks table as fallback
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, total_days_active, last_active_date')
      .eq('user_id', userId)
      .single();

    if (!streakError && streakData) {
      return {
        currentStreak: streakData.current_streak || 0,
        longestStreak: streakData.longest_streak || 0,
        totalDaysActive: streakData.total_days_active || 0,
        lastActiveDate: streakData.last_active_date || '',
      };
    }
  } catch (error) {
    // Silently fail
    if (__DEV__) {
      console.log('ℹ️ Could not load streak from Supabase:', error);
    }
  }

  return null;
}

// ============================================================================
// STREAK UPDATE LOGIC
// ============================================================================

/**
 * Update streak when user completes an action
 * This should be called whenever ANY action is completed
 */
export async function updateStreakOnAction(userId: string | null): Promise<StreakData> {
  if (!userId) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
      lastActiveDate: '',
    };
  }

  try {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    let streakData = await loadStreakData(userId);

    // If we already marked today as active, no need to update
    if (isToday(streakData.lastActiveDate)) {
      return streakData;
    }

    // Store old lastActiveDate to check if today was already counted
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
      daysSinceLastActive = 999; // No previous activity - first time
    }

    // Determine if this continues the streak
    const isConsecutive = daysSinceLastActive === 1; // Exactly 1 day ago (yesterday)
    const isFirstTime = !oldLastActiveDate; // No previous activity

    if (isConsecutive) {
      // Continue existing streak (yesterday was active)
      streakData.currentStreak += 1;
      streakData.lastActiveDate = today;
      
      // Update longest streak if current is higher
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }
    } else if (isFirstTime) {
      // First time ever - start streak
      streakData.currentStreak = 1;
      streakData.lastActiveDate = today;
      streakData.streakStartDate = today;
      streakData.longestStreak = 1;
    } else if (daysSinceLastActive > 1) {
      // Streak was broken (more than 1 day gap) - start new streak
      streakData.currentStreak = 1;
      streakData.lastActiveDate = today;
      streakData.streakStartDate = today;
      
      // Don't update longest streak here - it's already the best
    } else {
      // Same day (shouldn't happen due to early return, but handle gracefully)
      streakData.lastActiveDate = today;
    }

    // Increment total days active only if this is a new day
    if (!wasTodayAlreadyCounted) {
      streakData.totalDaysActive += 1;
    }

    // Save locally
    await saveStreakDataLocally(userId, streakData);

    // Sync to Supabase (non-blocking)
    syncStreakToSupabase(userId, streakData).catch(err => {
      if (__DEV__) {
        console.log('Error syncing streak to Supabase:', err);
      }
    });

    console.log(`🔥 Streak updated: ${streakData.currentStreak} days (longest: ${streakData.longestStreak})`);
    
    return streakData;
  } catch (error) {
    console.error('Error updating streak:', error);
    return await loadStreakData(userId);
  }
}

/**
 * Check and update streak based on current date
 * Call this on app start or when checking streak status
 */
export async function checkAndUpdateStreak(userId: string | null): Promise<StreakData> {
  if (!userId) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
      lastActiveDate: '',
    };
  }

  try {
    let streakData = await loadStreakData(userId);
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // If last active was before yesterday, streak is broken
    if (streakData.lastActiveDate && 
        streakData.lastActiveDate !== today && 
        streakData.lastActiveDate !== yesterday) {
      const daysSince = Math.floor(
        (new Date(today).getTime() - new Date(streakData.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince > 1) {
        // Streak broken - reset current streak
        streakData.currentStreak = 0;
        streakData.streakStartDate = undefined;
        await saveStreakDataLocally(userId, streakData);
        await syncStreakToSupabase(userId, streakData).catch(() => {});
      }
    }

    return streakData;
  } catch (error) {
    console.error('Error checking streak:', error);
    return await loadStreakData(userId);
  }
}

/**
 * Get current streak data (without updating)
 */
export async function getCurrentStreak(userId: string | null): Promise<StreakData> {
  return await loadStreakData(userId);
}

/**
 * Initialize streak data from Supabase if available
 */
export async function initializeStreakData(userId: string): Promise<StreakData> {
  try {
    // Try to load from Supabase first
    const supabaseData = await loadStreakFromSupabase(userId);
    if (supabaseData) {
      await saveStreakDataLocally(userId, supabaseData);
      return supabaseData;
    }

    // Otherwise use local data
    return await loadStreakData(userId);
  } catch (error) {
    console.error('Error initializing streak data:', error);
    return await loadStreakData(userId);
  }
}
