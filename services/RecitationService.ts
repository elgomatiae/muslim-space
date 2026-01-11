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
 */
export async function fetchAllRecitations(): Promise<RecitationDisplay[]> {
  try {
    console.log('🎵 [RecitationService] Fetching all recitations...');
    
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

    // Map to display format
    const recitations: RecitationDisplay[] = data.map((recitation: any) => ({
      id: recitation.id || '',
      title: recitation.title || '',
      url: recitation.video_url || '',
      image_url: recitation.thumbnail_url || '',
      category: recitation.category_id || '',
      reciter_name: recitation.reciter || '',
      duration: parseDuration(recitation.duration),
      views: 0,
      order_index: recitation.order_index || 0,
      created_at: recitation.created_at || '',
      updated_at: recitation.updated_at || recitation.created_at || '',
    }));

    return recitations;
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching recitations:', error);
    return [];
  }
}

/**
 * Fetch recitations by category
 */
export async function fetchRecitationsByCategory(categoryId: string): Promise<RecitationDisplay[]> {
  try {
    console.log(`🎵 [RecitationService] Fetching recitations for category: ${categoryId}`);
    
    const { data, error } = await supabase
      .from('recitations')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [RecitationService] Error fetching recitations by category:', error);
      return [];
    }

    return (data || []).map((recitation: any) => ({
      id: recitation.id || '',
      title: recitation.title || '',
      url: recitation.video_url || '',
      image_url: recitation.thumbnail_url || '',
      category: recitation.category_id || categoryId,
      reciter_name: recitation.reciter || '',
      duration: parseDuration(recitation.duration),
      views: 0,
      order_index: recitation.order_index || 0,
      created_at: recitation.created_at || '',
      updated_at: recitation.updated_at || recitation.created_at || '',
    }));
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching recitations by category:', error);
    return [];
  }
}

/**
 * Get unique categories from recitations
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

    const categories = Array.from(
      new Set((data || []).map((item: any) => item.category_id).filter(Boolean))
    ).sort() as string[];

    console.log(`✅ [RecitationService] Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('❌ [RecitationService] Exception fetching categories:', error);
    return [];
  }
}

/**
 * Search recitations
 */
export async function searchRecitations(query: string): Promise<RecitationDisplay[]> {
  try {
    console.log(`🔍 [RecitationService] Searching recitations: "${query}"`);
    
    const { data, error } = await supabase
      .from('recitations')
      .select('*')
      .or(`title.ilike.%${query}%,reciter.ilike.%${query}%`)
      .order('order_index', { ascending: true })
      .limit(50);

    if (error) {
      console.error('❌ [RecitationService] Error searching recitations:', error);
      return [];
    }

    return (data || []).map((recitation: any) => ({
      id: recitation.id || '',
      title: recitation.title || '',
      url: recitation.video_url || '',
      image_url: recitation.thumbnail_url || '',
      category: recitation.category_id || '',
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
