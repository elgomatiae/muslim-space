/**
 * DailyContentService - Simple service for fetching daily Quran verses and Hadiths
 */

import { supabase } from '@/lib/supabase';

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
 * Get today's daily verse - uses date-based selection for consistency
 */
export async function getDailyVerse(): Promise<DailyVerse | null> {
  try {
    // Get today's date as a seed for consistent selection
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const dateSeed = new Date(dateString + 'T00:00:00Z').getTime();

    // Fetch all verses
    const { data, error } = await supabase
      .from('quran_verses')
      .select('id, arabic, translation, reference')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verses:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No verses found in database');
      return null;
    }

    // Select verse based on date (same date = same verse)
    const index = Math.abs(dateSeed) % data.length;
    const verse = data[index];

    return {
      id: verse.id,
      arabic_text: verse.arabic || '',
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
 * Get today's daily hadith - uses date-based selection for consistency
 */
export async function getDailyHadith(): Promise<DailyHadith | null> {
  try {
    // Get today's date as a seed for consistent selection
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const dateSeed = new Date(dateString + 'T00:00:00Z').getTime();

    // Fetch all hadiths
    const { data, error } = await supabase
      .from('hadiths')
      .select('id, arabic, translation, reference')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hadiths:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No hadiths found in database');
      return null;
    }

    // Select hadith based on date with different seed (same date = same hadith)
    const baseIndex = Math.abs(dateSeed) % data.length;
    const index = (baseIndex * 7 + 13) % data.length; // Different seed from verse
    const hadith = data[index];

    return {
      id: hadith.id,
      arabic_text: hadith.arabic || undefined,
      translation: hadith.translation || '',
      source: hadith.reference || '',
    };
  } catch (error) {
    console.error('Error in getDailyHadith:', error);
    return null;
  }
}
