/**
 * LectureService - Clean implementation for fetching Islamic lectures
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface Lecture {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  category_id: string;
  speaker?: string;
  duration: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface LectureDisplay {
  id: string;
  title: string;
  url: string;
  video_url: string;
  thumbnail_url?: string;
  image_url?: string;
  category: string;
  category_id: string;
  scholar_name?: string;
  duration: number; // in seconds
  views: number;
  order_index: number;
  created_at?: string;
  updated_at?: string;
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
 * Fetch all lectures from Supabase
 */
export async function fetchAllLectures(): Promise<LectureDisplay[]> {
  try {
    console.log('📚 [LectureService] Fetching all lectures...');
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [LectureService] Error fetching lectures:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      
      if (error.code === 'PGRST205') {
        console.error('   ⚠️ Table "lectures" not found. Run migration 008_create_lectures_recitations_tables.sql');
      }
      
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [LectureService] No lectures found in database');
      console.warn('   Run migration 009_import_lectures_recitations.sql to import data');
      return [];
    }

    console.log(`✅ [LectureService] Fetched ${data.length} lectures`);

    // Map to display format
    const lectures: LectureDisplay[] = data.map((lecture: any) => ({
      id: lecture.id || '',
      title: lecture.title || '',
      url: lecture.video_url || '',
      video_url: lecture.video_url || '',
      thumbnail_url: lecture.thumbnail_url || undefined,
      image_url: lecture.thumbnail_url || undefined,
      category: lecture.category_id || '',
      category_id: lecture.category_id || '',
      scholar_name: lecture.speaker || undefined,
      duration: parseDuration(lecture.duration),
      views: 0,
      order_index: lecture.order_index || 0,
      created_at: lecture.created_at,
      updated_at: lecture.updated_at || lecture.created_at,
    }));

    return lectures;
  } catch (error) {
    console.error('❌ [LectureService] Exception fetching lectures:', error);
    return [];
  }
}

/**
 * Fetch lectures by category
 */
export async function fetchLecturesByCategory(categoryId: string): Promise<LectureDisplay[]> {
  try {
    console.log(`📚 [LectureService] Fetching lectures for category: ${categoryId}`);
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [LectureService] Error fetching lectures by category:', error);
      return [];
    }

    return (data || []).map((lecture: any) => ({
      id: lecture.id || '',
      title: lecture.title || '',
      url: lecture.video_url || '',
      video_url: lecture.video_url || '',
      thumbnail_url: lecture.thumbnail_url || undefined,
      image_url: lecture.thumbnail_url || undefined,
      category: lecture.category_id || categoryId,
      category_id: lecture.category_id || '',
      scholar_name: lecture.speaker || undefined,
      duration: parseDuration(lecture.duration),
      views: 0,
      order_index: lecture.order_index || 0,
      created_at: lecture.created_at,
      updated_at: lecture.updated_at || lecture.created_at,
    }));
  } catch (error) {
    console.error('❌ [LectureService] Exception fetching lectures by category:', error);
    return [];
  }
}

/**
 * Get unique categories from lectures
 */
export async function getLectureCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('lectures')
      .select('category_id');

    if (error) {
      console.error('❌ [LectureService] Error fetching categories:', error);
      return [];
    }

    const categories = Array.from(
      new Set((data || []).map((item: any) => item.category_id).filter(Boolean))
    ).sort() as string[];

    console.log(`✅ [LectureService] Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('❌ [LectureService] Exception fetching categories:', error);
    return [];
  }
}

/**
 * Search lectures
 */
export async function searchLectures(query: string): Promise<LectureDisplay[]> {
  try {
    console.log(`🔍 [LectureService] Searching lectures: "${query}"`);
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .or(`title.ilike.%${query}%,speaker.ilike.%${query}%`)
      .order('order_index', { ascending: true })
      .limit(50);

    if (error) {
      console.error('❌ [LectureService] Error searching lectures:', error);
      return [];
    }

    return (data || []).map((lecture: any) => ({
      id: lecture.id || '',
      title: lecture.title || '',
      url: lecture.video_url || '',
      video_url: lecture.video_url || '',
      thumbnail_url: lecture.thumbnail_url || undefined,
      image_url: lecture.thumbnail_url || undefined,
      category: lecture.category_id || '',
      category_id: lecture.category_id || '',
      scholar_name: lecture.speaker || undefined,
      duration: parseDuration(lecture.duration),
      views: 0,
      order_index: lecture.order_index || 0,
      created_at: lecture.created_at,
      updated_at: lecture.updated_at || lecture.created_at,
    }));
  } catch (error) {
    console.error('❌ [LectureService] Exception searching lectures:', error);
    return [];
  }
}

/**
 * Increment lecture views (if views column exists)
 */
export async function incrementLectureViews(lectureId: string): Promise<void> {
  try {
    // Note: views column may not exist in your schema
    // This is a no-op if the column doesn't exist
    await supabase.rpc('increment_views', { table_name: 'lectures', row_id: lectureId });
  } catch (error) {
    // Silently fail - views tracking is optional
    console.debug('Could not increment views:', error);
  }
}
