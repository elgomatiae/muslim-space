
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IbadahGoals,
  IlmGoals,
  AmanahGoals,
  SectionScores,
  loadIbadahGoals,
  loadIlmGoals,
  loadAmanahGoals,
  saveIbadahGoals,
  saveIlmGoals,
  saveAmanahGoals,
  getCurrentSectionScores,
  getOverallImanScore,
  updateSectionScores,
  checkAndHandleResets,
  // Legacy support
  PrayerGoals,
  DhikrGoals,
  QuranGoals,
  loadPrayerGoals,
  loadDhikrGoals,
  loadQuranGoals,
  savePrayerGoals,
  saveDhikrGoals,
  saveQuranGoals,
} from '@/utils/imanScoreCalculator';
import { useAuth } from './AuthContext';
import { syncLocalToSupabase, syncSupabaseToLocal, initializeImanTrackerForUser } from '@/utils/imanSupabaseSync';
import { sendImanTrackerMilestone } from '@/utils/notificationService';
import { checkAndUnlockAchievements } from '@/utils/achievementService';

interface ImanTrackerContextType {
  // New ring structure
  ibadahGoals: IbadahGoals | null;
  ilmGoals: IlmGoals | null;
  amanahGoals: AmanahGoals | null;
  
  // Legacy support
  prayerGoals: PrayerGoals | null;
  dhikrGoals: DhikrGoals | null;
  quranGoals: QuranGoals | null;
  
  sectionScores: SectionScores;
  overallScore: number;
  loading: boolean;
  refreshData: () => Promise<void>;
  
  // New update functions
  updateIbadahGoals: (goals: IbadahGoals) => Promise<void>;
  updateIlmGoals: (goals: IlmGoals) => Promise<void>;
  updateAmanahGoals: (goals: AmanahGoals) => Promise<void>;
  
  // Legacy update functions
  updatePrayerGoals: (goals: PrayerGoals) => Promise<void>;
  updateDhikrGoals: (goals: DhikrGoals) => Promise<void>;
  updateQuranGoals: (goals: QuranGoals) => Promise<void>;
  
  forceUpdate: () => void;
}

const ImanTrackerContext = createContext<ImanTrackerContextType | undefined>(undefined);

export function ImanTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // New ring states
  const [ibadahGoals, setIbadahGoals] = useState<IbadahGoals | null>(null);
  const [ilmGoals, setIlmGoals] = useState<IlmGoals | null>(null);
  const [amanahGoals, setAmanahGoals] = useState<AmanahGoals | null>(null);
  
  // Legacy states
  const [prayerGoals, setPrayerGoals] = useState<PrayerGoals | null>(null);
  const [dhikrGoals, setDhikrGoals] = useState<DhikrGoals | null>(null);
  const [quranGoals, setQuranGoals] = useState<QuranGoals | null>(null);
  
  const [sectionScores, setSectionScores] = useState<SectionScores>({ ibadah: 0, ilm: 0, amanah: 0 });
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const loadAllData = useCallback(async () => {
    try {
      console.log('ImanTrackerContext: Loading all data...');
      
      await checkAndHandleResets();

      if (user) {
        await initializeImanTrackerForUser(user.id);
        await syncSupabaseToLocal(user.id);
        
        // Check for new achievements
        await checkAndUnlockAchievements(user.id);
      }
      
      await updateSectionScores();
      
      // Load new ring goals
      const ibadah = await loadIbadahGoals();
      const ilm = await loadIlmGoals();
      const amanah = await loadAmanahGoals();
      
      setIbadahGoals(ibadah);
      setIlmGoals(ilm);
      setAmanahGoals(amanah);
      
      // Load legacy goals for backward compatibility
      const prayer = await loadPrayerGoals();
      const dhikr = await loadDhikrGoals();
      const quran = await loadQuranGoals();
      
      setPrayerGoals(prayer);
      setDhikrGoals(dhikr);
      setQuranGoals(quran);
      
      // Load scores
      const scores = await getCurrentSectionScores();
      const overall = await getOverallImanScore();
      
      setSectionScores(scores);
      setOverallScore(overall);
      
      console.log('ImanTrackerContext: Data loaded successfully');
    } catch (error) {
      console.log('ImanTrackerContext: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const updateIbadahGoals = useCallback(async (goals: IbadahGoals) => {
    console.log('ImanTrackerContext: Updating ibadah goals...');
    setIbadahGoals(goals);
    await saveIbadahGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    // Update legacy states
    const prayer = await loadPrayerGoals();
    const dhikr = await loadDhikrGoals();
    const quran = await loadQuranGoals();
    setPrayerGoals(prayer);
    setDhikrGoals(dhikr);
    setQuranGoals(quran);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check - this ensures badges update immediately
      console.log('ImanTrackerContext: Checking achievements after ibadah update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Ibadah goals updated');
  }, [user]);

  const updateIlmGoals = useCallback(async (goals: IlmGoals) => {
    console.log('ImanTrackerContext: Updating ilm goals...');
    setIlmGoals(goals);
    await saveIlmGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check
      console.log('ImanTrackerContext: Checking achievements after ilm update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Ilm goals updated');
  }, [user]);

  const updateAmanahGoals = useCallback(async (goals: AmanahGoals) => {
    console.log('ImanTrackerContext: Updating amanah goals...');
    setAmanahGoals(goals);
    await saveAmanahGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check
      console.log('ImanTrackerContext: Checking achievements after amanah update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Amanah goals updated');
  }, [user]);

  const updatePrayerGoals = useCallback(async (goals: PrayerGoals) => {
    console.log('ImanTrackerContext: Updating prayer goals...');
    setPrayerGoals(goals);
    await savePrayerGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    // Update ibadah goals
    const ibadah = await loadIbadahGoals();
    setIbadahGoals(ibadah);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check
      console.log('ImanTrackerContext: Checking achievements after prayer update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Prayer goals updated');
  }, [user]);

  const updateDhikrGoals = useCallback(async (goals: DhikrGoals) => {
    console.log('ImanTrackerContext: Updating dhikr goals...');
    setDhikrGoals(goals);
    await saveDhikrGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    // Update ibadah goals
    const ibadah = await loadIbadahGoals();
    setIbadahGoals(ibadah);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check
      console.log('ImanTrackerContext: Checking achievements after dhikr update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Dhikr goals updated');
  }, [user]);

  const updateQuranGoals = useCallback(async (goals: QuranGoals) => {
    console.log('ImanTrackerContext: Updating quran goals...');
    setQuranGoals(goals);
    await saveQuranGoals(goals);
    await updateSectionScores();
    
    const scores = await getCurrentSectionScores();
    const overall = await getOverallImanScore();
    setSectionScores(scores);
    setOverallScore(overall);
    
    // Update ibadah goals
    const ibadah = await loadIbadahGoals();
    setIbadahGoals(ibadah);
    
    if (user) {
      await syncLocalToSupabase(user.id);
      // INSTANT achievement check
      console.log('ImanTrackerContext: Checking achievements after quran update...');
      await checkAndUnlockAchievements(user.id);
    }
    
    console.log('ImanTrackerContext: Quran goals updated');
  }, [user]);

  const forceUpdate = useCallback(() => {
    console.log('ImanTrackerContext: Force update triggered');
    setUpdateTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, updateTrigger]);

  useEffect(() => {
    const resetInterval = setInterval(async () => {
      await checkAndHandleResets();
      await refreshData();
    }, 60000);
    
    return () => clearInterval(resetInterval);
  }, [refreshData]);

  useEffect(() => {
    const scoreInterval = setInterval(async () => {
      await updateSectionScores();
      const scores = await getCurrentSectionScores();
      const overall = await getOverallImanScore();
      
      // Check for milestones and send notifications
      if (overall >= 90 && overallScore < 90) {
        await sendImanTrackerMilestone('Excellent Progress!', 'You\'ve reached 90% Iman score! Keep up the amazing work! 🌟');
      } else if (overall >= 75 && overallScore < 75) {
        await sendImanTrackerMilestone('Great Achievement!', 'You\'ve reached 75% Iman score! You\'re doing great! 🎯');
      } else if (overall >= 50 && overallScore < 50) {
        await sendImanTrackerMilestone('Halfway There!', 'You\'ve reached 50% Iman score! Keep going! 💪');
      } else if (overall >= 25 && overallScore < 25) {
        await sendImanTrackerMilestone('Good Start!', 'You\'ve reached 25% Iman score! You\'re on the right path! 🌱');
      }
      
      setSectionScores(scores);
      setOverallScore(overall);
      
      // Check for new achievements periodically
      if (user) {
        await checkAndUnlockAchievements(user.id);
      }
    }, 30000);
    
    return () => clearInterval(scoreInterval);
  }, [overallScore, user]);

  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(async () => {
      await syncLocalToSupabase(user.id);
    }, 300000);
    
    return () => clearInterval(syncInterval);
  }, [user]);

  const value: ImanTrackerContextType = {
    ibadahGoals,
    ilmGoals,
    amanahGoals,
    prayerGoals,
    dhikrGoals,
    quranGoals,
    sectionScores,
    overallScore,
    loading,
    refreshData,
    updateIbadahGoals,
    updateIlmGoals,
    updateAmanahGoals,
    updatePrayerGoals,
    updateDhikrGoals,
    updateQuranGoals,
    forceUpdate,
  };

  return (
    <ImanTrackerContext.Provider value={value}>
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
