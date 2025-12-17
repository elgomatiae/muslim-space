
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

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

  if (showNewEntry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.newEntryHeader}>
            <TouchableOpacity
              onPress={() => setShowNewEntry(false)}
              style={styles.backButton}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron-left"
                size={24}
                color={colors.text}
              />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.header}>New Entry</Text>
            <TouchableOpacity
              onPress={saveEntry}
              style={styles.saveButton}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Mood Selector */}
          <View style={styles.moodSection}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((mood, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.moodButton,
                      selectedMood === mood.value && styles.moodButtonSelected,
                    ]}
                    onPress={() => setSelectedMood(mood.value)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Give your entry a title..."
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Content Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Thoughts</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts, feelings, and reflections..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.header}>My Journal</Text>
            <Text style={styles.subtitle}>Your private space for reflection</Text>
          </View>
          <TouchableOpacity
            style={styles.newEntryButton}
            onPress={() => setShowNewEntry(true)}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/journal-prompts' as any)}
          >
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.quickActionText}>Get Prompt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/mood-tracker' as any)}
          >
            <IconSymbol
              ios_icon_name="chart.line.uptrend.xyaxis"
              android_material_icon_name="insights"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.quickActionText}>Mood Tracker</Text>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        <View style={styles.entriesContainer}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start journaling to track your thoughts and feelings</Text>
            </View>
          ) : (
            entries.map((entry, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.entryCard}
                  activeOpacity={0.7}
                  onPress={() => console.log('View entry:', entry.id)}
                >
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                    <View style={styles.entryHeaderText}>
                      <Text style={styles.entryTitle} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
                    </View>
                  </View>
                  <Text style={styles.entryContent} numberOfLines={3}>
                    {entry.content}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  header: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  newEntryButton: {
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    ...shadows.medium,
  },
  newEntryGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  quickActionText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  entriesContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  entryMood: {
    fontSize: 32,
  },
  entryHeaderText: {
    flex: 1,
  },
  entryTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  entryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  entryContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  newEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  moodSection: {
    marginBottom: spacing.xxl,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
  inputSection: {
    marginBottom: spacing.xxl,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
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
  bottomPadding: {
    height: 120,
  },
});
