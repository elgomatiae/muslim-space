
import { supabase } from '@/lib/integrations/supabase/client';

// Re-export the supabase client for convenience
export { supabase };

export interface Video {
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
}

export interface VideoCategory {
  id: string;
  name: string;
  description?: string;
  type: string;
  order_index?: number;
}

export interface Lecture {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  image_url?: string;
  category?: string;
  description?: string;
  scholar_name?: string;
  duration?: number;
  views?: number;
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

export function isSupabaseConfigured(): boolean {
  try {
    const url = supabase.supabaseUrl;
    const key = supabase.supabaseKey;
    return !!(url && key && url !== 'YOUR_SUPABASE_URL' && key !== 'YOUR_SUPABASE_ANON_KEY');
  } catch {
    return false;
  }
}

export async function fetchLectures(): Promise<Lecture[]> {
  try {
    // First, get the lecture category IDs
    const { data: categories, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'lecture');

    if (catError) {
      console.error('Error fetching lecture categories:', catError);
      return [];
    }

    if (!categories || categories.length === 0) {
      console.log('No lecture categories found');
      return [];
    }

    const categoryIds = categories.map(cat => cat.id);

    // Fetch videos from those categories
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .in('category_id', categoryIds)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lectures:', error);
      return [];
    }

    // Map the data to Lecture interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      image_url: video.thumbnail_url,
      category: video.video_categories?.name || '',
      description: video.description || '',
      scholar_name: video.scholar_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return [];
  }
}

export async function fetchLecturesByCategory(category: string): Promise<Lecture[]> {
  try {
    // Find the category ID by name
    const { data: categoryData, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'lecture')
      .eq('name', category)
      .single();

    if (catError || !categoryData) {
      console.error('Error fetching lecture category:', catError);
      return [];
    }

    // Fetch videos from that category
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .eq('category_id', categoryData.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lectures by category:', error);
      return [];
    }

    // Map the data to Lecture interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      image_url: video.thumbnail_url,
      category: video.video_categories?.name || category,
      description: video.description || '',
      scholar_name: video.scholar_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error fetching lectures by category:', error);
    return [];
  }
}

export async function fetchRecitations(): Promise<Recitation[]> {
  try {
    // First, get the recitation category IDs
    const { data: categories, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'recitation');

    if (catError) {
      console.error('Error fetching recitation categories:', catError);
      return [];
    }

    if (!categories || categories.length === 0) {
      console.log('No recitation categories found');
      return [];
    }

    const categoryIds = categories.map(cat => cat.id);

    // Fetch videos from those categories
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .in('category_id', categoryIds)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching recitations:', error);
      return [];
    }

    // Map to Recitation interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      image_url: video.thumbnail_url || '',
      category: video.video_categories?.name || '',
      description: video.description || '',
      reciter_name: video.reciter_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error fetching recitations:', error);
    return [];
  }
}

export async function fetchRecitationsByCategory(categoryName: string): Promise<Recitation[]> {
  try {
    // Find the category ID by name
    const { data: categoryData, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'recitation')
      .eq('name', categoryName)
      .single();

    if (catError || !categoryData) {
      console.error('Error fetching recitation category:', catError);
      return [];
    }

    // Fetch videos from that category
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .eq('category_id', categoryData.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching recitations by category:', error);
      return [];
    }

    // Map to Recitation interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      image_url: video.thumbnail_url || '',
      category: video.video_categories?.name || categoryName,
      description: video.description || '',
      reciter_name: video.reciter_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error fetching recitations by category:', error);
    return [];
  }
}

export async function getLectureCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select('name')
      .eq('type', 'lecture')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lecture categories:', error);
      return [];
    }

    // Get unique categories and filter out null/undefined
    const categories = data.map(item => item.name).filter(Boolean);
    return categories;
  } catch (error) {
    console.error('Error fetching lecture categories:', error);
    return [];
  }
}

export async function getRecitationCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('video_categories')
      .select('name')
      .eq('type', 'recitation')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching recitation categories:', error);
      return [];
    }

    // Get unique categories and filter out null/undefined
    const categories = data.map(item => item.name).filter(Boolean);
    return categories;
  } catch (error) {
    console.error('Error fetching recitation categories:', error);
    return [];
  }
}

export async function searchLectures(query: string): Promise<Lecture[]> {
  try {
    // First, get the lecture category IDs
    const { data: categories, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'lecture');

    if (catError || !categories || categories.length === 0) {
      console.error('Error fetching lecture categories:', catError);
      return [];
    }

    const categoryIds = categories.map(cat => cat.id);

    // Search videos in those categories
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .in('category_id', categoryIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,scholar_name.ilike.%${query}%`)
      .order('views', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching lectures:', error);
      return [];
    }

    // Map the data to Lecture interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      image_url: video.thumbnail_url,
      category: video.video_categories?.name || '',
      description: video.description || '',
      scholar_name: video.scholar_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error searching lectures:', error);
    return [];
  }
}

export async function searchRecitations(query: string): Promise<Recitation[]> {
  try {
    // First, get the recitation category IDs
    const { data: categories, error: catError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', 'recitation');

    if (catError || !categories || categories.length === 0) {
      console.error('Error fetching recitation categories:', catError);
      return [];
    }

    const categoryIds = categories.map(cat => cat.id);

    // Search videos in those categories
    const { data, error } = await supabase
      .from('videos')
      .select('*, video_categories!videos_category_id_fkey(name)')
      .in('category_id', categoryIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,reciter_name.ilike.%${query}%`)
      .order('views', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching recitations:', error);
      return [];
    }

    // Map to Recitation interface
    return (data || []).map(video => ({
      id: video.id,
      title: video.title,
      url: video.video_url,
      image_url: video.thumbnail_url || '',
      category: video.video_categories?.name || '',
      description: video.description || '',
      reciter_name: video.reciter_name || '',
      duration: video.duration || 0,
      views: video.views || 0,
      order_index: video.order_index || 0,
      created_at: video.created_at || '',
      updated_at: video.created_at || '',
    }));
  } catch (error) {
    console.error('Error searching recitations:', error);
    return [];
  }
}

export async function incrementLectureViews(id: string): Promise<void> {
  try {
    // Get current views
    const { data: video } = await supabase
      .from('videos')
      .select('views')
      .eq('id', id)
      .single();
    
    if (video) {
      await supabase
        .from('videos')
        .update({ views: video.views + 1 })
        .eq('id', id);
    }
  } catch (error) {
    console.error('Error incrementing lecture views:', error);
  }
}

export async function incrementRecitationViews(id: string): Promise<void> {
  try {
    // Get current views
    const { data: video } = await supabase
      .from('videos')
      .select('views')
      .eq('id', id)
      .single();

    if (video) {
      await supabase
        .from('videos')
        .update({ views: video.views + 1 })
        .eq('id', id);
    }
  } catch (error) {
    console.error('Error incrementing recitation views:', error);
  }
}

// Legacy functions for backward compatibility with old video_categories system
export async function fetchCategories(type: 'lecture' | 'recitation'): Promise<VideoCategory[]> {
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
}

export async function fetchVideosByCategory(categoryId: string): Promise<Video[]> {
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
}

export async function searchVideos(query: string, type: 'lecture' | 'recitation'): Promise<Video[]> {
  try {
    const { data: categories } = await supabase
      .from('video_categories')
      .select('id')
      .eq('type', type);

    if (!categories || categories.length === 0) {
      return [];
    }

    const categoryIds = categories.map(cat => cat.id);

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .in('category_id', categoryIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,scholar_name.ilike.%${query}%,reciter_name.ilike.%${query}%`)
      .order('views', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching videos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
}

export async function incrementVideoViews(id: string): Promise<void> {
  try {
    const { data: video } = await supabase
      .from('videos')
      .select('views')
      .eq('id', id)
      .single();

    if (video) {
      await supabase
        .from('videos')
        .update({ views: video.views + 1 })
        .eq('id', id);
    }
  } catch (error) {
    console.error('Error incrementing video views:', error);
  }
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

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
