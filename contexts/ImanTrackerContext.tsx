
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getOverallImanScore, 
  getCurrentSectionScores, 
  updateSectionScores,
  checkAndHandleResets 
} from '@/utils/imanScoreCalculator';

interface SectionScores {
  ibadah: number;
  ilm: number;
  amanah: number;
}

interface ImanTrackerContextType {
  imanScore: number;
  sectionScores: SectionScores;
  refreshImanScore: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  const refreshImanScore = async () => {
    try {
      console.log('[ImanTrackerContext] Refreshing iman score...');
      setIsLoading(true);

      // Check and handle daily/weekly resets
      await checkAndHandleResets();

      // Update section scores based on current goals
      await updateSectionScores();

      // Get the latest scores
      const overallScore = await getOverallImanScore();
      const sections = await getCurrentSectionScores();

      console.log('[ImanTrackerContext] Overall score:', overallScore);
      console.log('[ImanTrackerContext] Section scores:', sections);

      setImanScore(overallScore);
      setSectionScores(sections);
    } catch (error) {
      console.error('[ImanTrackerContext] Error refreshing iman score:', error);
      // Set default values on error
      setImanScore(0);
      setSectionScores({ ibadah: 0, ilm: 0, amanah: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load when user is available
  useEffect(() => {
    if (user) {
      console.log('[ImanTrackerContext] User available, loading iman score...');
      refreshImanScore();
    } else {
      console.log('[ImanTrackerContext] No user, resetting scores...');
      setImanScore(0);
      setSectionScores({ ibadah: 0, ilm: 0, amanah: 0 });
      setIsLoading(false);
    }
  }, [user]);

  // Refresh scores every 5 minutes when app is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('[ImanTrackerContext] Auto-refreshing iman score...');
      refreshImanScore();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return (
    <ImanTrackerContext.Provider 
      value={{ 
        imanScore, 
        sectionScores, 
        refreshImanScore, 
        isLoading 
      }}
    >
      {children}
    </ImanTrackerContext.Provider>
  );
}

export function useImanTracker() {
  const context = useContext(ImanTrackerContext);
  if (!context) {
    throw new Error('useImanTracker must be used within an ImanTrackerProvider');
  }
  return context;
}
