
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
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState({ ibadah: 0, ilm: 0, amanah: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all goals on mount
  useEffect(() => {
    loadAllGoals();
    
    // Check for daily/weekly resets
    checkAndHandleResets().catch(err => {
      console.error('Error checking resets:', err);
    });
  }, []);

  const loadAllGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📥 Loading all goals...');
      
      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(),
        loadIlmGoals(),
        loadAmanahGoals()
      ]);
      
      console.log('✅ Goals loaded successfully');
      console.log('   Ibadah goals:', ibadah);
      console.log('   Ilm goals:', ilm);
      console.log('   Amanah goals:', amanah);
      
      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);
      
      await refreshScores();
    } catch (err) {
      console.error('❌ Error loading goals:', err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateIbadahGoals = useCallback(async (goals: Partial<IbadahGoals>) => {
    try {
      console.log('🔄 Updating Ibadah goals...', goals);
      
      const updated = { ...ibadahGoals, ...goals };
      
      // Optimistically update UI
      setIbadahGoals(updated);
      
      // Save to storage
      await saveIbadahGoals(updated);
      
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
  }, [ibadahGoals]);

  const updateIlmGoals = useCallback(async (goals: Partial<IlmGoals>) => {
    try {
      console.log('🔄 Updating Ilm goals...', goals);
      
      const updated = { ...ilmGoals, ...goals };
      
      // Optimistically update UI
      setIlmGoals(updated);
      
      // Save to storage
      await saveIlmGoals(updated);
      
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
  }, [ilmGoals]);

  const updateAmanahGoals = useCallback(async (goals: Partial<AmanahGoals>) => {
    try {
      console.log('🔄 Updating Amanah goals...', goals);
      
      const updated = { ...amanahGoals, ...goals };
      
      // Optimistically update UI
      setAmanahGoals(updated);
      
      // Save to storage
      await saveAmanahGoals(updated);
      
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
  }, [amanahGoals]);

  const refreshScores = useCallback(async () => {
    try {
      console.log('🔄 Refreshing scores...');
      
      const [overall, sections] = await Promise.all([
        getOverallImanScore(),
        getCurrentSectionScores()
      ]);
      
      console.log('✅ Scores refreshed:');
      console.log('   Overall:', overall);
      console.log('   Sections:', sections);
      
      setImanScore(overall);
      setSectionScores(sections);
    } catch (err) {
      console.error('❌ Error refreshing scores:', err);
      // Don't set error here as this is a background operation
      // Just log it and continue
    }
  }, []);

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
