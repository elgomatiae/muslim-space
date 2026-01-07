
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCurrentSectionScores,
  getOverallImanScore,
  updateSectionScores,
  checkAndHandleResets,
  loadIbadahGoals,
  loadIlmGoals,
  loadAmanahGoals,
  saveIbadahGoals,
  saveIlmGoals,
  saveAmanahGoals,
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  SectionScores,
} from '@/utils/imanScoreCalculator';

interface ImanTrackerContextType {
  // Scores
  imanScore: number;
  sectionScores: SectionScores;
  
  // Goals
  ibadahGoals: IbadahGoals;
  ilmGoals: IlmGoals;
  amanahGoals: AmanahGoals;
  
  // Actions
  refreshScores: () => Promise<void>;
  updateIbadahGoals: (goals: IbadahGoals) => Promise<void>;
  updateIlmGoals: (goals: IlmGoals) => Promise<void>;
  updateAmanahGoals: (goals: AmanahGoals) => Promise<void>;
  
  // Loading state
  loading: boolean;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | null>(null);

export const ImanTrackerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // State
  const [imanScore, setImanScore] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScores>({
    ibadah: 0,
    ilm: 0,
    amanah: 0,
  });
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals>({
    fardPrayers: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    sunnahDailyGoal: 5,
    sunnahCompleted: 0,
    tahajjudWeeklyGoal: 2,
    tahajjudCompleted: 0,
    quranDailyPagesGoal: 2,
    quranDailyPagesCompleted: 0,
    quranDailyVersesGoal: 10,
    quranDailyVersesCompleted: 0,
    quranWeeklyMemorizationGoal: 5,
    quranWeeklyMemorizationCompleted: 0,
    dhikrDailyGoal: 100,
    dhikrDailyCompleted: 0,
    dhikrWeeklyGoal: 1000,
    dhikrWeeklyCompleted: 0,
    duaDailyGoal: 3,
    duaDailyCompleted: 0,
    fastingWeeklyGoal: 2,
    fastingWeeklyCompleted: 0,
    score: 0,
  });
  const [ilmGoals, setIlmGoals] = useState<IlmGoals>({
    weeklyLecturesGoal: 2,
    weeklyLecturesCompleted: 0,
    weeklyRecitationsGoal: 2,
    weeklyRecitationsCompleted: 0,
    weeklyQuizzesGoal: 1,
    weeklyQuizzesCompleted: 0,
    weeklyReflectionGoal: 3,
    weeklyReflectionCompleted: 0,
    score: 0,
  });
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals>({
    dailyExerciseGoal: 30,
    dailyExerciseCompleted: 0,
    dailyWaterGoal: 8,
    dailyWaterCompleted: 0,
    weeklyWorkoutGoal: 3,
    weeklyWorkoutCompleted: 0,
    weeklyMeditationGoal: 2,
    weeklyMeditationCompleted: 0,
    weeklyJournalGoal: 2,
    weeklyJournalCompleted: 0,
    weeklyMentalHealthGoal: 3,
    weeklyMentalHealthCompleted: 0,
    dailySleepGoal: 7,
    dailySleepCompleted: 0,
    weeklyStressManagementGoal: 2,
    weeklyStressManagementCompleted: 0,
    score: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      console.log('🔄 ImanTrackerContext: Loading all data...');
      
      // Check for daily/weekly resets
      await checkAndHandleResets();
      
      // Load goals
      const [loadedIbadah, loadedIlm, loadedAmanah] = await Promise.all([
        loadIbadahGoals(),
        loadIlmGoals(),
        loadAmanahGoals(),
      ]);
      
      setIbadahGoals(loadedIbadah);
      setIlmGoals(loadedIlm);
      setAmanahGoals(loadedAmanah);
      
      // Calculate scores
      const scores = await getCurrentSectionScores();
      setSectionScores(scores);
      
      const overall = await getOverallImanScore();
      setImanScore(overall);
      
      console.log('✅ ImanTrackerContext: Data loaded successfully');
      console.log(`   Overall Score: ${overall}%`);
      console.log(`   Ibadah: ${scores.ibadah}%, Ilm: ${scores.ilm}%, Amanah: ${scores.amanah}%`);
    } catch (error) {
      console.error('❌ ImanTrackerContext: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh scores
  const refreshScores = useCallback(async () => {
    try {
      console.log('🔄 ImanTrackerContext: Refreshing scores...');
      
      // Check for resets
      await checkAndHandleResets();
      
      // Recalculate scores
      const scores = await updateSectionScores();
      setSectionScores(scores);
      
      const overall = await getOverallImanScore();
      setImanScore(overall);
      
      console.log('✅ ImanTrackerContext: Scores refreshed');
      console.log(`   Overall Score: ${overall}%`);
      console.log(`   Ibadah: ${scores.ibadah}%, Ilm: ${scores.ilm}%, Amanah: ${scores.amanah}%`);
    } catch (error) {
      console.error('❌ ImanTrackerContext: Error refreshing scores:', error);
    }
  }, []);

  // Update goals
  const updateIbadahGoals = useCallback(async (goals: IbadahGoals) => {
    try {
      await saveIbadahGoals(goals);
      setIbadahGoals(goals);
      await refreshScores();
    } catch (error) {
      console.error('❌ ImanTrackerContext: Error updating ibadah goals:', error);
    }
  }, [refreshScores]);

  const updateIlmGoals = useCallback(async (goals: IlmGoals) => {
    try {
      await saveIlmGoals(goals);
      setIlmGoals(goals);
      await refreshScores();
    } catch (error) {
      console.error('❌ ImanTrackerContext: Error updating ilm goals:', error);
    }
  }, [refreshScores]);

  const updateAmanahGoals = useCallback(async (goals: AmanahGoals) => {
    try {
      await saveAmanahGoals(goals);
      setAmanahGoals(goals);
      await refreshScores();
    } catch (error) {
      console.error('❌ ImanTrackerContext: Error updating amanah goals:', error);
    }
  }, [refreshScores]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  // Periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('⏰ ImanTrackerContext: Periodic refresh triggered');
      refreshScores();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, refreshScores]);

  const value: ImanTrackerContextType = {
    imanScore,
    sectionScores,
    ibadahGoals,
    ilmGoals,
    amanahGoals,
    refreshScores,
    updateIbadahGoals,
    updateIlmGoals,
    updateAmanahGoals,
    loading,
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
