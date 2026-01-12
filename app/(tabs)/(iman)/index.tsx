
import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import IbadahSection from "./ibadah-section";
import IlmSection from "./ilm-section";
import AmanahSection from "./amanah-section";
import AchievementsBadges from "@/components/iman/AchievementsBadges";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Header animation constants
const HEADER_MAX_HEIGHT = 150;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Tab animation constants
const TAB_MAX_HEIGHT = 60;
const TAB_MIN_HEIGHT = 0;
const TAB_SCROLL_DISTANCE = 80;

type TabType = 'tracker' | 'achievements';

export default function ImanTrackerScreen() {
  const { user } = useAuth();
  const { refreshScores } = useImanTracker();
  const [activeTab, setActiveTab] = useState<TabType>('tracker');
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

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
    setRefreshing(false);
  }, [refreshScores]);

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
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(iman)/communities');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.tabInactive}>
              <IconSymbol
                ios_icon_name="person.3.fill"
                android_material_icon_name="groups"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.tabText}>Communities</Text>
            </View>
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

          {/* QUICK ACCESS FEATURES - MOVED UP */}
          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionHeader}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/(iman)/activity' as any);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickAccessGradient}
                >
                  <View style={styles.quickAccessIconContainer}>
                    <IconSymbol
                      ios_icon_name="list.bullet.clipboard.fill"
                      android_material_icon_name="assignment"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.quickAccessTitle}>Activity</Text>
                  <Text style={styles.quickAccessSubtitle}>View log</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/(iman)/trends' as any);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickAccessGradient}
                >
                  <View style={styles.quickAccessIconContainer}>
                    <IconSymbol
                      ios_icon_name="chart.line.uptrend.xyaxis"
                      android_material_icon_name="trending-up"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.quickAccessTitle}>Trends</Text>
                  <Text style={styles.quickAccessSubtitle}>View progress</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/(iman)/goals-settings' as any);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickAccessGradient}
                >
                  <View style={styles.quickAccessIconContainer}>
                    <IconSymbol
                      ios_icon_name="target"
                      android_material_icon_name="flag"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.quickAccessTitle}>Goals</Text>
                  <Text style={styles.quickAccessSubtitle}>Set targets</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION DIVIDER */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Your Goals</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* DEDICATED SECTIONS FOR EACH RING */}
          <IbadahSection />
          <IlmSection />
          <AmanahSection />

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
    padding: spacing.lg,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontSize: 24,
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
  quickAccessSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAccessCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  quickAccessGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickAccessTitle: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '700',
  },
  quickAccessSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 11,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
});
