
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loadIbadahGoals, 
  loadIlmGoals, 
  loadAmanahGoals,
  saveIbadahGoals,
  saveIlmGoals,
  saveAmanahGoals,
  getOverallImanScore,
  updateSectionScores,
  getCurrentSectionScores,
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  SectionScores
} from '@/utils/imanScoreCalculator';

interface ImanTrackerContextType {
  imanScore: number;
  sectionScores: SectionScores;
  ibadahGoals: IbadahGoals;
  ilmGoals: IlmGoals;
  amanahGoals: AmanahGoals;
  refreshScores: () => Promise<void>;
  updateIbadahGoals: (newGoals: Partial<IbadahGoals>) => Promise<void>;
  updateIlmGoals: (newGoals: Partial<IlmGoals>) => Promise<void>;
  updateAmanahGoals: (newGoals: Partial<AmanahGoals>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export function ImanTrackerProvider({ children }: { children: ReactNode }) {
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScores>({ ibadah: 0, ilm: 0, amanah: 0 });
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllGoals();
  }, []);

  const loadAllGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('ImanTrackerContext: Loading all goals...');
      
      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(),
        loadIlmGoals(),
        loadAmanahGoals()
      ]);
      
      console.log('ImanTrackerContext: Goals loaded', { ibadah, ilm, amanah });
      
      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);
      
      await refreshScores();
    } catch (err) {
      console.error('ImanTrackerContext: Error loading goals:', err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshScores = async () => {
    try {
      console.log('ImanTrackerContext: Refreshing scores...');
      await updateSectionScores();
      
      const [score, sections] = await Promise.all([
        getOverallImanScore(),
        getCurrentSectionScores()
      ]);
      
      console.log('ImanTrackerContext: Scores updated:', { score, sections });
      setImanScore(score);
      setSectionScores(sections || { ibadah: 0, ilm: 0, amanah: 0 });
    } catch (err) {
      console.error('ImanTrackerContext: Error refreshing scores:', err);
      setError('Failed to refresh scores. Please try again.');
    }
  };

  const updateIbadahGoals = async (newGoals: Partial<IbadahGoals>) => {
    try {
      console.log('ImanTrackerContext: Updating Ibadah goals:', newGoals);
      const updated = { ...ibadahGoals, ...newGoals };
      await saveIbadahGoals(updated);
      setIbadahGoals(updated);
      await refreshScores();
    } catch (err) {
      console.error('ImanTrackerContext: Error updating Ibadah goals:', err);
      throw err;
    }
  };

  const updateIlmGoals = async (newGoals: Partial<IlmGoals>) => {
    try {
      console.log('ImanTrackerContext: Updating Ilm goals:', newGoals);
      const updated = { ...ilmGoals, ...newGoals };
      await saveIlmGoals(updated);
      setIlmGoals(updated);
      await refreshScores();
    } catch (err) {
      console.error('ImanTrackerContext: Error updating Ilm goals:', err);
      throw err;
    }
  };

  const updateAmanahGoals = async (newGoals: Partial<AmanahGoals>) => {
    try {
      console.log('ImanTrackerContext: Updating Amanah goals:', newGoals);
      const updated = { ...amanahGoals, ...newGoals };
      await saveAmanahGoals(updated);
      setAmanahGoals(updated);
      await refreshScores();
    } catch (err) {
      console.error('ImanTrackerContext: Error updating Amanah goals:', err);
      throw err;
    }
  };

  return (
    <ImanTrackerContext.Provider
      value={{
        imanScore,
        sectionScores,
        ibadahGoals,
        ilmGoals,
        amanahGoals,
        refreshScores,
        updateIbadahGoals,
        updateIlmGoals,
        updateAmanahGoals,
        isLoading,
        error,
      }}
    >
      {children}
    </ImanTrackerContext.Provider>
  );
}

export function useImanTracker() {
  const context = useContext(ImanTrackerContext);
  if (context === undefined) {
    throw new Error('useImanTracker must be used within an ImanTrackerProvider');
  }
  return context;
}
