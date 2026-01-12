
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

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
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardTopSection}>
            <View style={styles.cardIconWrapper}>
              <IconSymbol
                ios_icon_name={icon}
                android_material_icon_name={androidIcon}
                size={38}
                color={colors.card}
              />
            </View>
            <View style={styles.cardArrow}>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward-circle"
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  // Collapsing header animations
  const HEADER_MAX_HEIGHT = 160;
  const HEADER_MIN_HEIGHT = 100;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  
  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const scoreInfoOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Collapsing Header Section */}
      <Animated.View style={[styles.headerSection, { height: headerHeight, top: insets.top + spacing.sm }]}>
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerIconContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerIconGradient}
                >
                  <IconSymbol
                    ios_icon_name="heart.circle.fill"
                    android_material_icon_name="favorite"
                    size={32}
                    color={colors.card}
                  />
                </LinearGradient>
              </View>
              <View style={styles.headerTextContainer}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>Wellness Hub</Text>
                  <View style={styles.amanahScoreBadge}>
                    <Text style={styles.amanahScoreText}>{Math.round(amanahScore)}%</Text>
                  </View>
                </View>
                <Animated.Text style={[styles.headerSubtitle, { opacity: subtitleOpacity }]}>
                  Nurture mind, body & soul
                </Animated.Text>
              </View>
            </View>

            {/* Well-Being Progress Info */}
            <Animated.View style={[styles.scoreInfoRow, { opacity: scoreInfoOpacity }]}>
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

      {/* Collapsing Tab Switcher */}
      <Animated.View 
        style={[
          styles.tabContainerWrapper,
          {
            top: scrollY.interpolate({
              inputRange: [0, 60],
              outputRange: [insets.top + spacing.sm + HEADER_MAX_HEIGHT - spacing.xs, insets.top + spacing.sm + HEADER_MIN_HEIGHT - spacing.xs],
              extrapolate: 'clamp',
            }),
          }
        ]}
      >
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
                colors={colors.gradientPrimary}
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
                colors={colors.gradientWarning}
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
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + 60 + spacing.xs },
        ]}
        showsVerticalScrollIndicator={false}
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
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
  },
  headerGradient: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    minHeight: 160,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.medium,
    flexShrink: 0,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '800',
    fontSize: 22,
  },
  amanahScoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
  },
  amanahScoreText: {
    ...typography.bodyBold,
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    fontSize: 13,
    fontWeight: '500',
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
  tabContainerWrapper: {
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 2,
  },
  tabContainer: {
    width: '100%',
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
  quoteCard: {
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
  bottomPadding: {
    height: 100,
  },
});
