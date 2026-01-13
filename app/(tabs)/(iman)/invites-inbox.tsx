
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
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getUserInvites as getLocalInvites,
  acceptInvite as acceptLocalInvite,
  declineInvite as declineLocalInvite,
  CommunityInvite as LocalCommunityInvite,
} from '@/utils/localCommunityStorage';
import {
  getUserInvites,
  acceptCommunityInvite,
  declineCommunityInvite,
  CommunityInvite,
} from '@/services/CommunityInviteService';

export default function InvitesInboxScreen() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<CommunityInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!user) {
      console.log('ℹ️ No user logged in, skipping invites fetch');
      setInvites([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('📥 Fetching invites from Supabase for user:', user.id);
      
      // Fetch from Supabase
      const supabaseInvites = await getUserInvites(user.id);
      
      // Also fetch local invites (for backward compatibility)
      let localInvites: LocalCommunityInvite[] = [];
      try {
        localInvites = await getLocalInvites(user.id);
      } catch (error) {
        console.log('ℹ️ No local invites found');
      }
      
      // Convert local invites to Supabase format and merge
      const allInvites: CommunityInvite[] = [
        ...supabaseInvites,
        ...localInvites.map((inv: LocalCommunityInvite) => ({
          id: inv.id,
          community_id: inv.communityId,
          community_name: inv.communityName,
          invited_by_user_id: inv.invitedBy,
          invited_by_username: inv.invitedByUsername,
          invited_user_id: inv.invitedUserId,
          invited_username: inv.invitedUsername,
          status: inv.status,
          created_at: inv.createdAt,
          responded_at: inv.respondedAt,
        })),
      ];
      
      setInvites(allInvites);
      console.log(`✅ Loaded ${allInvites.length} invites (${supabaseInvites.length} from Supabase, ${localInvites.length} local)`);
    } catch (error) {
      console.log('ℹ️ Error fetching invites (non-critical):', error);
      setInvites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing invites...');
    setRefreshing(true);
    fetchInvites();
  }, [fetchInvites]);

  const handleAcceptInvite = async (invite: CommunityInvite) => {
    if (!user) return;

    setProcessingInviteId(invite.id);
    try {
      console.log('✅ Accepting invite:', invite.id);
      
      // Try Supabase first, fallback to local
      try {
        await acceptCommunityInvite(invite.id);
      } catch (error) {
        // If Supabase fails, try local storage (for backward compatibility)
        console.log('⚠️ Supabase accept failed, trying local...');
        await acceptLocalInvite(invite.id);
      }
      
      Alert.alert('Success', 'You have joined the community!');
      fetchInvites();
      console.log('✅ Invite accepted successfully');
    } catch (error: any) {
      console.error('❌ Error accepting invite:', error);
      const { getErrorMessage } = require('@/utils/errorHandler');
      Alert.alert('Error', getErrorMessage(error) || 'Failed to accept invite. Please try again.');
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleDeclineInvite = async (invite: CommunityInvite) => {
    setProcessingInviteId(invite.id);
    try {
      console.log('❌ Declining invite:', invite.id);
      
      // Try Supabase first, fallback to local
      try {
        await declineCommunityInvite(invite.id);
      } catch (error) {
        // If Supabase fails, try local storage (for backward compatibility)
        console.log('⚠️ Supabase decline failed, trying local...');
        await declineLocalInvite(invite.id);
      }
      
      Alert.alert('Success', 'Invite declined');
      fetchInvites();
      console.log('✅ Invite declined successfully');
    } catch (error: any) {
      console.error('❌ Error declining invite:', error);
      const { getErrorMessage } = require('@/utils/errorHandler');
      Alert.alert('Error', getErrorMessage(error) || 'Failed to decline invite. Please try again.');
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
          <Text style={styles.loadingText}>Loading invites...</Text>
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
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
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
