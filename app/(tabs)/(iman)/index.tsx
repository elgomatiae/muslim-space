
import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import IbadahSection from "./ibadah-section";
import IlmSection from "./ilm-section";
import AmanahSection from "./amanah-section";

type TabType = 'tracker' | 'achievements' | 'communities';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  order_index: number;
  unlock_message: string;
  next_steps: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  current_value: number;
}

interface Community {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_admin: boolean;
}

export default function ImanTrackerScreen() {
  const { user } = useAuth();
  const { refreshData, loading } = useImanTracker();
  const [activeTab, setActiveTab] = useState<TabType>('tracker');
  const [refreshing, setRefreshing] = React.useState(false);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    if (activeTab === 'achievements') {
      await loadAchievements();
    } else if (activeTab === 'communities') {
      await loadCommunities();
    }
    setRefreshing(false);
  }, [refreshData, activeTab]);

  // Load achievements when tab is selected
  useEffect(() => {
    if (activeTab === 'achievements' && achievements.length === 0) {
      loadAchievements();
    }
  }, [activeTab]);

  // Load communities when tab is selected
  useEffect(() => {
    if (activeTab === 'communities' && communities.length === 0) {
      loadCommunities();
      loadPendingInvites();
    }
  }, [activeTab]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setAchievementsLoading(true);

      // Load all data in parallel for better performance
      const [achievementsResult, userAchievementsResult, progressResult] = await Promise.all([
        supabase
          .from('achievements')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id),
        supabase
          .from('achievement_progress')
          .select('achievement_id, current_value')
          .eq('user_id', user.id)
      ]);

      if (achievementsResult.error) {
        console.log('Error loading achievements:', achievementsResult.error);
        return;
      }

      const allAchievements = achievementsResult.data || [];
      const userAchievements = userAchievementsResult.data || [];
      const progressData = progressResult.data || [];

      // Create lookup maps for O(1) access
      const unlockedMap = new Map(
        userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at])
      );
      const progressMap = new Map(
        progressData.map(p => [p.achievement_id, p.current_value])
      );

      // Merge data synchronously
      const mergedAchievements = allAchievements.map((achievement) => {
        const unlockedAt = unlockedMap.get(achievement.id);
        const unlocked = !!unlockedAt;
        const currentValue = progressMap.get(achievement.id) || 0;
        const progress = unlocked ? 100 : Math.min(100, (currentValue / achievement.requirement_value) * 100);

        return {
          ...achievement,
          unlocked,
          unlocked_at: unlockedAt,
          progress,
          current_value: currentValue,
        };
      });

      setAchievements(mergedAchievements);
    } catch (error) {
      console.log('Error in loadAchievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const loadCommunities = async () => {
    if (!user) return;

    try {
      setCommunitiesLoading(true);

      // Fetch communities where user is a member - split the query to avoid nested query issues
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('community_id, is_admin')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching community members:', memberError);
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        setCommunities([]);
        setCommunitiesLoading(false);
        return;
      }

      // Get community IDs
      const communityIds = memberData.map(m => m.community_id);

      // Fetch community details separately
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name, created_by, created_at')
        .in('id', communityIds);

      if (communitiesError) {
        console.error('Error fetching communities:', communitiesError);
        throw communitiesError;
      }

      // Get member counts for each community
      const { data: countData, error: countError } = await supabase
        .from('community_members')
        .select('community_id')
        .in('community_id', communityIds);

      if (countError) {
        console.error('Error fetching member counts:', countError);
        throw countError;
      }

      // Count members per community
      const memberCounts: Record<string, number> = {};
      countData?.forEach(item => {
        memberCounts[item.community_id] = (memberCounts[item.community_id] || 0) + 1;
      });

      // Create a map of community_id to is_admin
      const adminMap = new Map(memberData.map(m => [m.community_id, m.is_admin]));

      // Format communities
      const formattedCommunities: Community[] = communitiesData?.map(community => ({
        id: community.id,
        name: community.name,
        created_by: community.created_by,
        created_at: community.created_at,
        member_count: memberCounts[community.id] || 0,
        is_admin: adminMap.get(community.id) || false,
      })) || [];

      setCommunities(formattedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_invites')
        .select('id')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending invites:', error);
        throw error;
      }
      setPendingInvitesCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      setPendingInvitesCount(0);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#A78BFA';
      case 'gold': return '#FBBF24';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#CD7F32';
      default: return colors.textSecondary;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ibadah': return '#10B981';
      case 'ilm': return '#3B82F6';
      case 'amanah': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const handleCommunityPress = (community: Community) => {
    router.push({
      pathname: '/(tabs)/(iman)/community-detail',
      params: { communityId: community.id, communityName: community.name },
    });
  };

  const handleCreateCommunity = () => {
    router.push('/(tabs)/(iman)/communities');
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const nextAchievement = achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ENHANCED HEADER */}
      <LinearGradient
        colors={colors.gradientOcean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerIconContainer}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto-awesome"
            size={48}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.header}>Iman Tracker</Text>
          <Text style={styles.subtitle}>Track your spiritual journey daily</Text>
        </View>
        <View style={styles.headerDecoration}>
          <IconSymbol
            ios_icon_name="moon.stars.fill"
            android_material_icon_name="nights-stay"
            size={36}
            color="rgba(255, 255, 255, 0.6)"
          />
        </View>
      </LinearGradient>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tracker' && styles.tabActive]}
          onPress={() => setActiveTab('tracker')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chart.pie.fill"
            android_material_icon_name="pie-chart"
            size={20}
            color={activeTab === 'tracker' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>
            Tracker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
          onPress={() => setActiveTab('achievements')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="trophy.fill"
            android_material_icon_name="emoji-events"
            size={20}
            color={activeTab === 'achievements' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            Achievements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'communities' && styles.tabActive]}
          onPress={() => setActiveTab('communities')}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="person.3.fill"
            android_material_icon_name="groups"
            size={20}
            color={activeTab === 'communities' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'communities' && styles.tabTextActive]}>
            Communities
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT */}
      {activeTab === 'tracker' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* IMAN RINGS DISPLAY */}
          <ImanRingsDisplay onRefresh={onRefresh} />

          {/* DEDICATED SECTIONS FOR EACH RING */}
          <IbadahSection />
          <IlmSection />
          <AmanahSection />

          {/* QUICK ACCESS FEATURES */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Track & Grow</Text>
            
            <View style={styles.featuresGrid}>
              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => router.push('/(tabs)/(iman)/trends' as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <IconSymbol
                    ios_icon_name="chart.line.uptrend.xyaxis"
                    android_material_icon_name="trending-up"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureTitle}>Trends</Text>
                  <Text style={styles.featureSubtitle}>View progress</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.featureCard}
                onPress={() => router.push('/(tabs)/(iman)/goals-settings' as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <IconSymbol
                    ios_icon_name="target"
                    android_material_icon_name="flag"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureTitle}>Goals</Text>
                  <Text style={styles.featureSubtitle}>Set targets</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {activeTab === 'achievements' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {achievementsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading achievements...</Text>
            </View>
          ) : (
            <>
              {/* Stats Card */}
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCard}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <IconSymbol
                      ios_icon_name="trophy.fill"
                      android_material_icon_name="emoji-events"
                      size={32}
                      color={colors.card}
                    />
                    <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
                    <Text style={styles.statLabel}>Unlocked</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <IconSymbol
                      ios_icon_name="star.fill"
                      android_material_icon_name="star"
                      size={32}
                      color={colors.card}
                    />
                    <Text style={styles.statValue}>{totalPoints}</Text>
                    <Text style={styles.statLabel}>Total Points</Text>
                  </View>
                </View>

                <Text style={styles.statsSubtext}>
                  {unlockedCount === 0 
                    ? 'Start your journey to unlock achievements!'
                    : unlockedCount === achievements.length
                    ? 'Masha\'Allah! You\'ve unlocked all achievements!'
                    : `Keep going! ${achievements.length - unlockedCount} more to unlock`}
                </Text>
              </LinearGradient>

              {/* Next Achievement Card */}
              {nextAchievement && (
                <TouchableOpacity
                  style={styles.nextAchievementCard}
                  onPress={() => router.push('/(tabs)/(iman)/achievements')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[getTierColor(nextAchievement.tier) + '20', getTierColor(nextAchievement.tier) + '10']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextAchievementGradient}
                  >
                    <View style={styles.nextAchievementHeader}>
                      <IconSymbol
                        ios_icon_name="target"
                        android_material_icon_name="flag"
                        size={20}
                        color={getTierColor(nextAchievement.tier)}
                      />
                      <Text style={styles.nextAchievementTitle}>Next Achievement</Text>
                    </View>

                    <View style={styles.nextAchievementContent}>
                      <View style={[styles.nextAchievementIcon, { backgroundColor: getTierColor(nextAchievement.tier) }]}>
                        <IconSymbol
                          ios_icon_name="lock.fill"
                          android_material_icon_name="lock"
                          size={24}
                          color={colors.card}
                        />
                      </View>

                      <View style={styles.nextAchievementInfo}>
                        <Text style={styles.nextAchievementName}>{nextAchievement.title}</Text>
                        <Text style={styles.nextAchievementDesc} numberOfLines={1}>
                          {nextAchievement.description}
                        </Text>

                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBackground}>
                            <View 
                              style={[
                                styles.progressBarFill, 
                                { 
                                  width: `${nextAchievement.progress}%`,
                                  backgroundColor: getTierColor(nextAchievement.tier)
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {nextAchievement.current_value}/{nextAchievement.requirement_value} ({Math.round(nextAchievement.progress)}%)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.nextAchievementMotivation}>
                      You're {Math.round(100 - nextAchievement.progress)}% away from unlocking this! Keep going! 💪
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Recent Achievements */}
              <View style={styles.achievementsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Achievements</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/(iman)/achievements')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {achievements.slice(0, 5).map((achievement, index) => {
                  const tierColor = getTierColor(achievement.tier);
                  const categoryColor = getCategoryColor(achievement.category);

                  return (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={[
                          styles.achievementCard,
                          achievement.unlocked && styles.achievementCardUnlocked,
                        ]}
                        onPress={() => router.push('/(tabs)/(iman)/achievements')}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={achievement.unlocked ? [tierColor + '40', tierColor + '20'] : [colors.card, colors.card]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.achievementGradient}
                        >
                          <View style={[
                            styles.achievementIcon,
                            { backgroundColor: achievement.unlocked ? tierColor : colors.border },
                          ]}>
                            <IconSymbol
                              ios_icon_name={achievement.unlocked ? 'star.fill' : 'lock.fill'}
                              android_material_icon_name={achievement.unlocked ? 'star' : 'lock'}
                              size={24}
                              color={achievement.unlocked ? colors.card : colors.textSecondary}
                            />
                          </View>

                          <View style={styles.achievementContent}>
                            <Text style={[
                              styles.achievementTitle,
                              !achievement.unlocked && styles.achievementTitleLocked,
                            ]} numberOfLines={1}>
                              {achievement.title}
                            </Text>
                            <Text style={[
                              styles.achievementDescription,
                              !achievement.unlocked && styles.achievementDescriptionLocked,
                            ]} numberOfLines={1}>
                              {achievement.description}
                            </Text>
                          </View>

                          <IconSymbol
                            ios_icon_name="chevron.right"
                            android_material_icon_name="chevron-right"
                            size={20}
                            color={colors.textSecondary}
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {activeTab === 'communities' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {communitiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading communities...</Text>
            </View>
          ) : (
            <>
              {/* Header Actions */}
              <View style={styles.communityActions}>
                <TouchableOpacity
                  style={styles.createCommunityButton}
                  onPress={handleCreateCommunity}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createCommunityGradient}
                  >
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add-circle"
                      size={28}
                      color="#FFFFFF"
                    />
                    <Text style={styles.createCommunityText}>Create Community</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invitesButton}
                  onPress={() => router.push('/(tabs)/(iman)/invites-inbox')}
                  activeOpacity={0.7}
                >
                  <View style={styles.invitesButtonContent}>
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="mail"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.invitesButtonText}>Invites</Text>
                    {pendingInvitesCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

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
                  <Text style={styles.sectionTitle}>Your Communities</Text>
                  {communities.map((community, index) => (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={styles.communityCard}
                        onPress={() => handleCommunityPress(community)}
                        activeOpacity={0.7}
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
                          android_material_icon_name="chevron-right"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.large,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerDecoration: {
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.medium,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.highlight,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  bottomPadding: {
    height: 100,
  },
  featuresSection: {
    marginBottom: spacing.xxl,
  },
  featuresTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  featureGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  featureSubtitle: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.large,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.card,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsSubtext: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.9,
  },
  nextAchievementCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  nextAchievementGradient: {
    padding: spacing.lg,
  },
  nextAchievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nextAchievementTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  nextAchievementContent: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nextAchievementIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAchievementInfo: {
    flex: 1,
  },
  nextAchievementName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nextAchievementDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nextAchievementMotivation: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  achievementsSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  achievementCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  achievementCardUnlocked: {
    borderColor: 'transparent',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  achievementDescription: {
    ...typography.caption,
    color: colors.text,
  },
  achievementDescriptionLocked: {
    color: colors.textSecondary,
  },
  communityActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  createCommunityButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  createCommunityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  createCommunityText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  invitesButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  invitesButtonContent: {
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  invitesButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
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
    fontSize: 10,
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
    fontSize: 10,
  },
  communityMembers: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
