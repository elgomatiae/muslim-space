
import React, { useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Dimensions, Animated } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

// Header animation constants (matching Iman Tracker)
const HEADER_MAX_HEIGHT = 150;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

interface LearningSection {
  title: string;
  description: string;
  iosIcon: string;
  androidIcon: string;
  gradientColors: string[];
  route: string;
}

interface LearningCardProps {
  title: string;
  description: string;
  icon: string;
  androidIcon: string;
  gradient: string[];
  onPress: () => void;
}

const LearningCard: React.FC<LearningCardProps> = ({ title, description, icon, androidIcon, gradient, onPress }) => (
  <TouchableOpacity
    style={styles.learningCard}
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
        <Text style={styles.cardSubtitle}>{description}</Text>
      </View>
      <View style={styles.cardArrow}>
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron-right"
          size={18}
          color={colors.card}
        />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default function LearningScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const sections: LearningSection[] = [
    {
      title: 'Islamic Lectures',
      description: 'Watch inspiring lectures from scholars',
      iosIcon: 'play.rectangle.fill',
      androidIcon: 'play-circle',
      gradientColors: colors.gradientPrimary,
      route: '/(tabs)/(learning)/lectures',
    },
    {
      title: 'Quran Recitations',
      description: 'Beautiful recitations of the Holy Quran',
      iosIcon: 'music.note',
      androidIcon: 'headset',
      gradientColors: colors.gradientAccent,
      route: '/(tabs)/(learning)/recitations',
    },
    {
      title: 'Islamic Quizzes',
      description: 'Test your Islamic knowledge',
      iosIcon: 'questionmark.circle.fill',
      androidIcon: 'quiz',
      gradientColors: colors.gradientInfo,
      route: '/(tabs)/(learning)/quizzes',
    },
    {
      title: 'Daily Duas',
      description: 'Learn daily supplications',
      iosIcon: 'book.pages.fill',
      androidIcon: 'auto-stories',
      gradientColors: colors.gradientPurple,
      route: '/(tabs)/(wellness)/mental-duas',
    },
  ];

  const handleSectionPress = (section: LearningSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (section.route) {
      router.push(section.route as any);
    } else {
      console.log(`${section.title} - Coming soon`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Collapsing Header (matching Iman Tracker style) */}
      <Animated.View 
        style={[
          styles.headerSection,
          { height: headerHeight }
        ]}
      >
        <LinearGradient
          colors={colors.gradientOcean as any}
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
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={48}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.header}>Learning Center</Text>
                <Text style={styles.subtitle}>Expand your Islamic knowledge</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Learning Sections Grid */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.cardsGrid}>
          {sections.map((section, index) => (
            <LearningCard
              key={index}
              title={section.title}
              description={section.description}
              icon={section.iosIcon}
              androidIcon={section.androidIcon}
              gradient={section.gradientColors}
              onPress={() => handleSectionPress(section)}
            />
          ))}
        </View>

        {/* Inspirational Quote Card */}
        <View style={styles.quoteCard}>
          <LinearGradient
            colors={colors.gradientSecondary}
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
              &quot;Seek knowledge from the cradle to the grave.&quot;
            </Text>
            <Text style={styles.quoteSource}>Prophet Muhammad (PBUH)</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  learningCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardGradient: {
    padding: spacing.lg,
    minHeight: 140,
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
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.card,
    opacity: 0.9,
    lineHeight: 16,
  },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.emphasis,
  },
  quoteGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  quoteIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quoteText: {
    ...typography.h4,
    fontSize: 18,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  quoteSource: {
    ...typography.body,
    fontSize: 14,
    color: colors.card,
    opacity: 0.85,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
