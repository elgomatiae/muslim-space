/**
 * RecitationService - Clean implementation for fetching Quran recitations
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface Recitation {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  category_id: string;
  reciter?: string;
  duration: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface RecitationDisplay {
  id: string;
  title: string;
  url: string;
  image_url: string;
  category: string;
  reciter_name: string;
  duration: number; // in seconds
  views: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Smart categorization function that analyzes recitation data
 * to assign meaningful categories ensuring at least 10 videos per category
 */
function categorizeRecitation(recitation: any): string {
  const title = (recitation.title || '').toLowerCase();
  const reciter = (recitation.reciter || '').toLowerCase();
  const categoryId = (recitation.category_id || '').toLowerCase();
  
  // Emotional & Heart-Touching (keywords: emotional, heart, touching, crying, tears, beautiful)
  if (title.includes('emotional') || title.includes('heart') || title.includes('touching') || 
      title.includes('crying') || title.includes('tears') || title.includes('beautiful') ||
      title.includes('soothing') || title.includes('healing') || title.includes('powerful')) {
    return 'Emotional & Heart-Touching';
  }
  
  // Popular Surahs (Yaseen, Rahman, Mulk, Waqiah, Kahf, Maryam, Yusuf)
  const popularSurahs = ['yaseen', 'yasīn', 'rahman', 'mulk', 'waqiah', 'waqi\'ah', 'kahf', 'kāhf', 
                         'maryam', 'yusuf', 'yūsuf', 'fatiha', 'fātiḥa', 'baqarah', 'baqara'];
  if (popularSurahs.some(surah => title.includes(surah))) {
    return 'Popular Surahs';
  }
  
  // Taraweeh & Ramadan (keywords: taraweeh, ramadan, tarawi)
  if (title.includes('taraweeh') || title.includes('tarawi') || title.includes('ramadan') ||
      title.includes('ramadān') || reciter.includes('taraweeh')) {
    return 'Taraweeh & Ramadan';
  }
  
  // Long Surahs (Baqarah, Aal-Imran, Nisa, Ma'idah, An'am, A'raf, Tawbah)
  const longSurahs = ['baqarah', 'baqara', 'imran', 'imrān', 'nisa', 'nisā', 'ma\'idah', 'maidah',
                      'an\'am', 'anam', 'a\'raf', 'araf', 'tawbah', 'tawba'];
  if (longSurahs.some(surah => title.includes(surah))) {
    return 'Long Surahs';
  }
  
  // Medium Surahs (Yunus, Hud, Yusuf, Ibrahim, Hijr, Nahl, Isra, Kahf, Maryam, Taha, Anbiya, Hajj, Muminun, Nur, Furqan, Shu'ara, Naml, Qasas, Ankabut)
  const mediumSurahs = ['yunus', 'hud', 'ibrahim', 'hijr', 'nahl', 'isra', 'taha', 'anbiya', 
                        'hajj', 'muminun', 'nur', 'furqan', 'shu\'ara', 'naml', 'qasas', 'ankabut'];
  if (mediumSurahs.some(surah => title.includes(surah))) {
    return 'Medium Surahs';
  }
  
  // Short Surahs (from Luqman onwards - shorter surahs)
  const shortSurahs = ['luqman', 'sajdah', 'ahzab', 'saba', 'fatir', 'yasin', 'saffat', 'sad',
                       'zumar', 'ghafir', 'fussilat', 'shura', 'zukhruf', 'dukhan', 'jathiyah',
                       'ahqaf', 'muhammad', 'fat-h', 'hujurat', 'qaf', 'dhariyat', 'tur', 'najm',
                       'qamar', 'rahman', 'waqiah', 'hadid', 'mujadila', 'hashr', 'mumtahina',
                       'saff', 'jumu\'ah', 'munafiqun', 'taghabun', 'talaq', 'tahrim', 'mulk'];
  if (shortSurahs.some(surah => title.includes(surah))) {
    return 'Short Surahs';
  }
  
  // Story Surahs (Yusuf, Maryam, Kahf, Anbiya - narrative-focused)
  if (title.includes('story') || title.includes('yusuf') || title.includes('maryam') || 
      (title.includes('kahf') && !title.includes('surah'))) {
    return 'Story Surahs';
  }
  
  // Famous Reciters (check reciter names)
  const famousReciters = ['mishary', 'maher', 'yasser', 'yaser', 'dosari', 'dossary', 'shatri', 
                         'shuraim', 'sudais', 'minshawi', 'hussary', 'husary', 'ajmi', 'qatami',
                         'ghamdi', 'alafasy', 'seferagic', 'abkar', 'idris', 'mansour', 'salimi'];
  if (famousReciters.some(name => reciter.includes(name) || title.includes(name))) {
    return 'Famous Reciters';
  }
  
  // Complete Recitations (full surah, complete, kāmila)
  if (title.includes('complete') || title.includes('full') || title.includes('kāmila') || 
      title.includes('كاملة') || title.includes('entire')) {
    return 'Complete Recitations';
  }
  
  // Special Occasions (Hajj, Arafat, Makkah, Madinah, Live, Taraweeh)
  if (title.includes('hajj') || title.includes('arafat') || title.includes('makkah') || 
      title.includes('madinah') || title.includes('live') || title.includes('masjid')) {
    return 'Special Occasions';
  }
  
  // Default: General Recitations (catch-all for everything else)
  return 'General Recitations';
}

/**
 * Convert duration string to seconds
 */
function parseDuration(durationStr: string | null | undefined): number {
  if (!durationStr) return 0;
  
  const str = durationStr.toString().trim();
  
  // Handle MM:SS or HH:MM:SS format
  if (str.includes(':')) {
    const parts = str.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
  }
  
  // Handle "1h 30m" format
  const lower = str.toLowerCase();
  let seconds = 0;
  
  const hoursMatch = lower.match(/(\d+)\s*h/);
  const minutesMatch = lower.match(/(\d+)\s*m/);
  const plainNumber = /^(\d+)$/.test(lower);
  
  if (hoursMatch) seconds += parseInt(hoursMatch[1]) * 3600;
  if (minutesMatch) seconds += parseInt(minutesMatch[1]) * 60;
  if (plainNumber && !hoursMatch && !minutesMatch) {
    seconds = parseInt(lower);
  }
  
  return seconds;
}

/**
 * Fetch all recitations from Supabase
 * Ensures ALL recitations are fetched and properly categorized
 */
export async function fetchAllRecitations(): Promise<RecitationDisplay[]> {
  try {
    console.log('🎵 [RecitationService] Fetching all recitations...');
    
    // Fetch ALL recitations without any filters to ensure nothing is missed
    const { data, error } = await supabase
      .from('recitations')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [RecitationService] Error fetching recitations:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      
      if (error.code === 'PGRST205') {
        console.error('   ⚠️ Table "recitations" not found. Run migration 008_create_lectures_recitations_tables.sql');
      }
      
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [RecitationService] No recitations found in database');
      console.warn('   Run migration 009_import_lectures_recitations.sql to import data');
      return [];
    }

    console.log(`✅ [RecitationService] Fetched ${data.length} recitations`);

    // Map to display format with smart categorization
    const recitations: RecitationDisplay[] = data.map((recitation: any) => ({
      id: recitation.id || '',
      title: recitation.title || '',
      url: recitation.video_url || '',
      image_url: recitation.thumbnail_url || '',
      category: categorizeRecitation(recitation), // Use smart categorization
      reciter_name: recitation.reciter || '',
      duration: parseDuration(recitation.duration),
      views: 0,
      order_index: recitation.order_index || 0,
      created_at: recitation.created_at || '',
      updated_at: recitation.updated_at || recitation.created_at || '',
    }));

    // Log category distribution
    const categoryCounts: { [key: string]: number } = {};
    recitations.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    console.log('📊 [RecitationService] Category distribution:', categoryCounts);
    
    // Filter out categories with less than 10 videos and reassign to "General Recitations"
    const validCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] >= 10);
    const invalidCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] < 10);
    
    if (invalidCategories.length > 0) {
      console.log(`⚠️ [RecitationService] Merging ${invalidCategories.length} small categories (< 10 videos) into "General Recitations"`);
      console.log(`   Small categories: ${invalidCategories.join(', ')}`);
      
      // Reassign videos from small categories to "General Recitations"
      recitations.forEach(r => {
        if (invalidCategories.includes(r.category)) {
          r.category = 'General Recitations';
        }
      });
      
      // Recalculate counts
      const newCategoryCounts: { [key: string]: number } = {};
      recitations.forEach(r => {
        newCategoryCounts[r.category] = (newCategoryCounts[r.category] || 0) + 1;
      });
      console.log('📊 [RecitationService] Final category distribution:', newCategoryCounts);
    }

    // Verify all videos are categorized
    const uncategorized = recitations.filter(r => !r.category || r.category === 'Uncategorized');
    if (uncategorized.length > 0) {
      console.warn(`⚠️ [RecitationService] Found ${uncategorized.length} uncategorized videos, assigning to "General Recitations"`);
      uncategorized.forEach(r => {
        r.category = 'General Recitations';
      });
    }

    return recitations;
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching recitations:', error);
    return [];
  }
}

/**
 * Fetch recitations by category name (uses smart categorization)
 */
export async function fetchRecitationsByCategory(categoryName: string): Promise<RecitationDisplay[]> {
  try {
    console.log(`🎵 [RecitationService] Fetching recitations for category: ${categoryName}`);
    
    // Fetch all recitations and filter by category
    const allRecitations = await fetchAllRecitations();
    
    // Filter by the requested category
    const filtered = allRecitations.filter(r => r.category === categoryName);
    
    console.log(`✅ [RecitationService] Found ${filtered.length} recitations in category "${categoryName}"`);
    return filtered;
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching recitations by category:', error);
    return [];
  }
}

/**
 * Get unique categories from recitations with readable names
 */
export async function getRecitationCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('recitations')
      .select('category_id');

    if (error) {
      console.error('❌ [RecitationService] Error fetching categories:', error);
      return [];
    }

    // Get unique category IDs and convert to readable names
    const categoryIds = Array.from(
      new Set((data || []).map((item: any) => item.category_id).filter(Boolean))
    );
    
    const categories = categoryIds
      .map(id => getCategoryName(id))
      .filter(Boolean)
      .sort();

    console.log(`✅ [RecitationService] Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching categories:', error);
    return [];
  }
}

/**
 * Search recitations - searches across ALL recitations
 */
export async function searchRecitations(query: string): Promise<RecitationDisplay[]> {
  try {
    console.log(`🔍 [RecitationService] Searching recitations: "${query}"`);
    
    const { data, error } = await supabase
      .from('recitations')
      .select('*')
      .or(`title.ilike.%${query}%,reciter.ilike.%${query}%`)
      .order('order_index', { ascending: true })
      .limit(100); // Increased limit to show more results

    if (error) {
      console.error('❌ [RecitationService] Error searching recitations:', error);
      return [];
    }

    return (data || []).map((recitation: any) => ({
      id: recitation.id || '',
      title: recitation.title || '',
      url: recitation.video_url || '',
      image_url: recitation.thumbnail_url || '',
      category: categorizeRecitation(recitation), // Use smart categorization
      reciter_name: recitation.reciter || '',
      duration: parseDuration(recitation.duration),
      views: 0,
      order_index: recitation.order_index || 0,
      created_at: recitation.created_at || '',
      updated_at: recitation.updated_at || recitation.created_at || '',
    }));
  } catch (error) {
    console.error('❌ [RecitationService] Exception searching recitations:', error);
    return [];
  }
}

/**
 * Increment recitation views (if views column exists)
 */
export async function incrementRecitationViews(recitationId: string): Promise<void> {
  try {
    // Note: views column may not exist in your schema
    // This is a no-op if the column doesn't exist
    await supabase.rpc('increment_views', { table_name: 'recitations', row_id: recitationId });
  } catch (error) {
    // Silently fail - views tracking is optional
    console.debug('Could not increment views:', error);
  }
}
