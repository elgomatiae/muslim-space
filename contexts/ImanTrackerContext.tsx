
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  calculateAllSectionScores,
  getOverallImanScore,
  updateSectionScores,
  loadIbadahGoals,
  loadIlmGoals,
  loadAmanahGoals,
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  SectionScores,
} from '@/utils/imanScoreCalculator';

interface ImanTrackerContextType {
  imanScore: number;
  sectionScores: SectionScores;
  ibadahGoals: IbadahGoals;
  ilmGoals: IlmGoals;
  amanahGoals: AmanahGoals;
  refreshImanScore: () => Promise<void>;
  loading: boolean;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export function ImanTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScores>({
    ibadah: 0,
    ilm: 0,
    amanah: 0,
  });
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [loading, setLoading] = useState(true);

  const refreshImanScore = async () => {
    try {
      setLoading(true);
      const [ibadah, ilm, amanah] = await Promise.all([
        loadIbadahGoals(),
        loadIlmGoals(),
        loadAmanahGoals(),
      ]);

      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);

      const scores = await calculateAllSectionScores(ibadah, ilm, amanah);
      setSectionScores(scores);

      const overall = await getOverallImanScore();
      setImanScore(overall);
    } catch (error) {
      console.error('Failed to refresh Iman score:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshImanScore();
    }
  }, [user]);

  return (
    <ImanTrackerContext.Provider
      value={{
        imanScore,
        sectionScores,
        ibadahGoals,
        ilmGoals,
        amanahGoals,
        refreshImanScore,
        loading,
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
