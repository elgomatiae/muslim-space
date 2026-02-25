
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
import { useTranslation } from '@/contexts/I18nContext';
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
import Svg, { Circle } from 'react-native-svg';

export default function CommunityDetailScreen() {
  const { t } = useTranslation();
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
        Alert.alert(t('common.error'), t('iman.communityNotFound'));
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
      Alert.alert(t('common.error'), t('iman.failedToLoadCommunity'));
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
              Alert.alert(t('common.success'), t('iman.leftCommunity'));
              router.back();
              console.log('✅ Successfully left community');
            } catch (error) {
              console.error('❌ Failed to leave community:', error);
              const { getErrorMessage } = require('@/utils/errorHandler');
              Alert.alert(t('common.error'), getErrorMessage(error) || t('iman.failedToLeaveCommunity'));
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
              Alert.alert(t('common.success'), t('iman.memberRemoved'));
              loadCommunityData();
              console.log('✅ Member removed successfully');
            } catch (error) {
              console.error('❌ Failed to remove member:', error);
              const { getErrorMessage } = require('@/utils/errorHandler');
              Alert.alert(t('common.error'), getErrorMessage(error) || t('iman.failedToRemoveMember'));
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
              android_material_icon_name="arrow-back"
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

  // Render small Iman rings for leaderboard
  const renderMemberRings = (
    sectionScores?: { ibadah: number; ilm: number; amanah: number },
    size: 'small' | 'medium' = 'small'
  ) => {
    if (!sectionScores) {
      return null;
    }

    const isSmall = size === 'small';
    const centerX = isSmall ? 40 : 50;
    const centerY = isSmall ? 40 : 50;
    const svgSize = isSmall ? 80 : 100;
    
    // Ibadah ring (outer) - Green
    const ibadahRadius = isSmall ? 34 : 42;
    const ibadahStroke = isSmall ? 6 : 8;
    const ibadahProgress = (sectionScores.ibadah || 0) / 100;
    const ibadahCircumference = 2 * Math.PI * ibadahRadius;
    const ibadahOffset = ibadahCircumference * (1 - ibadahProgress);
    
    // Ilm ring (middle) - Blue
    const ilmRadius = isSmall ? 25 : 31;
    const ilmStroke = isSmall ? 5 : 7;
    const ilmProgress = (sectionScores.ilm || 0) / 100;
    const ilmCircumference = 2 * Math.PI * ilmRadius;
    const ilmOffset = ilmCircumference * (1 - ilmProgress);
    
    // Amanah ring (inner) - Amber/Gold
    const amanahRadius = isSmall ? 16 : 20;
    const amanahStroke = isSmall ? 4 : 6;
    const amanahProgress = (sectionScores.amanah || 0) / 100;
    const amanahCircumference = 2 * Math.PI * amanahRadius;
    const amanahOffset = amanahCircumference * (1 - amanahProgress);

    const ibadahColor = '#10B981';
    const ilmColor = '#3B82F6';
    const amanahColor = '#F59E0B';

    return (
      <View style={[styles.memberRingsContainer, isSmall && styles.memberRingsContainerSmall]}>
        <Svg width={svgSize} height={svgSize} style={styles.memberRingsSvg}>
          {/* Background circles */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={ibadahRadius}
            stroke={colors.border}
            strokeWidth={ibadahStroke}
            fill="none"
            opacity={0.2}
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={ilmRadius}
            stroke={colors.border}
            strokeWidth={ilmStroke}
            fill="none"
            opacity={0.2}
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={amanahRadius}
            stroke={colors.border}
            strokeWidth={amanahStroke}
            fill="none"
            opacity={0.2}
          />
          
          {/* Progress circles */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={ibadahRadius}
            stroke={ibadahColor}
            strokeWidth={ibadahStroke}
            fill="none"
            strokeDasharray={ibadahCircumference}
            strokeDashoffset={ibadahOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${centerX} ${centerY})`}
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={ilmRadius}
            stroke={ilmColor}
            strokeWidth={ilmStroke}
            fill="none"
            strokeDasharray={ilmCircumference}
            strokeDashoffset={ilmOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${centerX} ${centerY})`}
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={amanahRadius}
            stroke={amanahColor}
            strokeWidth={amanahStroke}
            fill="none"
            strokeDasharray={amanahCircumference}
            strokeDashoffset={amanahOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${centerX} ${centerY})`}
          />
        </Svg>
        <View style={[styles.memberRingsCenter, isSmall && styles.memberRingsCenterSmall]}>
          <Text style={[styles.memberRingsCenterText, isSmall && styles.memberRingsCenterTextSmall]}>
            {Math.round(
              (sectionScores.ibadah * 0.6) + 
              (sectionScores.ilm * 0.25) + 
              (sectionScores.amanah * 0.15)
            )}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
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
                android_material_icon_name="person-add"
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
              android_material_icon_name="emoji-events"
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
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leaderboardHeader}
            >
              <View style={styles.leaderboardHeaderIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.leaderboardHeaderIcon}
                >
                  <IconSymbol
                    ios_icon_name="trophy.fill"
                    android_material_icon_name="emoji-events"
                    size={48}
                    color="#fff"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.leaderboardTitle}>🏆 Leaderboard 🏆</Text>
              <Text style={styles.leaderboardSubtitle}>
                {community.members.length} {community.members.length === 1 ? 'Member' : 'Members'} Competing
              </Text>
              <View style={styles.leaderboardStats}>
                <View style={styles.leaderboardStatItem}>
                  <Text style={styles.leaderboardStatValue}>{sortedMembers[0]?.imanScore || 0}</Text>
                  <Text style={styles.leaderboardStatLabel}>Top Score</Text>
                </View>
                <View style={styles.leaderboardStatDivider} />
                <View style={styles.leaderboardStatItem}>
                  <Text style={styles.leaderboardStatValue}>
                    {Math.round(sortedMembers.reduce((sum, m) => sum + m.imanScore, 0) / sortedMembers.length) || 0}
                  </Text>
                  <Text style={styles.leaderboardStatLabel}>Avg Score</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Top 3 Podium - Enhanced */}
            {sortedMembers.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                <View style={styles.podiumItem}>
                  <View style={styles.podiumItemWrapper}>
                    <LinearGradient
                      colors={['#C0C0C0', '#A8A8A8', '#808080']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.podiumAvatar}
                    >
                      <Text style={styles.podiumMedal}>{getMedalIcon(2)}</Text>
                    </LinearGradient>
                    <View style={[styles.podiumRank, styles.podiumRankSecond]}>
                      <Text style={styles.podiumRankText}>2</Text>
                    </View>
                    <View style={styles.podiumGlowSecond} />
                  </View>
                  <View style={styles.podiumInfo}>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {sortedMembers[1].username}
                    </Text>
                    <View style={styles.podiumScoreContainer}>
                      <Text style={styles.podiumScore}>{sortedMembers[1].imanScore}</Text>
                      <Text style={styles.podiumScoreLabel}>Iman Score</Text>
                    </View>
                    {sortedMembers[1].sectionScores && (
                      <View style={styles.podiumRingsContainer}>
                        {renderMemberRings(sortedMembers[1].sectionScores, 'medium')}
                      </View>
                    )}
                  </View>
                  <LinearGradient
                    colors={['#C0C0C0', '#A8A8A8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.podiumBar, styles.podiumBarSecond]}
                  >
                    <View style={styles.podiumBarInner} />
                  </LinearGradient>
                </View>

                {/* 1st Place - Champion */}
                <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                  <View style={styles.podiumItemWrapper}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.podiumAvatar, styles.podiumAvatarFirst]}
                    >
                      <Text style={styles.podiumMedalFirst}>{getMedalIcon(1)}</Text>
                      <View style={styles.podiumSparkles}>
                        <Text style={styles.sparkle}>✨</Text>
                      </View>
                    </LinearGradient>
                    <View style={[styles.podiumRank, styles.podiumRankFirst]}>
                      <Text style={styles.podiumRankTextFirst}>1</Text>
                    </View>
                    <View style={styles.podiumGlowFirst} />
                    <IconSymbol
                      ios_icon_name="crown.fill"
                      android_material_icon_name="workspace-premium"
                      size={32}
                      color="#FFD700"
                      style={styles.crownIcon}
                    />
                  </View>
                  <View style={styles.podiumInfo}>
                    <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                      {sortedMembers[0].username}
                    </Text>
                    <View style={styles.podiumScoreContainer}>
                      <Text style={[styles.podiumScore, styles.podiumScoreFirst]}>
                        {sortedMembers[0].imanScore}
                      </Text>
                      <Text style={styles.podiumScoreLabel}>Iman Score</Text>
                    </View>
                    {sortedMembers[0].sectionScores && (
                      <View style={styles.podiumRingsContainer}>
                        {renderMemberRings(sortedMembers[0].sectionScores, 'medium')}
                      </View>
                    )}
                  </View>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.podiumBar, styles.podiumBarFirst]}
                  >
                    <View style={styles.podiumBarInner} />
                  </LinearGradient>
                </View>

                {/* 3rd Place */}
                <View style={styles.podiumItem}>
                  <View style={styles.podiumItemWrapper}>
                    <LinearGradient
                      colors={['#CD7F32', '#B87333', '#A0522D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.podiumAvatar}
                    >
                      <Text style={styles.podiumMedal}>{getMedalIcon(3)}</Text>
                    </LinearGradient>
                    <View style={[styles.podiumRank, styles.podiumRankThird]}>
                      <Text style={styles.podiumRankText}>3</Text>
                    </View>
                    <View style={styles.podiumGlowThird} />
                  </View>
                  <View style={styles.podiumInfo}>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {sortedMembers[2].username}
                    </Text>
                    <View style={styles.podiumScoreContainer}>
                      <Text style={styles.podiumScore}>{sortedMembers[2].imanScore}</Text>
                      <Text style={styles.podiumScoreLabel}>Iman Score</Text>
                    </View>
                    {sortedMembers[2].sectionScores && (
                      <View style={styles.podiumRingsContainer}>
                        {renderMemberRings(sortedMembers[2].sectionScores, 'medium')}
                      </View>
                    )}
                  </View>
                  <LinearGradient
                    colors={['#CD7F32', '#B87333']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.podiumBar, styles.podiumBarThird]}
                  >
                    <View style={styles.podiumBarInner} />
                  </LinearGradient>
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
                      colors={isCurrentUser 
                        ? ['#667eea', '#764ba2', '#f093fb'] 
                        : [colors.card, colors.card]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.leaderboardCard,
                        isCurrentUser && styles.leaderboardCardHighlight,
                      ]}
                    >
                      <View style={styles.leaderboardRankContainer}>
                        <LinearGradient
                          colors={isCurrentUser 
                            ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                            : [colors.highlight, colors.highlight]
                          }
                          style={styles.leaderboardRank}
                        >
                          <Text style={[styles.leaderboardRankText, isCurrentUser && styles.leaderboardRankTextHighlight]}>
                            {rank}
                          </Text>
                        </LinearGradient>
                      </View>
                      <LinearGradient
                        colors={isCurrentUser
                          ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']
                          : [colors.highlight, colors.highlight + '80']
                        }
                        style={[styles.leaderboardAvatar, isCurrentUser && styles.leaderboardAvatarHighlight]}
                      >
                        <IconSymbol
                          ios_icon_name="person.fill"
                          android_material_icon_name="person"
                          size={28}
                          color={isCurrentUser ? '#fff' : colors.primary}
                        />
                      </LinearGradient>
                      <View style={styles.leaderboardInfo}>
                        <View style={styles.leaderboardNameRow}>
                          <Text style={[styles.leaderboardName, isCurrentUser && styles.leaderboardNameHighlight]}>
                            {member.username}
                          </Text>
                          {member.role === 'admin' && (
                            <LinearGradient
                              colors={isCurrentUser 
                                ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'] as const
                                : colors.gradientPrimary as any
                              }
                              style={[styles.adminBadge, isCurrentUser && styles.adminBadgeHighlight]}
                            >
                              <Text style={styles.adminBadgeText}>👑 Admin</Text>
                            </LinearGradient>
                          )}
                          {isCurrentUser && (
                            <LinearGradient
                              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                              style={styles.youBadge}
                            >
                              <Text style={styles.youBadgeText}>⭐ You</Text>
                            </LinearGradient>
                          )}
                        </View>
                        {showScore ? (
                          <>
                            <View style={styles.leaderboardScoreRow}>
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={18}
                                color={isCurrentUser ? '#FFD700' : colors.warning}
                              />
                              <Text style={[styles.leaderboardScore, isCurrentUser && styles.leaderboardScoreHighlight]}>
                                {member.imanScore}% Iman Score
                              </Text>
                            </View>
                            {member.sectionScores && (
                              <View style={styles.leaderboardRingsRow}>
                                <View style={styles.leaderboardRingsContainer}>
                                  {renderMemberRings(member.sectionScores, 'small')}
                                </View>
                                <View style={styles.leaderboardRingScores}>
                                  <View style={styles.leaderboardRingScoreItem}>
                                    <View style={[styles.leaderboardRingDot, { backgroundColor: '#10B981' }]} />
                                    <Text style={[styles.leaderboardRingScoreText, isCurrentUser && styles.leaderboardRingScoreTextHighlight]}>
                                      ʿIbādah: {Math.round(member.sectionScores.ibadah)}%
                                    </Text>
                                  </View>
                                  <View style={styles.leaderboardRingScoreItem}>
                                    <View style={[styles.leaderboardRingDot, { backgroundColor: '#3B82F6' }]} />
                                    <Text style={[styles.leaderboardRingScoreText, isCurrentUser && styles.leaderboardRingScoreTextHighlight]}>
                                      ʿIlm: {Math.round(member.sectionScores.ilm)}%
                                    </Text>
                                  </View>
                                  <View style={styles.leaderboardRingScoreItem}>
                                    <View style={[styles.leaderboardRingDot, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={[styles.leaderboardRingScoreText, isCurrentUser && styles.leaderboardRingScoreTextHighlight]}>
                                      Amanah: {Math.round(member.sectionScores.amanah)}%
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            )}
                          </>
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
                            size={28}
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
    gap: spacing.xl,
  },
  leaderboardHeader: {
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.colored,
    marginBottom: spacing.md,
  },
  leaderboardHeaderIconContainer: {
    marginBottom: spacing.md,
  },
  leaderboardHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  leaderboardTitle: {
    ...typography.h1,
    color: '#fff',
    marginTop: spacing.md,
    fontWeight: '900',
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  leaderboardSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardStats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  leaderboardStatItem: {
    alignItems: 'center',
  },
  leaderboardStatValue: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '900',
    fontSize: 28,
  },
  leaderboardStatLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    fontSize: 12,
  },
  leaderboardStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // PODIUM STYLES - ENHANCED
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 120,
  },
  podiumItemFirst: {
    marginBottom: spacing.xl,
    maxWidth: 140,
  },
  podiumItemWrapper: {
    position: 'relative',
    alignItems: 'center',
    width: '100%',
  },
  podiumAvatar: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    borderWidth: 4,
    borderColor: '#fff',
  },
  podiumAvatarFirst: {
    width: 120,
    height: 120,
    borderWidth: 5,
    borderColor: '#FFD700',
  },
  podiumMedal: {
    fontSize: 48,
  },
  podiumMedalFirst: {
    fontSize: 64,
  },
  podiumSparkles: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle: {
    fontSize: 24,
  },
  podiumRank: {
    position: 'absolute',
    top: -12,
    right: '50%',
    transform: [{ translateX: 30 }],
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...shadows.medium,
  },
  podiumRankFirst: {
    backgroundColor: '#FFD700',
    width: 44,
    height: 44,
    transform: [{ translateX: 38 }],
    borderWidth: 4,
    borderColor: '#fff',
  },
  podiumRankSecond: {
    backgroundColor: '#C0C0C0',
    transform: [{ translateX: 28 }],
  },
  podiumRankThird: {
    backgroundColor: '#CD7F32',
    transform: [{ translateX: 28 }],
  },
  podiumRankText: {
    ...typography.h4,
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  podiumRankTextFirst: {
    fontSize: 22,
  },
  podiumGlowFirst: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    top: -10,
    zIndex: -1,
  },
  podiumGlowSecond: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    top: -10,
    zIndex: -1,
  },
  podiumGlowThird: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    top: -10,
    zIndex: -1,
  },
  crownIcon: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
    ...shadows.medium,
  },
  podiumInfo: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.xs,
  },
  podiumName: {
    ...typography.bodyBold,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  podiumNameFirst: {
    ...typography.h4,
    fontSize: 18,
    fontWeight: '900',
  },
  podiumScoreContainer: {
    alignItems: 'center',
    gap: 2,
  },
  podiumScore: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '900',
    fontSize: 24,
  },
  podiumScoreFirst: {
    ...typography.h2,
    fontSize: 32,
    color: '#FFD700',
  },
  podiumScoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  podiumBarInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  podiumBarFirst: {
    height: 140,
  },
  podiumBarSecond: {
    height: 100,
  },
  podiumBarThird: {
    height: 80,
  },
  // LEADERBOARD LIST STYLES - ENHANCED
  leaderboardList: {
    gap: spacing.lg,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.large,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  leaderboardCardHighlight: {
    borderWidth: 3,
    borderColor: '#fff',
    ...shadows.colored,
    transform: [{ scale: 1.02 }],
  },
  leaderboardRankContainer: {
    alignItems: 'center',
  },
  leaderboardRank: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  leaderboardRankText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '900',
    fontSize: 20,
  },
  leaderboardRankTextHighlight: {
    color: '#fff',
  },
  leaderboardAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.medium,
  },
  leaderboardAvatarHighlight: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  leaderboardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  leaderboardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  leaderboardName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  leaderboardNameHighlight: {
    color: '#fff',
    fontWeight: '900',
  },
  leaderboardScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  leaderboardScore: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  leaderboardScoreHighlight: {
    color: '#fff',
    fontWeight: '900',
  },
  leaderboardScoreHidden: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // MEMBER RINGS STYLES
  memberRingsContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  memberRingsContainerSmall: {
    width: 80,
    height: 80,
  },
  memberRingsSvg: {
    position: 'absolute',
  },
  memberRingsCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  memberRingsCenterSmall: {
    width: 32,
    height: 32,
  },
  memberRingsCenterText: {
    ...typography.h4,
    fontWeight: '900',
    color: colors.text,
    fontSize: 14,
  },
  memberRingsCenterTextSmall: {
    fontSize: 12,
  },
  podiumRingsContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  leaderboardRingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  leaderboardRingsContainer: {
    width: 80,
    height: 80,
  },
  leaderboardRingScores: {
    flex: 1,
    gap: spacing.xs,
  },
  leaderboardRingScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  leaderboardRingDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.round,
  },
  leaderboardRingScoreText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  leaderboardRingScoreTextHighlight: {
    color: 'rgba(255, 255, 255, 0.9)',
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
