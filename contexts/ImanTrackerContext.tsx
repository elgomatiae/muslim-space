
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
    
    // Check for daily/weekly resets
    checkAndHandleResets(user.id).catch(err => {
      console.error('Error checking resets:', err);
    });
  }, [user?.id]);

  const loadAllGoals = useCallback(async () => {
    if (!user?.id) {
      console.log('ℹ️ No user logged in, skipping goal load');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(user.id),
        loadIlmGoals(user.id),
        loadAmanahGoals(user.id)
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
  }, [user?.id]); // refreshScores is stable, no need to include

  const updateIbadahGoals = useCallback(async (goals: Partial<IbadahGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Ibadah goals for user: ${user.id}...`, goals);
      
      const updated = { ...ibadahGoals, ...goals };
      
      // Optimistically update UI
      setIbadahGoals(updated);
      
      // Save to storage with user-specific key
      await saveIbadahGoals(updated, user.id);
      
      // Refresh scores in background
      refreshScores().catch(err => {
        console.error('Error refreshing scores after Ibadah update:', err);
      });
      
      console.log('✅ Ibadah goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Ibadah goals:', err);
      setError('Failed to update Ibadah goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [ibadahGoals, user?.id, loadAllGoals]);

  const updateIlmGoals = useCallback(async (goals: Partial<IlmGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Ilm goals for user: ${user.id}...`, goals);
      
      const updated = { ...ilmGoals, ...goals };
      
      // Optimistically update UI
      setIlmGoals(updated);
      
      // Save to storage with user-specific key
      await saveIlmGoals(updated, user.id);
      
      // Refresh scores in background
      refreshScores().catch(err => {
        console.error('Error refreshing scores after Ilm update:', err);
      });
      
      console.log('✅ Ilm goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Ilm goals:', err);
      setError('Failed to update Ilm goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [ilmGoals, user?.id, loadAllGoals]);

  const updateAmanahGoals = useCallback(async (goals: Partial<AmanahGoals>) => {
    if (!user?.id) {
      console.error('❌ Cannot update goals: no user logged in');
      return;
    }

    try {
      console.log(`🔄 Updating Amanah goals for user: ${user.id}...`, goals);
      
      const updated = { ...amanahGoals, ...goals };
      
      // Optimistically update UI
      setAmanahGoals(updated);
      
      // Save to storage with user-specific key
      await saveAmanahGoals(updated, user.id);
      
      // Refresh scores in background
      refreshScores().catch(err => {
        console.error('Error refreshing scores after Amanah update:', err);
      });
      
      console.log('✅ Amanah goals updated successfully');
    } catch (err) {
      console.error('❌ Error updating Amanah goals:', err);
      setError('Failed to update Amanah goals. Please try again.');
      
      // Reload goals to ensure consistency
      loadAllGoals();
    }
  }, [amanahGoals, user?.id, loadAllGoals]);

  const refreshScores = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const [overall, sections] = await Promise.all([
        getOverallImanScore(user.id),
        getCurrentSectionScores(user.id)
      ]);
      
      setImanScore(overall);
      setSectionScores(sections);
    } catch (err) {
      // Silent failure for background operation
      // Error already logged in score calculator
    }
  }, [user?.id]);

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
