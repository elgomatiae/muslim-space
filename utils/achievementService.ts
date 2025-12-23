
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

// Calculate user stats from various sources
export async function calculateUserStats(userId: string): Promise<UserStats> {
  try {
    // Get user stats from user_stats table
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get streak data
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, total_days_active')
      .eq('user_id', userId)
      .single();

    // Get iman tracker goals for additional stats
    const { data: imanGoals } = await supabase
      .from('iman_tracker_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Count lectures watched
    const { count: lecturesCount } = await supabase
      .from('tracked_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_type', 'lecture')
      .eq('completed', true);

    // Count quizzes completed
    const { count: quizzesCount } = await supabase
      .from('user_quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count workouts
    const { count: workoutsCount } = await supabase
      .from('physical_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count meditation sessions
    const { count: meditationCount } = await supabase
      .from('meditation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      total_prayers: userStats?.total_prayers || 0,
      total_dhikr: userStats?.total_dhikr || 0,
      total_quran_pages: userStats?.total_quran_pages || 0,
      current_streak: streakData?.current_streak || 0,
      days_active: streakData?.total_days_active || 0,
      lectures_watched: lecturesCount || 0,
      quizzes_completed: quizzesCount || 0,
      workouts_completed: workoutsCount || 0,
      meditation_sessions: meditationCount || 0,
    };
  } catch (error) {
    console.log('Error calculating user stats:', error);
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

// Check and unlock achievements
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  try {
    const unlockedAchievements: string[] = [];

    // Get user stats
    const stats = await calculateUserStats(userId);

    // Get all active achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (achievementsError || !achievements) {
      console.log('Error loading achievements:', achievementsError);
      return [];
    }

    // Get already unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

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

      // Update progress
      await updateAchievementProgress(userId, achievement.id, currentValue);

      // Check if achievement should be unlocked
      if (currentValue >= achievement.requirement_value) {
        // Unlock achievement
        const { error: unlockError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
          });

        if (!unlockError) {
          unlockedAchievements.push(achievement.id);
          
          // Send notification
          await sendAchievementUnlocked(
            achievement.title,
            achievement.unlock_message || achievement.description
          );

          // Store locally for celebration
          const celebrationKey = `achievement_celebration_${achievement.id}`;
          await AsyncStorage.setItem(celebrationKey, JSON.stringify({
            achievement,
            unlockedAt: new Date().toISOString(),
          }));
        }
      } else {
        // Check for milestone celebrations (25%, 50%, 75%)
        const progress = (currentValue / achievement.requirement_value) * 100;
        const milestones = [25, 50, 75];
        
        for (const milestone of milestones) {
          if (progress >= milestone) {
            // Check if milestone already celebrated
            const { data: existingMilestone } = await supabase
              .from('achievement_milestones')
              .select('*')
              .eq('user_id', userId)
              .eq('achievement_id', achievement.id)
              .eq('milestone_percentage', milestone)
              .single();

            if (!existingMilestone) {
              // Record milestone
              await supabase
                .from('achievement_milestones')
                .insert({
                  user_id: userId,
                  achievement_id: achievement.id,
                  milestone_percentage: milestone,
                  reached_at: new Date().toISOString(),
                  celebrated: false,
                });
            }
          }
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.log('Error in checkAndUnlockAchievements:', error);
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
      .select('*')
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
      .select('*')
      .eq('is_active', true);

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
