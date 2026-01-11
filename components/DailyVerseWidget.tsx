/**
 * DailyVerseWidget - Displays a daily Quran verse
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { DailyVerse } from '@/services/DailyContentService';

interface DailyVerseWidgetProps {
  verse: DailyVerse | null;
  loading?: boolean;
}

export default function DailyVerseWidget({ verse, loading }: DailyVerseWidgetProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.card} />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </View>
      </View>
    );
  }

  if (!verse) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="book.closed"
            android_material_icon_name="book"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No verse available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="book.closed.fill"
              android_material_icon_name="book"
              size={20}
              color={colors.card}
            />
          </View>
          <Text style={styles.headerTitle}>Daily Verse</Text>
        </View>

        {/* Arabic Text */}
        <Text style={styles.arabicText}>{verse.arabic_text}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Translation */}
        <Text style={styles.translation}>{verse.translation}</Text>

        {/* Reference */}
        <View style={styles.referenceContainer}>
          <Text style={styles.reference}>{verse.reference}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No margin - parent section handles spacing
  },
  gradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.card,
    fontWeight: '700',
  },
  arabicText: {
    ...typography.h3,
    fontSize: 22,
    color: colors.card,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 36,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: spacing.md,
  },
  translation: {
    ...typography.body,
    fontSize: 15,
    color: colors.card,
    lineHeight: 24,
    marginBottom: spacing.md,
    opacity: 0.95,
  },
  referenceContainer: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  reference: {
    ...typography.caption,
    fontSize: 13,
    color: colors.card,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
