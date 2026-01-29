/**
 * Achievement Celebration Context
 * Manages achievement celebrations globally across the app
 */

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import AchievementCelebration from '@/components/iman/AchievementCelebration';
import { sendAchievementUnlocked } from '@/utils/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from './AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlock_message?: string;
  points: number;
}

interface AchievementCelebrationContextType {
  celebrateAchievement: (achievement: Achievement) => void;
  checkForUncelebratedAchievements: (userId: string) => Promise<void>;
}

const AchievementCelebrationContext = createContext<AchievementCelebrationContextType | undefined>(undefined);

export function AchievementCelebrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const processedAchievementsRef = useRef<Set<string>>(new Set());

  const celebrateAchievement = useCallback(async (achievement: Achievement) => {
    console.log('🎉 Celebrating achievement:', achievement.title);
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Send notification
    await sendAchievementUnlocked(
      achievement.title,
      achievement.unlock_message || achievement.description
    );
    
    // Show celebration modal
    setCurrentAchievement(achievement);
    setCelebrationVisible(true);
    
    // Mark as celebrated in AsyncStorage
    if (user?.id) {
      try {
        const celebratedKey = `achievement_celebrated_${user.id}_${achievement.id}`;
        await AsyncStorage.setItem(celebratedKey, JSON.stringify({
          celebrated: true,
          celebratedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.log('Error marking achievement as celebrated:', error);
      }
    }
  }, [user?.id]);

  const checkCelebrationQueue = useCallback(async () => {
    if (!user?.id || celebrationVisible) return; // Don't check if already showing a celebration

    try {
      const celebrationQueueKey = `achievement_celebration_queue_${user.id}`;
      const queueData = await AsyncStorage.getItem(celebrationQueueKey);
      
      if (queueData) {
        const queue = JSON.parse(queueData);
        
        // Process each achievement in the queue
        for (const item of queue) {
          if (item.achievement && !processedAchievementsRef.current.has(item.achievement.id)) {
            console.log('🎉 Found uncelebrated achievement in queue:', item.achievement.title);
            
            // Mark as processed
            processedAchievementsRef.current.add(item.achievement.id);
            
            // Trigger celebration
            celebrateAchievement({
              id: item.achievement.id,
              title: item.achievement.title,
              description: item.achievement.description,
              icon_name: item.achievement.icon_name,
              tier: item.achievement.tier,
              unlock_message: item.achievement.unlock_message,
              points: item.achievement.points,
            });

            // Remove from queue
            const updatedQueue = queue.filter((q: any) => q.achievement?.id !== item.achievement.id);
            if (updatedQueue.length === 0) {
              await AsyncStorage.removeItem(celebrationQueueKey);
            } else {
              await AsyncStorage.setItem(celebrationQueueKey, JSON.stringify(updatedQueue));
            }

            // Only process one at a time
            break;
          }
        }
      }
    } catch (error) {
      console.log('Error checking celebration queue:', error);
    }
  }, [user?.id, celebrationVisible, celebrateAchievement]);

  // Check for uncelebrated achievements on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      // Initial check
      const timer = setTimeout(() => {
        checkCelebrationQueue();
      }, 1000);
      
      // Set up interval to check for new achievements every 5 seconds
      const interval = setInterval(() => {
        if (!celebrationVisible) {
          checkCelebrationQueue();
        }
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [user?.id, checkCelebrationQueue, celebrationVisible]);

  const checkForUncelebratedAchievements = useCallback(async (userId: string) => {
    await checkCelebrationQueue();
  }, [checkCelebrationQueue]);

  const handleCloseCelebration = useCallback(() => {
    setCelebrationVisible(false);
    // Clear achievement after animation completes
    setTimeout(() => {
      setCurrentAchievement(null);
      // Check for more achievements in queue after closing
      checkCelebrationQueue();
    }, 300);
  }, [checkCelebrationQueue]);

  return (
    <AchievementCelebrationContext.Provider
      value={{
        celebrateAchievement,
        checkForUncelebratedAchievements,
      }}
    >
      {children}
      <AchievementCelebration
        visible={celebrationVisible}
        achievement={currentAchievement}
        onClose={handleCloseCelebration}
      />
    </AchievementCelebrationContext.Provider>
  );
}

export function useAchievementCelebration() {
  const context = useContext(AchievementCelebrationContext);
  if (context === undefined) {
    throw new Error('useAchievementCelebration must be used within AchievementCelebrationProvider');
  }
  return context;
}
