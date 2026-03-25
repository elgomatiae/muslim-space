/**
 * User-Specific Storage Helper
 * 
 * This module provides user-specific AsyncStorage keys to ensure data isolation between users.
 * All Iman tracker data is stored with userId in the key to prevent cross-user contamination.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Get user-specific storage key
 */
export function getUserStorageKey(baseKey: string, userId: string | null): string {
  if (!userId) {
    // Fallback to base key if no user (shouldn't happen in normal flow)
    console.warn('⚠️ getUserStorageKey called without userId, using base key');
    return baseKey;
  }
  return `${baseKey}_${userId}`;
}

/**
 * Clear all user-specific data for a user (used on logout)
 */
export async function clearUserSpecificData(userId: string): Promise<void> {
  try {
    const keys = [
      `ibadahGoals_${userId}`,
      `ilmGoals_${userId}`,
      `amanahGoals_${userId}`,
      `sectionScores_${userId}`,
      `sectionScoresLastUpdated_${userId}`,
      `imanMomentumState_${userId}`,
      `imanActivityLog_${userId}`,
      `lastImanDate_${userId}`,
      `lastWeeklyResetDate_${userId}`,
      `prayerGoals_${userId}`,
      `dhikrGoals_${userId}`,
      `quranGoals_${userId}`,
      `lastResetCheck_${userId}`,
      `storyReadingTracked_${userId}`,
    ];

    await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
    console.log(`✅ Cleared user-specific data for user: ${userId}`);
  } catch (error) {
    console.error('❌ Error clearing user-specific data:', error);
  }
}

/**
 * Get all AsyncStorage keys for a specific user (for debugging)
 */
export async function getUserStorageKeys(userId: string): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(key => key.includes(`_${userId}`) || key === `imanScores`); // imanScores is a shared object
  } catch (error) {
    console.error('❌ Error getting user storage keys:', error);
    return [];
  }
}
