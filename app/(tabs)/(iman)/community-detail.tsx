
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
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Community {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
}

interface Member {
  user_id: string;
  username: string;
  role: 'admin' | 'member';
  hide_score: boolean;
  iman_score: number;
}

export default function CommunityDetailScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');

  const loadCommunityData = useCallback(async () => {
    if (!communityId || !user) return;

    try {
      // Get community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id, name, description, created_by')
        .eq('id', communityId)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Get user's role
      const { data: membershipData, error: membershipError } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (membershipError) throw membershipError;
      setUserRole(membershipData.role);

      // Get all members
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          user_id,
          role,
          hide_score,
          user_profiles!inner (username)
        `)
        .eq('community_id', communityId);

      if (membersError) throw membersError;

      // Get Iman scores from iman_tracker_goals
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: scoresData, error: scoresError } = await supabase
        .from('iman_tracker_goals')
        .select('user_id, ibadah_score, ilm_score, amanah_score')
        .in('user_id', userIds);

      if (scoresError) throw scoresError;

      // Calculate overall scores
      const scoresMap = new Map(
        scoresData?.map(s => [
          s.user_id,
          Math.round(
            (Number(s.ibadah_score) || 0) * 0.5 +
            (Number(s.ilm_score) || 0) * 0.3 +
            (Number(s.amanah_score) || 0) * 0.2
          ),
        ]) || []
      );

      const formattedMembers: Member[] = membersData?.map(m => ({
        user_id: m.user_id,
        username: (m.user_profiles as any)?.username || 'Unknown',
        role: m.role,
        hide_score: m.hide_score,
        iman_score: scoresMap.get(m.user_id) || 0,
      })) || [];

      // Sort by score (highest first)
      formattedMembers.sort((a, b) => b.iman_score - a.iman_score);

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, user]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommunityData();
  }, [loadCommunityData]);

  const handleLeaveCommunity = () => {
    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('user_id', user?.id);

              if (error) throw error;

              Alert.alert('Success', 'You have left the community');
              router.back();
            } catch (error) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, username: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('user_id', memberId);

              if (error) throw error;

              Alert.alert('Success', 'Member removed successfully');
              loadCommunityData();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  if (loading || !community) {
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
          <Text style={styles.headerTitle}>Community</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={styles.headerRight}>
          {userRole === 'admin' && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/(iman)/invite-user',
                  params: { communityId, communityName: community.name },
                })
              }
            >
              <IconSymbol
                ios_icon_name="person.badge.plus"
                android_material_icon_name="person_add"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {community.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{community.description}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Members ({members.length})</Text>

        <View style={styles.membersList}>
          {members.map((member, index) => {
            const isCurrentUser = member.user_id === user?.id;
            const showScore = !member.hide_score || isCurrentUser;
            const rank = index + 1;

            return (
              <React.Fragment key={index}>
                <View style={styles.memberCard}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{rank}</Text>
                  </View>
                  <View style={styles.memberAvatar}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      {member.role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                      {isCurrentUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>You</Text>
                        </View>
                      )}
                    </View>
                    {showScore ? (
                      <Text style={styles.memberScore}>Iman Score: {member.iman_score}</Text>
                    ) : (
                      <Text style={styles.memberScoreHidden}>Score Hidden</Text>
                    )}
                  </View>
                  {userRole === 'admin' && !isCurrentUser && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMember(member.user_id, member.username)}
                    >
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCommunity}>
          <Text style={styles.leaveButtonText}>Leave Community</Text>
        </TouchableOpacity>
      </View>
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
    marginHorizontal: spacing.md,
  },
  headerRight: {
    width: 40,
  },
  inviteButton: {
    padding: spacing.sm,
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 3,
  },
  descriptionCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  membersList: {
    gap: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    gap: spacing.md,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    ...typography.h4,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  memberName: {
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
  youBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  youBadgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  memberScore: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  memberScoreHidden: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  removeButton: {
    padding: spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  leaveButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  leaveButtonText: {
    ...typography.bodyBold,
    color: '#fff',
  },
});
