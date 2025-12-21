
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import * as Haptics from 'expo-haptics';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  created_at: string;
}

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😤', label: 'Angry', value: 'angry' },
  { emoji: '🙏', label: 'Grateful', value: 'grateful' },
];

export default function JournalScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

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
      
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: title.trim() || 'Untitled Entry',
          content: content.trim(),
          mood: selectedMood,
        });

      if (error) {
        console.error('Error saving entry:', error);
        Alert.alert('Error', 'Failed to save entry');
      } else {
        Alert.alert('Success', 'Your journal entry has been saved');
        
        // Update Iman Tracker - mental health activity
        if (amanahGoals) {
          const updatedGoals = {
            ...amanahGoals,
            weeklyMentalHealthCompleted: Math.min(
              amanahGoals.weeklyMentalHealthCompleted + 1,
              amanahGoals.weeklyMentalHealthGoal
            ),
          };
          await updateAmanahGoals(updatedGoals);
        }
        
        setTitle('');
        setContent('');
        setSelectedMood('');
        setShowNewEntry(false);
        loadEntries();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodObj = MOODS.find(m => m.value === mood);
    return moodObj ? moodObj.emoji : '📝';
  };

  const openJournalWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowJournalModal(true);
  };

  const closeJournalWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowJournalModal(false);
    setShowNewEntry(false);
    setSelectedEntry(null);
  };

  const openNewEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNewEntry(true);
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setSelectedMood('');
  };

  const viewEntry = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEntry(entry);
    setShowNewEntry(false);
  };

  // Main screen - button to open journal
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContent}>
        <TouchableOpacity
          style={styles.openJournalButton}
          onPress={openJournalWindow}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.openJournalGradient}
          >
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="menu-book"
              size={64}
              color={colors.card}
            />
            <Text style={styles.openJournalTitle}>Open Journal</Text>
            <Text style={styles.openJournalSubtitle}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Journal Modal Window */}
      <Modal
        visible={showJournalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeJournalWindow}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeJournalWindow}
              style={styles.closeButton}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>My Journal</Text>
            <TouchableOpacity
              style={styles.newEntryIconButton}
              onPress={openNewEntry}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newEntryIconGradient}
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

          {/* Previous Entries Bar */}
          <View style={styles.entriesBar}>
            <Text style={styles.entriesBarTitle}>Previous Entries</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.entriesBarScroll}
            >
              {entries.map((entry, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.entryBarItem,
                      selectedEntry?.id === entry.id && styles.entryBarItemActive,
                    ]}
                    onPress={() => viewEntry(entry)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.entryBarEmoji}>{getMoodEmoji(entry.mood)}</Text>
                    <Text style={styles.entryBarTitle} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text style={styles.entryBarDate}>
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
              {entries.length === 0 && (
                <Text style={styles.noEntriesText}>No entries yet. Start writing!</Text>
              )}
            </ScrollView>
          </View>

          {/* Content Area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {showNewEntry ? (
              // New Entry Form
              <View style={styles.newEntryForm}>
                <Text style={styles.formSectionTitle}>How are you feeling?</Text>
                <View style={styles.moodGrid}>
                  {MOODS.map((mood, index) => (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={[
                          styles.moodButton,
                          selectedMood === mood.value && styles.moodButtonSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedMood(mood.value);
                        }}
                      >
                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                        <Text style={styles.moodLabel}>{mood.label}</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>

                <Text style={styles.formSectionTitle}>Title (Optional)</Text>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Give your entry a title..."
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.formSectionTitle}>Your Thoughts</Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Write your thoughts, feelings, and reflections..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveEntry}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.card}
                    />
                    <Text style={styles.saveButtonText}>Save Entry</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.imanTrackerHint}>
                  💫 Journaling counts toward your mental health goals in the Iman Tracker
                </Text>
              </View>
            ) : selectedEntry ? (
              // View Selected Entry
              <View style={styles.entryView}>
                <View style={styles.entryViewHeader}>
                  <Text style={styles.entryViewMood}>{getMoodEmoji(selectedEntry.mood)}</Text>
                  <View style={styles.entryViewHeaderText}>
                    <Text style={styles.entryViewTitle}>{selectedEntry.title}</Text>
                    <Text style={styles.entryViewDate}>{formatDate(selectedEntry.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.entryViewDivider} />
                <Text style={styles.entryViewContent}>{selectedEntry.content}</Text>
              </View>
            ) : (
              // Empty State
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyStateTitle}>Welcome to Your Journal</Text>
                <Text style={styles.emptyStateText}>
                  Select an entry from above or create a new one to start journaling
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={openNewEntry}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyStateButtonGradient}
                  >
                    <IconSymbol
                      ios_icon_name="plus"
                      android_material_icon_name="add"
                      size={20}
                      color={colors.card}
                    />
                    <Text style={styles.emptyStateButtonText}>New Entry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  openJournalButton: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  openJournalGradient: {
    padding: spacing.xxxl * 2,
    alignItems: 'center',
  },
  openJournalTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  openJournalSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
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
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  newEntryIconButton: {
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    ...shadows.medium,
  },
  newEntryIconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entriesBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  entriesBarTitle: {
    ...typography.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  entriesBarScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  entryBarItem: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  entryBarItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  entryBarEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  entryBarTitle: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  entryBarDate: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 10,
  },
  noEntriesText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  newEntryForm: {
    gap: spacing.lg,
  },
  formSectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  moodButton: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  moodButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    ...typography.caption,
    color: colors.text,
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
    minHeight: 300,
  },
  saveButton: {
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
  },
  entryView: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  entryViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  entryViewMood: {
    fontSize: 48,
  },
  entryViewHeaderText: {
    flex: 1,
  },
  entryViewTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  entryViewDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  entryViewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  entryViewContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 26,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
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
});
