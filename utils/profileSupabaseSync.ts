
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string; // This is the user_id (references auth.users.id)
  email?: string;
  full_name?: string; // Your schema uses full_name, not username/display_name
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch user profile from Supabase
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('Fetching user profile from Supabase for user:', userId);
    
    // In your schema, profiles.id IS the user_id (references auth.users.id)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, created_at, updated_at')
      .eq('id', userId) // id is the user_id in your schema
      .single();

    if (error) {
      console.log('Error fetching user profile:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('User profile fetched successfully:', data);
    return data;
  } catch (error) {
    console.log('Error in fetchUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(userId: string, profile: Partial<{ full_name?: string; email?: string; avatar_url?: string }>): Promise<boolean> {
  try {
    console.log('📝 Updating user profile in Supabase for user:', userId);
    console.log('📝 Profile data being saved:', JSON.stringify(profile, null, 2));
    
    // In your schema: profiles.id IS the user_id, and we use full_name instead of username/display_name
    const profileData = {
      id: userId, // id is the primary key (references auth.users.id)
      ...profile,
      updated_at: new Date().toISOString(),
    };
    
    console.log('📝 Full profile data with id:', JSON.stringify(profileData, null, 2));
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id' // Conflict on id (which is the user_id)
      })
      .select();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a table/permission issue
      if (error.code === 'PGRST205' || error.message?.includes('permission denied')) {
        console.error('⚠️ Possible RLS or table access issue. Check:');
        console.error('   1. Does profiles table exist?');
        console.error('   2. Are RLS policies set up correctly?');
        console.error('   3. Does the user have INSERT/UPDATE permissions?');
      }
      
      return false;
    }

    console.log('✅ User profile updated successfully in Supabase');
    console.log('✅ Returned data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error: any) {
    console.error('❌ Exception in updateUserProfile:', error);
    console.error('❌ Error stack:', error.stack);
    return false;
  }
}

/**
 * Sync local profile data to Supabase
 */
export async function syncProfileToSupabase(userId: string): Promise<void> {
  try {
    console.log('Syncing profile to Supabase...');
    
    // Load local profile data
    const localProfileStr = await AsyncStorage.getItem('userProfile');
    if (!localProfileStr) {
      console.log('No local profile data to sync');
      return;
    }

    const localProfile = JSON.parse(localProfileStr);
    
    // Update Supabase with local data
    await updateUserProfile(userId, {
      full_name: localProfile.name, // Use full_name instead of display_name
      email: typeof localProfile.email === 'string' ? localProfile.email : undefined,
    });
    
    console.log('Profile synced to Supabase successfully');
  } catch (error) {
    console.log('Error syncing profile to Supabase:', error);
  }
}

/**
 * Sync Supabase profile data to local storage
 */
export async function syncProfileFromSupabase(userId: string): Promise<void> {
  try {
    console.log('Syncing profile from Supabase...');
    
    // Fetch profile from Supabase
    const profile = await fetchUserProfile(userId);
    if (!profile) {
      console.log('No profile found in Supabase');
      return;
    }

    // Get user email from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    // Save to local storage
    const localProfile = {
      name: profile.full_name || user?.email?.split('@')[0] || 'User', // Use full_name from schema
      email: profile.email || user?.email || '',
      phone: '', // Phone not in your schema, remove it
    };
    
    await AsyncStorage.setItem('userProfile', JSON.stringify(localProfile));
    
    console.log('Profile synced from Supabase successfully');
  } catch (error) {
    console.log('Error syncing profile from Supabase:', error);
  }
}

/**
 * Initialize user profile on first login or signup
 */
export async function initializeUserProfile(userId: string, username?: string, email?: string): Promise<void> {
  try {
    console.log('📝 Initializing user profile for user:', userId);
    console.log('📝 Username provided:', username);
    console.log('📝 Email provided:', email);
    
    // Check if profile already exists
    const existingProfile = await fetchUserProfile(userId);
    
    if (existingProfile) {
      console.log('✅ Profile already exists');
      
      // If username is provided and current profile doesn't have full_name, or it's different, update it
      const finalName = username?.trim() || email?.split('@')[0] || 'User';
      const existingName = existingProfile.full_name?.trim();
      // Only fill full_name if missing; don't overwrite user's edited value
      if (!existingName) {
        console.log('🔄 Updating existing profile with full_name:', finalName);
        await updateUserProfile(userId, {
          full_name: finalName, // Use full_name instead of username
        });
        console.log('✅ Profile updated with full_name');
      }

      // Only fill email if it's missing/empty.
      // This prevents overwriting a user's edited `profiles.email` on next sign-in
      // when Supabase Auth email may still be the original value.
      const finalEmail = email?.trim();
      const existingEmail = existingProfile.email?.trim();
      if (finalEmail && !existingEmail) {
        console.log('🔄 Updating existing profile with email:', finalEmail);
        await updateUserProfile(userId, { email: finalEmail });
        console.log('✅ Profile updated with email');
      }
      
      // Sync to local
      await syncProfileFromSupabase(userId);
      return;
    }

    // Create new profile with full_name
    // Priority: provided username > email prefix > 'User'
    const finalName = username?.trim() || email?.split('@')[0] || 'User';
    
    console.log('📝 Creating new profile with full_name:', finalName);
    
    const newProfile: Partial<UserProfile> = {
      id: userId, // id is the user_id in your schema
      email: email || undefined,
      full_name: finalName, // Use full_name instead of username/display_name
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const success = await updateUserProfile(userId, newProfile);
    
    if (!success) {
      console.error('❌ Failed to create profile in Supabase');
      throw new Error('Failed to create user profile');
    }
    
    console.log('✅ User profile created successfully in Supabase with username:', finalName);
    
    // Save to local storage
    const localProfile = {
      name: newProfile.full_name || 'User', // Use full_name
      email: email || '',
      phone: '', // Phone not in schema
    };
    
    await AsyncStorage.setItem('userProfile', JSON.stringify(localProfile));
    
    console.log('✅ User profile initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing user profile:', error);
    throw error; // Re-throw so caller knows it failed
  }
}

/**
 * Delete user account and all associated data
 * Note: This deletes the user profile from Supabase. The auth user account
 * deletion requires admin privileges and should be handled separately.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting user account and profile for user:', userId);
    
    // Delete user profile from Supabase (this will cascade delete related data if CASCADE is set up)
    // In your schema, profiles.id IS the user_id (references auth.users.id)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId); // Use id instead of user_id

    if (error) {
      console.error('❌ Error deleting user profile from Supabase:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ User profile deleted from Supabase');

    // Also delete from community_invites (both sent and received)
    try {
      // Delete invites where user is the inviter
      await supabase
        .from('community_invites')
        .delete()
        .eq('invited_by_user_id', userId);
      
      // Delete invites where user is the invitee
      await supabase
        .from('community_invites')
        .delete()
        .eq('invited_user_id', userId);
      
      console.log('✅ User invites deleted');
    } catch (inviteError) {
      console.log('⚠️ Error deleting invites (non-critical):', inviteError);
    }

    // Clear local storage
    try {
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.multiRemove([
        'prayerData',
        'imanTrackerData',
        'local_communities',
        'local_community_invites',
        'local_iman_scores',
      ]);
      console.log('✅ Local storage cleared');
    } catch (storageError) {
      console.log('⚠️ Error clearing local storage (non-critical):', storageError);
    }

    console.log('✅ User account data deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting user account:', error);
    return false;
  }
}
