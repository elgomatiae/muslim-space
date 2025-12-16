
import { supabase as supabaseClient } from '@/app/integrations/supabase/client';

// Re-export the supabase client
export const supabase = supabaseClient;

// Database types
export interface VideoCategory {
  id: string;
  name: string;
  description: string;
  type: 'lecture' | 'recitation';
  order_index: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  category_id: string;
  duration: number; // in seconds
  scholar_name?: string;
  reciter_name?: string;
  views: number;
  order_index: number;
  created_at: string;
}

// Helper function to extract YouTube video ID from URL
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Helper function to get YouTube thumbnail URL from video URL
export const getYouTubeThumbnailUrl = (videoUrl: string): string => {
  const videoId = extractYouTubeVideoId(videoUrl);
  
  if (videoId) {
    // Use maxresdefault for highest quality, fallback to hqdefault if not available
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  // Return a placeholder or the original thumbnail_url if it's not a YouTube video
  return videoUrl;
};

// Helper function to check if URL is a YouTube video
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to get proper YouTube watch URL
export const getYouTubeWatchUrl = (videoUrl: string): string => {
  const videoId = extractYouTubeVideoId(videoUrl);
  
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  return videoUrl;
};

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  // Check if the supabase client is properly initialized
  try {
    const url = supabaseClient.supabaseUrl;
    const key = supabaseClient.supabaseKey;
    return url !== '' && key !== '' && url !== undefined && key !== undefined;
  } catch (error) {
    console.error('Error checking Supabase configuration:', error);
    return false;
  }
};

// Fetch categories by type
export const fetchCategories = async (type: 'lecture' | 'recitation'): Promise<VideoCategory[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select('*')
      .eq('type', type)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Fetch videos by category
export const fetchVideosByCategory = async (categoryId: string): Promise<Video[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

// Fetch all videos (for search)
export const fetchAllVideos = async (type: 'lecture' | 'recitation'): Promise<Video[]> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!inner(type)')
      .eq('video_categories.type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all videos:', error);
    return [];
  }
};

// Search videos by title, description, or scholar name
export const searchVideos = async (
  query: string,
  type: 'lecture' | 'recitation'
): Promise<Video[]> => {
  if (!isSupabaseConfigured() || !query.trim()) {
    return [];
  }

  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!inner(type)')
      .eq('video_categories.type', type)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},scholar_name.ilike.${searchTerm},reciter_name.ilike.${searchTerm}`)
      .order('views', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};

// Increment video views
export const incrementVideoViews = async (videoId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase.rpc('increment_video_views', { video_id: videoId });

    if (error) {
      console.error('Error incrementing views:', error);
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};
