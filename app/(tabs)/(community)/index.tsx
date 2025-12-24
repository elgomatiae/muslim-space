
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Community {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_admin: boolean;
}

export default function CommunitiesScreen() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const loadCommunities = useCallback(async () => {
    if (!user) {
      setCommunities([]);
      setCommunitiesLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('Fetching communities for user:', user.id);

      // Step 1: Get user's memberships
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('community_id, is_admin')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching community members:', memberError);
        throw memberError;
      }

      console.log('User memberships:', memberData);

      if (!memberData || memberData.length === 0) {
        setCommunities([]);
        setCommunitiesLoading(false);
        setRefreshing(false);
        return;
      }

      const communityIds = memberData.map(m => m.community_id);
      const membershipMap = new Map(memberData.map(m => [m.community_id, m.is_admin]));

      // Step 2: Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id, name, created_by, created_at')
        .in('id', communityIds);

      if (communityError) {
        console.error('Error fetching communities:', communityError);
        throw communityError;
      }

      console.log('Community data:', communityData);

      // Step 3: Get member counts for each community
      const { data: allMembers, error: countError } = await supabase
        .from('community_members')
        .select('community_id')
        .in('community_id', communityIds);

      if (countError) {
        console.error('Error fetching member counts:', countError);
        throw countError;
      }

      // Count members per community
      const memberCounts: Record<string, number> = {};
      allMembers?.forEach(item => {
        memberCounts[item.community_id] = (memberCounts[item.community_id] || 0) + 1;
      });

      // Format communities
      const formattedCommunities: Community[] = communityData?.map(c => ({
        id: c.id,
        name: c.name,
        created_by: c.created_by,
        created_at: c.created_at,
        member_count: memberCounts[c.id] || 0,
        is_admin: membershipMap.get(c.id) || false,
      })) || [];

      console.log('Formatted communities:', formattedCommunities);
      setCommunities(formattedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const fetchPendingInvites = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_invites')
        .select('id')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingInvitesCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  }, [user]);

  useEffect(() => {
    loadCommunities();
    fetchPendingInvites();
  }, [loadCommunities, fetchPendingInvites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommunities();
    fetchPendingInvites();
  }, [loadCommunities, fetchPendingInvites]);

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      // Create community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .insert({
          name: newCommunityName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: communityData.id,
          user_id: user.id,
          is_admin: true,
        });

      if (memberError) throw memberError;

      Alert.alert('Success', 'Community created successfully!');
      setNewCommunityName('');
      setShowCreateModal(false);
      loadCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      Alert.alert('Error', error.message || 'Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  const handleCommunityPress = (community: Community) => {
    router.push({
      pathname: '/(tabs)/(community)/community-detail',
      params: { communityId: community.id, communityName: community.name },
    });
  };

  if (communitiesLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Communities</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity
          style={styles.invitesButton}
          onPress={() => router.push('/(tabs)/(community)/invites-inbox')}
        >
          <IconSymbol
            ios_icon_name="envelope.fill"
            android_material_icon_name="mail"
            size={24}
            color={colors.primary}
          />
          {pendingInvitesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Create Community Section */}
        {!showCreateModal ? (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add_circle"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.createButtonText}>Create New Community</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.createModal}>
            <Text style={styles.createModalTitle}>Create Community</Text>
            <TextInput
              style={styles.input}
              placeholder="Community Name"
              placeholderTextColor={colors.textSecondary}
              value={newCommunityName}
              onChangeText={setNewCommunityName}
              maxLength={50}
            />
            <View style={styles.createModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewCommunityName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateCommunity}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Communities List */}
        {communities.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="groups"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Communities Yet</Text>
            <Text style={styles.emptyStateText}>
              Create a community or wait for an invite to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.communitiesList}>
            {communities.map((community, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.communityCard}
                  onPress={() => handleCommunityPress(community)}
                >
                  <View style={styles.communityIcon}>
                    <IconSymbol
                      ios_icon_name="person.3.fill"
                      android_material_icon_name="groups"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.communityInfo}>
                    <View style={styles.communityHeader}>
                      <Text style={styles.communityName}>{community.name}</Text>
                      {community.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.communityMembers}>
                      {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron_right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  invitesButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: borderRadius.round,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
    gap: spacing.md,
  },
  createButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  createModal: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  createModalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  createModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.bodyBold,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  communitiesList: {
    gap: spacing.md,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    gap: spacing.md,
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  communityName: {
    ...typography.h4,
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  communityMembers: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
