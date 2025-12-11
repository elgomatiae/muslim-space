
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

type WellnessTab = 'mental' | 'physical';

interface WellnessActivity {
  title: string;
  description: string;
  iosIcon: string;
  androidIcon: string;
  duration: string;
}

export default function WellnessScreen() {
  const [activeTab, setActiveTab] = useState<WellnessTab>('mental');

  const mentalActivities: WellnessActivity[] = [
    {
      title: 'Meditation & Reflection',
      description: 'Practice mindfulness and spiritual reflection',
      iosIcon: 'figure.walk',
      androidIcon: 'self-improvement',
      duration: '10 min',
    },
    {
      title: 'Gratitude Journal',
      description: 'Write down things you are grateful for',
      iosIcon: 'pencil.and.list.clipboard',
      androidIcon: 'edit-note',
      duration: '5 min',
    },
    {
      title: 'Stress Management',
      description: 'Learn techniques to manage daily stress',
      iosIcon: 'leaf.fill',
      androidIcon: 'spa',
      duration: '15 min',
    },
    {
      title: 'Positive Affirmations',
      description: 'Start your day with positive thoughts',
      iosIcon: 'face.smiling.fill',
      androidIcon: 'sentiment-satisfied',
      duration: '5 min',
    },
  ];

  const physicalActivities: WellnessActivity[] = [
    {
      title: 'Exercise Routine',
      description: 'Stay active with daily physical activities',
      iosIcon: 'figure.run',
      androidIcon: 'fitness-center',
      duration: '30 min',
    },
    {
      title: 'Healthy Eating',
      description: 'Follow a balanced and nutritious diet',
      iosIcon: 'fork.knife',
      androidIcon: 'restaurant',
      duration: 'Daily',
    },
    {
      title: 'Sleep Tracking',
      description: 'Monitor and improve your sleep quality',
      iosIcon: 'bed.double.fill',
      androidIcon: 'bedtime',
      duration: '8 hours',
    },
    {
      title: 'Hydration',
      description: 'Track your daily water intake',
      iosIcon: 'drop.fill',
      androidIcon: 'water-drop',
      duration: '8 glasses',
    },
  ];

  const activities = activeTab === 'mental' ? mentalActivities : physicalActivities;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Wellness</Text>
        <Text style={styles.subtitle}>Take care of your mind and body</Text>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'mental' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('mental')}
            activeOpacity={0.7}
          >
            {activeTab === 'mental' ? (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.tabTextActive}>Mental</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Mental</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'physical' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('physical')}
            activeOpacity={0.7}
          >
            {activeTab === 'physical' ? (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabGradient}
              >
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.tabTextActive}>Physical</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.tabText}>Physical</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Activities List */}
        <View style={styles.activitiesContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="list.bullet"
                android_material_icon_name="list"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>
              {activeTab === 'mental' ? 'Mental Wellness' : 'Physical Wellness'}
            </Text>
          </View>
          {activities.map((activity, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.activityCard}
                activeOpacity={0.7}
                onPress={() => console.log(`Pressed ${activity.title}`)}
              >
                <View style={styles.activityLeft}>
                  <View style={styles.activityIconContainer}>
                    <IconSymbol
                      ios_icon_name={activity.iosIcon}
                      android_material_icon_name={activity.androidIcon}
                      size={30}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <View style={styles.durationBadge}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.durationText}>{activity.duration}</Text>
                    </View>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xxxl,
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
    // Active tab styling handled by gradient
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    ...typography.bodyBold,
    color: colors.card,
  },
  activitiesContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  durationText: {
    ...typography.smallBold,
    color: colors.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
