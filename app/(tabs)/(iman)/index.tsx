
import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import IbadahSection from "./ibadah-section";
import IlmSection from "./ilm-section";
import AmanahSection from "./amanah-section";
import AchievementsBadges from "@/components/iman/AchievementsBadges";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Header animation constants
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Tab animation constants
const TAB_MAX_HEIGHT = 60;
const TAB_MIN_HEIGHT = 0;
const TAB_SCROLL_DISTANCE = 80;

type TabType = 'tracker' | 'achievements' | 'communities';

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
  const { refreshScores } = useImanTracker();
  const [activeTab, setActiveTab] = useState<TabType>('tracker');
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  // Header height animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  // Header content opacity
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Header title scale for collapsed state
  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Tab switcher height animation
  const tabHeight = scrollY.interpolate({
    inputRange: [0, TAB_SCROLL_DISTANCE],
    outputRange: [TAB_MAX_HEIGHT, TAB_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  // Tab switcher opacity
  const tabOpacity = scrollY.interpolate({
    inputRange: [0, TAB_SCROLL_DISTANCE / 2, TAB_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshScores();
    if (activeTab === 'communities') {
      await loadCommunities();
    }
    setRefreshing(false);
  }, [refreshScores, activeTab]);

  // Load communities when tab is selected
  useEffect(() => {
    if (activeTab === 'communities' && communities.length === 0) {
      loadCommunities();
      loadPendingInvites();
    }
  }, [activeTab]);

  const loadCommunities = async () => {
    if (!user) return;

    try {
      setCommunitiesLoading(true);

      // Fetch communities where user is a member - split the query to avoid nested query issues
      const { data: memberData } = await supabase
        .from('community_members')
        .select('community_id, is_admin')
        .eq('user_id', user.id);

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
      const { data } = await supabase
        .from('community_invites')
        .select('id')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending');

      setPendingInvitesCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      setPendingInvitesCount(0);
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

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

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
      {/* COLLAPSING HEADER */}
      <Animated.View 
        style={[
          styles.headerSection,
          { height: headerHeight }
        ]}
      >
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: headerContentOpacity }
            ]}
          >
            <Animated.View 
              style={[
                styles.headerTop,
                { transform: [{ scale: headerTitleScale }] }
              ]}
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
              <TouchableOpacity
                style={styles.activityButton}
                onPress={() => router.push('/(tabs)/(iman)/activity')}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="list.bullet.clipboard.fill"
                  android_material_icon_name="assignment"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* COLLAPSING TABS */}
      <Animated.View 
        style={[
          styles.tabsContainer,
          { 
            height: tabHeight,
            opacity: tabOpacity,
          }
        ]}
      >
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tracker' && styles.tabActive]}
            onPress={() => handleTabChange('tracker')}
            activeOpacity={0.7}
          >
            {activeTab === 'tracker' ? (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="chart.pie.fill"
                  android_material_icon_name="pie-chart"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.tabTextActive}>Tracker</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="chart.pie.fill"
                  android_material_icon_name="pie-chart"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Tracker</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
            onPress={() => handleTabChange('achievements')}
            activeOpacity={0.7}
          >
            {activeTab === 'achievements' ? (
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="trophy.fill"
                  android_material_icon_name="emoji-events"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.tabTextActive}>Achievements</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="trophy.fill"
                  android_material_icon_name="emoji-events"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Achievements</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'communities' && styles.tabActive]}
            onPress={() => handleTabChange('communities')}
            activeOpacity={0.7}
          >
            {activeTab === 'communities' ? (
              <LinearGradient
                colors={colors.gradientTeal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="groups"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.tabTextActive}>Communities</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="groups"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Communities</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* TAB CONTENT WITH ANIMATED SCROLL */}
      {activeTab === 'tracker' && (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
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
                onPress={() => router.push('/(tabs)/(iman)/activity' as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <IconSymbol
                    ios_icon_name="list.bullet.clipboard.fill"
                    android_material_icon_name="assignment"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.featureTitle}>Activity</Text>
                  <Text style={styles.featureSubtitle}>View log</Text>
                </LinearGradient>
              </TouchableOpacity>

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
                  colors={['#10B981', '#059669']}
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
        </Animated.ScrollView>
      )}

      {activeTab === 'achievements' && (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Use the AchievementsBadges component which shows all achievements by default */}
          <AchievementsBadges />

          <View style={styles.bottomPadding} />
        </Animated.ScrollView>
      )}

      {activeTab === 'communities' && (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
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
        </Animated.ScrollView>
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
  headerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  headerContent: {
    gap: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  tabsWrapper: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.medium,
  },
  tab: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  tabActive: {
    ...shadows.small,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: 'transparent',
  },
  tabText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    ...typography.caption,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    width: '31%',
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
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
