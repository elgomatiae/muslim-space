import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import {
  fetchJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  searchJournalEntries,
  type JournalEntry,
} from '@/services/JournalService';
import { trackJournalEntry } from '@/utils/imanActivityIntegration';
import * as Haptics from 'expo-haptics';

/** Minimal tags — select one or add custom. Kept optional and lightweight. */
const SUGGESTED_TAGS = [
  'Gratitude',
  'Reflection',
  'Goals',
  'Spiritual',
  'Blessings',
  'Struggle',
  'Dua',
  'Learning',
];

/** Single rotating prompt per session. No mood, no category drill-down. */
const REFLECTION_PROMPTS = [
  "What are you grateful for today?",
  "How did you feel closer to Allah today?",
  "What moment will you remember most?",
  "What small blessing did you notice?",
  "What step did you take toward your goals?",
  "How did today align with your values?",
  "What verse or teaching stayed with you?",
  "Who deserves your gratitude and why?",
  "What would you do differently if you could relive today?",
  "What dua are you holding in your heart?",
];

type DateGroup = 'today' | 'yesterday' | 'week' | 'older';

function getDateGroup(dateStr: string): DateGroup {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  if (d >= todayStart) return 'today';
  if (d >= yesterdayStart) return 'yesterday';
  if (d >= weekStart) return 'week';
  return 'older';
}

function formatSectionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function deriveTitle(content: string, dateStr: string): string {
  const firstLine = content.trim().split('\n')[0];
  if (firstLine && firstLine.length > 0) {
    return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  }
  return 'Reflection · ' + formatSectionDate(dateStr);
}

export default function JournalScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showComposer, setShowComposer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const sessionPrompt = useMemo(
    () => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)],
    [showComposer]
  );

  useEffect(() => {
    if (user) loadEntries();
    else {
      setEntries([]);
      setFilteredEntries([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchQuery.trim()) performSearch();
    else applyFilters(entries);
  }, [searchQuery, entries, filterTag]);

  const applyFilters = useCallback(
    (list: JournalEntry[]) => {
      let result = list;
      if (filterTag) result = result.filter((e) => e.tags?.includes(filterTag));
      setFilteredEntries(result);
    },
    [filterTag]
  );

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchJournalEntries(user.id);
      setEntries(data);
      setFilteredEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert(t('common.error'), t('wellness.failedToLoadJournal'));
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!user || !searchQuery.trim()) {
      applyFilters(entries);
      return;
    }
    try {
      const results = await searchJournalEntries(user.id, searchQuery);
      applyFilters(results);
    } catch {
      applyFilters(entries);
    }
  };

  const openNewEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
    setSelectedEntry(null);
    setViewingEntry(null);
    setContent('');
    setSelectedTags([]);
    setCustomTag('');
    setShowComposer(true);
  };

  const openView = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewingEntry(entry);
  };

  const openEdit = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewingEntry(null);
    setIsEditing(true);
    setSelectedEntry(entry);
    setContent(entry.content || '');
    setSelectedTags(entry.tags || []);
    setCustomTag('');
    setShowComposer(true);
  };

  const applyPrompt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContent((prev) => (prev.trim() ? prev + '\n\n' + sessionPrompt : sessionPrompt));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('wellness.writeSomething'));
      return;
    }
    if (!user) {
      Alert.alert(t('common.error'), t('wellness.mustBeLoggedInToSave'));
      return;
    }

    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const title = deriveTitle(content, new Date().toISOString());

      if (isEditing && selectedEntry) {
        await updateJournalEntry(selectedEntry.id, title, content, selectedTags);
        Alert.alert(t('common.success'), t('wellness.journalEntryUpdated'));
      } else {
        await saveJournalEntry(user.id, title, content, selectedTags);
        if (amanahGoals) {
          await updateAmanahGoals({
            ...amanahGoals,
            weeklyJournalCompleted: Math.min(
              (amanahGoals.weeklyJournalCompleted || 0) + 1,
              amanahGoals.weeklyJournalGoal || 10
            ),
          });
        }
        try {
          const { logActivity } = await import('@/utils/activityLogger');
          await logActivity({
            userId: user.id,
            activityType: 'journal_entry',
            activityCategory: 'amanah',
            activityTitle: 'Journal Entry Written',
            activityDescription: title,
            activityValue: 1,
            pointsEarned: 5,
          });
          const { checkAndUnlockAchievements } = await import('@/utils/achievementService');
          await checkAndUnlockAchievements(user.id);
        } catch {}
        await trackJournalEntry(user.id);
        Alert.alert(t('common.success'), t('wellness.journalEntrySaved'));
      }

      setShowComposer(false);
      await loadEntries();
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message || 'Failed to save. Please try again.';
      Alert.alert(t('common.error'), msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entryId: string) => {
    Alert.alert(
      t('wellness.deleteEntry'),
      t('wellness.deleteEntryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteJournalEntry(entryId);
              setShowComposer(false);
              setViewingEntry(null);
              await loadEntries();
            } catch {
              Alert.alert(t('common.error'), t('wellness.failedToDeleteEntry'));
            }
          },
        },
      ]
    );
  };

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((x) => x !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTags([...selectedTags, tag]);
      setCustomTag('');
    }
  };

  const groupedEntries = useMemo(() => {
    const groups: { group: DateGroup; label: string; entries: JournalEntry[] }[] = [];
    const seen: Record<DateGroup, boolean> = {
      today: false,
      yesterday: false,
      week: false,
      older: false,
    };
    const order: DateGroup[] = ['today', 'yesterday', 'week', 'older'];
    const labels: Record<DateGroup, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'This Week',
      older: 'Older',
    };

    const sorted = [...filteredEntries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const entry of sorted) {
      const g = getDateGroup(entry.created_at);
      if (!seen[g]) {
        seen[g] = true;
        groups.push({ group: g, label: labels[g], entries: [] });
      }
      const idx = groups.findIndex((x) => x.group === g);
      if (idx >= 0) groups[idx].entries.push(entry);
    }
    return groups;
  }, [filteredEntries]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.centeredTitle}>Please Log In</Text>
          <Text style={styles.centeredText}>Sign in to use the journal</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{t('wellness.journal')}</Text>
            <Text style={styles.headerMeta}>
              {entries.length}{' '}
              {entries.length === 1 ? t('wellness.journalEntryCountOne') : t('wellness.journalEntryCountMany')}
              {amanahGoals?.weeklyJournalGoal ? (
                <> · {t('wellness.journalGoalProgress', { current: amanahGoals.weeklyJournalCompleted ?? 0, target: amanahGoals.weeklyJournalGoal })}</>
              ) : null}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.fab}
            onPress={openNewEntry}
            activeOpacity={0.85}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={24}
              color={colors.card}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('wellness.searchEntries')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {entries.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagScroll}
            contentContainerStyle={styles.tagScrollContent}
          >
            <TouchableOpacity
              style={[styles.tagChip, !filterTag && styles.tagChipActive]}
              onPress={() => setFilterTag(null)}
            >
              <Text style={[styles.tagChipText, !filterTag && styles.tagChipTextActive]}>
                {t('wellness.allEntries')}
              </Text>
            </TouchableOpacity>
            {Array.from(new Set(entries.flatMap((e) => e.tags || [])))
              .slice(0, 6)
              .map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, filterTag === tag && styles.tagChipActive]}
                  onPress={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  <Text style={[styles.tagChipText, filterTag === tag && styles.tagChipTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centeredText}>Loading...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <IconSymbol
                ios_icon_name="text.book.closed.fill"
                android_material_icon_name="menu-book"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('wellness.noMatchingEntries') : filterTag ? t('wellness.noEntriesWithTag') : t('wellness.startYourJourney')}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? t('wellness.tryAdjustingSearch') : filterTag ? t('wellness.tryDifferentTag') : t('wellness.beginDocumenting')}
            </Text>
            {!searchQuery && !filterTag && (
              <TouchableOpacity style={styles.emptyButton} onPress={openNewEntry} activeOpacity={0.8}>
                <Text style={styles.emptyButtonText}>{t('wellness.createFirstEntry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.groups}>
            {groupedEntries.map(({ group, label, entries: groupEntries }) => (
              <View key={group} style={styles.group}>
                <Text style={styles.groupLabel}>{label}</Text>
                {groupEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() => openView(entry)}
                  >
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTime}>{formatTime(entry.created_at)}</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {entry.title || t('wellness.untitledEntry')}
                    </Text>
                    <Text style={styles.cardPreview} numberOfLines={3}>
                      {entry.content}
                    </Text>
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.cardTags}>
                        {entry.tags.slice(0, 3).map((tag, i) => (
                          <View key={i} style={styles.cardTag}>
                            <Text style={styles.cardTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* View modal */}
      <Modal
        visible={!!viewingEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewingEntry(null)}
      >
        <SafeAreaView style={styles.modal} edges={['top']}>
          {viewingEntry && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setViewingEntry(null)} style={styles.modalClose}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('wellness.viewEntry')}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalEditBtn}
                    onPress={() => openEdit(viewingEntry)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.modalEditBtnText}>{t('wellness.editEntry')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDelete(viewingEntry.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.viewContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.viewMeta}>
                  {formatSectionDate(viewingEntry.created_at)} · {formatTime(viewingEntry.created_at)}
                </Text>
                <Text style={styles.viewTitle}>{viewingEntry.title || t('wellness.untitledEntry')}</Text>
                <Text style={styles.viewBody}>{viewingEntry.content}</Text>
                {viewingEntry.tags && viewingEntry.tags.length > 0 && (
                  <View style={styles.viewTags}>
                    {viewingEntry.tags.map((tag, i) => (
                      <View key={i} style={styles.viewTag}>
                        <Text style={styles.viewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.viewBottom} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Composer modal */}
      <Modal
        visible={showComposer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposer(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modal}
        >
          <SafeAreaView style={styles.modal} edges={['top']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowComposer(false)}
                style={styles.modalClose}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isEditing ? t('common.edit') : t('wellness.newJournalEntry')}
              </Text>
              {isEditing && selectedEntry ? (
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => handleDelete(selectedEntry.id)}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.modalSpacer} />
              )}
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.composerContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!isEditing && (
                <TouchableOpacity
                  style={styles.promptCard}
                  onPress={applyPrompt}
                  activeOpacity={0.8}
                >
                  <Text style={styles.promptLabel}>{t('wellness.suggestedPrompts')}</Text>
                  <Text style={styles.promptText}>{sessionPrompt}</Text>
                  <Text style={styles.promptUse}>{t('wellness.usePrompt')}</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.fieldLabel}>Your reflection *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder={t('wellness.writeYourThoughts')}
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Tags (optional)</Text>
              <View style={styles.tagsRow}>
                {SUGGESTED_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.optTag, selectedTags.includes(tag) && styles.optTagActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.optTagText, selectedTags.includes(tag) && styles.optTagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customTagRow}>
                <TextInput
                  style={styles.customTagInput}
                  placeholder={t('wellness.addCustomTag')}
                  placeholderTextColor={colors.textSecondary}
                  value={customTag}
                  onChangeText={setCustomTag}
                  onSubmitEditing={addCustomTag}
                />
                <TouchableOpacity style={styles.customTagBtn} onPress={addCustomTag}>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={22}
                      color={colors.card}
                    />
                    <Text style={styles.saveBtnText}>
                      {saving ? '...' : isEditing ? 'Update' : 'Save'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {!isEditing && (
                <Text style={styles.hint}>{t('wellness.journalGoalHint')}</Text>
              )}
              <View style={styles.composerBottom} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    marginTop: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  tagScroll: {
    marginTop: spacing.sm,
    maxHeight: 36,
  },
  tagScrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  tagChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.highlight,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tagChipTextActive: {
    color: colors.card,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  centeredTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  centeredText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.highlightPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  groups: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  groupLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: '#FDFCFA',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EDE9E5',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardPreview: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cardTag: {
    backgroundColor: colors.highlight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  cardTagText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomPad: {
    height: 80,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '18',
  },
  modalEditBtnText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  modalDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSpacer: {
    width: 40,
  },
  modalScroll: {
    flex: 1,
  },
  viewContent: {
    padding: spacing.xl,
  },
  viewMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  viewTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  viewBody: {
    ...typography.body,
    color: colors.text,
    lineHeight: 26,
  },
  viewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  viewTag: {
    backgroundColor: colors.highlight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  viewTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  viewBottom: {
    height: 60,
  },
  composerContent: {
    padding: spacing.lg,
  },
  promptCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  promptLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  promptText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  promptUse: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  fieldLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  contentInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optTag: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optTagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optTagText: {
    ...typography.caption,
    color: colors.text,
  },
  optTagTextActive: {
    color: colors.card,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customTagBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  composerBottom: {
    height: 80,
  },
});
