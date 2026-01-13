
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
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getCommunity,
  removeMemberFromCommunity,
  updateAllMemberScores,
  LocalCommunity,
} from '@/utils/localCommunityStorage';
import MemberAchievements from '@/components/iman/MemberAchievements';

export default function CommunityDetailScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<LocalCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const loadCommunityData = useCallback(async () => {
    if (!communityId || !user) {
      console.log('ℹ️ Missing communityId or user');
      setLoading(false);
      return;
    }

    try {
      console.log('📥 Loading community data for:', communityId);
      
      // Update all member scores
      try {
        await updateAllMemberScores(communityId);
        console.log('✅ Member scores updated');
      } catch (error) {
        console.log('ℹ️ Member score update skipped:', error);
      }
      
      // Load community
      const communityData = await getCommunity(communityId);
      
      if (!communityData) {
        console.log('❌ Community not found');
        Alert.alert('Error', 'Community not found');
        router.back();
        return;
      }
      
      setCommunity(communityData);
      
      // Get user's role
      const userMember = communityData.members.find(m => m.userId === user.id);
      if (userMember) {
        setUserRole(userMember.role);
        console.log(`✅ User role: ${userMember.role}`);
      }
      
      console.log(`✅ Successfully loaded community: ${communityData.name}`);
    } catch (error) {
      console.error('❌ Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, user]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing community data...');
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
              if (!user || !communityId) return;
              
              console.log('🚪 Leaving community...');
              await removeMemberFromCommunity(communityId, user.id);
              Alert.alert('Success', 'You have left the community');
              router.back();
              console.log('✅ Successfully left community');
            } catch (error) {
              console.error('❌ Failed to leave community:', error);
              const { getErrorMessage } = require('@/utils/errorHandler');
              Alert.alert('Error', getErrorMessage(error) || 'Failed to leave community. Please try again.');
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
              if (!communityId) return;
              
              console.log(`🗑️ Removing member ${username}...`);
              await removeMemberFromCommunity(communityId, memberId);
              Alert.alert('Success', 'Member removed successfully');
              loadCommunityData();
              console.log('✅ Member removed successfully');
            } catch (error) {
              console.error('❌ Failed to remove member:', error);
              const { getErrorMessage } = require('@/utils/errorHandler');
              Alert.alert('Error', getErrorMessage(error) || 'Failed to remove member. Please try again.');
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
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </View>
    );
  }

  // Sort members by score (highest first)
  const sortedMembers = [...community.members].sort((a, b) => b.imanScore - a.imanScore);

  // Get medal colors for top 3
  const getMedalGradient = (rank: number) => {
    if (rank === 1) return ['#FFD700', '#FFA500']; // Gold
    if (rank === 2) return ['#C0C0C0', '#A8A8A8']; // Silver
    if (rank === 3) return ['#CD7F32', '#B87333']; // Bronze
    return colors.gradientPrimary;
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

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

        {/* Toggle between Leaderboard and Members List */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, showLeaderboard && styles.toggleButtonActive]}
            onPress={() => setShowLeaderboard(true)}
          >
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji_events"
              size={20}
              color={showLeaderboard ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.toggleButtonText, showLeaderboard && styles.toggleButtonTextActive]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showLeaderboard && styles.toggleButtonActive]}
            onPress={() => setShowLeaderboard(false)}
          >
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="groups"
              size={20}
              color={!showLeaderboard ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.toggleButtonText, !showLeaderboard && styles.toggleButtonTextActive]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {showLeaderboard ? (
          // LEADERBOARD VIEW
          <View style={styles.leaderboardContainer}>
            <LinearGradient
              colors={colors.gradientOcean}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leaderboardHeader}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji_events"
                size={32}
                color="#fff"
              />
              <Text style={styles.leaderboardTitle}>Top Performers</Text>
              <Text style={styles.leaderboardSubtitle}>
                {community.members.length} {community.members.length === 1 ? 'Member' : 'Members'}
              </Text>
            </LinearGradient>

            {/* Top 3 Podium */}
            {sortedMembers.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                <View style={styles.podiumItem}>
                  <LinearGradient
                    colors={getMedalGradient(2)}
                    style={styles.podiumAvatar}
                  >
                    <Text style={styles.podiumMedal}>{getMedalIcon(2)}</Text>
                  </LinearGradient>
                  <View style={styles.podiumRank}>
                    <Text style={styles.podiumRankText}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {sortedMembers[1].username}
                  </Text>
                  <Text style={styles.podiumScore}>{sortedMembers[1].imanScore}</Text>
                  <View style={[styles.podiumBar, styles.podiumBarSecond]} />
                </View>

                {/* 1st Place */}
                <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                  <LinearGradient
                    colors={getMedalGradient(1)}
                    style={[styles.podiumAvatar, styles.podiumAvatarFirst]}
                  >
                    <Text style={styles.podiumMedalFirst}>{getMedalIcon(1)}</Text>
                  </LinearGradient>
                  <View style={[styles.podiumRank, styles.podiumRankFirst]}>
                    <Text style={styles.podiumRankText}>1</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="crown.fill"
                    android_material_icon_name="workspace_premium"
                    size={24}
                    color="#FFD700"
                    style={styles.crownIcon}
                  />
                  <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                    {sortedMembers[0].username}
                  </Text>
                  <Text style={[styles.podiumScore, styles.podiumScoreFirst]}>
                    {sortedMembers[0].imanScore}
                  </Text>
                  <View style={[styles.podiumBar, styles.podiumBarFirst]} />
                </View>

                {/* 3rd Place */}
                <View style={styles.podiumItem}>
                  <LinearGradient
                    colors={getMedalGradient(3)}
                    style={styles.podiumAvatar}
                  >
                    <Text style={styles.podiumMedal}>{getMedalIcon(3)}</Text>
                  </LinearGradient>
                  <View style={styles.podiumRank}>
                    <Text style={styles.podiumRankText}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {sortedMembers[2].username}
                  </Text>
                  <Text style={styles.podiumScore}>{sortedMembers[2].imanScore}</Text>
                  <View style={[styles.podiumBar, styles.podiumBarThird]} />
                </View>
              </View>
            )}

            {/* Rest of the leaderboard */}
            <View style={styles.leaderboardList}>
              {sortedMembers.map((member, index) => {
                const isCurrentUser = member.userId === user?.id;
                const showScore = !member.hideScore || isCurrentUser;
                const rank = index + 1;
                const isTopThree = rank <= 3;

                // Skip top 3 if we have podium
                if (isTopThree && sortedMembers.length >= 3) return null;

                return (
                  <React.Fragment key={index}>
                    <LinearGradient
                      colors={isCurrentUser ? colors.gradientPurple : ['#fff', '#fff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.leaderboardCard,
                        isCurrentUser && styles.leaderboardCardHighlight,
                      ]}
                    >
                      <View style={styles.leaderboardRank}>
                        <Text style={[styles.leaderboardRankText, isCurrentUser && styles.leaderboardRankTextHighlight]}>
                          {rank}
                        </Text>
                      </View>
                      <View style={[styles.leaderboardAvatar, isCurrentUser && styles.leaderboardAvatarHighlight]}>
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={24}
                          color={isCurrentUser ? '#fff' : colors.primary}
                        />
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <View style={styles.leaderboardNameRow}>
                          <Text style={[styles.leaderboardName, isCurrentUser && styles.leaderboardNameHighlight]}>
                            {member.username}
                          </Text>
                          {member.role === 'admin' && (
                            <View style={[styles.adminBadge, isCurrentUser && styles.adminBadgeHighlight]}>
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
                          <Text style={[styles.leaderboardScore, isCurrentUser && styles.leaderboardScoreHighlight]}>
                            {member.imanScore} points
                          </Text>
                        ) : (
                          <Text style={[styles.leaderboardScoreHidden, isCurrentUser && styles.leaderboardScoreHighlight]}>
                            Score Hidden
                          </Text>
                        )}
                      </View>
                      {userRole === 'admin' && !isCurrentUser && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveMember(member.userId, member.username)}
                        >
                          <IconSymbol
                            ios_icon_name="xmark.circle.fill"
                            android_material_icon_name="cancel"
                            size={24}
                            color={isCurrentUser ? '#fff' : colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </LinearGradient>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ) : (
          // MEMBERS LIST VIEW
          <View style={styles.membersList}>
            <Text style={styles.sectionTitle}>Members ({community.members.length})</Text>
            {sortedMembers.map((member, index) => {
              const isCurrentUser = member.userId === user?.id;
              const showScore = !member.hideScore || isCurrentUser;
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
                        <Text style={styles.memberScore}>Iman Score: {member.imanScore}</Text>
                      ) : (
                        <Text style={styles.memberScoreHidden}>Score Hidden</Text>
                      )}
                      {/* Member Achievements */}
                      <MemberAchievements userId={member.userId} limit={3} showTitle={false} />
                    </View>
                    {userRole === 'admin' && !isCurrentUser && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveMember(member.userId, member.username)}
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
        )}
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  // LEADERBOARD STYLES
  leaderboardContainer: {
    gap: spacing.lg,
  },
  leaderboardHeader: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.colored,
  },
  leaderboardTitle: {
    ...typography.h2,
    color: '#fff',
    marginTop: spacing.sm,
    fontWeight: '800',
  },
  leaderboardSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  // PODIUM STYLES
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  podiumItemFirst: {
    marginBottom: spacing.lg,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.colored,
  },
  podiumAvatarFirst: {
    width: 80,
    height: 80,
  },
  podiumMedal: {
    fontSize: 32,
  },
  podiumMedalFirst: {
    fontSize: 40,
  },
  podiumRank: {
    position: 'absolute',
    top: -8,
    right: '50%',
    transform: [{ translateX: 20 }],
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  podiumRankFirst: {
    backgroundColor: '#FFD700',
    width: 28,
    height: 28,
    transform: [{ translateX: 26 }],
  },
  podiumRankText: {
    ...typography.smallBold,
    color: '#fff',
  },
  crownIcon: {
    position: 'absolute',
    top: -12,
  },
  podiumName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
  podiumNameFirst: {
    ...typography.bodyBold,
    maxWidth: 100,
  },
  podiumScore: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  podiumScoreFirst: {
    ...typography.h3,
    color: colors.primary,
  },
  podiumBar: {
    width: '100%',
    backgroundColor: colors.highlight,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  podiumBarFirst: {
    height: 100,
    backgroundColor: colors.primaryLight,
  },
  podiumBarSecond: {
    height: 70,
    backgroundColor: colors.secondaryLight,
  },
  podiumBarThird: {
    height: 50,
    backgroundColor: colors.warning,
  },
  // LEADERBOARD LIST STYLES
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
  leaderboardCardHighlight: {
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.colored,
  },
  leaderboardRank: {
    width: 32,
    alignItems: 'center',
  },
  leaderboardRankText: {
    ...typography.h4,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  leaderboardRankTextHighlight: {
    color: '#fff',
  },
  leaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  leaderboardNameHighlight: {
    color: '#fff',
  },
  leaderboardScore: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  leaderboardScoreHighlight: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  leaderboardScoreHidden: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // MEMBERS LIST STYLES
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
  adminBadgeHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
