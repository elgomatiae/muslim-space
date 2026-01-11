
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendAchievementUnlocked } from './notificationService';

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
      
      // Count workouts
      supabase
        .from('physical_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count meditation sessions
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
    const workoutsResult = results[4].status === 'fulfilled' ? results[4].value : { data: null, count: 0, error: null };
    const meditationResult = results[5].status === 'fulfilled' ? results[5].value : { data: null, count: 0, error: null };

    // ===== PRAYER CALCULATION =====
    // Count total fard prayers completed (lifetime)
    // We need to calculate this from iman_tracker_goals history
    // For now, we'll use a cumulative approach based on current completion
    let totalPrayers = 0;
    
    if (imanGoalsResult.data) {
      const goals = imanGoalsResult.data;
      
      // Count completed fard prayers today
      const fardToday = [
        goals.fard_fajr,
        goals.fard_dhuhr,
        goals.fard_asr,
        goals.fard_maghrib,
        goals.fard_isha
      ].filter(Boolean).length;
      
      // Get historical prayer count from user_stats (if exists)
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('total_prayers')
        .eq('user_id', userId)
        .single();
      
      // Use existing count + today's prayers
      totalPrayers = (userStats?.total_prayers || 0) + fardToday;
      
      console.log(`🕌 Prayers: ${totalPrayers} total (${fardToday} today)`);
    }

    // ===== DHIKR CALCULATION =====
    // Count total dhikr completed (lifetime)
    let totalDhikr = 0;
    
    if (imanGoalsResult.data) {
      const goals = imanGoalsResult.data;
      
      // Get current dhikr counts
      const dhikrDaily = goals.dhikr_daily_completed || 0;
      const dhikrWeekly = goals.dhikr_weekly_completed || 0;
      
      // Get historical dhikr count from user_stats (if exists)
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('total_dhikr')
        .eq('user_id', userId)
        .single();
      
      // Use existing count + current period counts
      totalDhikr = (userStats?.total_dhikr || 0) + dhikrDaily + dhikrWeekly;
      
      console.log(`📿 Dhikr: ${totalDhikr} total (${dhikrDaily} daily, ${dhikrWeekly} weekly)`);
    }

    // ===== QURAN CALCULATION =====
    // Count total Quran pages read (lifetime)
    let totalQuranPages = 0;
    
    if (imanGoalsResult.data) {
      const goals = imanGoalsResult.data;
      
      // Get current Quran pages
      const pagesDaily = goals.quran_daily_pages_completed || 0;
      
      // Get historical Quran count from user_stats (if exists)
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('total_quran_pages')
        .eq('user_id', userId)
        .single();
      
      // Use existing count + current period counts
      totalQuranPages = (userStats?.total_quran_pages || 0) + pagesDaily;
      
      console.log(`📖 Quran: ${totalQuranPages} total pages (${pagesDaily} today)`);
    }

    // ===== OTHER STATS =====
    const currentStreak = streakResult.data?.current_streak || 0;
    const daysActive = streakResult.data?.total_days_active || 0;
    const lecturesWatched = lecturesResult.count || 0;
    const quizzesCompleted = quizzesResult.count || 0;
    const workoutsCompleted = workoutsResult.count || 0;
    const meditationSessions = meditationResult.count || 0;

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
        last_active_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.log('⚠️ Error updating user_stats:', error);
    } else {
      console.log('✅ user_stats table updated successfully');
    }
  } catch (error) {
    console.log('⚠️ Error in updateUserStatsTable:', error);
  }
}

/**
 * Increment prayer count in user_stats
 * Call this whenever a prayer is marked as completed
 */
export async function incrementPrayerCount(userId: string, count: number = 1): Promise<void> {
  try {
    console.log(`🕌 Incrementing prayer count by ${count} for user ${userId}`);
    
    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('total_prayers')
      .eq('user_id', userId)
      .single();

    const newTotal = (currentStats?.total_prayers || 0) + count;

    // Update stats
    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_prayers: newTotal,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    console.log(`✅ Prayer count updated: ${newTotal}`);
  } catch (error) {
    console.log('❌ Error incrementing prayer count:', error);
  }
}

/**
 * Increment dhikr count in user_stats
 * Call this whenever dhikr is completed
 */
export async function incrementDhikrCount(userId: string, count: number): Promise<void> {
  try {
    console.log(`📿 Incrementing dhikr count by ${count} for user ${userId}`);
    
    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('total_dhikr')
      .eq('user_id', userId)
      .single();

    const newTotal = (currentStats?.total_dhikr || 0) + count;

    // Update stats
    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_dhikr: newTotal,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    console.log(`✅ Dhikr count updated: ${newTotal}`);
  } catch (error) {
    console.log('❌ Error incrementing dhikr count:', error);
  }
}

/**
 * Increment Quran pages count in user_stats
 * Call this whenever Quran pages are read
 */
export async function incrementQuranPagesCount(userId: string, pages: number): Promise<void> {
  try {
    console.log(`📖 Incrementing Quran pages by ${pages} for user ${userId}`);
    
    // Get current stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('total_quran_pages')
      .eq('user_id', userId)
      .single();

    const newTotal = (currentStats?.total_quran_pages || 0) + pages;

    // Update stats
    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_quran_pages: newTotal,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    console.log(`✅ Quran pages count updated: ${newTotal}`);
  } catch (error) {
    console.log('❌ Error incrementing Quran pages count:', error);
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
    const stats = await calculateUserStats(userId);

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
        console.log(`🎉 UNLOCKING: ${achievement.title} (${currentValue}/${achievement.requirement_value})`);
        achievementsToUnlock.push({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
        unlockedAchievements.push(achievement.id);
      } else {
        const progress = Math.round((currentValue / achievement.requirement_value) * 100);
        console.log(`📊 ${achievement.title}: ${currentValue}/${achievement.requirement_value} (${progress}%)`);
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
        
        // Send notifications for newly unlocked achievements
        for (const unlock of achievementsToUnlock) {
          const achievement = achievements.find(a => a.id === unlock.achievement_id);
          if (achievement) {
            // Send notification (don't await to avoid blocking)
            sendAchievementUnlocked(
              achievement.title,
              achievement.unlock_message || achievement.description
            ).catch(err => console.log('Error sending notification:', err));

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
