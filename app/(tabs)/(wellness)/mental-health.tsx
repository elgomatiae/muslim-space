
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

interface MentalHealthFeature {
  title: string;
  description: string;
  iosIcon: string;
  androidIcon: string;
  route: string;
  color: string[];
  isCrisis?: boolean;
}

export default function MentalHealthScreen() {
  const features: MentalHealthFeature[] = [
    {
      title: 'Crisis Support',
      description: 'Immediate help if you\'re in crisis',
      iosIcon: 'exclamationmark.triangle.fill',
      androidIcon: 'warning',
      route: '/crisis-support',
      color: colors.gradientRed,
      isCrisis: true,
    },
    {
      title: 'Journal',
      description: 'Write your thoughts and feelings',
      iosIcon: 'book.fill',
      androidIcon: 'menu-book',
      route: '/journal',
      color: colors.gradientPrimary,
    },
    {
      title: 'Daily Prompts',
      description: 'Guided reflection questions',
      iosIcon: 'lightbulb.fill',
      androidIcon: 'lightbulb',
      route: '/journal-prompts',
      color: colors.gradientInfo,
    },
    {
      title: 'Prophet Stories',
      description: 'Learn from the Prophet\'s life',
      iosIcon: 'book.closed.fill',
      androidIcon: 'auto-stories',
      route: '/prophet-stories',
      color: colors.gradientSecondary,
    },
    {
      title: 'Healing Duas',
      description: 'Prayers for mental wellness',
      iosIcon: 'hands.sparkles.fill',
      androidIcon: 'self-improvement',
      route: '/mental-duas',
      color: colors.gradientPurple,
    },
    {
      title: 'Mood Tracker',
      description: 'Track your emotional patterns',
      iosIcon: 'chart.line.uptrend.xyaxis',
      androidIcon: 'insights',
      route: '/mood-tracker',
      color: colors.gradientTeal,
    },
    {
      title: 'Emotional Support',
      description: 'Guidance for different emotions',
      iosIcon: 'heart.text.square.fill',
      androidIcon: 'favorite',
      route: '/emotional-support',
      color: colors.gradientPink,
    },
    {
      title: 'Meditation & Dhikr',
      description: 'Mindfulness and remembrance',
      iosIcon: 'leaf.fill',
      androidIcon: 'spa',
      route: '/meditation',
      color: colors.gradientOcean,
    },
  ];

  const handleFeaturePress = (route: string, isCrisis?: boolean) => {
    if (isCrisis) {
      Alert.alert(
        'Crisis Support',
        'If you are in immediate danger, please call emergency services (911) or go to your nearest emergency room.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => router.push(route as any) },
        ]
      );
    } else {
      router.push(route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="brain.head.profile"
              android_material_icon_name="psychology"
              size={48}
              color={colors.card}
            />
            <Text style={styles.header}>Mental Wellness</Text>
            <Text style={styles.subtitle}>Your mental health matters</Text>
          </LinearGradient>
        </View>

        {/* Important Message */}
        <View style={styles.messageCard}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.messageText}>
            Taking care of your mental health is part of taking care of the trust Allah has given you. You are not alone.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.featureCard,
                  feature.isCrisis && styles.crisisCard,
                ]}
                activeOpacity={0.7}
                onPress={() => handleFeaturePress(feature.route, feature.isCrisis)}
              >
                <LinearGradient
                  colors={feature.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureGradient}
                >
                  <View style={styles.featureIconContainer}>
                    <IconSymbol
                      ios_icon_name={feature.iosIcon}
                      android_material_icon_name={feature.androidIcon}
                      size={36}
                      color={colors.card}
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={24}
                    color={colors.card}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important Note</Text>
          <Text style={styles.disclaimerText}>
            This app provides Islamic guidance and support resources, but it is not a substitute for professional mental health care. If you are experiencing severe mental health issues, please consult with a qualified mental health professional.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerContainer: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  header: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.95,
  },
  messageCard: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  messageText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: spacing.xxl,
  },
  featureCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  crisisCard: {
    ...shadows.colored,
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  disclaimerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 120,
  },
});
