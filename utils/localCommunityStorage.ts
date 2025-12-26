
/**
 * ============================================================================
 * LOCAL COMMUNITY STORAGE SYSTEM
 * ============================================================================
 * 
 * This module handles all community data storage locally using AsyncStorage.
 * No Supabase dependency - everything is stored on the device.
 * 
 * Features:
 * - Create and manage communities
 * - Invite and manage members
 * - Store and retrieve Iman scores
 * - Handle invites and responses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentSectionScores } from './imanScoreCalculator';

// ============================================================================
// INTERFACES
// ============================================================================

export interface LocalCommunity {
  id: string;
  name: string;
  description: string | null;
  createdBy: string; // user ID
  createdAt: string;
  members: CommunityMember[];
}

export interface CommunityMember {
  userId: string;
  username: string;
  role: 'admin' | 'member';
  joinedAt: string;
  hideScore: boolean;
  imanScore: number;
}

export interface CommunityInvite {
  id: string;
  communityId: string;
  communityName: string;
  invitedBy: string; // user ID
  invitedByUsername: string;
  invitedUserId: string;
  invitedUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  COMMUNITIES: 'local_communities',
  INVITES: 'local_community_invites',
  USER_PROFILE: 'local_user_profile',
  IMAN_SCORES: 'local_iman_scores',
};

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    console.log('✅ User profile saved locally:', profile.username);
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    throw new Error('Failed to save user profile');
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) {
      const profile = JSON.parse(saved);
      console.log('✅ User profile loaded:', profile.username);
      return profile;
    }
    console.log('ℹ️ No user profile found');
    return null;
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
    return null;
  }
}

// ============================================================================
// IMAN SCORE MANAGEMENT
// ============================================================================

export async function updateUserImanScore(userId: string): Promise<void> {
  try {
    const scores = await getCurrentSectionScores();
    const overallScore = Math.round(
      scores.ibadah * 0.5 + scores.ilm * 0.3 + scores.amanah * 0.2
    );
    
    const scoresData = await AsyncStorage.getItem(STORAGE_KEYS.IMAN_SCORES);
    const allScores: Record<string, number> = scoresData ? JSON.parse(scoresData) : {};
    
    allScores[userId] = overallScore;
    
    await AsyncStorage.setItem(STORAGE_KEYS.IMAN_SCORES, JSON.stringify(allScores));
    console.log(`✅ Iman score updated for user ${userId}: ${overallScore}`);
  } catch (error) {
    console.error('❌ Error updating Iman score:', error);
    throw new Error('Failed to update Iman score');
  }
}

export async function getUserImanScore(userId: string): Promise<number> {
  try {
    const scoresData = await AsyncStorage.getItem(STORAGE_KEYS.IMAN_SCORES);
    const allScores: Record<string, number> = scoresData ? JSON.parse(scoresData) : {};
    const score = allScores[userId] || 0;
    console.log(`✅ Iman score retrieved for user ${userId}: ${score}`);
    return score;
  } catch (error) {
    console.error('❌ Error getting Iman score:', error);
    return 0;
  }
}

// ============================================================================
// COMMUNITY MANAGEMENT
// ============================================================================

export async function getAllCommunities(): Promise<LocalCommunity[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.COMMUNITIES);
    if (saved) {
      const communities = JSON.parse(saved);
      console.log(`✅ Loaded ${communities.length} communities from storage`);
      return communities;
    }
    console.log('ℹ️ No communities found in storage (this is normal for new users)');
    return [];
  } catch (error) {
    console.error('❌ Error loading communities:', error);
    throw new Error('Failed to load communities');
  }
}

export async function saveCommunities(communities: LocalCommunity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(communities));
    console.log(`✅ ${communities.length} communities saved locally`);
  } catch (error) {
    console.error('❌ Error saving communities:', error);
    throw new Error('Failed to save communities');
  }
}

export async function createCommunity(
  name: string,
  description: string | null,
  creatorId: string,
  creatorUsername: string
): Promise<LocalCommunity> {
  try {
    console.log(`🏗️ Creating community "${name}" for user ${creatorUsername}...`);
    
    const communities = await getAllCommunities();
    
    const newCommunity: LocalCommunity = {
      id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: creatorId,
          username: creatorUsername,
          role: 'admin',
          joinedAt: new Date().toISOString(),
          hideScore: false,
          imanScore: await getUserImanScore(creatorId),
        },
      ],
    };
    
    communities.push(newCommunity);
    await saveCommunities(communities);
    
    console.log(`✅ Community created successfully: ${newCommunity.name} (ID: ${newCommunity.id})`);
    return newCommunity;
  } catch (error) {
    console.error('❌ Error creating community:', error);
    throw new Error('Failed to create community');
  }
}

export async function getCommunity(communityId: string): Promise<LocalCommunity | null> {
  try {
    console.log(`📥 Fetching community: ${communityId}`);
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId) || null;
    if (community) {
      console.log(`✅ Found community: ${community.name}`);
    } else {
      console.log(`ℹ️ Community not found: ${communityId}`);
    }
    return community;
  } catch (error) {
    console.error('❌ Error getting community:', error);
    throw new Error('Failed to get community');
  }
}

export async function getUserCommunities(userId: string): Promise<LocalCommunity[]> {
  try {
    console.log(`📥 Fetching communities for user: ${userId}`);
    const communities = await getAllCommunities();
    const userCommunities = communities.filter(c => c.members.some(m => m.userId === userId));
    console.log(`✅ Found ${userCommunities.length} communities for user`);
    return userCommunities;
  } catch (error) {
    console.error('❌ Error getting user communities:', error);
    throw new Error('Failed to get user communities');
  }
}

export async function addMemberToCommunity(
  communityId: string,
  userId: string,
  username: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  try {
    console.log(`➕ Adding member ${username} to community ${communityId}...`);
    
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      throw new Error('Community not found');
    }
    
    // Check if already a member
    if (community.members.some(m => m.userId === userId)) {
      throw new Error('User is already a member');
    }
    
    const newMember: CommunityMember = {
      userId,
      username,
      role,
      joinedAt: new Date().toISOString(),
      hideScore: false,
      imanScore: await getUserImanScore(userId),
    };
    
    community.members.push(newMember);
    await saveCommunities(communities);
    
    console.log(`✅ Member ${username} added to community ${community.name}`);
  } catch (error) {
    console.error('❌ Error adding member to community:', error);
    throw error;
  }
}

export async function removeMemberFromCommunity(
  communityId: string,
  userId: string
): Promise<void> {
  try {
    console.log(`➖ Removing member ${userId} from community ${communityId}...`);
    
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      throw new Error('Community not found');
    }
    
    community.members = community.members.filter(m => m.userId !== userId);
    
    // If no members left, delete the community
    if (community.members.length === 0) {
      const index = communities.indexOf(community);
      communities.splice(index, 1);
      console.log(`🗑️ Community ${community.name} deleted (no members left)`);
    }
    
    await saveCommunities(communities);
    console.log(`✅ Member removed from community ${community.name}`);
  } catch (error) {
    console.error('❌ Error removing member from community:', error);
    throw new Error('Failed to remove member from community');
  }
}

export async function updateMemberScore(communityId: string, userId: string): Promise<void> {
  try {
    console.log(`📊 Updating score for member ${userId} in community ${communityId}...`);
    
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      console.log(`ℹ️ Community ${communityId} not found for score update`);
      return;
    }
    
    const member = community.members.find(m => m.userId === userId);
    if (member) {
      member.imanScore = await getUserImanScore(userId);
      await saveCommunities(communities);
      console.log(`✅ Member score updated in community ${community.name}: ${member.imanScore}`);
    } else {
      console.log(`ℹ️ Member ${userId} not found in community ${communityId}`);
    }
  } catch (error) {
    console.error('❌ Error updating member score:', error);
    throw new Error('Failed to update member score');
  }
}

export async function updateAllMemberScores(communityId: string): Promise<void> {
  try {
    console.log(`📊 Updating all member scores in community ${communityId}...`);
    
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      console.log(`ℹ️ Community ${communityId} not found for score update`);
      return;
    }
    
    for (const member of community.members) {
      member.imanScore = await getUserImanScore(member.userId);
    }
    
    await saveCommunities(communities);
    console.log(`✅ All member scores updated in community ${community.name}`);
  } catch (error) {
    console.error('❌ Error updating all member scores:', error);
    throw new Error('Failed to update all member scores');
  }
}

export async function toggleHideScore(communityId: string, userId: string): Promise<void> {
  try {
    console.log(`👁️ Toggling score visibility for user ${userId} in community ${communityId}...`);
    
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      throw new Error('Community not found');
    }
    
    const member = community.members.find(m => m.userId === userId);
    if (member) {
      member.hideScore = !member.hideScore;
      await saveCommunities(communities);
      console.log(`✅ Score visibility toggled for user in community ${community.name}: ${member.hideScore ? 'hidden' : 'visible'}`);
    }
  } catch (error) {
    console.error('❌ Error toggling score visibility:', error);
    throw new Error('Failed to toggle score visibility');
  }
}

// ============================================================================
// INVITE MANAGEMENT
// ============================================================================

export async function getAllInvites(): Promise<CommunityInvite[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.INVITES);
    if (saved) {
      const invites = JSON.parse(saved);
      console.log(`✅ Loaded ${invites.length} invites from storage`);
      return invites;
    }
    console.log('ℹ️ No invites found in storage (this is normal for new users)');
    return [];
  } catch (error) {
    console.error('❌ Error loading invites:', error);
    throw new Error('Failed to load invites');
  }
}

export async function saveInvites(invites: CommunityInvite[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(invites));
    console.log(`✅ ${invites.length} invites saved locally`);
  } catch (error) {
    console.error('❌ Error saving invites:', error);
    throw new Error('Failed to save invites');
  }
}

export async function createInvite(
  communityId: string,
  communityName: string,
  invitedBy: string,
  invitedByUsername: string,
  invitedUserId: string,
  invitedUsername: string
): Promise<CommunityInvite> {
  try {
    console.log(`📧 Creating invite for ${invitedUsername} to join ${communityName}...`);
    
    const invites = await getAllInvites();
    
    // Check if invite already exists
    const existingInvite = invites.find(
      i => i.communityId === communityId && i.invitedUserId === invitedUserId && i.status === 'pending'
    );
    
    if (existingInvite) {
      throw new Error('Invite already exists');
    }
    
    const newInvite: CommunityInvite = {
      id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      communityId,
      communityName,
      invitedBy,
      invitedByUsername,
      invitedUserId,
      invitedUsername,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    invites.push(newInvite);
    await saveInvites(invites);
    
    console.log(`✅ Invite created for ${invitedUsername} (ID: ${newInvite.id})`);
    return newInvite;
  } catch (error) {
    console.error('❌ Error creating invite:', error);
    throw error;
  }
}

export async function getUserInvites(userId: string): Promise<CommunityInvite[]> {
  try {
    console.log(`📥 Fetching invites for user: ${userId}`);
    const invites = await getAllInvites();
    const userInvites = invites.filter(i => i.invitedUserId === userId);
    console.log(`✅ Found ${userInvites.length} invites for user`);
    return userInvites;
  } catch (error) {
    console.error('❌ Error getting user invites:', error);
    throw new Error('Failed to get user invites');
  }
}

export async function getPendingInvitesCount(userId: string): Promise<number> {
  try {
    console.log(`📥 Fetching pending invites count for user: ${userId}`);
    const invites = await getUserInvites(userId);
    const count = invites.filter(i => i.status === 'pending').length;
    console.log(`✅ Found ${count} pending invites for user`);
    return count;
  } catch (error) {
    console.log('ℹ️ Error getting pending invites count (non-critical):', error);
    return 0;
  }
}

export async function acceptInvite(inviteId: string): Promise<void> {
  try {
    console.log(`✅ Accepting invite: ${inviteId}`);
    
    const invites = await getAllInvites();
    const invite = invites.find(i => i.id === inviteId);
    
    if (!invite) {
      throw new Error('Invite not found');
    }
    
    if (invite.status !== 'pending') {
      throw new Error('Invite has already been responded to');
    }
    
    // Update invite status
    invite.status = 'accepted';
    invite.respondedAt = new Date().toISOString();
    await saveInvites(invites);
    
    // Add user to community
    await addMemberToCommunity(
      invite.communityId,
      invite.invitedUserId,
      invite.invitedUsername,
      'member'
    );
    
    console.log(`✅ Invite accepted successfully`);
  } catch (error) {
    console.error('❌ Error accepting invite:', error);
    throw error;
  }
}

export async function declineInvite(inviteId: string): Promise<void> {
  try {
    console.log(`❌ Declining invite: ${inviteId}`);
    
    const invites = await getAllInvites();
    const invite = invites.find(i => i.id === inviteId);
    
    if (!invite) {
      throw new Error('Invite not found');
    }
    
    if (invite.status !== 'pending') {
      throw new Error('Invite has already been responded to');
    }
    
    invite.status = 'declined';
    invite.respondedAt = new Date().toISOString();
    await saveInvites(invites);
    
    console.log(`✅ Invite declined successfully`);
  } catch (error) {
    console.error('❌ Error declining invite:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function findUserByUsername(username: string): Promise<UserProfile | null> {
  // In a real app, you'd have a user directory
  // For now, we'll just return null if not the current user
  const currentUser = await getUserProfile();
  if (currentUser && currentUser.username === username) {
    return currentUser;
  }
  return null;
}

export async function clearAllCommunityData(): Promise<void> {
  try {
    console.log('🗑️ Clearing all community data...');
    await AsyncStorage.removeItem(STORAGE_KEYS.COMMUNITIES);
    await AsyncStorage.removeItem(STORAGE_KEYS.INVITES);
    console.log('✅ All community data cleared');
  } catch (error) {
    console.error('❌ Error clearing community data:', error);
    throw new Error('Failed to clear community data');
  }
}
