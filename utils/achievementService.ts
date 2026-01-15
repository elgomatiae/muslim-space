
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: Notifications are sent by AchievementCelebrationContext to prevent duplicates

interface AchievementProgress {
  achievement_id: string;
  current_value: number;
}

interface UserStats {
  total_prayers: number;
  total_dhikr: number;
  total_quran_pages: number;
  current_streak: number;
  days_active: number;
  lectures_watched: number;
  quizzes_completed: number;
  workouts_completed: number;
  meditation_sessions: number;
}

/**
 * Calculate user stats from various sources
 * This is the SINGLE SOURCE OF TRUTH for achievement progress
 */
export async function calculateUserStats(userId: string): Promise<UserStats> {
  try {
    console.log('📊 ========== CALCULATING USER STATS ==========');
    console.log(`User ID: ${userId}`);
    
    // Execute all queries in parallel for better performance
    const results = await Promise.allSettled([
      // Get Iman tracker goals (contains prayer, dhikr, quran data)
      // SECURITY: Always scope by user_id
      supabase
        .from('iman_tracker_goals')
        .select('fard_fajr, fard_dhuhr, fard_asr, fard_maghrib, fard_isha, dhikr_daily_completed, dhikr_weekly_completed, quran_daily_pages_completed')
        .eq('user_id', userId)
        .single(),
      
      // Get streak data
      supabase
        .from('user_streaks')
        .select('current_streak, total_days_active')
        .eq('user_id', userId)
        .single(),
      
      // Count completed lectures
      supabase
        .from('tracked_content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('content_type', 'lecture')
        .eq('completed', true),
      
      // Count completed quizzes
      supabase
        .from('user_quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count workouts - try activity_log first, then fallback to physical_activities
      supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'workout_completed'),
      
      // Fallback: Count workouts from physical_activities (with error handling)
      (async () => {
        try {
          const { count, error } = await supabase
            .from('physical_activities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          if (error) {
            // If table doesn't exist, return null to indicate fallback unavailable
            if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
              return { data: null, error: null, count: null };
            }
            return { data: null, error, count: null };
          }
          return { data: null, error: null, count };
        } catch (err) {
          return { data: null, error: err, count: null };
        }
      })(),
      
      // Count meditation sessions - try activity_log first, then fallback
      supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'meditation_session'),
      
      // Fallback: Count meditation sessions from meditation_sessions
      supabase
        .from('meditation_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    // Extract results, handling failures gracefully
    const imanGoalsResult = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: null };
    const streakResult = results[1].status === 'fulfilled' ? results[1].value : { data: null, error: null };
    const lecturesResult = results[2].status === 'fulfilled' ? results[2].value : { data: null, count: 0, error: null };
    const quizzesResult = results[3].status === 'fulfilled' ? results[3].value : { data: null, count: 0, error: null };
    const workoutsActivityResult = results[4].status === 'fulfilled' ? results[4].value : { data: null, count: null, error: null };
    const workoutsFallbackResult = results[5].status === 'fulfilled' 
      ? results[5].value 
      : { data: null, count: null, error: null };
    const meditationActivityResult = results[6].status === 'fulfilled' ? results[6].value : { data: null, count: null, error: null };
    const meditationFallbackResult = results[7].status === 'fulfilled' ? results[7].value : { data: null, count: 0, error: null };

    // ===== PRAYER CALCULATION =====
    // Count total fard prayers completed (lifetime)
    // Check both activity_log AND user_stats, use the higher value
    let totalPrayers = 0;
    let activityLogCount = 0;
    let userStatsCount = 0;
    
    // Try activity_log first
    try {
      const { count: prayerCount, error: activityError } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'prayer_completed');
      
      if (!activityError && prayerCount !== null) {
        activityLogCount = prayerCount;
        console.log(`📊 Prayers from activity_log: ${activityLogCount}`);
      }
    } catch (error) {
      // activity_log table might not exist
      console.log('⚠️ activity_log not available, using user_stats');
    }
    
    // Always check user_stats as well (this is updated by incrementPrayerCount)
    try {
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('total_prayers')
        .eq('user_id', userId)
        .single();
      
      if (!statsError && userStats) {
        userStatsCount = userStats.total_prayers || 0;
        console.log(`📊 Prayers from user_stats: ${userStatsCount}`);
      } else if (statsError && (statsError.code === 'PGRST204' || statsError.code === 'PGRST205')) {
        console.log('⚠️ user_stats table or column not found - using activity_log only');
      }
    } catch (error) {
      console.log('⚠️ user_stats not available');
    }
    
    // Use the higher value to ensure we don't miss any prayers
    totalPrayers = Math.max(activityLogCount, userStatsCount);
    
    console.log(`🕌 Prayers: ${totalPrayers} total (activity_log: ${activityLogCount}, user_stats: ${userStatsCount})`);

    // ===== DHIKR CALCULATION =====
    // Count total dhikr completed (lifetime)
    // First try activity_log, then fallback to user_stats
    let totalDhikr = 0;
    
    try {
      const { data: dhikrActivities } = await supabase
        .from('activity_log')
        .select('activity_value')
        .eq('user_id', userId)
        .eq('activity_type', 'dhikr_session');
      
      if (dhikrActivities && dhikrActivities.length > 0) {
        totalDhikr = dhikrActivities.reduce((sum, act) => sum + (act.activity_value || 0), 0);
      } else {
        // Fallback to user_stats
        try {
          const { data: userStats, error: statsError } = await supabase
            .from('user_stats')
            .select('total_dhikr')
            .eq('user_id', userId)
            .single();
          if (!statsError && userStats) {
            totalDhikr = userStats.total_dhikr || 0;
          } else if (statsError && (statsError.code === 'PGRST204' || statsError.code === 'PGRST205')) {
            console.log('⚠️ user_stats table or column not found - dhikr count will be 0');
            totalDhikr = 0;
          }
        } catch (err) {
          totalDhikr = 0;
        }
      }
    } catch (error) {
      // Fallback to user_stats if activity_log doesn't exist
      try {
        const { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('total_dhikr')
          .eq('user_id', userId)
          .single();
        if (!statsError && userStats) {
          totalDhikr = userStats.total_dhikr || 0;
        } else if (statsError && (statsError.code === 'PGRST204' || statsError.code === 'PGRST205')) {
          console.log('⚠️ user_stats table or column not found - dhikr count will be 0');
          totalDhikr = 0;
        }
      } catch (err) {
        totalDhikr = 0;
      }
    }
    
    console.log(`📿 Dhikr: ${totalDhikr} total`);

    // ===== QURAN CALCULATION =====
    // Count total Quran pages read (lifetime)
    // First try activity_log, then fallback to user_stats
    let totalQuranPages = 0;
    
    try {
      const { data: quranActivities } = await supabase
        .from('activity_log')
        .select('activity_value')
        .eq('user_id', userId)
        .eq('activity_type', 'quran_reading');
      
      if (quranActivities && quranActivities.length > 0) {
        // Sum up all quran reading activities (pages)
        totalQuranPages = quranActivities.reduce((sum, act) => sum + (act.activity_value || 0), 0);
      } else {
        // Fallback to user_stats
        try {
          const { data: userStats, error: statsError } = await supabase
            .from('user_stats')
            .select('total_quran_pages')
            .eq('user_id', userId)
            .single();
          if (!statsError && userStats) {
            totalQuranPages = userStats.total_quran_pages || 0;
          } else if (statsError && (statsError.code === 'PGRST204' || statsError.code === 'PGRST205')) {
            console.log('⚠️ user_stats table or column not found - quran pages count will be 0');
            totalQuranPages = 0;
          }
        } catch (err) {
          totalQuranPages = 0;
        }
      }
    } catch (error) {
      // Fallback to user_stats if activity_log doesn't exist
      try {
        const { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('total_quran_pages')
          .eq('user_id', userId)
          .single();
        if (!statsError && userStats) {
          totalQuranPages = userStats.total_quran_pages || 0;
        } else if (statsError && (statsError.code === 'PGRST204' || statsError.code === 'PGRST205')) {
          console.log('⚠️ user_stats table or column not found - quran pages count will be 0');
          totalQuranPages = 0;
        }
      } catch (err) {
        totalQuranPages = 0;
      }
    }
    
    console.log(`📖 Quran: ${totalQuranPages} total pages`);

    // ===== OTHER STATS =====
    const currentStreak = streakResult.data?.current_streak || 0;
    const daysActive = streakResult.data?.total_days_active || 0;
    const lecturesWatched = lecturesResult.count || 0;
    const quizzesCompleted = quizzesResult.count || 0;
    
    // Use activity_log if available, otherwise fallback to physical_activities
    const workoutsCompleted = (workoutsActivityResult.count !== null && workoutsActivityResult.count !== undefined) 
      ? workoutsActivityResult.count 
      : (workoutsFallbackResult.count || 0);
    
    // Use activity_log if available, otherwise fallback to meditation_sessions
    const meditationSessions = (meditationActivityResult.count !== null && meditationActivityResult.count !== undefined)
      ? meditationActivityResult.count
      : (meditationFallbackResult.count || 0);

    console.log(`🔥 Streak: ${currentStreak} days`);
    console.log(`📅 Days Active: ${daysActive} days`);
    console.log(`🎓 Lectures: ${lecturesWatched}`);
    console.log(`❓ Quizzes: ${quizzesCompleted}`);
    console.log(`🏋️ Workouts: ${workoutsCompleted}`);
    console.log(`🧘 Meditation: ${meditationSessions}`);
    console.log('================================================\n');

    const stats: UserStats = {
      total_prayers: totalPrayers,
      total_dhikr: totalDhikr,
      total_quran_pages: totalQuranPages,
      current_streak: currentStreak,
      days_active: daysActive,
      lectures_watched: lecturesWatched,
      quizzes_completed: quizzesCompleted,
      workouts_completed: workoutsCompleted,
      meditation_sessions: meditationSessions,
    };

    // Update user_stats table for persistence
    await updateUserStatsTable(userId, stats);

    return stats;
  } catch (error) {
    console.log('❌ Error calculating user stats:', error);
    return {
      total_prayers: 0,
      total_dhikr: 0,
      total_quran_pages: 0,
      current_streak: 0,
      days_active: 0,
      lectures_watched: 0,
      quizzes_completed: 0,
      workouts_completed: 0,
      meditation_sessions: 0,
    };
  }
}

/**
 * Update user_stats table with current stats
 * This ensures persistence across sessions
 */
async function updateUserStatsTable(userId: string, stats: UserStats): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_prayers: stats.total_prayers,
        total_dhikr: stats.total_dhikr,
        total_quran_pages: stats.total_quran_pages,
        current_streak: stats.current_streak,
        longest_streak: stats.current_streak, // Update if current is higher
        days_active: stats.days_active,
        lectures_watched: stats.lectures_watched,
        quizzes_completed: stats.quizzes_completed,
        workouts_completed: stats.workouts_completed,
        meditation_sessions: stats.meditation_sessions,
        last_active_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      // If table or columns don't exist, that's okay - activity_log will be used
      // Silently handle PGRST errors - don't log as errors
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('Could not find')) {
        // Silently handle - this is expected if migration hasn't been run
        return; // Exit gracefully - don't log
      }
      // Only log non-PGRST errors
      if (__DEV__) {
        console.log('⚠️ Error updating user_stats:', error);
      }
    } else if (__DEV__) {
      console.log('✅ user_stats table updated successfully');
    }
  } catch (error: any) {
    // Catch any unhandled errors
    if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.message?.includes('Could not find')) {
      // Silently handle - this is expected if migration hasn't been run
      return; // Exit gracefully - don't log
    }
    // Only log unexpected errors
    if (__DEV__) {
      console.log('⚠️ Error in updateUserStatsTable:', error);
    }
  }
}

/**
 * Increment prayer count in user_stats
 * Call this whenever a prayer is marked as completed
 */
export async function incrementPrayerCount(userId: string, count: number = 1): Promise<void> {
  try {
    if (__DEV__) {
      console.log(`\n🕌 ========== INCREMENTING PRAYER COUNT ==========`);
      console.log(`User ID: ${userId}`);
      console.log(`Increment by: ${count}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
    }
    
    // Get current stats - wrap in try-catch to handle missing table/column gracefully
    let currentTotal = 0;
    try {
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('total_prayers')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // PGRST116 is "not found" which is okay for first-time users
        // PGRST204 is "column not found", PGRST205 is "table not found"
        if (fetchError.code === 'PGRST204' || fetchError.code === 'PGRST205' || fetchError.code === 'PGRST116') {
          if (__DEV__) {
            console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          }
          return; // Exit early - can't update if table/column doesn't exist
        }
        if (__DEV__) {
          console.log('⚠️ Error fetching current stats:', fetchError);
        }
        return; // Exit on other errors too
      }

      currentTotal = currentStats?.total_prayers || 0;
    } catch (fetchErr: any) {
      // Catch any errors during the SELECT query
      if (fetchErr?.code === 'PGRST204' || fetchErr?.code === 'PGRST205' || fetchErr?.message?.includes('Could not find')) {
        if (__DEV__) {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
        }
        return; // Exit early
      }
      if (__DEV__) {
        console.log('⚠️ Error fetching current stats:', fetchErr);
      }
      return; // Exit on other errors
    }

    const newTotal = currentTotal + count;

    if (__DEV__) {
      console.log(`📊 Current total: ${currentTotal}`);
      console.log(`📊 New total: ${newTotal}`);
    }

    // Update stats - wrap in try-catch to handle missing table/column gracefully
    try {
      const { error: updateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_prayers: newTotal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        // If user_stats table or column doesn't exist, that's okay - activity_log will be used
        if (updateError.code === 'PGRST205' || updateError.code === 'PGRST204' || updateError.message?.includes('Could not find')) {
          if (__DEV__) {
            console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
            console.log('   Please run migration 016_create_user_stats_table.sql to enable user_stats tracking');
          }
          return; // Exit gracefully - don't log as error
        }
        // Only log non-PGRST errors
        if (__DEV__) {
          console.log('⚠️ Error updating user_stats:', updateError);
        }
      } else if (__DEV__) {
        console.log(`✅ Prayer count updated in user_stats: ${newTotal}`);
      }
    } catch (updateErr: any) {
      // Catch any errors during the UPDATE query
      if (updateErr?.code === 'PGRST204' || updateErr?.code === 'PGRST205' || updateErr?.message?.includes('Could not find')) {
        if (__DEV__) {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          console.log('   Please run migration 016_create_user_stats_table.sql to enable user_stats tracking');
        }
        return; // Exit gracefully - don't log as error
      }
      // Only log non-PGRST errors
      if (__DEV__) {
        console.log('⚠️ Error updating user_stats:', updateErr);
      }
    }
    
    if (__DEV__) {
      console.log('==========================================\n');
    }
  } catch (error: any) {
    // Catch any unhandled errors
    if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.message?.includes('Could not find')) {
      // Silently handle missing table/column - this is expected if migration hasn't been run
      if (__DEV__) {
        console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
      }
      return; // Exit gracefully
    }
    // Only log unexpected errors
    if (__DEV__) {
      console.log('❌ Error incrementing prayer count:', error);
    }
  }
}

/**
 * Increment dhikr count in user_stats
 * Call this whenever dhikr is completed
 */
export async function incrementDhikrCount(userId: string, count: number): Promise<void> {
  try {
    console.log(`📿 Incrementing dhikr count by ${count} for user ${userId}`);
    
    // Get current stats - wrap in try-catch to handle missing table/column gracefully
    let currentTotal = 0;
    try {
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('total_dhikr')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST204' || fetchError.code === 'PGRST205' || fetchError.code === 'PGRST116') {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          return; // Exit early
        }
        console.log('⚠️ Error fetching current stats:', fetchError);
        return; // Exit on other errors
      }

      currentTotal = currentStats?.total_dhikr || 0;
    } catch (fetchErr: any) {
      if (fetchErr?.code === 'PGRST204' || fetchErr?.code === 'PGRST205' || fetchErr?.message?.includes('Could not find')) {
        console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
        return; // Exit early
      }
      console.log('⚠️ Error fetching current stats:', fetchErr);
      return; // Exit on other errors
    }

    const newTotal = currentTotal + count;

    // Update stats - wrap in try-catch to handle missing table/column gracefully
    try {
      const { error: updateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_dhikr: newTotal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        if (updateError.code === 'PGRST205' || updateError.code === 'PGRST204' || updateError.message?.includes('Could not find')) {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          console.log('   Please run migration 016_create_user_stats_table.sql to enable user_stats tracking');
          return; // Exit gracefully
        }
        // Only log non-PGRST errors
        if (__DEV__) {
          console.log('⚠️ Error updating user_stats:', updateError);
        }
      } else if (__DEV__) {
        console.log(`✅ Dhikr count updated: ${newTotal}`);
      }
    } catch (updateErr: any) {
      if (updateErr?.code === 'PGRST204' || updateErr?.code === 'PGRST205' || updateErr?.message?.includes('Could not find')) {
        // Silently handle - this is expected if migration hasn't been run
        return; // Exit gracefully - don't log as error
      }
      // Only log unexpected errors
      if (__DEV__) {
        console.log('⚠️ Error updating user_stats:', updateErr);
      }
    }
  } catch (error: any) {
    // Catch any unhandled errors
    if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.message?.includes('Could not find')) {
      // Silently handle - this is expected if migration hasn't been run
      return; // Exit gracefully
    }
    if (__DEV__) {
      console.log('⚠️ Error incrementing dhikr count:', error);
    }
  }
}

/**
 * Increment Quran pages count in user_stats
 * Call this whenever Quran pages are read
 */
export async function incrementQuranPagesCount(userId: string, pages: number): Promise<void> {
  try {
    if (__DEV__) {
      console.log(`📖 Incrementing Quran pages by ${pages} for user ${userId}`);
    }
    
    // Get current stats - wrap in try-catch to handle missing table/column gracefully
    let currentTotal = 0;
    try {
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('total_quran_pages')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST204' || fetchError.code === 'PGRST205' || fetchError.code === 'PGRST116') {
          if (__DEV__) {
            console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          }
          return; // Exit early
        }
        if (__DEV__) {
          console.log('⚠️ Error fetching current stats:', fetchError);
        }
        return; // Exit on other errors
      }

      currentTotal = currentStats?.total_quran_pages || 0;
    } catch (fetchErr: any) {
      if (fetchErr?.code === 'PGRST204' || fetchErr?.code === 'PGRST205' || fetchErr?.message?.includes('Could not find')) {
        if (__DEV__) {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
        }
        return; // Exit early
      }
      if (__DEV__) {
        console.log('⚠️ Error fetching current stats:', fetchErr);
      }
      return; // Exit on other errors
    }

    const newTotal = currentTotal + pages;

    // Update stats - wrap in try-catch to handle missing table/column gracefully
    try {
      const { error: updateError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          total_quran_pages: newTotal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        if (updateError.code === 'PGRST205' || updateError.code === 'PGRST204' || updateError.message?.includes('Could not find')) {
          console.log('⚠️ user_stats table or column not found - achievements will use activity_log');
          console.log('   Please run migration 016_create_user_stats_table.sql to enable user_stats tracking');
          return; // Exit gracefully
        }
        // Only log non-PGRST errors
        if (__DEV__) {
          console.log('⚠️ Error updating user_stats:', updateError);
        }
      } else if (__DEV__) {
        console.log(`✅ Quran pages count updated: ${newTotal}`);
      }
    } catch (updateErr: any) {
      if (updateErr?.code === 'PGRST204' || updateErr?.code === 'PGRST205' || updateErr?.message?.includes('Could not find')) {
        // Silently handle - this is expected if migration hasn't been run
        return; // Exit gracefully - don't log as error
      }
      // Only log unexpected errors
      if (__DEV__) {
        console.log('⚠️ Error updating user_stats:', updateErr);
      }
    }
  } catch (error: any) {
    // Catch any unhandled errors
    if (error?.code === 'PGRST204' || error?.code === 'PGRST205' || error?.message?.includes('Could not find')) {
      // Silently handle - this is expected if migration hasn't been run
      return; // Exit gracefully
    }
    if (__DEV__) {
      console.log('⚠️ Error incrementing Quran pages count:', error);
    }
  }
}

// Update achievement progress
export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  currentValue: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('achievement_progress')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        current_value: currentValue,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,achievement_id'
      });

    if (error) {
      console.log('Error updating achievement progress:', error);
    }
  } catch (error) {
    console.log('Error in updateAchievementProgress:', error);
  }
}

// Check and unlock achievements (optimized)
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  try {
    console.log('\n🏆 ========== CHECKING ACHIEVEMENTS ==========');
    console.log(`User ID: ${userId}`);
    
    const unlockedAchievements: string[] = [];

    // Get user stats (SINGLE SOURCE OF TRUTH)
    console.log('📊 Calculating user stats for achievements...');
    const stats = await calculateUserStats(userId);
    console.log('📊 User stats calculated:', JSON.stringify(stats, null, 2));

    // Load all data in parallel
    const [achievementsResult, userAchievementsResult] = await Promise.all([
      supabase
        .from('achievements')
        .select('id, title, description, icon_name, requirement_type, requirement_value, points, tier, category, order_index, is_active, unlock_message, next_steps')
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId) // SECURITY: Always scope by user_id
    ]);

    if (achievementsResult.error || !achievementsResult.data) {
      console.log('❌ Error loading achievements:', achievementsResult.error);
      return [];
    }

    const achievements = achievementsResult.data;
    const unlockedIds = new Set(
      (userAchievementsResult.data || []).map(ua => ua.achievement_id)
    );

    console.log(`📋 Total achievements: ${achievements.length}`);
    console.log(`✅ Already unlocked: ${unlockedIds.size}`);
    console.log(`🔍 Checking: ${achievements.length - unlockedIds.size} locked achievements`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Batch progress updates
    const progressUpdates: any[] = [];
    const achievementsToUnlock: any[] = [];

    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) {
        continue;
      }

      // Get current value based on requirement type
      let currentValue = 0;
      switch (achievement.requirement_type) {
        case 'total_prayers':
          currentValue = stats.total_prayers;
          break;
        case 'total_dhikr':
          currentValue = stats.total_dhikr;
          break;
        case 'total_quran_pages':
          currentValue = stats.total_quran_pages;
          break;
        case 'streak':
          currentValue = stats.current_streak;
          break;
        case 'days_active':
          currentValue = stats.days_active;
          break;
        case 'lectures_watched':
          currentValue = stats.lectures_watched;
          break;
        case 'quizzes_completed':
          currentValue = stats.quizzes_completed;
          break;
        case 'workouts_completed':
          currentValue = stats.workouts_completed;
          break;
        case 'meditation_sessions':
          currentValue = stats.meditation_sessions;
          break;
        default:
          currentValue = 0;
      }

      // Add to batch progress update
      progressUpdates.push({
        user_id: userId,
        achievement_id: achievement.id,
        current_value: currentValue,
        last_updated: new Date().toISOString(),
      });

      // Check if achievement should be unlocked
      if (currentValue >= achievement.requirement_value) {
        console.log(`🎉🎉🎉 UNLOCKING ACHIEVEMENT: ${achievement.title} 🎉🎉🎉`);
        console.log(`   Current: ${currentValue}, Required: ${achievement.requirement_value}`);
        console.log(`   Type: ${achievement.requirement_type}, Category: ${achievement.category}`);
        achievementsToUnlock.push({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
        unlockedAchievements.push(achievement.id);
      } else {
        const progress = Math.round((currentValue / achievement.requirement_value) * 100);
        if (currentValue > 0 || progress > 0) {
          console.log(`📊 ${achievement.title}: ${currentValue}/${achievement.requirement_value} (${progress}%)`);
        }
      }
    }

    // Batch update progress (upsert all at once)
    if (progressUpdates.length > 0) {
      const { error: progressError } = await supabase
        .from('achievement_progress')
        .upsert(progressUpdates, {
          onConflict: 'user_id,achievement_id'
        });

      if (progressError) {
        console.log('❌ Error batch updating progress:', progressError);
      } else {
        console.log(`✅ Updated progress for ${progressUpdates.length} achievements`);
      }
    }

    // Batch unlock achievements
    if (achievementsToUnlock.length > 0) {
      const { error: unlockError } = await supabase
        .from('user_achievements')
        .insert(achievementsToUnlock);

      if (!unlockError) {
        console.log(`🎊 UNLOCKED ${achievementsToUnlock.length} NEW ACHIEVEMENTS!`);
        
        // Log achievements as activities
        try {
          const { logActivity } = await import('./activityLogger');
          for (const unlock of achievementsToUnlock) {
            const achievement = achievements.find(a => a.id === unlock.achievement_id);
            if (achievement) {
              // Log achievement unlock activity
              await logActivity({
                userId,
                activityType: 'achievement_unlocked',
                activityCategory: (achievement.category as 'ibadah' | 'ilm' | 'amanah' | 'general') || 'general',
                activityTitle: `Achievement Unlocked: ${achievement.title}`,
                activityDescription: achievement.description,
                pointsEarned: achievement.points || 50,
                metadata: {
                  achievement_id: achievement.id,
                  tier: achievement.tier,
                  requirement_type: achievement.requirement_type,
                },
              });
            }
          }
        } catch (err) {
          // Silently fail - activity logging is non-critical
          if (__DEV__) {
            console.log('Error logging achievement activities:', err);
          }
        }
        
        // Store achievements in celebration queue (notification will be sent by AchievementCelebrationContext)
        // This prevents double notifications - only celebrateAchievement sends the notification
        for (const unlock of achievementsToUnlock) {
          const achievement = achievements.find(a => a.id === unlock.achievement_id);
          if (achievement) {
            // Store locally for celebration (store in a queue for React components to pick up)
            const celebrationQueueKey = `achievement_celebration_queue_${userId}`;
            try {
              const existingQueue = await AsyncStorage.getItem(celebrationQueueKey);
              const queue = existingQueue ? JSON.parse(existingQueue) : [];
              queue.push({
                achievement,
                unlockedAt: unlock.unlocked_at,
                timestamp: Date.now(),
              });
              // Keep only last 10 celebrations in queue
              const recentQueue = queue.slice(-10);
              await AsyncStorage.setItem(celebrationQueueKey, JSON.stringify(recentQueue));
            } catch (err) {
              console.log('Error storing celebration in queue:', err);
            }
          }
        }
      } else {
        console.log('❌ Error batch unlocking achievements:', unlockError);
      }
    } else {
      console.log('ℹ️ No new achievements unlocked');
    }

    console.log('================================================\n');
    return unlockedAchievements;
  } catch (error) {
    console.log('❌ Error in checkAndUnlockAchievements:', error);
    return [];
  }
}

// Calculate progress for a specific achievement
export async function calculateAchievementProgress(
  userId: string,
  achievementId: string
): Promise<{ current: number; required: number; percentage: number }> {
  try {
    // Get achievement details
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id, requirement_type, requirement_value')
      .eq('id', achievementId)
      .single();

    if (!achievement) {
      return { current: 0, required: 0, percentage: 0 };
    }

    // Get user stats
    const stats = await calculateUserStats(userId);

    // Get current value based on requirement type
    let currentValue = 0;
    switch (achievement.requirement_type) {
      case 'total_prayers':
        currentValue = stats.total_prayers;
        break;
      case 'total_dhikr':
        currentValue = stats.total_dhikr;
        break;
      case 'total_quran_pages':
        currentValue = stats.total_quran_pages;
        break;
      case 'streak':
        currentValue = stats.current_streak;
        break;
      case 'days_active':
        currentValue = stats.days_active;
        break;
      case 'lectures_watched':
        currentValue = stats.lectures_watched;
        break;
      case 'quizzes_completed':
        currentValue = stats.quizzes_completed;
        break;
      case 'workouts_completed':
        currentValue = stats.workouts_completed;
        break;
      case 'meditation_sessions':
        currentValue = stats.meditation_sessions;
        break;
      default:
        currentValue = 0;
    }

    const percentage = Math.min(100, (currentValue / achievement.requirement_value) * 100);

    return {
      current: currentValue,
      required: achievement.requirement_value,
      percentage,
    };
  } catch (error) {
    console.log('Error calculating achievement progress:', error);
    return { current: 0, required: 0, percentage: 0 };
  }
}

// Get uncelebrated milestones
export async function getUncelebratedMilestones(userId: string): Promise<any[]> {
  try {
    const { data: milestones } = await supabase
      .from('achievement_milestones')
      .select(`
        *,
        achievements (*)
      `)
      .eq('user_id', userId)
      .eq('celebrated', false)
      .order('reached_at', { ascending: false });

    return milestones || [];
  } catch (error) {
    console.log('Error getting uncelebrated milestones:', error);
    return [];
  }
}

// Mark milestone as celebrated
export async function markMilestoneAsCelebrated(milestoneId: string): Promise<void> {
  try {
    await supabase
      .from('achievement_milestones')
      .update({ celebrated: true })
      .eq('id', milestoneId);
  } catch (error) {
    console.log('Error marking milestone as celebrated:', error);
  }
}

// Get achievement suggestions based on user progress
export async function getAchievementSuggestions(userId: string): Promise<any[]> {
  try {
    // Get user stats
    const stats = await calculateUserStats(userId);

    // Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('id, title, description, icon_name, requirement_type, requirement_value, points, tier, category, order_index, is_active, unlock_message, next_steps')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (!achievements) return [];

    // Get unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    // Calculate progress for each locked achievement
    const suggestions = achievements
      .filter(a => !unlockedIds.has(a.id))
      .map(achievement => {
        let currentValue = 0;
        switch (achievement.requirement_type) {
          case 'total_prayers':
            currentValue = stats.total_prayers;
            break;
          case 'total_dhikr':
            currentValue = stats.total_dhikr;
            break;
          case 'total_quran_pages':
            currentValue = stats.total_quran_pages;
            break;
          case 'streak':
            currentValue = stats.current_streak;
            break;
          case 'days_active':
            currentValue = stats.days_active;
            break;
          case 'lectures_watched':
            currentValue = stats.lectures_watched;
            break;
          case 'quizzes_completed':
            currentValue = stats.quizzes_completed;
            break;
          case 'workouts_completed':
            currentValue = stats.workouts_completed;
            break;
          case 'meditation_sessions':
            currentValue = stats.meditation_sessions;
            break;
        }

        const progress = (currentValue / achievement.requirement_value) * 100;

        return {
          ...achievement,
          current_value: currentValue,
          progress,
          remaining: achievement.requirement_value - currentValue,
        };
      })
      .filter(a => a.progress > 0) // Only show achievements with some progress
      .sort((a, b) => b.progress - a.progress) // Sort by progress descending
      .slice(0, 3); // Top 3 suggestions

    return suggestions;
  } catch (error) {
    console.log('Error getting achievement suggestions:', error);
    return [];
  }
}
