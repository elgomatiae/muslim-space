
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  calculateAllSectionScores, 
  getOverallImanScore,
  updateSectionScores,
  SectionScores,
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  loadIbadahGoals,
  loadIlmGoals,
  loadAmanahGoals
} from '@/utils/imanScoreCalculator';

interface ImanTrackerContextType {
  overallScore: number;
  sectionScores: SectionScores;
  ibadahGoals: IbadahGoals;
  ilmGoals: IlmGoals;
  amanahGoals: AmanahGoals;
  refreshImanScore: () => Promise<void>;
  loading: boolean;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export function ImanTrackerProvider({ children }: { children: ReactNode }) {
  const [overallScore, setOverallScore] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScores>({
    ibadah: 0,
    ilm: 0,
    amanah: 0
  });
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [loading, setLoading] = useState(true);

  const refreshImanScore = async () => {
    try {
      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(),
        loadIlmGoals(),
        loadAmanahGoals()
      ]);
      
      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);

      await updateSectionScores();
      const scores = await calculateAllSectionScores(ibadah, ilm, amanah);
      const overall = await getOverallImanScore();
      
      setSectionScores(scores);
      setOverallScore(overall);
    } catch (error) {
      console.error('Failed to refresh Iman score:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await refreshImanScore();
      setLoading(false);
    };
    initialize();

    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshImanScore, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ImanTrackerContext.Provider
      value={{
        overallScore,
        sectionScores,
        ibadahGoals,
        ilmGoals,
        amanahGoals,
        refreshImanScore,
        loading
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
