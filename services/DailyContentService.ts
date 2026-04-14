/**
 * DailyContentService - Simple service for fetching daily Quran verses and Hadiths
 */

import { supabase } from '@/lib/integrations/supabase/client';

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

/** Prefer the longest non-empty string so we surface full text when the row has both a short label and a longer column. */
function pickLongestText(...candidates: unknown[]): string {
  let best = '';
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const s = c.trim();
    if (s.length > best.length) best = s;
  }
  return best;
}

/** Map a Supabase row (any column names) into DailyHadith. Uses select('*') so extra columns (e.g. full_translation) are not dropped. */
function normalizeHadithRow(row: Record<string, unknown>): DailyHadith {
  const translation = pickLongestText(
    row.full_translation,
    row.translation_full,
    row.translation_en,
    row.translation,
    row.english_text,
    row.text,
    row.content,
    row.meaning,
    row.description,
    row.body,
    row.english_narrator,
    row.narrator_en,
  );

  const arabic = pickLongestText(
    row.arabic_text,
    row.arabic,
    row.arabic_matn,
    row.matn_arabic,
    row.arabic_full,
  );

  const source = pickLongestText(
    row.source,
    row.reference,
    row.book_reference,
    row.hadith_reference,
    row.ref,
  );

  return {
    id: String(row.id ?? ''),
    arabic_text: arabic || undefined,
    translation,
    source,
  };
}

// ============================================================================
// DAILY VERSE FUNCTIONS
// ============================================================================

/**
 * Get today's daily verse - changes at midnight local time
 * @param locale Optional locale code to filter verses by language (e.g., 'en', 'ar', 'es')
 */
export async function getDailyVerse(locale?: string): Promise<DailyVerse | null> {
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

    // Build query - try with language filter if locale is provided
    let query1 = supabase
      .from('daily_verses')
      .select('id, arabic_text, translation, reference')
      .eq('is_active', true);
    
    // Try to filter by language if locale is provided
    if (locale) {
      query1 = query1.eq('language', locale);
    }
    
    const result1 = await query1.order('created_at', { ascending: false });

    // If error suggests language column doesn't exist, retry without language filter
    if (result1.error && locale && result1.error.message?.includes('column') && result1.error.message?.includes('language')) {
      console.log('Language column not found, fetching all languages');
      const retryResult = await supabase
        .from('daily_verses')
        .select('id, arabic_text, translation, reference')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (!retryResult.error && retryResult.data && retryResult.data.length > 0) {
        data = retryResult.data;
      }
    } else if (!result1.error && result1.data && result1.data.length > 0) {
      data = result1.data;
    } else {
      // Fallback to quran_verses table
      let query2 = supabase
        .from('quran_verses')
        .select('id, arabic, translation, reference');
      
      if (locale) {
        query2 = query2.eq('language', locale);
      }
      
      const result2 = await query2.order('created_at', { ascending: false });
      
      // If error suggests language column doesn't exist, retry without language filter
      if (result2.error && locale && result2.error.message?.includes('column') && result2.error.message?.includes('language')) {
        console.log('Language column not found in quran_verses, fetching all languages');
        const retryResult2 = await supabase
          .from('quran_verses')
          .select('id, arabic, translation, reference')
          .order('created_at', { ascending: false });
        
        data = retryResult2.data;
        error = retryResult2.error;
      } else {
        data = result2.data;
        error = result2.error;
      }
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
 * @param locale Optional locale code to filter hadiths by language (e.g., 'en', 'ar', 'es')
 */
export async function getDailyHadith(locale?: string): Promise<DailyHadith | null> {
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

    // Build query - try with language filter if locale is provided
    let query1 = supabase.from('daily_hadiths').select('*').eq('is_active', true);
    
    // Try to filter by language if locale is provided
    if (locale) {
      query1 = query1.eq('language', locale);
    }
    
    const result1 = await query1.order('created_at', { ascending: false });

    // If error suggests language column doesn't exist, retry without language filter
    if (result1.error && locale && result1.error.message?.includes('column') && result1.error.message?.includes('language')) {
      console.log('Language column not found, fetching all languages');
      const retryResult = await supabase
        .from('daily_hadiths')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (!retryResult.error && retryResult.data && retryResult.data.length > 0) {
        data = retryResult.data;
      }
    } else if (!result1.error && result1.data && result1.data.length > 0) {
      data = result1.data;
    } else {
      // Fallback to hadiths table
      let query2 = supabase.from('hadiths').select('*');
      
      if (locale) {
        query2 = query2.eq('language', locale);
      }
      
      const result2 = await query2.order('created_at', { ascending: false });
      
      // If error suggests language column doesn't exist, retry without language filter
      if (result2.error && locale && result2.error.message?.includes('column') && result2.error.message?.includes('language')) {
        console.log('Language column not found in hadiths, fetching all languages');
        const retryResult2 = await supabase.from('hadiths').select('*').order('created_at', { ascending: false });
        
        data = retryResult2.data;
        error = retryResult2.error;
      } else {
        data = result2.data;
        error = result2.error;
      }
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
    const hadith = data[index] as Record<string, unknown>;

    console.log(`📿 Daily Hadith: date seed ${dateSeed}, index ${index}/${data.length}`);

    return normalizeHadithRow(hadith);
  } catch (error) {
    console.error('Error in getDailyHadith:', error);
    return null;
  }
}
