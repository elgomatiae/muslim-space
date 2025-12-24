
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const fetchCommunities = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch communities where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select(`
          community_id,
          is_admin,
          communities (
            id,
            name,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Get member counts for each community
      const communityIds = memberData?.map(m => m.community_id) || [];
      const { data: countData, error: countError } = await supabase
        .from('community_members')
        .select('community_id')
        .in('community_id', communityIds);

      if (countError) throw countError;

      // Count members per community
      const memberCounts: Record<string, number> = {};
      countData?.forEach(item => {
        memberCounts[item.community_id] = (memberCounts[item.community_id] || 0) + 1;
      });

      // Format communities
      const formattedCommunities: Community[] = memberData?.map(m => ({
        id: m.communities.id,
        name: m.communities.name,
        created_by: m.communities.created_by,
        created_at: m.communities.created_at,
        member_count: memberCounts[m.community_id] || 0,
        is_admin: m.is_admin,
      })) || [];

      setCommunities(formattedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoading(false);
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
    fetchCommunities();
    fetchPendingInvites();
  }, [fetchCommunities, fetchPendingInvites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommunities();
    fetchPendingInvites();
  }, [fetchCommunities, fetchPendingInvites]);

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
      fetchCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      Alert.alert('Error', error.message || 'Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  const handleCommunityPress = (community: Community) => {
    router.push({
      pathname: '/(tabs)/(iman)/community-detail',
      params: { communityId: community.id, communityName: community.name },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Communities</Text>
          <View style={styles.headerRight} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity
          style={styles.invitesButton}
          onPress={() => router.push('/(tabs)/(iman)/invites-inbox')}
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
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
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
