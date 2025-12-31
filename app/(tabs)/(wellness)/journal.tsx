
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const SUGGESTED_TAGS = [
  'Gratitude', 'Prayer', 'Reflection', 'Goals', 'Challenges',
  'Blessings', 'Learning', 'Family', 'Health', 'Spirituality',
  'Dua', 'Quran', 'Ramadan', 'Personal Growth', 'Struggles'
];

type ViewMode = 'list' | 'calendar';

export default function JournalScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Modal states
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, searchQuery, filterTag]);

  const loadEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title?.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filterTag) {
      filtered = filtered.filter(entry => entry.tags?.includes(filterTag));
    }

    setFilteredEntries(filtered);
  };

  const openNewEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    setShowEntryModal(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
    setSelectedEntry(entry);
    setTitle(entry.title || '');
    setContent(entry.content || '');
    setSelectedTags(entry.tags || []);
    setShowEntryModal(true);
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to save entries');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const entryData = {
        user_id: user.id,
        title: title.trim() || 'Untitled Entry',
        content: content.trim(),
        tags: selectedTags,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && selectedEntry) {
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', selectedEntry.id);

        if (error) {
          console.error('Error updating entry:', error);
          Alert.alert('Error', 'Failed to update entry');
        } else {
          Alert.alert('Success', 'Your journal entry has been updated');
          setShowEntryModal(false);
          loadEntries();
        }
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert(entryData);

        if (error) {
          console.error('Error saving entry:', error);
          Alert.alert('Error', 'Failed to save entry');
        } else {
          Alert.alert('Success', 'Your journal entry has been saved');
          
          // Update Iman Tracker - journal activity
          if (amanahGoals) {
            const updatedGoals = {
              ...amanahGoals,
              weeklyJournalCompleted: Math.min(
                amanahGoals.weeklyJournalCompleted + 1,
                amanahGoals.weeklyJournalGoal
              ),
            };
            await updateAmanahGoals(updatedGoals);
          }
          
          setShowEntryModal(false);
          loadEntries();
        }
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const deleteEntry = async (entryId: string) => {
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
              const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', entryId);

              if (error) {
                console.error('Error deleting entry:', error);
                Alert.alert('Error', 'Failed to delete entry');
              } else {
                setShowEntryModal(false);
                loadEntries();
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
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

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setFilterTag('');
  };

  const hasActiveFilters = searchQuery || filterTag;

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags || [])));

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
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
          </View>
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

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFilters(!showFilters);
            }}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal.decrease.circle"
              android_material_icon_name="filter-list"
              size={20}
              color={showFilters ? colors.primary : colors.text}
            />
            <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
              Filters
            </Text>
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          )}

          <View style={styles.filterSpacer} />

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('list');
            }}
          >
            <IconSymbol
              ios_icon_name="list.bullet"
              android_material_icon_name="view-list"
              size={20}
              color={viewMode === 'list' ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('calendar');
            }}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-month"
              size={20}
              color={viewMode === 'calendar' ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Expandable Filters */}
        {showFilters && allTags.length > 0 && (
          <View style={styles.filtersExpanded}>
            <Text style={styles.filterSectionTitle}>Filter by Tag</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterScroll}>
              {allTags.map((tag, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.tagFilterChip,
                      filterTag === tag && styles.tagFilterChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFilterTag(filterTag === tag ? '' : tag);
                    }}
                  >
                    <Text style={[
                      styles.tagFilterText,
                      filterTag === tag && styles.tagFilterTextActive,
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
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
              {hasActiveFilters ? 'No Matching Entries' : 'Start Your Journey'}
            </Text>
            <Text style={styles.emptyStateText}>
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more entries'
                : 'Begin documenting your thoughts, reflections, and spiritual journey'
              }
            </Text>
            {!hasActiveFilters && (
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
          <View style={styles.entriesGrid}>
            {filteredEntries.map((entry, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
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
                      size={28}
                      color={colors.card}
                    />
                    <View style={styles.entryCardHeaderText}>
                      <Text style={styles.entryCardDate}>{formatDate(entry.created_at)}</Text>
                      <Text style={styles.entryCardTime}>{formatTime(entry.created_at)}</Text>
                    </View>
                  </LinearGradient>
                  
                  <View style={styles.entryCardBody}>
                    <Text style={styles.entryCardTitle} numberOfLines={2}>
                      {entry.title || 'Untitled Entry'}
                    </Text>
                    <Text style={styles.entryCardContent} numberOfLines={3}>
                      {entry.content}
                    </Text>
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.entryCardTags}>
                        {entry.tags.slice(0, 3).map((tag, tagIndex) => (
                          <React.Fragment key={tagIndex}>
                            <View style={styles.entryCardTag}>
                              <Text style={styles.entryCardTagText}>{tag}</Text>
                            </View>
                          </React.Fragment>
                        ))}
                        {entry.tags.length > 3 && (
                          <Text style={styles.entryCardTagMore}>+{entry.tags.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
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
            {isEditing && selectedEntry && (
              <TouchableOpacity
                onPress={() => deleteEntry(selectedEntry.id)}
                style={styles.modalDeleteButton}
              >
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={24}
                  color={colors.error}
                />
              </TouchableOpacity>
            )}
            {!isEditing && <View style={styles.modalHeaderSpacer} />}
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

            {/* Tags */}
            <Text style={styles.formLabel}>Tags (Optional)</Text>
            <View style={styles.tagsContainer}>
              {SUGGESTED_TAGS.map((tag, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
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
                </React.Fragment>
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
                  {selectedTags.map((tag, index) => (
                    <React.Fragment key={index}>
                      <View style={styles.selectedTag}>
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
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveEntry}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.card}
                />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Entry' : 'Save Entry'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!isEditing && (
              <Text style={styles.imanTrackerHint}>
                💫 Journaling counts toward your mental health goals
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
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
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  filterButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  clearFiltersButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearFiltersText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.accent,
  },
  filterSpacer: {
    flex: 1,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.highlight,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  filtersExpanded: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterSectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagFilterScroll: {
    marginBottom: spacing.sm,
  },
  tagFilterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  tagFilterText: {
    ...typography.caption,
    color: colors.text,
  },
  tagFilterTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  entriesGrid: {
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
});
