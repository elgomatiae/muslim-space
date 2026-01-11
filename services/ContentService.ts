
/**
 * ContentService - Centralized service for fetching Islamic content from Supabase
 * Handles: Daily Verses, Daily Hadiths, Lectures, and Recitations
 */

import { supabase } from '@/lib/supabase';
import { contentServiceConfig } from './ContentServiceConfig';

// Get table names from config
const {
  dailyVersesTable,
  dailyHadithsTable,
  userDailyContentTable,
  videoCategoriesTable,
  videosTable,
  dailyVerses: verseCols,
  dailyHadiths: hadithCols,
  userDailyContent: userContentCols,
  videoCategories: categoryCols,
  videos: videoCols,
} = contentServiceConfig;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// DailyVerse and DailyHadith interfaces moved to DailyContentService.ts
// UserDailyContent interface removed - not used

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  image_url?: string;
  video_url: string;
  url?: string;
  category?: string;
  category_id?: string;
  duration?: number;
  scholar_name?: string;
  reciter_name?: string;
  views: number;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Recitation {
  id: string;
  title: string;
  url: string;
  image_url: string;
  category: string;
  description?: string;
  reciter_name?: string;
  duration: number;
  views: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  description?: string;
  type: 'lecture' | 'recitation';
  order_index?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely get a column value with fallback
 */
function getColumnValue<T>(obj: any, configKey: string | undefined, fallbackKey: string): T | undefined {
  if (configKey) {
    return obj[configKey] !== undefined ? obj[configKey] : obj[fallbackKey];
  }
  return obj[fallbackKey];
}

/**
 * Safely get a column value with default
 */
function getColumnValueWithDefault<T>(obj: any, configKey: string | undefined, fallbackKey: string, defaultValue: T): T {
  const value = getColumnValue<T>(obj, configKey, fallbackKey);
  return value !== undefined ? value : defaultValue;
}


// ============================================================================
// DAILY VERSE AND HADITH FUNCTIONS MOVED TO DailyContentService.ts
// ============================================================================
// All daily verse and hadith functionality has been moved to a separate service
// Import from '@/services/DailyContentService' instead

// ============================================================================
// LECTURE FUNCTIONS
// ============================================================================

/**
 * Fetch all lectures from Supabase
 * Your schema: lectures table with category_id as text (no separate categories table)
 */
export async function fetchAllLectures(): Promise<Lecture[]> {
  try {
    console.log('🎓 Fetching all lectures...');
    
    // Your lectures table structure: id, category_id (text), title, speaker, duration (text), video_url, thumbnail_url, order_index
    // Build select columns as comma-separated string
    const selectColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'speaker', // Maps to scholar_name
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Try to fetch from lectures table
    // If this fails with PGRST205, PostgREST can't see the table (RLS or schema cache issue)
    let { data, error } = await (supabase as any)
      .from('lectures') // Your table name
      .select(selectColumns)
      .order('order_index', { ascending: true });

    // If table not found, try alternative: check if table exists via a test query
    if (error && error.code === 'PGRST205') {
      console.error('❌ PostgREST cannot see the "lectures" table');
      console.error('This usually means:');
      console.error('1. RLS is enabled but no policies allow access');
      console.error('2. PostgREST schema cache needs refresh (restart Supabase project)');
      console.error('3. Table permissions are not set correctly');
      console.error('');
      console.error('SOLUTION: Run force_fix_all_tables.sql in Supabase SQL Editor, then RESTART your Supabase project');
      
      // Try to see what tables PostgREST CAN see (for debugging)
      try {
        const { data: testData } = await (supabase as any).from('video_categories').select('*').limit(1);
        console.log('✅ PostgREST CAN see video_categories table');
        console.log('❌ PostgREST CANNOT see lectures table - this is a visibility/permission issue');
      } catch (testError) {
        console.error('Even video_categories test failed:', testError);
      }
      
      return [];
    }

    if (error) {
      console.error('❌ Error fetching lectures:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if it's an RLS/table visibility issue
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.error('⚠️ Table visibility issue - check RLS policies for the "lectures" table');
        console.error('Make sure the anon role has SELECT permission on the lectures table');
        console.error('SOLUTION: Run migration 008_create_lectures_recitations_tables.sql in Supabase SQL Editor');
      }
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No lectures found in database. Make sure to run migration 009_import_lectures_recitations.sql');
      return [];
    }

      // Map the data to Lecture interface
      const lectures: Lecture[] = (data || []).map((lecture: any) => {
        // Convert duration from text to number (in seconds)
        // Handle formats like "1h 30m", "45m", "42:56" (MM:SS), "1:30:50" (HH:MM:SS), "3600" etc.
        let durationSeconds = 0;
        const durationValue = lecture.duration;
        if (durationValue) {
          const durationStr = durationValue.toString().trim();
          
          // Handle MM:SS or HH:MM:SS format (e.g., "42:56", "1:30:50")
          if (durationStr.includes(':')) {
            const parts = durationStr.split(':').map(p => parseInt(p) || 0);
            if (parts.length === 2) {
              // MM:SS format
              durationSeconds = parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
              // HH:MM:SS format
              durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
          } else {
            // Handle "1h 30m", "45m", or plain number formats
            const lowerStr = durationStr.toLowerCase();
            const hoursMatch = lowerStr.match(/(\d+)\s*h/);
            const minutesMatch = lowerStr.match(/(\d+)\s*m/);
            const secondsMatch = lowerStr.match(/^(\d+)$/);
            
            if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
            if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
            if (secondsMatch && !hoursMatch && !minutesMatch) {
              durationSeconds = parseInt(secondsMatch[1]);
            }
          }
        }

        return {
          id: lecture.id || '',
          title: lecture.title || '',
          url: lecture.video_url || '',
          video_url: lecture.video_url || '',
          thumbnail_url: lecture.thumbnail_url || undefined,
          image_url: lecture.thumbnail_url || undefined,
          category: lecture.category_id || '', // category_id contains the category name
          category_id: lecture.category_id || '',
          description: undefined, // Not in your schema
          scholar_name: lecture.speaker || undefined, // Maps from 'speaker'
          duration: durationSeconds,
          views: 0, // Not in your schema - default to 0
          order_index: lecture.order_index || 0,
          created_at: lecture.created_at || undefined,
          updated_at: lecture.updated_at || lecture.created_at || undefined,
        };
      });

    console.log(`✅ Fetched ${lectures.length} lectures`);
    return lectures;
  } catch (error) {
    console.error('❌ Error in fetchAllLectures:', error);
    return [];
  }
}

/**
 * Fetch lectures by category name
 * Your schema: category_id is text stored directly on lectures table
 */
export async function fetchLecturesByCategory(categoryName: string): Promise<Lecture[]> {
  try {
    console.log(`🎓 Fetching lectures for category: ${categoryName}...`);
    
    const selectColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'speaker', // Use speaker from your schema
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Filter directly by category_id (which is text in your schema)
    const { data, error } = await (supabase as any)
      .from('lectures')
      .select(selectColumns)
      .eq('category_id', categoryName) // category_id is text, so direct match
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching lectures by category:', error);
      return [];
    }

    // Map the data to Lecture interface (same as fetchAllLectures)
    const lectures: Lecture[] = (data || []).map((lecture: any) => {
      let durationSeconds = 0;
      const durationValue = lecture.duration || getColumnValue(lecture, videoCols.duration, 'duration');
      if (durationValue) {
        const durationStr = durationValue.toString().trim();
        
        // Handle MM:SS or HH:MM:SS format
        if (durationStr.includes(':')) {
          const parts = durationStr.split(':').map(p => parseInt(p) || 0);
          if (parts.length === 2) {
            durationSeconds = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        } else {
          const lowerStr = durationStr.toLowerCase();
          const hoursMatch = lowerStr.match(/(\d+)\s*h/);
          const minutesMatch = lowerStr.match(/(\d+)\s*m/);
          const secondsMatch = lowerStr.match(/^(\d+)$/);
          
          if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
          if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
          if (secondsMatch && !hoursMatch && !minutesMatch) {
            durationSeconds = parseInt(secondsMatch[1]);
          }
        }
      }

        return {
          id: lecture.id || '',
          title: lecture.title || '',
          url: lecture.video_url || '',
          video_url: lecture.video_url || '',
          thumbnail_url: lecture.thumbnail_url || undefined,
          image_url: lecture.thumbnail_url || undefined,
          category: lecture.category_id || categoryName,
          category_id: lecture.category_id || '',
          description: undefined,
          scholar_name: lecture.speaker || undefined, // Use speaker directly
          duration: durationSeconds,
          views: 0,
          order_index: lecture.order_index || 0,
          created_at: lecture.created_at || undefined,
          updated_at: lecture.updated_at || lecture.created_at || undefined,
        };
    });

    console.log(`✅ Fetched ${lectures.length} lectures for category: ${categoryName}`);
    return lectures;
  } catch (error) {
    console.error('❌ Error in fetchLecturesByCategory:', error);
    return [];
  }
}

/**
 * Get lecture categories
 * Your schema: Get unique category_id values from lectures table (category_id is text)
 */
export async function getLectureCategories(): Promise<string[]> {
  try {
    // Get all lectures and extract unique category_id values
    const { data, error } = await (supabase as any)
      .from('lectures')
      .select('category_id');

    if (error) {
      console.error('❌ Error fetching lecture categories:', error);
      return [];
    }

    // Get unique category_id values and sort them
    const uniqueCategories = Array.from(
      new Set(data?.map((item: any) => item.category_id).filter(Boolean))
    ).sort() as string[];

    console.log(`✅ Found ${uniqueCategories.length} lecture categories`);
    return uniqueCategories;
  } catch (error) {
    console.error('❌ Error in getLectureCategories:', error);
    return [];
  }
}

/**
 * Search lectures by query
 * Your schema: Search directly in lectures table
 */
export async function searchLectures(query: string): Promise<Lecture[]> {
  try {
    console.log(`🔍 Searching lectures: "${query}"...`);
    
    const lectureSearchColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'speaker',
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Search directly in lectures table
    // Your schema: title, speaker (not scholar_name or description)
    const { data, error } = await (supabase as any)
      .from('lectures')
      .select(lectureSearchColumns)
      .or(`title.ilike.%${query}%,speaker.ilike.%${query}%`) // Search in title and speaker
      .order('order_index', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ Error searching lectures:', error);
      return [];
    }

    // Map the data to Lecture interface (same mapping logic as fetchAllLectures)
    const lectures: Lecture[] = (data || []).map((lecture: any) => {
      let durationSeconds = 0;
      const durationValue = lecture.duration;
      if (durationValue) {
        const durationStr = durationValue.toString().trim();
        
        // Handle MM:SS or HH:MM:SS format
        if (durationStr.includes(':')) {
          const parts = durationStr.split(':').map(p => parseInt(p) || 0);
          if (parts.length === 2) {
            durationSeconds = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        } else {
          const lowerStr = durationStr.toLowerCase();
          const hoursMatch = lowerStr.match(/(\d+)\s*h/);
          const minutesMatch = lowerStr.match(/(\d+)\s*m/);
          const secondsMatch = lowerStr.match(/^(\d+)$/);
          
          if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
          if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
          if (secondsMatch && !hoursMatch && !minutesMatch) {
            durationSeconds = parseInt(secondsMatch[1]);
          }
        }
      }

      return {
        id: lecture.id || '',
        title: lecture.title || '',
        url: lecture.video_url || '',
        video_url: lecture.video_url || '',
        thumbnail_url: lecture.thumbnail_url || undefined,
        image_url: lecture.thumbnail_url || undefined,
        category: lecture.category_id || '',
        category_id: lecture.category_id || '',
        description: undefined,
        scholar_name: lecture.speaker || undefined, // Use speaker directly
        duration: durationSeconds,
        views: 0,
        order_index: lecture.order_index || 0,
        created_at: lecture.created_at || undefined,
        updated_at: lecture.updated_at || lecture.created_at || undefined,
      };
    });

    console.log(`✅ Found ${lectures.length} lectures matching "${query}"`);
    return lectures;
  } catch (error) {
    console.error('❌ Error in searchLectures:', error);
    return [];
  }
}

/**
 * Increment lecture views
 * Note: views column doesn't exist in your lectures table - this will be a no-op
 * If you want to track views, add a views column to your lectures table
 */
export async function incrementLectureViews(lectureId: string): Promise<void> {
  try {
    // Your schema doesn't have a views column, so we skip incrementing
    // If you want to track views, add: ALTER TABLE lectures ADD COLUMN views INTEGER DEFAULT 0;
    console.log(`📊 View increment requested for lecture: ${lectureId} (views tracking not available in current schema)`);
  } catch (error) {
    console.error('❌ Error incrementing lecture views:', error);
  }
}

// ============================================================================
// RECITATION FUNCTIONS
// ============================================================================

/**
 * Fetch all recitations from Supabase
 * Your schema: recitations table with category_id as text
 */
export async function fetchAllRecitations(): Promise<Recitation[]> {
  try {
    console.log('🎵 Fetching all recitations...');
    
    // Your recitations table structure: id, category_id (text), title, reciter, duration (text), video_url, thumbnail_url, order_index
    const selectColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'reciter', // Maps to reciter_name
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Fetch directly from recitations table
    const { data, error } = await (supabase as any)
      .from('recitations') // Your table name
      .select(selectColumns)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching recitations:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if it's an RLS/table visibility issue
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.error('⚠️ Table visibility issue - check RLS policies for the "recitations" table');
        console.error('Make sure the anon role has SELECT permission on the recitations table');
        console.error('SOLUTION: Run migration 008_create_lectures_recitations_tables.sql in Supabase SQL Editor');
      }
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No recitations found in database. Make sure to run migration 009_import_lectures_recitations.sql');
      return [];
    }

      // Map to Recitation interface
      const recitations: Recitation[] = (data || []).map((recitation: any) => {
        // Convert duration from text to number (in seconds)
        // Handle formats like "1h 30m", "45m", "13:20" (MM:SS), "1:30:50" (HH:MM:SS), "3600" etc.
        let durationSeconds = 0;
        const durationValue = recitation.duration;
        if (durationValue) {
          const durationStr = durationValue.toString().trim();
          
          // Handle MM:SS or HH:MM:SS format (e.g., "13:20", "1:30:50")
          if (durationStr.includes(':')) {
            const parts = durationStr.split(':').map(p => parseInt(p) || 0);
            if (parts.length === 2) {
              // MM:SS format
              durationSeconds = parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
              // HH:MM:SS format
              durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
          } else {
            // Handle "1h 30m", "45m", or plain number formats
            const lowerStr = durationStr.toLowerCase();
            const hoursMatch = lowerStr.match(/(\d+)\s*h/);
            const minutesMatch = lowerStr.match(/(\d+)\s*m/);
            const secondsMatch = lowerStr.match(/^(\d+)$/);
            
            if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
            if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
            if (secondsMatch && !hoursMatch && !minutesMatch) {
              durationSeconds = parseInt(secondsMatch[1]);
            }
          }
        }

        return {
          id: recitation.id || '',
          title: recitation.title || '',
          url: recitation.video_url || '',
          image_url: recitation.thumbnail_url || '',
          category: recitation.category_id || '', // category_id contains the category name
          description: undefined, // Not in your schema
          reciter_name: recitation.reciter || '', // Maps from 'reciter'
          duration: durationSeconds,
          views: 0, // Not in your schema - default to 0
          order_index: recitation.order_index || 0,
          created_at: recitation.created_at || '',
          updated_at: recitation.updated_at || recitation.created_at || '',
        };
      });

    console.log(`✅ Fetched ${recitations.length} recitations`);
    return recitations;
  } catch (error) {
    console.error('❌ Error in fetchAllRecitations:', error);
    return [];
  }
}

/**
 * Fetch recitations by category name
 * Your schema: category_id is text stored directly on recitations table
 */
export async function fetchRecitationsByCategory(categoryName: string): Promise<Recitation[]> {
  try {
    console.log(`🎵 Fetching recitations for category: ${categoryName}...`);
    
    const selectColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'reciter',
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Filter directly by category_id (which is text in your schema)
    const { data, error } = await (supabase as any)
      .from('recitations')
      .select(selectColumns)
      .eq('category_id', categoryName) // category_id is text, so direct match
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching recitations by category:', error);
      return [];
    }

    // Map to Recitation interface (same as fetchAllRecitations)
    const recitations: Recitation[] = (data || []).map((recitation: any) => {
      let durationSeconds = 0;
      const durationValue = recitation.duration || getColumnValue(recitation, videoCols.duration, 'duration');
      if (durationValue) {
        const durationStr = durationValue.toString().trim();
        
        // Handle MM:SS or HH:MM:SS format
        if (durationStr.includes(':')) {
          const parts = durationStr.split(':').map(p => parseInt(p) || 0);
          if (parts.length === 2) {
            durationSeconds = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        } else {
          const lowerStr = durationStr.toLowerCase();
          const hoursMatch = lowerStr.match(/(\d+)\s*h/);
          const minutesMatch = lowerStr.match(/(\d+)\s*m/);
          const secondsMatch = lowerStr.match(/^(\d+)$/);
          
          if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
          if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
          if (secondsMatch && !hoursMatch && !minutesMatch) {
            durationSeconds = parseInt(secondsMatch[1]);
          }
        }
      }

      return {
        id: recitation.id || '',
        title: recitation.title || '',
        url: recitation.video_url || '',
        image_url: recitation.thumbnail_url || '',
        category: recitation.category_id || categoryName,
        description: undefined,
        reciter_name: recitation.reciter || '', // Use reciter directly
        duration: durationSeconds,
        views: 0,
        order_index: recitation.order_index || 0,
        created_at: recitation.created_at || '',
        updated_at: recitation.updated_at || recitation.created_at || '',
      };
    });

    console.log(`✅ Fetched ${recitations.length} recitations for category: ${categoryName}`);
    return recitations;
  } catch (error) {
    console.error('❌ Error in fetchRecitationsByCategory:', error);
    return [];
  }
}

/**
 * Get recitation categories
 * Your schema: Get unique category_id values from recitations table (category_id is text)
 */
export async function getRecitationCategories(): Promise<string[]> {
  try {
    // Get all recitations and extract unique category_id values
    const { data, error } = await (supabase as any)
      .from('recitations')
      .select('category_id');

    if (error) {
      console.error('❌ Error fetching recitation categories:', error);
      return [];
    }

    // Get unique category_id values and sort them
    const uniqueCategories = Array.from(
      new Set(data?.map((item: any) => item.category_id).filter(Boolean))
    ).sort() as string[];

    console.log(`✅ Found ${uniqueCategories.length} recitation categories`);
    return uniqueCategories;
  } catch (error) {
    console.error('❌ Error in getRecitationCategories:', error);
    return [];
  }
}

/**
 * Search recitations by query
 * Your schema: Search directly in recitations table
 */
export async function searchRecitations(query: string): Promise<Recitation[]> {
  try {
    console.log(`🔍 Searching recitations: "${query}"...`);
    
    const selectColumns = [
      'id',
      'title',
      'video_url',
      'thumbnail_url',
      'category_id',
      'duration',
      'reciter',
      'order_index',
      'created_at',
      'updated_at',
    ].join(', ');

    // Search directly in recitations table
    // Your schema: title, reciter (not reciter_name)
    const { data, error } = await (supabase as any)
      .from('recitations')
      .select(selectColumns)
      .or(`title.ilike.%${query}%,reciter.ilike.%${query}%`) // Search in title and reciter
      .order('order_index', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ Error searching recitations:', error);
      return [];
    }

    // Map to Recitation interface (same mapping logic as fetchAllRecitations)
    const recitations: Recitation[] = (data || []).map((recitation: any) => {
      let durationSeconds = 0;
      const durationValue = recitation.duration;
      if (durationValue) {
        const durationStr = durationValue.toString().trim();
        
        // Handle MM:SS or HH:MM:SS format
        if (durationStr.includes(':')) {
          const parts = durationStr.split(':').map(p => parseInt(p) || 0);
          if (parts.length === 2) {
            durationSeconds = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        } else {
          const lowerStr = durationStr.toLowerCase();
          const hoursMatch = lowerStr.match(/(\d+)\s*h/);
          const minutesMatch = lowerStr.match(/(\d+)\s*m/);
          const secondsMatch = lowerStr.match(/^(\d+)$/);
          
          if (hoursMatch) durationSeconds += parseInt(hoursMatch[1]) * 3600;
          if (minutesMatch) durationSeconds += parseInt(minutesMatch[1]) * 60;
          if (secondsMatch && !hoursMatch && !minutesMatch) {
            durationSeconds = parseInt(secondsMatch[1]);
          }
        }
      }

      return {
        id: recitation.id || '',
        title: recitation.title || '',
        url: recitation.video_url || '',
        image_url: recitation.thumbnail_url || '',
        category: recitation.category_id || '',
        description: undefined,
        reciter_name: recitation.reciter || '', // Use reciter directly
        duration: durationSeconds,
        views: 0,
        order_index: recitation.order_index || 0,
        created_at: recitation.created_at || '',
        updated_at: recitation.updated_at || recitation.created_at || '',
      };
    });

    console.log(`✅ Found ${recitations.length} recitations matching "${query}"`);
    return recitations;
  } catch (error) {
    console.error('❌ Error in searchRecitations:', error);
    return [];
  }
}

/**
 * Increment recitation views
 * Note: views column doesn't exist in your recitations table - this will be a no-op
 * If you want to track views, add a views column to your recitations table
 */
export async function incrementRecitationViews(recitationId: string): Promise<void> {
  try {
    // Your schema doesn't have a views column, so we skip incrementing
    // If you want to track views, add: ALTER TABLE recitations ADD COLUMN views INTEGER DEFAULT 0;
    console.log(`📊 View increment requested for recitation: ${recitationId} (views tracking not available in current schema)`);
  } catch (error) {
    console.error('❌ Error incrementing recitation views:', error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    // Check if Supabase client is initialized by trying a simple query
    // If it fails, Supabase is not configured
    return typeof supabase !== 'undefined' && supabase !== null;
  } catch {
    return false;
  }
}

/**
 * Test Supabase connection and verify we're connected to the right instance
 * Use this for debugging
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  url?: string;
  error?: string;
  tables?: string[];
  expectedUrl?: string;
}> {
  try {
    // Try to get the Supabase URL from the client
    const url = (supabase as any).supabaseUrl || 'Unknown';
    const expectedUrl = 'https://teemloiwfnwrogwnoxsa.supabase.co';
    
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Supabase URL:', url);
    console.log('📍 Expected URL:', expectedUrl);
    
    // Verify we're connecting to the correct instance
    if (!url.includes('teemloiwfnwrogwnoxsa')) {
      console.warn('⚠️ WARNING: Supabase URL does not match expected instance!');
      console.warn('   Current:', url);
      console.warn('   Expected:', expectedUrl);
    } else {
      console.log('✅ Supabase URL matches expected instance');
    }
    
    // Test connection by querying a system table or doing a simple query
    // Try to query quran_verses to see if we can connect
    const { data, error } = await (supabase as any)
      .from('quran_verses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide helpful error messages
      if (error.code === 'PGRST205') {
        console.error('💡 This is an RLS/table visibility issue. Run fix_rls_policies.sql in Supabase SQL Editor.');
      }
      
      return {
        connected: false,
        url: url,
        expectedUrl: expectedUrl,
        error: error.message || JSON.stringify(error),
      };
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Can query quran_verses table');
    return {
      connected: true,
      url: url,
      expectedUrl: expectedUrl,
    };
  } catch (err: any) {
    console.error('❌ Connection test exception:', err);
    return {
      connected: false,
      error: err.message || String(err),
    };
  }
}

/**
 * Test if we can access quran_verses and hadiths tables
 * Use this for debugging
 */
export async function testTableAccess(): Promise<{
  quran_verses: { accessible: boolean; count?: number; error?: string };
  hadiths: { accessible: boolean; count?: number; error?: string };
}> {
  const result = {
    quran_verses: { accessible: false } as any,
    hadiths: { accessible: false } as any,
  };

  // Test quran_verses
  try {
    const { data, error, count } = await (supabase as any)
      .from('quran_verses')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      result.quran_verses.error = error.message || JSON.stringify(error);
      console.error('❌ quran_verses test failed:', error);
    } else {
      result.quran_verses.accessible = true;
      result.quran_verses.count = count || data?.length || 0;
      console.log('✅ quran_verses is accessible, count:', result.quran_verses.count);
    }
  } catch (err: any) {
    result.quran_verses.error = err.message || String(err);
    console.error('❌ quran_verses test exception:', err);
  }

  // Test hadiths
  try {
    const { data, error, count } = await (supabase as any)
      .from('hadiths')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      result.hadiths.error = error.message || JSON.stringify(error);
      console.error('❌ hadiths test failed:', error);
    } else {
      result.hadiths.accessible = true;
      result.hadiths.count = count || data?.length || 0;
      console.log('✅ hadiths is accessible, count:', result.hadiths.count);
    }
  } catch (err: any) {
    result.hadiths.error = err.message || String(err);
    console.error('❌ hadiths test exception:', err);
  }

  return result;
}

/**
 * Helper function to check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

/**
 * Convert any YouTube URL format to watch URL
 */
export function getYouTubeWatchUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // If it's already a watch URL, return as is
    if (urlObj.pathname.includes('/watch')) {
      return url;
    }

    // If it's a youtu.be short URL
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // If it's an embed URL
    if (urlObj.pathname.includes('/embed/')) {
      const videoId = urlObj.pathname.split('/embed/')[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Get YouTube thumbnail URL from video URL
 */
export function getYouTubeThumbnailUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let videoId = '';

    // Extract video ID from different YouTube URL formats
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.pathname.includes('/watch')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.pathname.includes('/embed/')) {
      videoId = urlObj.pathname.split('/embed/')[1];
    }

    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return '';
  } catch {
    return '';
  }
}
