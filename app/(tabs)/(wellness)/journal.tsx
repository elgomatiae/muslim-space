import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { 
  fetchJournalEntries, 
  saveJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry,
  searchJournalEntries,
  type JournalEntry 
} from '@/services/JournalService';
import * as Haptics from 'expo-haptics';

const SUGGESTED_TAGS = [
  'Gratitude', 'Prayer', 'Reflection', 'Goals', 'Challenges',
  'Blessings', 'Learning', 'Family', 'Health', 'Spirituality',
  'Dua', 'Quran', 'Ramadan', 'Personal Growth', 'Struggles'
];

const MOODS = [
  { label: '😊 Happy', value: 'happy' },
  { label: '😌 Peaceful', value: 'peaceful' },
  { label: '🙏 Grateful', value: 'grateful' },
  { label: '😔 Sad', value: 'sad' },
  { label: '😰 Anxious', value: 'anxious' },
  { label: '😤 Frustrated', value: 'frustrated' },
  { label: '🤔 Reflective', value: 'reflective' },
  { label: '💪 Motivated', value: 'motivated' },
];

export default function JournalScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [customTag, setCustomTag] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadEntries();
    } else {
      // Clear entries when user logs out
      setEntries([]);
      setFilteredEntries([]);
    }
  }, [user?.id]); // Reload when user ID changes (e.g., switching accounts)

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setFilteredEntries(entries);
    }
  }, [searchQuery, entries]);

  const loadEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchJournalEntries(user.id);
      setEntries(data);
      setFilteredEntries(data);
      console.log(`✅ Loaded ${data.length} journal entries`);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load journal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!user || !searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }
    
    try {
      const results = await searchJournalEntries(user.id, searchQuery);
      setFilteredEntries(results);
    } catch (error) {
      console.error('Error searching:', error);
      setFilteredEntries(entries);
    }
  };

  const openNewEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setSelectedMood('');
    setCustomTag('');
    setShowEntryModal(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
    setSelectedEntry(entry);
    setTitle(entry.title || '');
    setContent(entry.content || '');
    setSelectedTags(entry.tags || []);
    setSelectedMood(entry.mood || '');
    setCustomTag('');
    setShowEntryModal(true);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal entry');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to save entries');
      return;
    }

    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (isEditing && selectedEntry) {
        // Update existing entry
        const updated = await updateJournalEntry(
          selectedEntry.id,
          title,
          content,
          selectedTags,
          selectedMood
        );
        
        if (!updated) {
          throw new Error('Failed to update entry');
        }
        
        console.log('✅ Journal entry updated and saved to your profile');
        Alert.alert('Success', 'Your journal entry has been updated and saved to your profile');
      } else {
        // Create new entry - saved to Supabase with user_id for cross-device sync
        const saved = await saveJournalEntry(
          user.id, // This ensures entry is linked to user's profile
          title,
          content,
          selectedTags,
          selectedMood
        );
        
        if (!saved) {
          throw new Error('Failed to save entry');
        }
        
        console.log('✅ Journal entry saved to your profile (accessible on all devices)');
        
        // Update Iman Tracker - journal activity
        if (amanahGoals) {
          const updatedGoals = {
            ...amanahGoals,
            weeklyJournalCompleted: Math.min(
              (amanahGoals.weeklyJournalCompleted || 0) + 1,
              amanahGoals.weeklyJournalGoal || 10
            ),
          };
          await updateAmanahGoals(updatedGoals);
          console.log('✅ Updated Iman Tracker journal goal');
        }
        
        // Track journal entry for achievements
        await trackJournalEntry(user.id);
        
        Alert.alert('Success', 'Your journal entry has been saved to your profile');
      }
      
      setShowEntryModal(false);
      // Reload entries from Supabase to ensure we have the latest data
      await loadEntries();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      const errorMessage = error.message || 'Failed to save entry. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteJournalEntry(entryId);
              setShowEntryModal(false);
              await loadEntries();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Please Log In</Text>
          <Text style={styles.emptyStateText}>You must be logged in to use the journal</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIconGradient}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={28}
                color={colors.card}
              />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>My Journal</Text>
              <Text style={styles.headerSubtitle}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} • Synced to your profile
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadEntries}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newEntryButton}
              onPress={openNewEntry}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newEntryGradient}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={24}
                  color={colors.card}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyStateText}>Loading entries...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="book.closed"
              android_material_icon_name="menu-book"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No Matching Entries' : 'Start Your Journey'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search to see more entries'
                : 'Begin documenting your thoughts, reflections, and spiritual journey'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={openNewEntry}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyStateButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={24}
                    color={colors.card}
                  />
                  <Text style={styles.emptyStateButtonText}>Create First Entry</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.entriesList}>
            {filteredEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                activeOpacity={0.8}
                onPress={() => openEditEntry(entry)}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.entryCardHeader}
                >
                  <IconSymbol
                    ios_icon_name="book.fill"
                    android_material_icon_name="menu-book"
                    size={24}
                    color={colors.card}
                  />
                  <View style={styles.entryCardHeaderText}>
                    <Text style={styles.entryCardDate}>{formatDate(entry.created_at)}</Text>
                    <Text style={styles.entryCardTime}>{formatTime(entry.created_at)}</Text>
                  </View>
                  {entry.mood && (
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodBadgeText}>
                        {MOODS.find(m => m.value === entry.mood)?.label || entry.mood}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
                
                <View style={styles.entryCardBody}>
                  <Text style={styles.entryCardTitle} numberOfLines={2}>
                    {entry.title || 'Untitled Entry'}
                  </Text>
                  <Text style={styles.entryCardContent} numberOfLines={4}>
                    {entry.content}
                  </Text>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <View style={styles.entryCardTags}>
                      {entry.tags.slice(0, 3).map((tag, tagIndex) => (
                        <View key={tagIndex} style={styles.entryCardTag}>
                          <Text style={styles.entryCardTagText}>{tag}</Text>
                        </View>
                      ))}
                      {entry.tags.length > 3 && (
                        <Text style={styles.entryCardTagMore}>+{entry.tags.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Entry Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowEntryModal(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Entry' : 'New Entry'}
              </Text>
              {isEditing && selectedEntry ? (
                <TouchableOpacity
                  onPress={() => handleDelete(selectedEntry.id)}
                  style={styles.modalDeleteButton}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.modalHeaderSpacer} />
              )}
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title Input */}
              <Text style={styles.formLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your entry a title..."
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Content Input */}
              <Text style={styles.formLabel}>Your Thoughts *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Write your thoughts, reflections, and feelings..."
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              {/* Mood Selection */}
              <Text style={styles.formLabel}>Mood (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodChip,
                      selectedMood === mood.value && styles.moodChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMood(selectedMood === mood.value ? '' : mood.value);
                    }}
                  >
                    <Text style={[
                      styles.moodChipText,
                      selectedMood === mood.value && styles.moodChipTextSelected,
                    ]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tags */}
              <Text style={styles.formLabel}>Tags (Optional)</Text>
              <View style={styles.tagsContainer}>
                {SUGGESTED_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagChip,
                      selectedTags.includes(tag) && styles.tagChipSelected,
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      selectedTags.includes(tag) && styles.tagChipTextSelected,
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Tag Input */}
              <View style={styles.customTagContainer}>
                <TextInput
                  style={styles.customTagInput}
                  placeholder="Add custom tag..."
                  placeholderTextColor={colors.textSecondary}
                  value={customTag}
                  onChangeText={setCustomTag}
                  onSubmitEditing={addCustomTag}
                />
                <TouchableOpacity
                  style={styles.customTagButton}
                  onPress={addCustomTag}
                >
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={28}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                  <Text style={styles.selectedTagsLabel}>Selected Tags:</Text>
                  <View style={styles.selectedTagsWrap}>
                    {selectedTags.map((tag) => (
                      <View key={tag} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => toggleTag(tag)}>
                          <IconSymbol
                            ios_icon_name="xmark.circle.fill"
                            android_material_icon_name="cancel"
                            size={16}
                            color={colors.card}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.card}
                    />
                  )}
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {!isEditing && (
                <Text style={styles.imanTrackerHint}>
                  💫 Journaling counts toward your mental health goals in the Iman Tracker
                </Text>
              )}
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
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  newEntryButton: {
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    ...shadows.medium,
  },
  newEntryGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyStateButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  entriesList: {
    gap: spacing.md,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  entryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  entryCardHeaderText: {
    flex: 1,
  },
  entryCardDate: {
    ...typography.bodyBold,
    color: colors.card,
    marginBottom: 2,
  },
  entryCardTime: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  moodBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  moodBadgeText: {
    ...typography.small,
    color: colors.card,
  },
  entryCardBody: {
    padding: spacing.lg,
  },
  entryCardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  entryCardContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  entryCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  entryCardTag: {
    backgroundColor: colors.highlight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  entryCardTagText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  entryCardTagMore: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  modalContainer: {
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
  modalCloseButton: {
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
  modalDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing.lg,
  },
  formLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  titleInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
  moodScroll: {
    marginBottom: spacing.md,
  },
  moodChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  moodChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moodChipText: {
    ...typography.caption,
    color: colors.text,
  },
  moodChipTextSelected: {
    color: colors.card,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.text,
  },
  tagChipTextSelected: {
    color: colors.card,
    fontWeight: '600',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  customTagButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTagsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
  },
  selectedTagsLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  selectedTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  selectedTagText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  saveButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  imanTrackerHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  infoContainer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  syncHint: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});
