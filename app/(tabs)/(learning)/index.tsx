
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

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
    <View style={styles.container}>
      {/* Modern Header with Gradient Background */}
      <LinearGradient
        colors={colors.gradientOcean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="menu-book"
              size={36}
              color={colors.card}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.header}>Learning Center</Text>
            <Text style={styles.subtitle}>Expand your Islamic knowledge</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Learning Sections Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    ...shadows.emphasis,
  },
  headerContent: {
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
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.card,
    opacity: 0.9,
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
