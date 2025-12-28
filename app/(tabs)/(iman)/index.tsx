
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
import AchievementsBadges from "@/components/iman/AchievementsBadges";

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
  const { refreshData, loading } = useImanTracker();
  const [activeTab, setActiveTab] = useState<TabType>('tracker');
  const [refreshing, setRefreshing] = React.useState(false);

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    if (activeTab === 'communities') {
      await loadCommunities();
    }
    setRefreshing(false);
  }, [refreshData, activeTab]);

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
          {/* Use the AchievementsBadges component which shows all achievements by default */}
          <AchievementsBadges />

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
  activityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
