
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

// Header animation constants
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Tab animation constants
const TAB_MAX_HEIGHT = 70;
const TAB_MIN_HEIGHT = 0;
const TAB_SCROLL_DISTANCE = 100;

type WellnessTab = 'mental' | 'physical';

interface WellnessCardProps {
  title: string;
  subtitle: string;
  icon: string;
  androidIcon: string;
  gradient: string[];
  onPress: () => void;
}

const WellnessCard: React.FC<WellnessCardProps> = ({ title, subtitle, icon, androidIcon, gradient, onPress }) => (
  <TouchableOpacity
    style={styles.wellnessCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardIconWrapper}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={androidIcon}
          size={32}
          color={colors.card}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardArrow}>
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron-right"
          size={20}
          color={colors.card}
        />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default function WellnessScreen() {
  const insets = useSafeAreaInsets();
  const { amanahGoals, sectionScores } = useImanTracker();
  const [activeTab, setActiveTab] = useState<WellnessTab>('mental');

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
    outputRange: [1, 0.7],
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

  const handleTabChange = (tab: WellnessTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const mentalHealthCards = [
    {
      title: 'Journal',
      subtitle: 'Express your thoughts',
      icon: 'book.fill',
      androidIcon: 'menu-book',
      gradient: colors.gradientPrimary,
      route: '/(tabs)/(wellness)/journal',
    },
    {
      title: 'Meditation',
      subtitle: 'Find inner peace',
      icon: 'leaf.fill',
      androidIcon: 'spa',
      gradient: colors.gradientTeal,
      route: '/(tabs)/(wellness)/meditation',
    },
    {
      title: 'Healing Duas',
      subtitle: 'Spiritual comfort',
      icon: 'hands.sparkles.fill',
      androidIcon: 'self-improvement',
      gradient: colors.gradientPurple,
      route: '/(tabs)/(wellness)/mental-duas',
    },
    {
      title: 'Support',
      subtitle: 'Get guidance',
      icon: 'heart.fill',
      androidIcon: 'favorite',
      gradient: colors.gradientAccent,
      route: '/(tabs)/(wellness)/emotional-support',
    },
    {
      title: 'Prophet Stories',
      subtitle: 'Learn & reflect',
      icon: 'book.pages.fill',
      androidIcon: 'auto-stories',
      gradient: colors.gradientInfo,
      route: '/(tabs)/(wellness)/prophet-stories',
    },
  ];

  const physicalHealthCards = [
    {
      title: 'Activity',
      subtitle: 'Log workouts',
      icon: 'figure.mixed.cardio',
      androidIcon: 'fitness-center',
      gradient: colors.gradientWarning,
      route: '/(tabs)/(wellness)/activity-tracker',
    },
    {
      title: 'Sleep',
      subtitle: 'Monitor rest',
      icon: 'moon.stars.fill',
      androidIcon: 'bedtime',
      gradient: colors.gradientSecondary,
      route: '/(tabs)/(wellness)/sleep-tracker',
    },
    {
      title: 'Goals',
      subtitle: 'Set & achieve',
      icon: 'target',
      androidIcon: 'track-changes',
      gradient: colors.gradientInfo,
      route: '/(tabs)/(wellness)/physical-goals',
    },
    {
      title: 'History',
      subtitle: 'View progress',
      icon: 'chart.line.uptrend.xyaxis',
      androidIcon: 'trending-up',
      gradient: colors.gradientPurple,
      route: '/(tabs)/(wellness)/activity-history',
    },
  ];

  const activeCards = activeTab === 'mental' ? mentalHealthCards : physicalHealthCards;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Collapsing Header Section */}
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
                  ios_icon_name="heart.circle.fill"
                  android_material_icon_name="favorite"
                  size={40}
                  color={colors.card}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Wellness Hub</Text>
                <Text style={styles.headerSubtitle}>Nurture mind, body & soul</Text>
              </View>
            </Animated.View>

            {/* Well-Being Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{Math.round(amanahScore)}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreTitle}>Well-Being Score</Text>
                <Text style={styles.scoreDescription}>
                  {amanahCompletion}% of daily goals completed
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${amanahCompletion}%` }]} />
                </View>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Collapsing Tab Switcher */}
      <Animated.View 
        style={[
          styles.tabContainer,
          { 
            height: tabHeight,
            opacity: tabOpacity,
          }
        ]}
      >
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mental' && styles.tabActive]}
            onPress={() => handleTabChange('mental')}
            activeOpacity={0.7}
          >
            {activeTab === 'mental' ? (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={22}
                  color={colors.card}
                />
                <Text style={styles.tabTextActive}>Mental Health</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Mental Health</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'physical' && styles.tabActive]}
            onPress={() => handleTabChange('physical')}
            activeOpacity={0.7}
          >
            {activeTab === 'physical' ? (
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="figure.run"
                  android_material_icon_name="directions-run"
                  size={22}
                  color={colors.card}
                />
                <Text style={styles.tabTextActive}>Physical Health</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="figure.run"
                  android_material_icon_name="directions-run"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Physical Health</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Wellness Cards Grid */}
        <View style={styles.cardsGrid}>
          {activeCards.map((card, index) => (
            <WellnessCard
              key={index}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              androidIcon={card.androidIcon}
              gradient={card.gradient}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(card.route as any);
              }}
            />
          ))}
        </View>

        {/* Inspirational Quote */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={colors.gradientTeal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteGradient}
          >
            <View style={styles.quoteIconWrapper}>
              <IconSymbol
                ios_icon_name="quote.opening"
                android_material_icon_name="format-quote"
                size={28}
                color={colors.card}
              />
            </View>
            <Text style={styles.quoteText}>
              &quot;Verily, with hardship comes ease.&quot;
            </Text>
            <Text style={styles.quoteSource}>Quran 94:6</Text>
          </LinearGradient>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    gap: spacing.lg,
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
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  scoreNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '800',
  },
  scoreLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    ...typography.bodyBold,
    color: colors.card,
    marginBottom: spacing.xs,
    fontSize: 16,
  },
  scoreDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  tabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  tabSwitcher: {
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
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'transparent',
  },
  tabText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  wellnessCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardGradient: {
    padding: spacing.lg,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.card,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.small,
    color: colors.card,
    opacity: 0.95,
    fontSize: 12,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  quoteCard: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quoteGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  quoteIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  quoteText: {
    ...typography.h4,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  quoteSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.95,
  },
  bottomPadding: {
    height: 100,
  },
});
