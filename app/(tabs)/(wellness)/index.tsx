
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

// Header animation constants
const HEADER_MAX_HEIGHT = 180;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type WellnessTab = 'mental' | 'physical';

interface WellnessCardProps {
  title: string;
  subtitle: string;
  icon: string;
  androidIcon: string;
  gradient: string[];
  onPress: () => void;
}

const WellnessCard: React.FC<WellnessCardProps> = ({ title, subtitle, icon, androidIcon, gradient, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.wellnessCard}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={gradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardTopSection}>
            <View style={styles.cardIconWrapper}>
              <IconSymbol
                ios_icon_name={icon}
                android_material_icon_name={androidIcon as keyof typeof MaterialIcons.glyphMap}
                size={38}
                color={colors.card}
              />
            </View>
            <View style={styles.cardArrow}>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward-ios"
                size={20}
                color={colors.card}
              />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function WellnessScreen() {
  const { amanahGoals, sectionScores } = useImanTracker();
  const [activeTab, setActiveTab] = useState<WellnessTab>('mental');
  const tabScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Scroll animation values
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
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });
  
  // Header subtitle opacity (fade faster)
  const headerSubtitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // Score info row opacity (fade faster)
  const scoreInfoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // Icon and score circle scale
  const headerIconScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });
  
  // Title scale for collapsed state
  const headerTitleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.85],
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
    if (tab === activeTab) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth scale animation on tab change
    Animated.sequence([
      Animated.timing(tabScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
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

  const handleCardPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate directly - no access gates
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Animated Header Section */}
      <Animated.View 
        style={[
          styles.headerSection,
          { height: headerHeight }
        ]}
      >
        <LinearGradient
          colors={colors.gradientOcean as unknown as readonly [string, string, ...string[]]}
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
            <View style={styles.headerTop}>
              <Animated.View 
                style={[
                  styles.headerIconContainer,
                  { transform: [{ scale: headerIconScale }] }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerIconGradient}
                >
                  <IconSymbol
                    ios_icon_name="heart.circle.fill"
                    android_material_icon_name="favorite"
                    size={40}
                    color={colors.card}
                  />
                </LinearGradient>
              </Animated.View>
              <View style={styles.headerTextContainer}>
                <Animated.Text 
                  style={[
                    styles.headerTitle,
                    { transform: [{ scale: headerTitleScale }] }
                  ]}
                >
                  Wellness Hub
                </Animated.Text>
                <Animated.Text 
                  style={[
                    styles.headerSubtitle,
                    { opacity: headerSubtitleOpacity }
                  ]}
                >
                  Nurture mind, body & soul
                </Animated.Text>
              </View>
              
              {/* Amanah Score - Aligned with title */}
              <Animated.View 
                style={[
                  styles.scoreCircle,
                  { transform: [{ scale: headerIconScale }] }
                ]}
              >
                <LinearGradient
                  colors={colors.gradientPrimary as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scoreCircleGradient}
                >
                  <Text style={styles.scoreNumber}>{Math.round(amanahScore)}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Well-Being Progress Info */}
            <Animated.View 
              style={[
                styles.scoreInfoRow,
                { opacity: scoreInfoOpacity }
              ]}
            >
              <Text style={styles.scoreInfoText}>
                {amanahCompletion}% of goals completed today
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${amanahCompletion}%` },
                  ]}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Fixed Tab Switcher */}
      <Animated.View 
        style={[
          styles.tabContainer,
          { transform: [{ scale: tabScaleAnim }] }
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
                colors={colors.gradientPrimary as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <View style={styles.tabIconContainer}>
                  <IconSymbol
                    ios_icon_name="brain.head.profile"
                    android_material_icon_name="psychology"
                    size={22}
                    color={colors.card}
                  />
                </View>
                <Text style={styles.tabTextActive}>Mental Health</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <View style={styles.tabIconContainerInactive}>
                  <IconSymbol
                    ios_icon_name="brain.head.profile"
                    android_material_icon_name="psychology"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={styles.tabText}>Mental Health</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'physical' && styles.tabActive]}
            onPress={() => handleTabChange('physical')}
            activeOpacity={0.8}
          >
            {activeTab === 'physical' ? (
              <LinearGradient
                colors={colors.gradientWarning as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabGradient}
              >
                <View style={styles.tabIconContainer}>
                  <IconSymbol
                    ios_icon_name="figure.run"
                    android_material_icon_name="directions-run"
                    size={22}
                    color={colors.card}
                  />
                </View>
                <Text style={styles.tabTextActive}>Physical Health</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <View style={styles.tabIconContainerInactive}>
                  <IconSymbol
                    ios_icon_name="figure.run"
                    android_material_icon_name="directions-run"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
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
              key={`${activeTab}-${index}`}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              androidIcon={card.androidIcon}
              gradient={card.gradient}
              onPress={() => handleCardPress(card.route)}
            />
          ))}
        </View>

        {/* Sources Tab */}
        <TouchableOpacity
          style={styles.sourcesTabCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/(wellness)/sources' as any);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientSecondary as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sourcesTabGradient}
          >
            <View style={styles.sourcesTabHeaderContent}>
              <View style={styles.sourcesTabIconWrapper}>
                <IconSymbol
                  ios_icon_name="book.pages.fill"
                  android_material_icon_name="menu-book"
                  size={28}
                  color={colors.card}
                />
              </View>
              <Text style={styles.sourcesTabTitle}>Sources</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.card}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Inspirational Quote Tab - Always Visible */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={colors.gradientTeal as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteGradient}
          >
            <View style={styles.quoteTopSection}>
              <View style={styles.quoteIconWrapper}>
                <IconSymbol
                  ios_icon_name="quote.opening"
                  android_material_icon_name="format-quote"
                  size={32}
                  color={colors.card}
                />
              </View>
            </View>
            <Text style={styles.quoteText}>
              &quot;Verily, with hardship comes ease.&quot;
            </Text>
            <View style={styles.quoteFooter}>
              <View style={styles.quoteDivider} />
              <Text style={styles.quoteSource}>Quran 94:6</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Padding for Tab Bar */}
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
  headerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
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
    minHeight: 64,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadows.medium,
  },
  headerIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.card,
    fontWeight: '900',
    marginBottom: spacing.xs,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    fontSize: 15,
    fontWeight: '500',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...shadows.medium,
    flexShrink: 0,
  },
  scoreCircleGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '900',
    fontSize: 20,
  },
  scoreLabel: {
    ...typography.smallBold,
    color: colors.card,
    opacity: 0.9,
    marginTop: -2,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  scoreInfoRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  scoreInfoText: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  },
  tabSwitcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
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
  tabIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  tabIconContainerInactive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.card,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    fontSize: 22,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  wellnessCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardGradient: {
    padding: spacing.lg,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.h4,
    fontSize: 16,
    color: colors.card,
    fontWeight: '800',
    marginBottom: spacing.xs / 2,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 16,
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcesTabCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sourcesTabGradient: {
    padding: spacing.xl,
  },
  sourcesTabHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourcesTabIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  sourcesTabTitle: {
    ...typography.h3,
    color: colors.card,
    flex: 1,
    fontWeight: '700',
  },
  quoteCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  quoteGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  quoteTopSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  quoteIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  quoteText: {
    ...typography.h4,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
    lineHeight: 26,
    fontSize: 18,
    fontWeight: '600',
  },
  quoteFooter: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quoteDivider: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
  },
  quoteSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.95,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sourcesCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sourcesGradient: {
    padding: spacing.lg,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sourcesIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  sourcesHeaderText: {
    flex: 1,
  },
  sourcesTitle: {
    ...typography.h3,
    color: colors.card,
    fontWeight: '800',
    marginBottom: spacing.xs / 2,
  },
  sourcesSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  sourcesBody: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  sourcesSectionHeading: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 15,
  },
  sourcesItem: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  sourcesFooter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
  contentTabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentTabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentTabButtonActive: {
    backgroundColor: colors.primary,
  },
  contentTabButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  contentTabButtonTextActive: {
    color: colors.card,
    fontWeight: '700',
  },
});
