
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Invite {
  id: string;
  community_id: string;
  community_name: string;
  invited_by_username: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function InvitesInboxScreen() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!user) return;

    try {
      const { data: invitesData, error: invitesError } = await supabase
        .from('community_invites')
        .select('id, community_id, created_at, status, invited_by')
        .eq('invited_user_id', user.id)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      if (!invitesData || invitesData.length === 0) {
        setInvites([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const communityIds = [...new Set(invitesData.map(i => i.community_id))];
      const userIds = [...new Set(invitesData.map(i => i.invited_by))];

      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name')
        .in('id', communityIds);

      if (communitiesError) throw communitiesError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const communityMap = new Map(communitiesData?.map(c => [c.id, c.name]) || []);
      const usernameMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);

      const formattedInvites: Invite[] = invitesData.map(invite => ({
        id: invite.id,
        community_id: invite.community_id,
        community_name: communityMap.get(invite.community_id) || 'Unknown Community',
        invited_by_username: usernameMap.get(invite.invited_by) || 'Unknown User',
        created_at: invite.created_at,
        status: invite.status,
      }));

      setInvites(formattedInvites);
    } catch (error) {
      console.error('Error fetching invites:', error);
      Alert.alert('Error', 'Failed to load invites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvites();
  }, [fetchInvites]);

  const handleAcceptInvite = async (invite: Invite) => {
    if (!user) return;

    setProcessingInviteId(invite.id);
    try {
      // Update invite status
      const { error: updateError } = await supabase
        .from('community_invites')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Add user to community
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: invite.community_id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      Alert.alert('Success', 'You have joined the community!');
      fetchInvites();
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      Alert.alert('Error', error.message || 'Failed to accept invite');
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async (invite: Invite) => {
    setProcessingInviteId(invite.id);
    try {
      const { error } = await supabase
        .from('community_invites')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (error) throw error;

      Alert.alert('Success', 'Invite declined');
      fetchInvites();
    } catch (error: any) {
      console.error('Error declining invite:', error);
      Alert.alert('Error', error.message || 'Failed to decline invite');
    } finally {
      setProcessingInviteId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invites</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const respondedInvites = invites.filter(i => i.status !== 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invites</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {invites.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="envelope"
              android_material_icon_name="mail_outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Invites</Text>
            <Text style={styles.emptyStateText}>
              You don&apos;t have any community invites yet.
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {pendingInvites.length > 0 && (
              <React.Fragment>
                <Text style={styles.sectionTitle}>Pending Invites</Text>
                <View style={styles.invitesList}>
                  {pendingInvites.map((invite, index) => (
                    <React.Fragment key={index}>
                      <View style={styles.inviteCard}>
                        <View style={styles.inviteIcon}>
                          <IconSymbol
                            ios_icon_name="person.3.fill"
                            android_material_icon_name="groups"
                            size={32}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.inviteInfo}>
                          <Text style={styles.inviteCommunityName}>{invite.community_name}</Text>
                          <Text style={styles.inviteText}>
                            Invited by {invite.invited_by_username}
                          </Text>
                          <Text style={styles.inviteDate}>
                            {new Date(invite.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.inviteActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptInvite(invite)}
                            disabled={processingInviteId === invite.id}
                          >
                            {processingInviteId === invite.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <IconSymbol
                                ios_icon_name="checkmark"
                                android_material_icon_name="check"
                                size={20}
                                color="#fff"
                              />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={() => handleDeclineInvite(invite)}
                            disabled={processingInviteId === invite.id}
                          >
                            {processingInviteId === invite.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <IconSymbol
                                ios_icon_name="xmark"
                                android_material_icon_name="close"
                                size={20}
                                color="#fff"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </React.Fragment>
            )}
            {respondedInvites.length > 0 && (
              <React.Fragment>
                <Text style={styles.sectionTitle}>Past Invites</Text>
                <View style={styles.invitesList}>
                  {respondedInvites.map((invite, index) => (
                    <React.Fragment key={index}>
                      <View style={styles.inviteCard}>
                        <View style={styles.inviteIcon}>
                          <IconSymbol
                            ios_icon_name="person.3.fill"
                            android_material_icon_name="groups"
                            size={32}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.inviteInfo}>
                          <Text style={styles.inviteCommunityName}>{invite.community_name}</Text>
                          <Text style={styles.inviteText}>
                            Invited by {invite.invited_by_username}
                          </Text>
                          <Text style={styles.inviteDate}>
                            {new Date(invite.created_at).toLocaleDateString()}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              invite.status === 'accepted'
                                ? styles.statusBadgeAccepted
                                : styles.statusBadgeDeclined,
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>
                              {invite.status === 'accepted' ? 'Accepted' : 'Declined'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </React.Fragment>
            )}
          </React.Fragment>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  invitesList: {
    gap: spacing.md,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    gap: spacing.md,
  },
  inviteIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteCommunityName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inviteText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inviteDate: {
    ...typography.small,
    color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  statusBadgeAccepted: {
    backgroundColor: colors.success,
  },
  statusBadgeDeclined: {
    backgroundColor: colors.error,
  },
  statusBadgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.error,
  },
});
