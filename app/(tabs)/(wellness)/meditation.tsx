
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";

interface MeditationPractice {
  title: string;
  description: string;
  duration: string;
  iosIcon: string;
  androidIcon: string;
  color: string[];
}

export default function MeditationScreen() {
  const practices: MeditationPractice[] = [
    {
      title: 'Dhikr Meditation',
      description: 'Repeat SubhanAllah, Alhamdulillah, Allahu Akbar',
      duration: '5-10 min',
      iosIcon: 'sparkles',
      androidIcon: 'auto-awesome',
      color: colors.gradientPrimary,
    },
    {
      title: 'Breath Awareness',
      description: 'Focus on your breathing, as taught by the Prophet ﷺ',
      duration: '5 min',
      iosIcon: 'wind',
      androidIcon: 'air',
      color: colors.gradientInfo,
    },
    {
      title: 'Gratitude Reflection',
      description: 'Reflect on Allah&apos;s blessings in your life',
      duration: '10 min',
      iosIcon: 'heart.fill',
      androidIcon: 'favorite',
      color: colors.gradientPink,
    },
    {
      title: 'Quran Contemplation',
      description: 'Slowly recite and reflect on Quranic verses',
      duration: '15 min',
      iosIcon: 'book.fill',
      androidIcon: 'menu-book',
      color: colors.gradientSecondary,
    },
    {
      title: 'Nature Connection',
      description: 'Observe Allah&apos;s creation mindfully',
      duration: '10-20 min',
      iosIcon: 'leaf.fill',
      androidIcon: 'spa',
      color: colors.gradientOcean,
    },
  ];

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
            colors={colors.gradientOcean}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="spa"
              size={48}
              color={colors.card}
            />
            <Text style={styles.header}>Meditation & Dhikr</Text>
            <Text style={styles.subtitle}>Mindfulness through Islamic practices</Text>
          </LinearGradient>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Islamic mindfulness combines remembrance of Allah with present-moment awareness, bringing peace to the heart and mind.
          </Text>
        </View>

        {/* Practices List */}
        <View style={styles.practicesContainer}>
          <Text style={styles.sectionTitle}>Mindfulness Practices</Text>
          {practices.map((practice, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.practiceCard}
                activeOpacity={0.7}
                onPress={() => console.log('Start practice:', practice.title)}
              >
                <LinearGradient
                  colors={practice.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.practiceGradient}
                >
                  <View style={styles.practiceIconContainer}>
                    <IconSymbol
                      ios_icon_name={practice.iosIcon}
                      android_material_icon_name={practice.androidIcon}
                      size={32}
                      color={colors.card}
                    />
                  </View>
                  <View style={styles.practiceContent}>
                    <Text style={styles.practiceTitle}>{practice.title}</Text>
                    <Text style={styles.practiceDescription}>{practice.description}</Text>
                    <View style={styles.durationBadge}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={14}
                        color={colors.card}
                      />
                      <Text style={styles.durationText}>{practice.duration}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Mindfulness Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.tipText}>Find a quiet, comfortable space</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.tipText}>Start with just 5 minutes daily</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.tipText}>Be patient with yourself</Text>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.tipText}>Practice regularly for best results</Text>
            </View>
          </View>
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
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  practicesContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  practiceCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  practiceGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  practiceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceContent: {
    flex: 1,
  },
  practiceTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  practiceDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  durationText: {
    ...typography.smallBold,
    color: colors.card,
  },
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  tipsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  tipsList: {
    gap: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tipText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  bottomPadding: {
    height: 120,
  },
});
