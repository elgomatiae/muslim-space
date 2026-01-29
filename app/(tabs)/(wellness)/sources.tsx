
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import * as Haptics from 'expo-haptics';

export default function SourcesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sources</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sources Card */}
        <View style={styles.sourcesCard}>
          <LinearGradient
            colors={colors.gradientSecondary as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sourcesGradient}
          >
            <View style={styles.sourcesHeader}>
              <View style={styles.sourcesIconWrapper}>
                <IconSymbol
                  ios_icon_name="book.pages.fill"
                  android_material_icon_name="menu-book"
                  size={32}
                  color={colors.card}
                />
              </View>
              <View style={styles.sourcesHeaderText}>
                <Text style={styles.sourcesTitle}>Health & Wellness Sources</Text>
                <Text style={styles.sourcesSubtitle}>
                  Evidence‑informed references behind the mental and physical wellness tools in this app.
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.sourcesBody}>
            <Text style={styles.sourcesSectionHeading}>Mental Health & Self‑Care</Text>
            <Text style={styles.sourcesItem}>
              • American Psychological Association — articles on journaling, coping skills, and mindfulness‑based stress reduction
              that inform the journaling, reflection, and stress‑management guidance in the app (apa.org).
            </Text>
            <Text style={styles.sourcesItem}>
              • National Institute of Mental Health (NIMH). &quot;Caring for Your Mental Health.&quot; Recommendations on healthy coping,
              tracking mood, and seeking professional help when needed (nimh.nih.gov).
            </Text>

            <Text style={styles.sourcesSectionHeading}>Activity, Sleep & Daily Rhythm</Text>
            <Text style={styles.sourcesItem}>
              • World Health Organization &amp; national public‑health guidelines on regular physical activity for cardiovascular,
              metabolic, and mental‑health benefits — reflected in the activity tracking and movement reminders (who.int).
            </Text>
            <Text style={styles.sourcesItem}>
              • National Sleep Foundation. &quot;How Much Sleep Do We Really Need?&quot; Evidence supporting 7–9 hours of nightly sleep for
              most healthy adults and the cognitive and emotional benefits of consistent sleep (sleepfoundation.org).
            </Text>

            <Text style={styles.sourcesSectionHeading}>Mindfulness & Relaxation</Text>
            <Text style={styles.sourcesItem}>
              • National Health Service (NHS, UK). &quot;Mental wellbeing — Mindfulness.&quot; Explains how breathing exercises and
              mindful awareness can reduce stress and improve emotional regulation (nhs.uk).
            </Text>
            <Text style={styles.sourcesItem}>
              • American Psychological Association. &quot;Mindfulness meditation: A research‑proven way to reduce stress.&quot; Summarizes
              evidence that brief, regular mindfulness practice can support anxiety and stress management.
            </Text>

            <Text style={styles.sourcesSectionHeading}>Islamic Spiritual Wellbeing</Text>
            <Text style={styles.sourcesItem}>
              • Quran 13:28 — &quot;Verily, in the remembrance of Allah do hearts find rest.&quot; and Quran 94:6 — &quot;Verily, with hardship
              comes ease.&quot; These verses underpin the focus on dhikr, dua, and spiritual reflection woven through the wellness tools.
            </Text>
            <Text style={styles.sourcesItem}>
              • Sahih al‑Bukhari (Book of Medicine) and Sahih Muslim — collections that include supplications and prophetic guidance
              related to hardship, anxiety, and seeking spiritual comfort, which inform the healing duas and spiritual prompts.
            </Text>
            <Text style={styles.sourcesItem}>
              • Classical and contemporary collections of adhkar and duas (e.g., &quot;Hisn al‑Muslim&quot;) used as references for the
              in‑app duas and spiritual reminders.
            </Text>

            <Text style={styles.sourcesSectionHeading}>Crisis & Professional Support</Text>
            <Text style={styles.sourcesItem}>
              • World Health Organization. &quot;Suicide.&quot; Highlights the importance of immediate, local crisis support and
              professional care for severe distress or suicidal thoughts (who.int).
            </Text>
            <Text style={styles.sourcesItem}>
              • National and local crisis hotlines and emergency services (for example, 988 in the United States) are recommended as
              first‑line resources in emergencies; users should contact equivalent services in their own country as listed by local
              health authorities.
            </Text>

            <Text style={styles.sourcesFooter}>
              This app is intended as a complementary spiritual and self‑reflection aid. Always consult qualified medical and mental
              health professionals for diagnosis, treatment, and personalized care.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sourcesCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: colors.card,
  },
  sourcesGradient: {
    padding: spacing.xl,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourcesIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    lineHeight: 18,
  },
  sourcesBody: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
  sourcesSectionHeading: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
  },
  sourcesItem: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  sourcesFooter: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
