
import { supabase } from '@/app/integrations/supabase/client';
import { getOverallImanScore, getCurrentSectionScores } from './imanScoreCalculator';

/**
 * Sync current Iman scores to the database for community leaderboards
 * This should be called whenever the user's Iman score changes
 */
export async function syncImanScoreToDatabase(userId: string): Promise<void> {
  try {
    const overallScore = await getOverallImanScore();
    const sectionScores = await getCurrentSectionScores();

    // Get today's date at midnight for consistent recorded_at
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recordedAt = today.toISOString();

    // Insert or update today's score
    const { error } = await supabase
      .from('iman_score_history')
      .upsert({
        user_id: userId,
        overall_score: Math.round(overallScore),
        ibadah_score: Math.round(sectionScores.ibadah),
        ilm_score: Math.round(sectionScores.ilm),
        amanah_score: Math.round(sectionScores.amanah),
        recorded_at: recordedAt,
      }, {
        onConflict: 'user_id,recorded_at',
      });

    if (error) {
      console.error('Error syncing Iman score to database:', error);
    } else {
      console.log('Iman score synced to database successfully');
    }
  } catch (error) {
    console.error('Error in syncImanScoreToDatabase:', error);
  }
}

/**
 * Get the user's privacy setting for hiding scores in communities
 */
export async function getUserScorePrivacy(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('hide_score')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching score privacy:', error);
      return false;
    }

    return data?.hide_score || false;
  } catch (error) {
    console.error('Error in getUserScorePrivacy:', error);
    return false;
  }
}

/**
 * Update the user's privacy setting for hiding scores in communities
 */
export async function updateScorePrivacy(
  userId: string,
  communityId: string,
  hideScore: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('community_members')
      .update({ hide_score: hideScore })
      .eq('user_id', userId)
      .eq('community_id', communityId);

    if (error) {
      console.error('Error updating score privacy:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateScorePrivacy:', error);
    throw error;
  }
}
