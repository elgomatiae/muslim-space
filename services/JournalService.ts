/**
 * JournalService - Service for managing journal entries
 */

import { supabase } from '@/app/integrations/supabase/client';

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags?: string[];
  mood?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all journal entries for a user
 */
export async function fetchJournalEntries(userId: string): Promise<JournalEntry[]> {
  try {
    console.log('📔 [JournalService] Fetching journal entries for user:', userId);
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [JournalService] Error fetching entries:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      
      if (error.code === 'PGRST205') {
        console.error('   ⚠️ Table "journal_entries" not found. Create the table first.');
      }
      
      return [];
    }

    console.log(`✅ [JournalService] Fetched ${data?.length || 0} journal entries`);
    return data || [];
  } catch (error) {
    console.error('❌ [JournalService] Exception fetching entries:', error);
    return [];
  }
}

/**
 * Save a new journal entry
 */
export async function saveJournalEntry(
  userId: string,
  title: string,
  content: string,
  tags?: string[],
  mood?: string
): Promise<JournalEntry | null> {
  try {
    console.log('💾 [JournalService] Saving journal entry...');
    
    if (!content.trim()) {
      throw new Error('Journal entry content cannot be empty');
    }

    const entryData = {
      user_id: userId,
      title: title.trim() || 'Untitled Entry',
      content: content.trim(),
      tags: tags || [],
      mood: mood || null,
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      console.error('❌ [JournalService] Error saving entry:', error);
      console.error('   This entry was NOT saved to your profile');
      throw error;
    }

    console.log('✅ [JournalService] Journal entry saved successfully to user profile');
    console.log('   Entry ID:', data.id);
    console.log('   User ID:', data.user_id);
    console.log('   This entry will be accessible on all your devices');
    return data;
  } catch (error) {
    console.error('❌ [JournalService] Exception saving entry:', error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  entryId: string,
  title: string,
  content: string,
  tags?: string[],
  mood?: string
): Promise<JournalEntry | null> {
  try {
    console.log('✏️ [JournalService] Updating journal entry:', entryId);
    
    if (!content.trim()) {
      throw new Error('Journal entry content cannot be empty');
    }

    const updateData = {
      title: title.trim() || 'Untitled Entry',
      content: content.trim(),
      tags: tags || [],
      mood: mood || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('❌ [JournalService] Error updating entry:', error);
      throw error;
    }

    console.log('✅ [JournalService] Journal entry updated successfully');
    return data;
  } catch (error) {
    console.error('❌ [JournalService] Exception updating entry:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(entryId: string): Promise<boolean> {
  try {
    console.log('🗑️ [JournalService] Deleting journal entry:', entryId);
    
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('❌ [JournalService] Error deleting entry:', error);
      throw error;
    }

    console.log('✅ [JournalService] Journal entry deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ [JournalService] Exception deleting entry:', error);
    throw error;
  }
}

/**
 * Search journal entries
 */
export async function searchJournalEntries(
  userId: string,
  query: string
): Promise<JournalEntry[]> {
  try {
    console.log(`🔍 [JournalService] Searching journal entries: "${query}"`);
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [JournalService] Error searching entries:', error);
      return [];
    }

    console.log(`✅ [JournalService] Found ${data?.length || 0} matching entries`);
    return data || [];
  } catch (error) {
    console.error('❌ [JournalService] Exception searching entries:', error);
    return [];
  }
}

/**
 * Get journal entries by tag
 */
export async function getJournalEntriesByTag(
  userId: string,
  tag: string
): Promise<JournalEntry[]> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [JournalService] Error fetching entries by tag:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ [JournalService] Exception fetching entries by tag:', error);
    return [];
  }
}
