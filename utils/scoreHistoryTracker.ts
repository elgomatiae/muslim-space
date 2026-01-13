/**
 * Score History Tracker
 * 
 * This utility automatically records Iman scores to the database
 * for trends tracking. Scores are recorded whenever they change.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScoreRecord {
  user_id: string;
  overall_score: number;
  ibadah_score: number;
  ilm_score: number;
  amanah_score: number;
  recorded_at: string;
}

/**
 * Record current Iman scores to the database for trends tracking
 * This ensures scores are tracked consistently throughout the app
 */
export async function recordScoreHistory(
  userId: string,
  overallScore: number,
  sectionScores: { ibadah: number; ilm: number; amanah: number }
): Promise<void> {
  if (!userId) {
    console.log('⚠️ Cannot record score: no user ID');
    return;
  }

  try {
    // Get today's date in user's local timezone
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if we already recorded today
    const { data: existingToday, error: queryError } = await supabase
      .from('iman_score_history')
      .select('id')
      .eq('user_id', userId)
      .gte('recorded_at', `${today}T00:00:00`)
      .lt('recorded_at', `${today}T23:59:59`)
      .maybeSingle();

    // Handle table not found gracefully
    if (queryError) {
      if (queryError.code === 'PGRST205' || queryError.message?.includes('Could not find the table')) {
        console.log('ℹ️ iman_score_history table not found - run migration to enable trends feature');
        return;
      }
      console.log('⚠️ Error checking existing score:', queryError);
      return;
    }

    const scoreRecord: ScoreRecord = {
      user_id: userId,
      overall_score: Math.round(overallScore),
      ibadah_score: Math.round(sectionScores.ibadah),
      ilm_score: Math.round(sectionScores.ilm),
      amanah_score: Math.round(sectionScores.amanah),
      recorded_at: now.toISOString(),
    };

    if (existingToday) {
      // Update today's record with latest scores
      const { error: updateError } = await supabase
        .from('iman_score_history')
        .update({
          overall_score: scoreRecord.overall_score,
          ibadah_score: scoreRecord.ibadah_score,
          ilm_score: scoreRecord.ilm_score,
          amanah_score: scoreRecord.amanah_score,
          recorded_at: scoreRecord.recorded_at,
        })
        .eq('id', existingToday.id);

      if (updateError) {
        console.log('⚠️ Error updating score history:', updateError);
      } else {
        console.log(`✅ Updated score history for user ${userId}: Overall=${scoreRecord.overall_score}, Ibadah=${scoreRecord.ibadah_score}, Ilm=${scoreRecord.ilm_score}, Amanah=${scoreRecord.amanah_score}`);
      }
    } else {
      // Insert new record for today
      const { error: insertError } = await supabase
        .from('iman_score_history')
        .insert(scoreRecord);

      if (insertError) {
        console.log('⚠️ Error inserting score history:', insertError);
      } else {
        console.log(`✅ Recorded score history for user ${userId}: Overall=${scoreRecord.overall_score}, Ibadah=${scoreRecord.ibadah_score}, Ilm=${scoreRecord.ilm_score}, Amanah=${scoreRecord.amanah_score}`);
      }
    }

    // Store last recorded timestamp to prevent excessive updates
    const lastRecordedKey = `lastScoreRecorded_${userId}`;
    await AsyncStorage.setItem(lastRecordedKey, Date.now().toString());
  } catch (error) {
    console.log('⚠️ Error in recordScoreHistory:', error);
  }
}

/**
 * Check if we should record the score (throttle to avoid excessive writes)
 * Returns true if enough time has passed since last recording
 */
export async function shouldRecordScore(userId: string, minIntervalMinutes: number = 5): Promise<boolean> {
  try {
    const lastRecordedKey = `lastScoreRecorded_${userId}`;
    const lastRecordedStr = await AsyncStorage.getItem(lastRecordedKey);
    
    if (!lastRecordedStr) {
      return true; // Never recorded, should record
    }

    const lastRecorded = parseInt(lastRecordedStr, 10);
    const now = Date.now();
    const minutesSinceLastRecord = (now - lastRecorded) / (1000 * 60);

    return minutesSinceLastRecord >= minIntervalMinutes;
  } catch (error) {
    console.log('⚠️ Error checking shouldRecordScore:', error);
    return true; // Default to recording if check fails
  }
}
