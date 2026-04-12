
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerGoals, DhikrGoals, QuranGoals } from './imanScoreCalculator';

interface ImanTrackerData {
  user_id: string;
  fard_fajr: boolean;
  fard_dhuhr: boolean;
  fard_asr: boolean;
  fard_maghrib: boolean;
  fard_isha: boolean;
  sunnah_daily_goal: number;
  sunnah_completed: number;
  tahajjud_weekly_goal: number;
  tahajjud_completed: number;
  quran_daily_pages_goal: number;
  quran_daily_pages_completed: number;
  quran_daily_verses_goal: number;
  quran_daily_verses_completed: number;
  quran_weekly_memorization_goal: number;
  quran_weekly_memorization_completed: number;
  dhikr_daily_goal: number;
  dhikr_daily_completed: number;
  dhikr_weekly_goal: number;
  dhikr_weekly_completed: number;
  prayer_score: number;
  quran_score: number;
  dhikr_score: number;
  last_updated: string;
  last_daily_reset: string;
  last_weekly_reset: string;
}

/**
 * Sync local Iman Tracker data to Supabase
 */
export async function syncLocalToSupabase(userId: string): Promise<void> {
  try {
    console.log('Syncing Iman Tracker data to Supabase...');
    
    // Load local data
    const prayerGoalsStr = await AsyncStorage.getItem('prayerGoals');
    const dhikrGoalsStr = await AsyncStorage.getItem('dhikrGoals');
    const quranGoalsStr = await AsyncStorage.getItem('quranGoals');
    const scoresStr = await AsyncStorage.getItem('sectionScores');
    const lastResetStr = await AsyncStorage.getItem('lastResetCheck');

    if (!prayerGoalsStr || !dhikrGoalsStr || !quranGoalsStr) {
      console.log('No local data to sync');
      return;
    }

    const prayerGoals: PrayerGoals = JSON.parse(prayerGoalsStr);
    const dhikrGoals: DhikrGoals = JSON.parse(dhikrGoalsStr);
    const quranGoals: QuranGoals = JSON.parse(quranGoalsStr);
    const scores = scoresStr ? JSON.parse(scoresStr) : { prayer: 0, dhikr: 0, quran: 0 };
    const lastReset = lastResetStr ? JSON.parse(lastResetStr) : { daily: new Date().toISOString(), weekly: new Date().toISOString() };

    // Prepare data for Supabase
    const data: Partial<ImanTrackerData> = {
      user_id: userId,
      fard_fajr: prayerGoals.fardPrayers.fajr,
      fard_dhuhr: prayerGoals.fardPrayers.dhuhr,
      fard_asr: prayerGoals.fardPrayers.asr,
      fard_maghrib: prayerGoals.fardPrayers.maghrib,
      fard_isha: prayerGoals.fardPrayers.isha,
      sunnah_daily_goal: prayerGoals.sunnahDailyGoal,
      sunnah_completed: prayerGoals.sunnahCompleted,
      tahajjud_weekly_goal: prayerGoals.tahajjudWeeklyGoal,
      tahajjud_completed: prayerGoals.tahajjudCompleted,
      quran_daily_pages_goal: quranGoals.dailyPagesGoal,
      quran_daily_pages_completed: quranGoals.dailyPagesCompleted,
      quran_daily_verses_goal: 0,
      quran_daily_verses_completed: 0,
      quran_weekly_memorization_goal: quranGoals.weeklyMemorizationGoal,
      quran_weekly_memorization_completed: quranGoals.weeklyMemorizationCompleted,
      dhikr_daily_goal: dhikrGoals.dailyGoal,
      dhikr_daily_completed: dhikrGoals.dailyCompleted,
      dhikr_weekly_goal: dhikrGoals.weeklyGoal,
      dhikr_weekly_completed: dhikrGoals.weeklyCompleted,
      prayer_score: scores.prayer,
      quran_score: scores.quran,
      dhikr_score: scores.dhikr,
      last_updated: new Date().toISOString(),
      last_daily_reset: lastReset.daily,
      last_weekly_reset: lastReset.weekly,
    };

    // Upsert to Supabase
    const { error } = await supabase
      .from('iman_tracker_goals')
      .upsert(data, { onConflict: 'user_id' });

    if (error) {
      console.log('Error syncing to Supabase:', error);
      return;
    }

    console.log('Iman Tracker data synced to Supabase successfully');
  } catch (error) {
    console.log('Error in syncLocalToSupabase:', error);
  }
}

/**
 * Sync Supabase Iman Tracker data to local storage
 */
export async function syncSupabaseToLocal(userId: string): Promise<void> {
  try {
    console.log('Syncing Iman Tracker data from Supabase...');
    
    // Fetch data from Supabase
    const { data, error } = await supabase
      .from('iman_tracker_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('Error fetching from Supabase:', error);
      return;
    }

    if (!data) {
      console.log('No data found in Supabase');
      return;
    }

    // Convert to local format
    const prayerGoals: PrayerGoals = {
      fardPrayers: {
        fajr: data.fard_fajr,
        dhuhr: data.fard_dhuhr,
        asr: data.fard_asr,
        maghrib: data.fard_maghrib,
        isha: data.fard_isha,
      },
      sunnahDailyGoal: data.sunnah_daily_goal,
      sunnahCompleted: data.sunnah_completed,
      tahajjudWeeklyGoal: data.tahajjud_weekly_goal,
      tahajjudCompleted: data.tahajjud_completed,
    };

    const dhikrGoals: DhikrGoals = {
      dailyGoal: data.dhikr_daily_goal,
      dailyCompleted: data.dhikr_daily_completed,
      weeklyGoal: data.dhikr_weekly_goal,
      weeklyCompleted: data.dhikr_weekly_completed,
    };

    const quranGoals: QuranGoals = {
      dailyPagesGoal: data.quran_daily_pages_goal,
      dailyPagesCompleted: data.quran_daily_pages_completed,
      weeklyMemorizationGoal: data.quran_weekly_memorization_goal,
      weeklyMemorizationCompleted: data.quran_weekly_memorization_completed,
    };

    const scores = {
      prayer: data.prayer_score,
      quran: data.quran_score,
      dhikr: data.dhikr_score,
    };

    const lastReset = {
      daily: data.last_daily_reset,
      weekly: data.last_weekly_reset,
    };

    // Save to local storage
    await AsyncStorage.setItem('prayerGoals', JSON.stringify(prayerGoals));
    await AsyncStorage.setItem('dhikrGoals', JSON.stringify(dhikrGoals));
    await AsyncStorage.setItem('quranGoals', JSON.stringify(quranGoals));
    await AsyncStorage.setItem('sectionScores', JSON.stringify(scores));
    await AsyncStorage.setItem('lastResetCheck', JSON.stringify(lastReset));

    console.log('Iman Tracker data synced from Supabase successfully');
  } catch (error) {
    console.log('Error in syncSupabaseToLocal:', error);
  }
}

/**
 * Initialize Iman Tracker data for a new user
 */
export async function initializeImanTrackerForUser(userId: string): Promise<void> {
  try {
    console.log('Initializing Iman Tracker for user:', userId);
    
    // Check if data already exists
    const { data: existingData } = await supabase
      .from('iman_tracker_goals')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingData) {
      console.log('Iman Tracker data already exists, syncing to local...');
      await syncSupabaseToLocal(userId);
      return;
    }

    // Create default data
    const defaultData: Partial<ImanTrackerData> = {
      user_id: userId,
      fard_fajr: false,
      fard_dhuhr: false,
      fard_asr: false,
      fard_maghrib: false,
      fard_isha: false,
      sunnah_daily_goal: 2,
      sunnah_completed: 0,
      tahajjud_weekly_goal: 3,
      tahajjud_completed: 0,
      quran_daily_pages_goal: 2,
      quran_daily_pages_completed: 0,
      quran_daily_verses_goal: 0,
      quran_daily_verses_completed: 0,
      quran_weekly_memorization_goal: 5,
      quran_weekly_memorization_completed: 0,
      dhikr_daily_goal: 100,
      dhikr_daily_completed: 0,
      dhikr_weekly_goal: 1000,
      dhikr_weekly_completed: 0,
      prayer_score: 0,
      quran_score: 0,
      dhikr_score: 0,
      last_updated: new Date().toISOString(),
      last_daily_reset: new Date().toISOString(),
      last_weekly_reset: new Date().toISOString(),
    };

    // Insert to Supabase
    const { error } = await supabase
      .from('iman_tracker_goals')
      .insert(defaultData);

    if (error) {
      console.log('Error initializing Iman Tracker:', error);
      return;
    }

    // Sync to local
    await syncSupabaseToLocal(userId);

    console.log('Iman Tracker initialized successfully');
  } catch (error) {
    console.log('Error in initializeImanTrackerForUser:', error);
  }
}
