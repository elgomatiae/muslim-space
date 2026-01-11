/**
 * DailyHadithWidget - Displays a daily Hadith
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { DailyHadith } from '@/services/DailyContentService';

interface DailyHadithWidgetProps {
  hadith: DailyHadith | null;
  loading?: boolean;
}

export default function DailyHadithWidget({ hadith, loading }: DailyHadithWidgetProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>Loading hadith...</Text>
        </View>
      </View>
    );
  }

  if (!hadith) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="book.pages"
            android_material_icon_name="menu-book"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No hadith available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="quote.opening"
              android_material_icon_name="format-quote"
              size={20}
              color={colors.card}
            />
          </View>
          <Text style={styles.headerTitle}>Daily Hadith</Text>
        </View>

        {/* Arabic Text (if available) */}
        {hadith.arabic_text && (
          <>
            <Text style={styles.arabicText}>{hadith.arabic_text}</Text>
            <View style={styles.divider} />
          </>
        )}

        {/* Translation */}
        <Text style={styles.translation}>{hadith.translation}</Text>

        {/* Source */}
        <View style={styles.sourceContainer}>
          <View style={styles.sourceDivider} />
          <Text style={styles.source}>{hadith.source}</Text>
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
    fontSize: 20,
    color: colors.card,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 32,
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
  sourceContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: borderRadius.sm,
  },
  source: {
    ...typography.caption,
    fontSize: 13,
    color: colors.card,
    opacity: 0.9,
    fontStyle: 'italic',
    fontWeight: '600',
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
