
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  notes: string;
  date: string;
  created_at: string;
}

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy', color: colors.gradientSunset },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful', color: colors.gradientSecondary },
  { emoji: '😔', label: 'Sad', value: 'sad', color: colors.gradientPurple },
  { emoji: '😰', label: 'Anxious', value: 'anxious', color: colors.gradientInfo },
  { emoji: '😤', label: 'Angry', value: 'angry', color: colors.gradientRed },
  { emoji: '🙏', label: 'Grateful', value: 'grateful', color: colors.gradientPrimary },
];

export default function MoodTrackerScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading mood entries:', error);
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMood = async () => {
    if (!selectedMood) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to track mood');
      return;
    }

    try {
      const { error } = await supabase
        .from('mood_tracking')
        .insert({
          user_id: user.id,
          mood: selectedMood,
          intensity: intensity,
          date: new Date().toISOString().split('T')[0],
        });

      if (error) {
        console.error('Error saving mood:', error);
        Alert.alert('Error', 'Failed to save mood');
      } else {
        Alert.alert('Success', 'Mood tracked successfully');
        setSelectedMood('');
        setIntensity(5);
        loadEntries();
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save mood');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodObj = MOODS.find(m => m.value === mood);
    return moodObj ? moodObj.emoji : '📝';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Mood Tracker</Text>
          <Text style={styles.subtitle}>Track your emotional patterns</Text>
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

        {/* Intensity Slider */}
        {selectedMood && (
          <View style={styles.intensitySection}>
            <Text style={styles.sectionTitle}>Intensity: {intensity}/10</Text>
            <View style={styles.intensityButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.intensityButton,
                      intensity === value && styles.intensityButtonSelected,
                    ]}
                    onPress={() => setIntensity(value)}
                  >
                    <Text style={[
                      styles.intensityText,
                      intensity === value && styles.intensityTextSelected,
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        {selectedMood && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveMood}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Save Mood</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Entries */}
        <View style={styles.entriesContainer}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : entries.length === 0 ? (
            <Text style={styles.emptyText}>No entries yet</Text>
          ) : (
            entries.map((entry, index) => (
              <React.Fragment key={index}>
                <View style={styles.entryCard}>
                  <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryLabel}>{entry.mood}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
                  </View>
                  <View style={styles.intensityBadge}>
                    <Text style={styles.intensityBadgeText}>{entry.intensity}/10</Text>
                  </View>
                </View>
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
  headerContainer: {
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
  moodSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
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
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  moodLabel: {
    ...typography.caption,
    color: colors.text,
  },
  intensitySection: {
    marginBottom: spacing.xxl,
  },
  intensityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  intensityButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  intensityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  intensityText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  intensityTextSelected: {
    color: colors.card,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.medium,
  },
  saveGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveText: {
    ...typography.h4,
    color: colors.card,
  },
  entriesContainer: {
    marginBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  entryMood: {
    fontSize: 32,
  },
  entryContent: {
    flex: 1,
  },
  entryLabel: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  entryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  intensityBadge: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  intensityBadgeText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
