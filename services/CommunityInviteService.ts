/**
 * CommunityInviteService - Supabase-based invite system for communities
 * Handles looking up users by full_name/email and sending/receiving invites
 * 
 * Uses the actual Supabase instance: https://teemloiwfnwrogwnoxsa.supabase.co
 * Tables: profiles, community_invites
 */

import { supabase } from '@/lib/supabase';

// Verify Supabase client is initialized
if (!supabase) {
  console.error('❌ CRITICAL: Supabase client is not initialized!');
  throw new Error('Supabase client not initialized');
}

export interface CommunityInvite {
  id: string;
  community_id: string;
  community_name: string;
  invited_by_user_id: string;
  invited_by_username: string;
  invited_user_id: string;
  invited_username: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at?: string;
}

export interface UserProfile {
  id: string; // This IS the user_id (references auth.users.id)
  email?: string;
  full_name?: string; // Your schema uses full_name, not username
  avatar_url?: string;
}

/**
 * Get all profiles (for debugging/diagnostics and invite suggestions)
 */
export async function getAllUsernames(): Promise<Array<{id: string, name: string, email?: string}>> {
  try {
    console.log('🔍 Fetching all profiles...');
    
    // Query actual Supabase profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST205') {
        console.error('⚠️ RLS issue - run fix_user_profiles_rls.sql');
      }
      return [];
    }

    const profiles = (data || []).map((row: any) => ({
      id: row.id,
      name: row.full_name || row.email?.split('@')[0] || 'User',
      email: row.email,
    }));
    
    console.log(`✅ Found ${profiles.length} profiles`);
    return profiles;
  } catch (error) {
    console.error('❌ Error in getAllUsernames:', error);
    return [];
  }
}

/**
 * Find user by full_name or email in Supabase
 * Allows inviting anyone with a profile
 */
export async function findUserByUsername(usernameOrEmail: string): Promise<UserProfile | null> {
  try {
    const searchTerm = usernameOrEmail.trim().toLowerCase();
    console.log(`🔍 Looking up user by full_name or email: "${searchTerm}"`);
    
    // Query actual Supabase profiles table
    // Search by full_name OR email (case-insensitive)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('❌ Error searching for user:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If it's an RLS or table access error
      if (error.code === 'PGRST205' || error.message?.includes('permission denied')) {
        console.error('⚠️ RLS issue - profiles table may not allow SELECT for all users');
        console.error('SOLUTION: Run fix_user_profiles_rls.sql to allow viewing all profiles');
      }
      return null;
    }

    if (data && (Array.isArray(data) ? data.length > 0 : true)) {
      // Handle both array and single result
      const results = Array.isArray(data) ? data : [data];
      
      // Find best match: exact match on full_name first, then email, then first result
      const exactNameMatch = results.find((u: any) => 
        u.full_name?.toLowerCase().trim() === searchTerm
      );
      
      const exactEmailMatch = results.find((u: any) => 
        u.email?.toLowerCase().trim() === searchTerm
      );
      
      // Try partial match on name (contains)
      const partialNameMatch = !exactNameMatch && !exactEmailMatch
        ? results.find((u: any) => 
            u.full_name?.toLowerCase().includes(searchTerm)
          )
        : null;
      
      const match = exactNameMatch || exactEmailMatch || partialNameMatch || results[0];
      
      if (match && match.id) {
        console.log(`✅ Found user: ${match.full_name || match.email} (${match.id})`);
        return {
          id: match.id,
          email: match.email,
          full_name: match.full_name || match.email?.split('@')[0] || 'User',
          avatar_url: match.avatar_url,
        };
      }
    }

    // No match found - check if table is accessible for debugging
    console.log('🔍 No match found. Checking if profiles table is accessible...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(10);

    if (testError) {
      console.error('❌ Cannot access profiles table:', testError);
      console.error('This is an RLS (Row Level Security) issue.');
      console.error('SOLUTION: Run fix_user_profiles_rls.sql in Supabase SQL Editor');
    } else {
      const profiles = Array.isArray(testData) ? testData : [testData].filter(Boolean);
      console.log(`ℹ️ Table is accessible. Found ${profiles.length} profiles:`);
      profiles.forEach((p: any) => {
        console.log(`  - ${p.full_name || p.email || 'No name'} (${p.id})`);
      });
      console.log(`⚠️ User "${usernameOrEmail}" not found in database`);
    }

    return null;
  } catch (error) {
    console.error('❌ Error in findUserByUsername:', error);
    return null;
  }
}

/**
 * Create a community invite in Supabase
 */
export async function createCommunityInvite(
  communityId: string,
  communityName: string,
  invitedByUserId: string,
  invitedByFullName: string,
  invitedUserId: string,
  invitedFullName: string
): Promise<CommunityInvite> {
  try {
    console.log(`📧 Creating invite for ${invitedFullName} to join ${communityName}...`);
    
    // Check if invite already exists in Supabase
    const { data: existingInvite } = await supabase
      .from('community_invites')
      .select('id')
      .eq('community_id', communityId)
      .eq('invited_user_id', invitedUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      throw new Error('Invite already exists');
    }

    // Create new invite in Supabase
    // Table: community_invites (must exist in Supabase)
    const { data, error } = await supabase
      .from('community_invites')
      .insert({
        community_id: communityId,
        community_name: communityName,
        invited_by_user_id: invitedByUserId,
        invited_by_username: invitedByFullName, // Stores full_name from profiles
        invited_user_id: invitedUserId,
        invited_username: invitedFullName, // Stores full_name from profiles
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating invite:', error);
      throw error;
    }

    console.log(`✅ Invite created: ${data.id}`);
    return {
      id: data.id,
      community_id: data.community_id,
      community_name: data.community_name,
      invited_by_user_id: data.invited_by_user_id,
      invited_by_username: data.invited_by_username,
      invited_user_id: data.invited_user_id,
      invited_username: data.invited_username,
      status: data.status,
      created_at: data.created_at,
      responded_at: data.responded_at,
    };
  } catch (error: any) {
    console.error('❌ Error in createCommunityInvite:', error);
    throw error;
  }
}

/**
 * Get all invites for a user
 */
export async function getUserInvites(userId: string): Promise<CommunityInvite[]> {
  try {
    console.log(`📥 Fetching invites for user: ${userId}`);
    
    // Query actual Supabase community_invites table
    // SECURITY: Always scope by user_id to ensure RLS is enforced
    const { data, error } = await supabase
      .from('community_invites')
      .select('id, community_id, community_name, invited_by_user_id, invited_by_username, invited_user_id, invited_username, status, created_at, responded_at')
      .eq('invited_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Pagination: limit to 50 invites

    if (error) {
      console.error('❌ Error fetching invites:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} invites`);
    return (data || []).map((row: any) => ({
      id: row.id,
      community_id: row.community_id,
      community_name: row.community_name,
      invited_by_user_id: row.invited_by_user_id,
      invited_by_username: row.invited_by_username,
      invited_user_id: row.invited_user_id,
      invited_username: row.invited_username,
      status: row.status,
      created_at: row.created_at,
      responded_at: row.responded_at,
    }));
  } catch (error) {
    console.error('❌ Error in getUserInvites:', error);
    return [];
  }
}

/**
 * Get pending invites count for a user
 */
export async function getPendingInvitesCount(userId: string): Promise<number> {
  try {
    // Query actual Supabase community_invites table
    const { count, error } = await supabase
      .from('community_invites')
      .select('*', { count: 'exact', head: true })
      .eq('invited_user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error getting pending invites count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error in getPendingInvitesCount:', error);
    return 0;
  }
}

/**
 * Accept a community invite
 */
export async function acceptCommunityInvite(inviteId: string): Promise<void> {
  try {
    console.log(`✅ Accepting invite: ${inviteId}`);
    
    // Get invite from actual Supabase community_invites table
    const { data: inviteData, error: fetchError } = await supabase
      .from('community_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !inviteData) {
      throw new Error('Invite not found or already responded to');
    }

    // Update invite status in Supabase
    const { error: updateError } = await supabase
      .from('community_invites')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('❌ Error updating invite status:', updateError);
      throw updateError;
    }

    // Add user to community - fetch current user's profile from Supabase to get correct full_name
    try {
      const { addMemberToCommunity } = await import('@/utils/localCommunityStorage');
      const { fetchUserProfile } = await import('@/utils/profileSupabaseSync');
      
      // Get the invited user's current profile from Supabase to ensure we have the correct full_name
      const invitedUserProfile = await fetchUserProfile(inviteData.invited_user_id);
      const memberUsername = invitedUserProfile?.full_name || inviteData.invited_username || 'User';
      
      await addMemberToCommunity(
        inviteData.community_id,
        inviteData.invited_user_id,
        memberUsername, // Use full_name from Supabase, fallback to invite data
        'member'
      );
      console.log(`✅ User ${memberUsername} added to community: ${inviteData.community_name}`);
    } catch (communityError) {
      console.warn('⚠️ Could not add user to community (may need to be done manually):', communityError);
      // Don't throw - invite is still accepted
    }

    console.log(`✅ Invite accepted: ${inviteId}`);
  } catch (error: any) {
    console.error('❌ Error in acceptCommunityInvite:', error);
    throw error;
  }
}

/**
 * Decline a community invite
 */
export async function declineCommunityInvite(inviteId: string): Promise<void> {
  try {
    console.log(`❌ Declining invite: ${inviteId}`);
    
    // Update invite status in actual Supabase community_invites table
    const { data, error } = await supabase
      .from('community_invites')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('❌ Error declining invite:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Invite not found or already responded to');
    }

    console.log(`✅ Invite declined: ${inviteId}`);
  } catch (error: any) {
    console.error('❌ Error in declineCommunityInvite:', error);
    throw error;
  }
}
