
import { supabase } from '@/lib/supabase';

export type ActivityType =
  | 'prayer_completed'
  | 'sunnah_prayer'
  | 'tahajjud_prayer'
  | 'quran_reading'
  | 'quran_memorization'
  | 'dhikr_session'
  | 'dua_completed'
  | 'fasting'
  | 'lecture_watched'
  | 'recitation_listened'
  | 'quiz_completed'
  | 'reflection_written'
  | 'exercise_completed'
  | 'water_logged'
  | 'workout_completed'
  | 'meditation_session'
  | 'sleep_logged'
  | 'journal_entry'
  | 'achievement_unlocked'
  | 'goal_completed';

export type ActivityCategory = 'ibadah' | 'ilm' | 'amanah' | 'general';

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_category: ActivityCategory;
  activity_title: string;
  activity_description?: string;
  activity_value?: number;
  activity_unit?: string;
  points_earned?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

interface LogActivityParams {
  userId: string;
  activityType: ActivityType;
  activityCategory: ActivityCategory;
  activityTitle: string;
  activityDescription?: string;
  activityValue?: number;
  activityUnit?: string;
  pointsEarned?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to the database
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { error } = await supabase.from('activity_log').insert({
      user_id: params.userId,
      activity_type: params.activityType,
      activity_category: params.activityCategory,
      activity_title: params.activityTitle,
      activity_description: params.activityDescription,
      activity_value: params.activityValue,
      activity_unit: params.activityUnit,
      points_earned: params.pointsEarned || 0,
      metadata: params.metadata || {},
    });

    if (error) {
      console.error('Error logging activity:', error);
    } else {
      console.log('Activity logged successfully:', params.activityTitle);
    }
  } catch (error) {
    console.error('Error in logActivity:', error);
  }
}

/**
 * Get user's activity log with pagination
 */
export async function getUserActivityLog(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserActivityLog:', error);
    return [];
  }
}

/**
 * Get activity log by category
 */
export async function getActivityLogByCategory(
  userId: string,
  category: ActivityCategory,
  limit: number = 50
): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_category', category)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity log by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActivityLogByCategory:', error);
    return [];
  }
}

/**
 * Get activity log for a specific date range
 */
export async function getActivityLogByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activity log by date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActivityLogByDateRange:', error);
    return [];
  }
}

/**
 * Get activity statistics for today
 */
export async function getTodayActivityStats(userId: string): Promise<{
  totalActivities: number;
  ibadahCount: number;
  ilmCount: number;
  amanahCount: number;
  totalPoints: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('activity_log')
      .select('activity_category, points_earned')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      console.error('Error fetching today activity stats:', error);
      return {
        totalActivities: 0,
        ibadahCount: 0,
        ilmCount: 0,
        amanahCount: 0,
        totalPoints: 0,
      };
    }

    const stats = {
      totalActivities: data?.length || 0,
      ibadahCount: data?.filter((a) => a.activity_category === 'ibadah').length || 0,
      ilmCount: data?.filter((a) => a.activity_category === 'ilm').length || 0,
      amanahCount: data?.filter((a) => a.activity_category === 'amanah').length || 0,
      totalPoints: data?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0,
    };

    return stats;
  } catch (error) {
    console.error('Error in getTodayActivityStats:', error);
    return {
      totalActivities: 0,
      ibadahCount: 0,
      ilmCount: 0,
      amanahCount: 0,
      totalPoints: 0,
    };
  }
}

/**
 * Delete old activity logs (older than 90 days)
 */
export async function cleanupOldActivityLogs(userId: string): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error } = await supabase
      .from('activity_log')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old activity logs:', error);
    } else {
      console.log('Old activity logs cleaned up successfully');
    }
  } catch (error) {
    console.error('Error in cleanupOldActivityLogs:', error);
  }
}
