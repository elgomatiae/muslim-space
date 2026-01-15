
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { 
  loadIbadahGoals, 
  loadIlmGoals, 
  loadAmanahGoals,
  saveIbadahGoals,
  saveIlmGoals,
  saveAmanahGoals,
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  getOverallImanScore,
  getCurrentSectionScores,
  checkAndHandleResets
} from '@/utils/imanScoreCalculator';
import { useAuth } from './AuthContext';
import { clearUserSpecificData } from '@/utils/userSpecificStorage';
import { logIbadahActivity, logIlmActivity, logAmanahActivity } from '@/utils/activityLoggingHelper';

interface ImanTrackerContextType {
  ibadahGoals: IbadahGoals;
  ilmGoals: IlmGoals;
  amanahGoals: AmanahGoals;
  imanScore: number;
  sectionScores: { ibadah: number; ilm: number; amanah: number };
  updateIbadahGoals: (goals: Partial<IbadahGoals>) => Promise<void>;
  updateIlmGoals: (goals: Partial<IlmGoals>) => Promise<void>;
  updateAmanahGoals: (goals: Partial<AmanahGoals>) => Promise<void>;
  refreshScores: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export const ImanTrackerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState({ ibadah: 0, ilm: 0, amanah: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Track app state to check for resets when app comes to foreground
  const appState = useRef(AppState.currentState);

  // ✅ define refreshScores FIRST
  const refreshScores = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [overall, sections] = await Promise.all([
        getOverallImanScore(user.id),
        getCurrentSectionScores(user.id),
      ]);

      setImanScore(overall);
      setSectionScores(sections);

      // Record scores to database for trends tracking
      try {
        const { recordScoreHistory, shouldRecordScore } = await import('@/utils/scoreHistoryTracker');
        // Throttle to avoid excessive writes (record at most every 5 minutes)
        const shouldRecord = await shouldRecordScore(user.id, 5);
        if (shouldRecord) {
          await recordScoreHistory(user.id, overall, sections);
        }
      } catch (err) {
        // Silent failure - score tracking is non-critical
        if (__DEV__) {
          console.log('Error recording score history:', err);
        }
      }

      // Check for Iman score drop notifications
      try {
        const { checkImanScoreAndNotify } = await import('@/utils/notificationService');
        await checkImanScoreAndNotify(overall, user.id);
      } catch (err) {
        // Silent failure - notifications are non-critical
      }
    } catch (err) {
      // Silent failure for background operation
      if (__DEV__) {
        console.log('Error refreshing scores:', err);
      }
    }
  }, [user?.id]);

  // ✅ then define loadAllGoals SECOND
  const loadAllGoals = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(user.id),
        loadIlmGoals(user.id),
        loadAmanahGoals(user.id),
      ]);

      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);

      await refreshScores();
    } catch (err) {
      setError('Failed to load goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshScores]);

  // Check for resets when app comes to foreground (user might have passed midnight)
  useEffect(() => {
    if (!user?.id) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - check if it's a new day
        console.log('📱 App came to foreground, checking for daily resets...');
        checkAndHandleResets(user.id)
          .then(() => {
            // Reload goals if reset happened
            loadAllGoals();
          })
          .catch(err => {
            console.error('Error checking resets on app foreground:', err);
          });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id, loadAllGoals]);

  // Check for resets when screen is focused (user navigates to app)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        checkAndHandleResets(user.id).catch(err => {
          console.error('Error checking resets on focus:', err);
        });
      }
    }, [user?.id])
  );

  // Load all goals when user changes or on mount
  useEffect(() => {
    if (!user?.id) {
      // No user logged in, clear data
      setIbadahGoals({} as IbadahGoals);
      setIlmGoals({} as IlmGoals);
      setAmanahGoals({} as AmanahGoals);
      setImanScore(0);
      setSectionScores({ ibadah: 0, ilm: 0, amanah: 0 });
      setIsLoading(false);
      return;
    }

    // If user changed, clear previous user's data from memory
    if (previousUserId && previousUserId !== user.id) {
      console.log(`🔄 User changed from ${previousUserId} to ${user.id}, clearing previous user data...`);
      clearUserSpecificData(previousUserId).catch(err => {
        console.error('Error clearing previous user data:', err);
      });
    }

    setPreviousUserId(user.id);
    loadAllGoals();
    
    // Check for daily/weekly resets on initial load
    checkAndHandleResets(user.id).catch(err => {
      console.error('Error checking resets:', err);
    });
  }, [user?.id, loadAllGoals]);

  const updateIbadahGoals = useCallback(async (goals: Partial<IbadahGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Ibadah goals for user: ${user.id}...`, goals);
      
      const oldGoals = { ...ibadahGoals };
      const updated = { ...ibadahGoals, ...goals };
      
      // Optimistically update UI
      setIbadahGoals(updated);
      
      // Save to storage with user-specific key
      await saveIbadahGoals(updated, user.id);
      
      // Calculate scores immediately with updated goals (don't wait for storage reload)
      try {
        const { calculateAllSectionScores } = await import('@/utils/imanScoreCalculator');
        const WEIGHTS = { ibadah: 0.60, ilm: 0.25, amanah: 0.15 };
        
        const sections = await calculateAllSectionScores(updated, ilmGoals, amanahGoals, user.id);
        const overall = Math.round(
          (sections.ibadah * WEIGHTS.ibadah) +
          (sections.ilm * WEIGHTS.ilm) +
          (sections.amanah * WEIGHTS.amanah)
        );
        
        setImanScore(overall);
        setSectionScores(sections);
        
        console.log(`✅ Scores updated immediately: Ibadah=${sections.ibadah}%, Ilm=${sections.ilm}%, Amanah=${sections.amanah}%, Overall=${overall}%`);
      } catch (scoreErr) {
        console.error('Error calculating scores immediately:', scoreErr);
        // Fallback to refreshScores
        refreshScores().catch(err => {
          console.error('Error refreshing scores after Ibadah update:', err);
        });
      }
      
      // Log activities in background (non-blocking)
      logIbadahActivity(user.id, oldGoals, updated).catch(err => {
        if (__DEV__) {
          console.log('Error logging Ibadah activity:', err);
        }
      });
      
      // Check achievements after updating goals (non-blocking)
      const { checkAndUnlockAchievements } = await import('@/utils/achievementService');
      checkAndUnlockAchievements(user.id).catch(err => {
        if (__DEV__) {
          console.log('Error checking achievements after Ibadah update:', err);
        }
      });
      
      console.log('✅ Ibadah goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Ibadah goals:', err);
      setError('Failed to update Ibadah goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [ibadahGoals, ilmGoals, amanahGoals, user?.id, loadAllGoals, refreshScores]);

  const updateIlmGoals = useCallback(async (goals: Partial<IlmGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Ilm goals for user: ${user.id}...`, goals);
      
      const oldGoals = { ...ilmGoals };
      const updated = { ...ilmGoals, ...goals };
      
      // Optimistically update UI
      setIlmGoals(updated);
      
      // Save to storage with user-specific key
      await saveIlmGoals(updated, user.id);
      
      // Calculate scores immediately with updated goals (don't wait for storage reload)
      try {
        const { calculateAllSectionScores } = await import('@/utils/imanScoreCalculator');
        const WEIGHTS = { ibadah: 0.60, ilm: 0.25, amanah: 0.15 };
        
        const sections = await calculateAllSectionScores(ibadahGoals, updated, amanahGoals, user.id);
        const overall = Math.round(
          (sections.ibadah * WEIGHTS.ibadah) +
          (sections.ilm * WEIGHTS.ilm) +
          (sections.amanah * WEIGHTS.amanah)
        );
        
        setImanScore(overall);
        setSectionScores(sections);
        
        console.log(`✅ Scores updated immediately: Ibadah=${sections.ibadah}%, Ilm=${sections.ilm}%, Amanah=${sections.amanah}%, Overall=${overall}%`);
      } catch (scoreErr) {
        console.error('Error calculating scores immediately:', scoreErr);
        // Fallback to refreshScores
        refreshScores().catch(err => {
          console.error('Error refreshing scores after Ilm update:', err);
        });
      }
      
      // Log activities in background (non-blocking)
      logIlmActivity(user.id, oldGoals, updated).catch(err => {
        if (__DEV__) {
          console.log('Error logging Ilm activity:', err);
        }
      });
      
      // Check achievements after updating goals (non-blocking)
      const { checkAndUnlockAchievements } = await import('@/utils/achievementService');
      checkAndUnlockAchievements(user.id).catch(err => {
        if (__DEV__) {
          console.log('Error checking achievements after Ilm update:', err);
        }
      });
      
      console.log('✅ Ilm goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Ilm goals:', err);
      setError('Failed to update Ilm goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [ilmGoals, ibadahGoals, amanahGoals, user?.id, loadAllGoals, refreshScores]);

  const updateAmanahGoals = useCallback(async (goals: Partial<AmanahGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Amanah goals for user: ${user.id}...`, goals);
      
      const oldGoals = { ...amanahGoals };
      const updated = { ...amanahGoals, ...goals };
      
      // Optimistically update UI
      setAmanahGoals(updated);
      
      // Save to storage with user-specific key
      await saveAmanahGoals(updated, user.id);
      
      // Calculate scores immediately with updated goals (don't wait for storage reload)
      try {
        const { calculateAllSectionScores } = await import('@/utils/imanScoreCalculator');
        const WEIGHTS = { ibadah: 0.60, ilm: 0.25, amanah: 0.15 };
        
        const sections = await calculateAllSectionScores(ibadahGoals, ilmGoals, updated, user.id);
        const overall = Math.round(
          (sections.ibadah * WEIGHTS.ibadah) +
          (sections.ilm * WEIGHTS.ilm) +
          (sections.amanah * WEIGHTS.amanah)
        );
        
        setImanScore(overall);
        setSectionScores(sections);
        
        console.log(`✅ Scores updated immediately: Ibadah=${sections.ibadah}%, Ilm=${sections.ilm}%, Amanah=${sections.amanah}%, Overall=${overall}%`);
      } catch (scoreErr) {
        console.error('Error calculating scores immediately:', scoreErr);
        // Fallback to refreshScores
        refreshScores().catch(err => {
          console.error('Error refreshing scores after Amanah update:', err);
        });
      }
      
      // Log activities in background (non-blocking)
      logAmanahActivity(user.id, oldGoals, updated).catch(err => {
        if (__DEV__) {
          console.log('Error logging Amanah activity:', err);
        }
      });
      
      // Check achievements after updating goals (non-blocking)
      const { checkAndUnlockAchievements } = await import('@/utils/achievementService');
      checkAndUnlockAchievements(user.id).catch(err => {
        if (__DEV__) {
          console.log('Error checking achievements after Amanah update:', err);
        }
      });
      
      console.log('✅ Amanah goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Amanah goals:', err);
      setError('Failed to update Amanah goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [amanahGoals, ibadahGoals, ilmGoals, user?.id, loadAllGoals, refreshScores]);

  const value: ImanTrackerContextType = {
    ibadahGoals,
    ilmGoals,
    amanahGoals,
    imanScore,
    sectionScores,
    updateIbadahGoals,
    updateIlmGoals,
    updateAmanahGoals,
    refreshScores,
    isLoading,
    error
  };

  return (
    <ImanTrackerContext.Provider value={value}>
      {children}
    </ImanTrackerContext.Provider>
  );
};

export const useImanTracker = () => {
  const context = useContext(ImanTrackerContext);
  if (!context) {
    throw new Error('useImanTracker must be used within an ImanTrackerProvider');
  }
  return context;
};
