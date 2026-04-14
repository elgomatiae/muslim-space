/**
 * DailyHadithWidget - Displays a daily Hadith
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTranslation } from '@/contexts/I18nContext';
import { DailyHadith } from '@/services/DailyContentService';

interface DailyHadithWidgetProps {
  hadith: DailyHadith | null;
  loading?: boolean;
}

const READ_FULL_THRESHOLD = 200;

export default function DailyHadithWidget({ hadith, loading }: DailyHadithWidgetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const showReadFull = useMemo(
    () =>
      Boolean(
        hadith &&
          (hadith.translation.length >= READ_FULL_THRESHOLD ||
            (hadith.arabic_text?.length ?? 0) >= READ_FULL_THRESHOLD),
      ),
    [hadith],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingText}>{t('home.loadingHadith')}</Text>
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
          <Text style={styles.emptyText}>{t('home.noHadithAvailable')}</Text>
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
          <Text style={styles.headerTitle}>{t('home.dailyHadith')}</Text>
        </View>

        {/* Arabic Text (if available) */}
        {hadith.arabic_text && (
          <>
            <Text style={styles.arabicText} selectable>
              {hadith.arabic_text}
            </Text>
            <View style={styles.divider} />
          </>
        )}

        {/* Translation (full text; service picks longest DB field) */}
        <Text style={styles.translation} selectable>
          {hadith.translation}
        </Text>

        {showReadFull ? (
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [styles.readFullButton, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={t('home.hadithReadFull')}
          >
            <Text style={styles.readFullLabel}>{t('home.hadithReadFull')}</Text>
            <IconSymbol
              ios_icon_name="arrow.up.left.and.arrow.down.right"
              android_material_icon_name="fullscreen"
              size={16}
              color={colors.card}
            />
          </Pressable>
        ) : null}

        {/* Source */}
        <View style={styles.sourceContainer}>
          <View style={styles.sourceDivider} />
          <Text style={styles.source}>{hadith.source}</Text>
        </View>
      </LinearGradient>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalRoot,
            {
              paddingTop: Math.max(insets.top, spacing.md),
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('home.dailyHadith')}</Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [styles.modalCloseButton, pressed && { opacity: 0.75 }]}
              hitSlop={12}
            >
              <Text style={styles.modalCloseText}>{t('home.hadithModalClose')}</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {hadith.arabic_text ? (
              <Text style={styles.modalArabic} selectable>
                {hadith.arabic_text}
              </Text>
            ) : null}
            <Text style={styles.modalBody} selectable>
              {hadith.translation}
            </Text>
            {hadith.source ? (
              <Text style={styles.modalSource} selectable>
                {hadith.source}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
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
    marginBottom: spacing.sm,
    opacity: 0.95,
  },
  readFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  readFullLabel: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.card,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.md,
  },
  modalCloseButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  modalCloseText: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  modalArabic: {
    ...typography.h3,
    fontSize: 20,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 32,
    fontWeight: '600',
  },
  modalBody: {
    ...typography.body,
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  modalSource: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
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
