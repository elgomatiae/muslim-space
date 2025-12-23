
import React, { useCallback } from "react";
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

export default function ImanTrackerScreen() {
  const { user } = useAuth();
  const { refreshData, loading } = useImanTracker();

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
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

        {/* IMAN RINGS DISPLAY WITH ACHIEVEMENTS */}
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

        {/* INFO SECTION */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <Text style={styles.infoText}>
                - Each ring represents: ʿIbādah, ʿIlm, and Amanah{'\n'}
                - Track progress directly on this screen{'\n'}
                - Rings update INSTANTLY when you track goals{'\n'}
                - Achievements unlock INSTANTLY when you complete goals{'\n'}
                - Scores slowly decay over time if inactive{'\n'}
                - Unmet daily goals deplete score at midnight{'\n'}
                - Unmet weekly goals deplete score Sunday 12 AM{'\n'}
                - Stay consistent to maintain high scores!{'\n'}
                {user && '- Progress auto-saves to your account'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
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
  infoSection: {
    marginBottom: spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
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
});
