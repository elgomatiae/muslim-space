
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
    console.log('✅ User profile saved locally');
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) {
      return JSON.parse(saved);
    }
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
  }
}

export async function getUserImanScore(userId: string): Promise<number> {
  try {
    const scoresData = await AsyncStorage.getItem(STORAGE_KEYS.IMAN_SCORES);
    const allScores: Record<string, number> = scoresData ? JSON.parse(scoresData) : {};
    return allScores[userId] || 0;
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
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading communities:', error);
    return [];
  }
}

export async function saveCommunities(communities: LocalCommunity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(communities));
    console.log('✅ Communities saved locally');
  } catch (error) {
    console.error('❌ Error saving communities:', error);
    throw error;
  }
}

export async function createCommunity(
  name: string,
  description: string | null,
  creatorId: string,
  creatorUsername: string
): Promise<LocalCommunity> {
  try {
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
    
    console.log('✅ Community created:', newCommunity.name);
    return newCommunity;
  } catch (error) {
    console.error('❌ Error creating community:', error);
    throw error;
  }
}

export async function getCommunity(communityId: string): Promise<LocalCommunity | null> {
  try {
    const communities = await getAllCommunities();
    return communities.find(c => c.id === communityId) || null;
  } catch (error) {
    console.error('❌ Error getting community:', error);
    return null;
  }
}

export async function getUserCommunities(userId: string): Promise<LocalCommunity[]> {
  try {
    const communities = await getAllCommunities();
    return communities.filter(c => c.members.some(m => m.userId === userId));
  } catch (error) {
    console.error('❌ Error getting user communities:', error);
    return [];
  }
}

export async function addMemberToCommunity(
  communityId: string,
  userId: string,
  username: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  try {
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
    }
    
    await saveCommunities(communities);
    console.log(`✅ Member removed from community ${community.name}`);
  } catch (error) {
    console.error('❌ Error removing member from community:', error);
    throw error;
  }
}

export async function updateMemberScore(communityId: string, userId: string): Promise<void> {
  try {
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      return;
    }
    
    const member = community.members.find(m => m.userId === userId);
    if (member) {
      member.imanScore = await getUserImanScore(userId);
      await saveCommunities(communities);
      console.log(`✅ Member score updated in community ${community.name}`);
    }
  } catch (error) {
    console.error('❌ Error updating member score:', error);
  }
}

export async function updateAllMemberScores(communityId: string): Promise<void> {
  try {
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      return;
    }
    
    for (const member of community.members) {
      member.imanScore = await getUserImanScore(member.userId);
    }
    
    await saveCommunities(communities);
    console.log(`✅ All member scores updated in community ${community.name}`);
  } catch (error) {
    console.error('❌ Error updating all member scores:', error);
  }
}

export async function toggleHideScore(communityId: string, userId: string): Promise<void> {
  try {
    const communities = await getAllCommunities();
    const community = communities.find(c => c.id === communityId);
    
    if (!community) {
      throw new Error('Community not found');
    }
    
    const member = community.members.find(m => m.userId === userId);
    if (member) {
      member.hideScore = !member.hideScore;
      await saveCommunities(communities);
      console.log(`✅ Score visibility toggled for user in community ${community.name}`);
    }
  } catch (error) {
    console.error('❌ Error toggling score visibility:', error);
    throw error;
  }
}

// ============================================================================
// INVITE MANAGEMENT
// ============================================================================

export async function getAllInvites(): Promise<CommunityInvite[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.INVITES);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading invites:', error);
    return [];
  }
}

export async function saveInvites(invites: CommunityInvite[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(invites));
    console.log('✅ Invites saved locally');
  } catch (error) {
    console.error('❌ Error saving invites:', error);
    throw error;
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
    
    console.log('✅ Invite created for', invitedUsername);
    return newInvite;
  } catch (error) {
    console.error('❌ Error creating invite:', error);
    throw error;
  }
}

export async function getUserInvites(userId: string): Promise<CommunityInvite[]> {
  try {
    const invites = await getAllInvites();
    return invites.filter(i => i.invitedUserId === userId);
  } catch (error) {
    console.error('❌ Error getting user invites:', error);
    return [];
  }
}

export async function getPendingInvitesCount(userId: string): Promise<number> {
  try {
    const invites = await getUserInvites(userId);
    return invites.filter(i => i.status === 'pending').length;
  } catch (error) {
    console.error('❌ Error getting pending invites count:', error);
    return 0;
  }
}

export async function acceptInvite(inviteId: string): Promise<void> {
  try {
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
    
    console.log('✅ Invite accepted');
  } catch (error) {
    console.error('❌ Error accepting invite:', error);
    throw error;
  }
}

export async function declineInvite(inviteId: string): Promise<void> {
  try {
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
    
    console.log('✅ Invite declined');
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
    await AsyncStorage.removeItem(STORAGE_KEYS.COMMUNITIES);
    await AsyncStorage.removeItem(STORAGE_KEYS.INVITES);
    console.log('✅ All community data cleared');
  } catch (error) {
    console.error('❌ Error clearing community data:', error);
  }
}
