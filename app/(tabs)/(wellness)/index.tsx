
import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { router } from "expo-router";

const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function WellnessScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { amanahGoals, sectionScores } = useImanTracker();

  // Calculate Amanah completion percentage
  const calculateAmanahCompletion = () => {
    if (!amanahGoals) return 0;
    
    let totalGoals = 0;
    let completedGoals = 0;
    
    // Physical goals
    if (amanahGoals.dailyExerciseGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailyExerciseCompleted >= amanahGoals.dailyExerciseGoal) completedGoals++;
    }
    if (amanahGoals.dailyWaterGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailyWaterCompleted >= amanahGoals.dailyWaterGoal) completedGoals++;
    }
    if (amanahGoals.weeklyWorkoutGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyWorkoutCompleted >= amanahGoals.weeklyWorkoutGoal) completedGoals++;
    }
    
    // Mental goals
    if (amanahGoals.weeklyMentalHealthGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyMentalHealthCompleted >= amanahGoals.weeklyMentalHealthGoal) completedGoals++;
    }
    if (amanahGoals.weeklyStressManagementGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyStressManagementCompleted >= amanahGoals.weeklyStressManagementGoal) completedGoals++;
    }
    
    // Sleep goals
    if (amanahGoals.dailySleepGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailySleepCompleted >= amanahGoals.dailySleepGoal) completedGoals++;
    }
    
    return totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  };

  const amanahCompletion = calculateAmanahCompletion();
  const amanahScore = sectionScores.amanah || 0;

  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const iconScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.6],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Collapsing Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Collapsed Title (visible when scrolled) */}
          <Animated.View style={[styles.collapsedHeader, { opacity: titleOpacity }]}>
            <IconSymbol
              ios_icon_name="heart.circle.fill"
              android_material_icon_name="favorite"
              size={28}
              color={colors.card}
            />
            <Text style={styles.collapsedTitle}>Wellness Hub</Text>
          </Animated.View>

          {/* Expanded Header Content (visible when not scrolled) */}
          <Animated.View style={[styles.expandedHeader, { opacity: headerOpacity }]}>
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <IconSymbol
                ios_icon_name="heart.circle.fill"
                android_material_icon_name="favorite"
                size={40}
                color={colors.card}
              />
            </Animated.View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Wellness Hub</Text>
              <Text style={styles.headerSubtitle}>Nurture mind, body, and soul</Text>
            </View>

            {/* Amanah Ring Reflection */}
            <View style={styles.amanahReflection}>
              <View style={styles.amanahRingContainer}>
                <View style={styles.amanahRingBackground}>
                  <View 
                    style={[
                      styles.amanahRingFill,
                      { 
                        transform: [{ 
                          rotate: `${(amanahScore / 100) * 360}deg` 
                        }] 
                      }
                    ]} 
                  />
                </View>
                <View style={styles.amanahRingCenter}>
                  <Text style={styles.amanahScore}>{Math.round(amanahScore)}</Text>
                  <Text style={styles.amanahLabel}>Amanah</Text>
                </View>
              </View>
              <View style={styles.amanahStats}>
                <Text style={styles.amanahStatsTitle}>Well-Being Score</Text>
                <Text style={styles.amanahStatsText}>
                  {amanahCompletion}% of goals completed
                </Text>
                <Text style={styles.amanahStatsSubtext}>
                  Linked to your Iman Tracker
                </Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Mental Wellness Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="brain.head.profile"
              android_material_icon_name="psychology"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Mental Wellness</Text>
          </View>

          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/journal' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Journal</Text>
                <Text style={styles.cardSubtitle}>Express your thoughts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/mood-tracker' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="face.smiling"
                  android_material_icon_name="mood"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Mood Tracker</Text>
                <Text style={styles.cardSubtitle}>Track your emotions</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/meditation' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientTeal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="leaf.fill"
                  android_material_icon_name="spa"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Meditation</Text>
                <Text style={styles.cardSubtitle}>Find inner peace</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/mental-duas' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientPurple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="hands.sparkles.fill"
                  android_material_icon_name="self-improvement"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Healing Duas</Text>
                <Text style={styles.cardSubtitle}>Spiritual comfort</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/emotional-support' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Support</Text>
                <Text style={styles.cardSubtitle}>Get help & guidance</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/prophet-stories' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="book.pages.fill"
                  android_material_icon_name="auto-stories"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Prophet Stories</Text>
                <Text style={styles.cardSubtitle}>Learn & reflect</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Physical Wellness Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="figure.run"
              android_material_icon_name="directions-run"
              size={32}
              color={colors.warning}
            />
            <Text style={styles.sectionTitle}>Physical Wellness</Text>
          </View>

          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/activity-tracker' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="figure.mixed.cardio"
                  android_material_icon_name="fitness-center"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Activity Tracker</Text>
                <Text style={styles.cardSubtitle}>Log your workouts</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/sleep-tracker' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="moon.stars.fill"
                  android_material_icon_name="bedtime"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Sleep Tracker</Text>
                <Text style={styles.cardSubtitle}>Monitor your rest</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/nutrition-tracker' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientSuccess}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Nutrition</Text>
                <Text style={styles.cardSubtitle}>Track your meals</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(wellness)/physical-goals' as any);
              }}
            >
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <IconSymbol
                  ios_icon_name="target"
                  android_material_icon_name="track-changes"
                  size={36}
                  color={colors.card}
                />
                <Text style={styles.cardTitle}>Goals</Text>
                <Text style={styles.cardSubtitle}>Set & achieve</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crisis Support Banner */}
        <TouchableOpacity
          style={styles.crisisCard}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/(wellness)/crisis-support' as any);
          }}
        >
          <LinearGradient
            colors={['#FF6B6B', '#EE5A6F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.crisisGradient}
          >
            <View style={styles.crisisContent}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={32}
                color={colors.card}
              />
              <View style={styles.crisisText}>
                <Text style={styles.crisisTitle}>Need Immediate Help?</Text>
                <Text style={styles.crisisSubtitle}>Crisis support resources available 24/7</Text>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="arrow.right.circle.fill"
              android_material_icon_name="arrow-forward"
              size={28}
              color={colors.card}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Inspirational Quote */}
        <View style={styles.quoteSection}>
          <LinearGradient
            colors={colors.gradientTeal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteGradient}
          >
            <IconSymbol
              ios_icon_name="quote.opening"
              android_material_icon_name="format-quote"
              size={32}
              color={colors.card}
            />
            <Text style={styles.quoteText}>
              &quot;Verily, with hardship comes ease.&quot;
            </Text>
            <Text style={styles.quoteSource}>Quran 94:6</Text>
          </LinearGradient>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.disclaimerText}>
            This app provides Islamic guidance and support resources, but is not a substitute for professional mental health care.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.large,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  collapsedTitle: {
    ...typography.h3,
    color: colors.card,
  },
  expandedHeader: {
    flex: 1,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
  },
  amanahReflection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  amanahRingContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  amanahRingBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  amanahRingFill: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: colors.card,
    borderStyle: 'solid',
    position: 'absolute',
  },
  amanahRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amanahScore: {
    ...typography.h3,
    color: colors.card,
    fontWeight: '800',
  },
  amanahLabel: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
  amanahStats: {
    flex: 1,
  },
  amanahStatsTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  amanahStatsText: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.xs,
  },
  amanahStatsSubtext: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: HEADER_MAX_HEIGHT + spacing.lg + spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '48%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardGradient: {
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.h4,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    textAlign: 'center',
  },
  crisisCard: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  crisisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  crisisContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  crisisText: {
    flex: 1,
  },
  crisisTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  crisisSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  quoteSection: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quoteGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  quoteText: {
    ...typography.h3,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  quoteSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  disclaimerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 120,
  },
});
