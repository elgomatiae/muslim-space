
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

interface Member {
  user_id: string;
  username: string;
  overall_score: number;
  ibadah_score: number;
  ilm_score: number;
  amanah_score: number;
  rank: number;
  hide_score: boolean;
  is_admin: boolean;
}

type LeaderboardPeriod = 'today' | 'week';

export default function CommunityDetailScreen() {
  const { communityId, communityName } = useLocalSearchParams<{
    communityId: string;
    communityName: string;
  }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'leaderboard'>('leaderboard');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('today');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!communityId || !user) return;

    try {
      // Check if current user is admin
      const { data: membershipData, error: membershipError } = await supabase
        .from('community_members')
        .select('is_admin')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (membershipError) throw membershipError;
      setIsAdmin(membershipData?.is_admin || false);

      // Fetch members with their admin status
      const { data: membersData, error: membersError } = await supabase
        .from('community_members')
        .select(`
          user_id,
          hide_score,
          is_admin,
          user_profiles!inner (
            username
          )
        `)
        .eq('community_id', communityId);

      if (membersError) throw membersError;

      // Fetch leaderboard data
      const functionName = leaderboardPeriod === 'today' 
        ? 'get_community_leaderboard_today'
        : 'get_community_leaderboard_week';

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc(functionName, { community_id_param: communityId });

      if (leaderboardError) throw leaderboardError;

      // Merge data
      const formattedMembers: Member[] = leaderboardData?.map((lb: any) => {
        const memberData = membersData?.find(m => m.user_id === lb.user_id);
        return {
          user_id: lb.user_id,
          username: lb.username || 'Unknown',
          overall_score: lb.overall_score,
          ibadah_score: lb.ibadah_score,
          ilm_score: lb.ilm_score,
          amanah_score: lb.amanah_score,
          rank: lb.rank,
          hide_score: lb.hide_score,
          is_admin: memberData?.is_admin || false,
        };
      }) || [];

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, user, leaderboardPeriod]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMembers();
  }, [fetchMembers]);

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
              fetchMembers();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = (member: Member, index: number) => {
    const isCurrentUser = member.user_id === user?.id;
    const showScore = !member.hide_score || isCurrentUser;

    return (
      <React.Fragment key={index}>
        <View style={styles.memberCard}>
          <View style={styles.memberInfo}>
            <View style={styles.memberAvatar}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.memberDetails}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.username}</Text>
                {member.is_admin && (
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
                <Text style={styles.memberScore}>
                  Iman Score: {member.overall_score}
                </Text>
              ) : (
                <Text style={styles.memberScoreHidden}>Score Hidden</Text>
              )}
            </View>
          </View>
          {isAdmin && !isCurrentUser && (
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
  };

  const renderLeaderboardItem = (member: Member, index: number) => {
    const isCurrentUser = member.user_id === user?.id;
    const showScore = !member.hide_score || isCurrentUser;
    const isTopThree = index < 3;

    return (
      <React.Fragment key={index}>
        <View
          style={[
            styles.leaderboardCard,
            isTopThree && styles.leaderboardCardTopThree,
            isCurrentUser && styles.leaderboardCardCurrentUser,
          ]}
        >
          <View style={styles.rankContainer}>
            {isTopThree ? (
              <View style={[styles.rankBadge, styles[`rankBadge${index + 1}` as keyof typeof styles]]}>
                <Text style={styles.rankBadgeText}>{index + 1}</Text>
              </View>
            ) : (
              <Text style={styles.rankText}>{member.rank}</Text>
            )}
          </View>
          <View style={styles.leaderboardInfo}>
            <View style={styles.leaderboardNameRow}>
              <Text style={styles.leaderboardName}>{member.username}</Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
            {showScore ? (
              <React.Fragment>
                <Text style={styles.leaderboardScore}>
                  Overall: {member.overall_score}
                </Text>
                <View style={styles.scoreBreakdown}>
                  <Text style={styles.scoreBreakdownText}>
                    Ibadah: {member.ibadah_score}
                  </Text>
                  <Text style={styles.scoreBreakdownText}>
                    Ilm: {member.ilm_score}
                  </Text>
                  <Text style={styles.scoreBreakdownText}>
                    Amanah: {member.amanah_score}
                  </Text>
                </View>
              </React.Fragment>
            ) : (
              <Text style={styles.memberScoreHidden}>Score Hidden</Text>
            )}
          </View>
        </View>
      </React.Fragment>
    );
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {communityName}
          </Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {communityName}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/(iman)/invite-user',
                params: { communityId, communityName },
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
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'leaderboard' && styles.tabTextActive,
            ]}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}
          >
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector (for leaderboard) */}
      {activeTab === 'leaderboard' && (
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              leaderboardPeriod === 'today' && styles.periodButtonActive,
            ]}
            onPress={() => setLeaderboardPeriod('today')}
          >
            <Text
              style={[
                styles.periodButtonText,
                leaderboardPeriod === 'today' && styles.periodButtonTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              leaderboardPeriod === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setLeaderboardPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                leaderboardPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'leaderboard' ? (
          <View style={styles.leaderboardList}>
            {members.map((member, index) => renderLeaderboardItem(member, index))}
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member, index) => renderMemberItem(member, index))}
          </View>
        )}
      </ScrollView>

      {/* Leave Community Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveCommunity}
        >
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
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inviteButton: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.card,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 3,
  },
  membersList: {
    gap: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberDetails: {
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
  leaderboardList: {
    gap: spacing.md,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    gap: spacing.md,
  },
  leaderboardCardTopThree: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  leaderboardCardCurrentUser: {
    backgroundColor: colors.highlight,
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadge1: {
    backgroundColor: '#FFD700',
  },
  rankBadge2: {
    backgroundColor: '#C0C0C0',
  },
  rankBadge3: {
    backgroundColor: '#CD7F32',
  },
  rankBadgeText: {
    ...typography.h4,
    color: '#fff',
    fontWeight: '800',
  },
  rankText: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  leaderboardName: {
    ...typography.h4,
    color: colors.text,
  },
  leaderboardScore: {
    ...typography.bodyBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreBreakdownText: {
    ...typography.caption,
    color: colors.textSecondary,
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
