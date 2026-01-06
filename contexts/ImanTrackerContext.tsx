
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  getCurrentSectionScores
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
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export const ImanTrackerProvider = ({ children }: { children: ReactNode }) => {
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({} as IbadahGoals);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({} as IlmGoals);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({} as AmanahGoals);
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState({ ibadah: 0, ilm: 0, amanah: 0 });

  useEffect(() => {
    loadAllGoals();
  }, []);

  const loadAllGoals = async () => {
    const [ibadah, ilm, amanah] = await Promise.all([
      loadIbadahGoals(),
      loadIlmGoals(),
      loadAmanahGoals()
    ]);
    setIbadahGoals(ibadah);
    setIlmGoals(ilm);
    setAmanahGoals(amanah);
    await refreshScores();
  };

  const updateIbadahGoals = async (goals: Partial<IbadahGoals>) => {
    const updated = { ...ibadahGoals, ...goals };
    await saveIbadahGoals(updated);
    setIbadahGoals(updated);
    await refreshScores();
  };

  const updateIlmGoals = async (goals: Partial<IlmGoals>) => {
    const updated = { ...ilmGoals, ...goals };
    await saveIlmGoals(updated);
    setIlmGoals(updated);
    await refreshScores();
  };

  const updateAmanahGoals = async (goals: Partial<AmanahGoals>) => {
    const updated = { ...amanahGoals, ...goals };
    await saveAmanahGoals(updated);
    setAmanahGoals(updated);
    await refreshScores();
  };

  const refreshScores = async () => {
    const overall = await getOverallImanScore();
    const sections = await getCurrentSectionScores();
    setImanScore(overall);
    setSectionScores(sections);
  };

  const value: ImanTrackerContextType = {
    ibadahGoals,
    ilmGoals,
    amanahGoals,
    imanScore,
    sectionScores,
    updateIbadahGoals,
    updateIlmGoals,
    updateAmanahGoals,
    refreshScores
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
