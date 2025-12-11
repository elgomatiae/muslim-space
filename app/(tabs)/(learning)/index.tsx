
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

interface LearningSection {
  title: string;
  description: string;
  icon: string;
  gradientColors: string[];
  count: number;
}

export default function LearningScreen() {
  const sections: LearningSection[] = [
    {
      title: 'Islamic Lectures',
      description: 'Listen to inspiring lectures from scholars',
      icon: 'play-circle',
      gradientColors: colors.gradientPrimary,
      count: 24,
    },
    {
      title: 'Quran Recitations',
      description: 'Beautiful recitations of the Holy Quran',
      icon: 'headset',
      gradientColors: colors.gradientAccent,
      count: 30,
    },
    {
      title: 'Islamic Quizzes',
      description: 'Test your Islamic knowledge',
      icon: 'quiz',
      gradientColors: colors.gradientInfo,
      count: 15,
    },
    {
      title: 'Daily Duas',
      description: 'Learn daily supplications',
      icon: 'auto-stories',
      gradientColors: colors.gradientPurple,
      count: 40,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Learning Center</Text>
        <Text style={styles.subtitle}>Expand your Islamic knowledge</Text>

        {/* Featured Banner */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredBanner}
        >
          <View style={styles.featuredIconContainer}>
            <IconSymbol
              ios_icon_name="star"
              android_material_icon_name="star"
              size={36}
              color={colors.card}
            />
          </View>
          <Text style={styles.featuredTitle}>Start Your Learning Journey</Text>
          <Text style={styles.featuredSubtitle}>
            Explore our collection of Islamic resources
          </Text>
        </LinearGradient>

        {/* Learning Sections */}
        <View style={styles.sectionsContainer}>
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.sectionCard}
                activeOpacity={0.7}
                onPress={() => console.log(`Pressed ${section.title}`)}
              >
                <LinearGradient
                  colors={section.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionGradient}
                >
                  <View style={styles.sectionContent}>
                    <View style={styles.iconContainer}>
                      <IconSymbol
                        ios_icon_name={section.icon}
                        android_material_icon_name={section.icon}
                        size={34}
                        color={colors.card}
                      />
                    </View>
                    <View style={styles.sectionTextContainer}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionDescription}>{section.description}</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{section.count} items</Text>
                      </View>
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron-right"
                    android_material_icon_name="chevron-right"
                    size={26}
                    color={colors.card}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Placeholder for content */}
        <View style={styles.placeholderCard}>
          <View style={styles.placeholderIconContainer}>
            <IconSymbol
              ios_icon_name="cloud-upload"
              android_material_icon_name="cloud-upload"
              size={52}
              color={colors.primary}
            />
          </View>
          <Text style={styles.placeholderTitle}>Content Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Upload your Islamic lectures, Quran recitations, and other learning materials via Supabase to populate these sections.
          </Text>
        </View>

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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
  },
  header: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  featuredBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.colored,
  },
  featuredIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featuredTitle: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  featuredSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
  },
  sectionsContainer: {
    marginBottom: spacing.xxl,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  sectionGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  countText: {
    ...typography.smallBold,
    color: colors.card,
  },
  placeholderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  placeholderTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 120,
  },
});
