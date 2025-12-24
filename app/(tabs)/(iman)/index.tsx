
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { router } from 'expo-router';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import IbadahSection from "./ibadah-section";
import IlmSection from "./ilm-section";
import AmanahSection from "./amanah-section";

type TabType = 'tracker' | 'achievements' | 'communities';

export default function ImanTrackerScreen() {
  const { user } = useAuth();
  const { refreshData, loading } = useImanTracker();
  const [activeTab, setActiveTab] = useState<TabType>('tracker');

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

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
        <View style={styles.tabContentContainer}>
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => router.push('/(tabs)/(iman)/achievements')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fullScreenButtonGradient}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.fullScreenButtonTitle}>View Achievements</Text>
              <Text style={styles.fullScreenButtonSubtitle}>
                Track your progress and unlock badges
              </Text>
              <View style={styles.fullScreenButtonArrow}>
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-circle-right"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'communities' && (
        <View style={styles.tabContentContainer}>
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => router.push('/(tabs)/(iman)/communities')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fullScreenButtonGradient}
            >
              <IconSymbol
                ios_icon_name="person.3.fill"
                android_material_icon_name="groups"
                size={64}
                color="#FFFFFF"
              />
              <Text style={styles.fullScreenButtonTitle}>View Communities</Text>
              <Text style={styles.fullScreenButtonSubtitle}>
                Connect with others and compete on leaderboards
              </Text>
              <View style={styles.fullScreenButtonArrow}>
                <IconSymbol
                  ios_icon_name="arrow.right.circle.fill"
                  android_material_icon_name="arrow-circle-right"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  tabContentContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  fullScreenButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  fullScreenButtonGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  fullScreenButtonTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: '800',
  },
  fullScreenButtonSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullScreenButtonArrow: {
    marginTop: spacing.xl,
  },
});
