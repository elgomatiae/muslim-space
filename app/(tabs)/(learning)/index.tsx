
import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

interface LearningSection {
  title: string;
  description: string;
  iosIcon: string;
  androidIcon: string;
  gradientColors: string[];
  route: string;
}

export default function LearningScreen() {
  const router = useRouter();

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
      route: '',
    },
    {
      title: 'Daily Duas',
      description: 'Learn daily supplications',
      iosIcon: 'book.pages.fill',
      androidIcon: 'auto-stories',
      gradientColors: colors.gradientPurple,
      route: '',
    },
  ];

  const handleSectionPress = (section: LearningSection) => {
    if (section.route) {
      router.push(section.route as any);
    } else {
      console.log(`${section.title} - Coming soon`);
    }
  };

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
              ios_icon_name="star.fill"
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
                onPress={() => handleSectionPress(section)}
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
                        ios_icon_name={section.iosIcon}
                        android_material_icon_name={section.androidIcon}
                        size={34}
                        color={colors.card}
                      />
                    </View>
                    <View style={styles.sectionTextContainer}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionDescription}>{section.description}</Text>
                      {section.route && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>Netflix Style</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={26}
                    color={colors.card}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={styles.infoTitle}>Content Management</Text>
          <Text style={styles.infoText}>
            Islamic Lectures and Quran Recitations feature a Netflix-style browsing experience. Admins can manage content through the admin panel accessible from the profile tab.
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
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  newBadgeText: {
    ...typography.smallBold,
    color: colors.card,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
  },
  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 120,
  },
});
