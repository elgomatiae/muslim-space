/**
 * DailyContentService - Simple service for fetching daily Quran verses and Hadiths
 */

import { supabase } from '@/app/integrations/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DailyVerse {
  id: string;
  arabic_text: string;
  translation: string;
  reference: string;
}

export interface DailyHadith {
  id: string;
  arabic_text?: string;
  translation: string;
  source: string;
}

// ============================================================================
// DAILY VERSE FUNCTIONS
// ============================================================================

/**
 * Get today's daily verse - changes at midnight local time
 */
export async function getDailyVerse(): Promise<DailyVerse | null> {
  try {
    // Get today's date in local timezone for consistent daily selection
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    // Create a unique daily seed based on year, month, day
    const dateSeed = year * 10000 + month * 100 + day;

    // Fetch all verses - try daily_verses first, then fallback to quran_verses
    let data: any[] | null = null;
    let error: any = null;

    // Try daily_verses table first (correct table name per migration)
    const result1 = await supabase
      .from('daily_verses')
      .select('id, arabic_text, translation, reference')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!result1.error && result1.data && result1.data.length > 0) {
      data = result1.data;
    } else {
      // Fallback to quran_verses table
      const result2 = await supabase
        .from('quran_verses')
        .select('id, arabic, translation, reference')
        .order('created_at', { ascending: false });
      
      data = result2.data;
      error = result2.error;
    }

    if (error) {
      console.error('Error fetching verses:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No verses found in database');
      return null;
    }

    // Select verse based on date - use prime multiplier for good distribution
    const index = (dateSeed * 13 + 7) % data.length;
    const verse = data[index];

    console.log(`📖 Daily Verse: date seed ${dateSeed}, index ${index}/${data.length}`);

    return {
      id: verse.id,
      arabic_text: verse.arabic_text || verse.arabic || '',
      translation: verse.translation || '',
      reference: verse.reference || '',
    };
  } catch (error) {
    console.error('Error in getDailyVerse:', error);
    return null;
  }
}

// ============================================================================
// DAILY HADITH FUNCTIONS
// ============================================================================

/**
 * Get today's daily hadith - changes at midnight local time
 */
export async function getDailyHadith(): Promise<DailyHadith | null> {
  try {
    // Get today's date in local timezone for consistent daily selection
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    // Create a unique daily seed based on year, month, day
    const dateSeed = year * 10000 + month * 100 + day;

    // Fetch all hadiths - try daily_hadiths first, then fallback to hadiths
    let data: any[] | null = null;
    let error: any = null;

    // Try daily_hadiths table first (correct table name per migration)
    const result1 = await supabase
      .from('daily_hadiths')
      .select('id, arabic_text, translation, source')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!result1.error && result1.data && result1.data.length > 0) {
      data = result1.data;
    } else {
      // Fallback to hadiths table
      const result2 = await supabase
        .from('hadiths')
        .select('id, arabic, translation, reference')
        .order('created_at', { ascending: false });
      
      data = result2.data;
      error = result2.error;
    }

    if (error) {
      console.error('Error fetching hadiths:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No hadiths found in database');
      return null;
    }

    // Select hadith based on date - different formula from verse to get different content
    // Use prime multiplier to ensure good distribution
    const index = (dateSeed * 31 + 17) % data.length;
    const hadith = data[index];

    console.log(`📿 Daily Hadith: date seed ${dateSeed}, index ${index}/${data.length}`);

    return {
      id: hadith.id,
      arabic_text: hadith.arabic_text || hadith.arabic || undefined,
      translation: hadith.translation || '',
      source: hadith.source || hadith.reference || '',
    };
  } catch (error) {
    console.error('Error in getDailyHadith:', error);
    return null;
  }
}
