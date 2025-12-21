
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Modal } from "react-native";
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
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  created_at: string;
}

interface Dua {
  id: string;
  title: string;
  arabic_text: string;
  translation: string;
  emotion_category: string;
}

interface JournalPrompt {
  id: string;
  prompt_text: string;
  category: string;
}

interface MoodEntry {
  id: string;
  mood: string;
  date: string;
}

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😤', label: 'Angry', value: 'angry' },
  { emoji: '🙏', label: 'Grateful', value: 'grateful' },
];

export default function MentalHealthHubScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [moodStreak, setMoodStreak] = useState(0);
  const [quickJournalText, setQuickJournalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const loadAllContent = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJournalEntries(),
        loadDuas(),
        loadPrompts(),
        loadMoodData(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllContent();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadAllContent, fadeAnim, slideAnim]);

  const loadJournalEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('journal_entries')
      .select('id, title, content, mood, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setJournalEntries(data);
  };

  const loadDuas = async () => {
    const { data } = await supabase
      .from('mental_health_duas')
      .select('id, title, arabic_text, translation, emotion_category')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(4);
    if (data) setDuas(data);
  };

  const loadPrompts = async () => {
    const { data } = await supabase
      .from('journal_prompts')
      .select('id, prompt_text, category')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(3);
    if (data) setPrompts(data);
  };

  const loadMoodData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mood_tracking')
      .select('id, mood, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7);
    if (data) setMoodEntries(data);
  };

  const loadStats = async () => {
    if (!user) return;
    
    // Journal count
    const { count: jCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setJournalCount(jCount || 0);

    // Mood streak
    const { data: moodData } = await supabase
      .from('mood_tracking')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);
    
    if (moodData && moodData.length > 0) {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < moodData.length; i++) {
        const entryDate = new Date(moodData[i].date);
        const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === i) {
          streak++;
        } else {
          break;
        }
      }
      setMoodStreak(streak);
    }
  };

  const handleQuickJournal = async () => {
    if (!user || !quickJournalText.trim()) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: 'Quick Entry',
        content: quickJournalText,
      });

    if (!error) {
      setQuickJournalText('');
      loadJournalEntries();
      loadStats();
      
      // Update Iman Tracker - mental health activity
      if (amanahGoals) {
        const updatedGoals = {
          ...amanahGoals,
          weeklyMentalHealthCompleted: amanahGoals.weeklyMentalHealthCompleted + 1,
        };
        await updateAmanahGoals(updatedGoals);
      }
    }
  };

  const openJournalWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowJournalModal(true);
    setShowNewEntry(false);
    setSelectedEntry(null);
  };

  const closeJournalWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowJournalModal(false);
    setShowNewEntry(false);
    setSelectedEntry(null);
    setNewEntryTitle('');
    setNewEntryContent('');
    setSelectedMood('');
  };

  const openNewEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNewEntry(true);
    setSelectedEntry(null);
    setNewEntryTitle('');
    setNewEntryContent('');
    setSelectedMood('');
  };

  const viewEntry = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEntry(entry);
    setShowNewEntry(false);
  };

  const saveNewEntry = async () => {
    if (!newEntryContent.trim() || !user) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: newEntryTitle.trim() || 'Untitled Entry',
          content: newEntryContent.trim(),
          mood: selectedMood,
        });

      if (!error) {
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
        
        setNewEntryTitle('');
        setNewEntryContent('');
        setSelectedMood('');
        setShowNewEntry(false);
        loadJournalEntries();
        loadStats();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
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

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section with Stats */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeader}>
            <IconSymbol
              ios_icon_name="brain.head.profile"
              android_material_icon_name="psychology"
              size={48}
              color={colors.card}
            />
            <Text style={styles.heroTitle}>Mental Wellness Hub</Text>
            <Text style={styles.heroSubtitle}>
              Your journey to inner peace
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journalCount}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moodStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duas.length}</Text>
              <Text style={styles.statLabel}>Duas</Text>
            </View>
          </View>

          {/* Link to Iman Tracker */}
          <TouchableOpacity
            style={styles.imanTrackerLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(iman)' as any);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={20}
              color={colors.card}
            />
            <Text style={styles.imanTrackerLinkText}>View in Iman Tracker</Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.card}
            />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Journal Window Button */}
      <View style={styles.journalWindowSection}>
        <TouchableOpacity
          style={styles.journalWindowButton}
          activeOpacity={0.8}
          onPress={openJournalWindow}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.journalWindowGradient}
          >
            <View style={styles.journalWindowIcon}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={48}
                color={colors.card}
              />
            </View>
            <Text style={styles.journalWindowTitle}>Open Journal</Text>
            <Text style={styles.journalWindowSubtitle}>
              {journalCount} {journalCount === 1 ? 'entry' : 'entries'} • Today&apos;s prompt awaits
            </Text>
            <View style={styles.journalWindowAction}>
              <Text style={styles.journalWindowActionText}>Start Writing</Text>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward"
                size={24}
                color={colors.card}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Journal Entry */}
      <View style={styles.quickJournalSection}>
        <View style={styles.sectionHeader}>
          <IconSymbol
            ios_icon_name="pencil.circle.fill"
            android_material_icon_name="edit"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Quick Journal</Text>
          <View style={styles.imanBadge}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.imanBadgeText}>+Iman</Text>
          </View>
        </View>
        <View style={styles.quickJournalCard}>
          <TextInput
            style={styles.quickJournalInput}
            placeholder="How are you feeling today? Express your thoughts..."
            placeholderTextColor={colors.textSecondary}
            value={quickJournalText}
            onChangeText={setQuickJournalText}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.quickJournalButton}
            onPress={handleQuickJournal}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickJournalGradient}
            >
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="send"
                size={24}
                color={colors.card}
              />
              <Text style={styles.quickJournalButtonText}>Save & Track</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.quickJournalHint}>
            Journaling counts toward your mental health goals in the Iman Tracker
          </Text>
        </View>
      </View>

      {/* Mood Tracker */}
      {moodEntries.length > 0 && (
        <View style={styles.moodSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="chart.line.uptrend.xyaxis"
              android_material_icon_name="insights"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Mood This Week</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/mood-tracker' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Track</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.moodGrid}>
            {moodEntries.map((entry, index) => (
              <React.Fragment key={index}>
                <View style={styles.moodItem}>
                  <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                  <Text style={styles.moodDate}>{formatDate(entry.date)}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Healing Duas */}
      {duas.length > 0 && (
        <View style={styles.duasSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="hands.sparkles.fill"
              android_material_icon_name="self-improvement"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Healing Duas</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/mental-duas' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.duasGrid}>
            {duas.map((dua, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.duaCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/(tabs)/(wellness)/mental-duas' as any,
                    params: { duaId: dua.id }
                  })}
                >
                  <LinearGradient
                    colors={colors.gradientPurple}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.duaGradient}
                  >
                    <View style={styles.duaHeader}>
                      <IconSymbol
                        ios_icon_name="hands.sparkles.fill"
                        android_material_icon_name="self-improvement"
                        size={24}
                        color={colors.card}
                      />
                      <Text style={styles.duaCategory}>{dua.emotion_category}</Text>
                    </View>
                    <Text style={styles.duaTitle} numberOfLines={2}>
                      {dua.title}
                    </Text>
                    <Text style={styles.duaTranslation} numberOfLines={3}>
                      {dua.translation}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Wellness Tools */}
      <View style={styles.toolsSection}>
        <View style={styles.sectionHeader}>
          <IconSymbol
            ios_icon_name="wrench.and.screwdriver.fill"
            android_material_icon_name="build"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Wellness Tools</Text>
        </View>
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={styles.toolCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/(wellness)/meditation' as any)}
          >
            <LinearGradient
              colors={colors.gradientSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolGradient}
            >
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="spa"
                size={36}
                color={colors.card}
              />
              <Text style={styles.toolTitle}>Meditation</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/(wellness)/emotional-support' as any)}
          >
            <LinearGradient
              colors={colors.gradientAccent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolGradient}
            >
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={36}
                color={colors.card}
              />
              <Text style={styles.toolTitle}>Support</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Crisis Support Banner */}
      <TouchableOpacity
        style={styles.crisisCard}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/(wellness)/crisis-support' as any)}
      >
        <LinearGradient
          colors={['#FF6B6B', '#EE5A6F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.crisisGradient}
        >
          <View style={styles.crisisContent}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color={colors.card}
            />
            <View style={styles.crisisText}>
              <Text style={styles.crisisTitle}>Need Immediate Help?</Text>
              <Text style={styles.crisisSubtitle}>Crisis support resources available 24/7</Text>
            </View>
          </View>
          <IconSymbol
            ios_icon_name="arrow.right.circle.fill"
            android_material_icon_name="arrow-forward"
            size={28}
            color={colors.card}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Inspirational Quote */}
      <View style={styles.quoteSection}>
        <LinearGradient
          colors={colors.gradientTeal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quoteGradient}
        >
          <IconSymbol
            ios_icon_name="quote.opening"
            android_material_icon_name="format-quote"
            size={32}
            color={colors.card}
          />
          <Text style={styles.quoteText}>
            &quot;Verily, with hardship comes ease.&quot;
          </Text>
          <Text style={styles.quoteSource}>Quran 94:6</Text>
        </LinearGradient>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <IconSymbol
          ios_icon_name="info.circle.fill"
          android_material_icon_name="info"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.disclaimerText}>
          This app provides Islamic guidance and support resources, but is not a substitute for professional mental health care.
        </Text>
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

          {/* Today's Suggested Prompt */}
          {!showNewEntry && !selectedEntry && prompts.length > 0 && (
            <View style={styles.todayPromptSection}>
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.todayPromptGradient}
              >
                <View style={styles.todayPromptBadge}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={16}
                    color={colors.card}
                  />
                  <Text style={styles.todayPromptBadgeText}>TODAY&apos;S PROMPT</Text>
                </View>
                <Text style={styles.todayPromptText}>{prompts[0].prompt_text}</Text>
                <TouchableOpacity
                  style={styles.todayPromptButton}
                  onPress={openNewEntry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.todayPromptButtonText}>Start Writing</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={20}
                    color={colors.card}
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Previous Entries Bar */}
          <View style={styles.entriesBar}>
            <Text style={styles.entriesBarTitle}>Previous Entries</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.entriesBarScroll}
            >
              {journalEntries.map((entry, index) => (
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
                      {formatDate(entry.created_at)}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
              {journalEntries.length === 0 && (
                <Text style={styles.noEntriesText}>No entries yet. Start writing!</Text>
              )}
            </ScrollView>
          </View>

          {/* Content Area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.modalContentContainer}
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
                        <Text style={styles.moodEmoji2}>{mood.emoji}</Text>
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
                  value={newEntryTitle}
                  onChangeText={setNewEntryTitle}
                />

                <Text style={styles.formSectionTitle}>Your Thoughts</Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Write your thoughts, feelings, and reflections..."
                  placeholderTextColor={colors.textSecondary}
                  value={newEntryContent}
                  onChangeText={setNewEntryContent}
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveNewEntry}
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
                    <Text style={styles.entryViewDate}>{formatFullDate(selectedEntry.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.entryViewDivider} />
                <Text style={styles.entryViewContent}>{selectedEntry.content}</Text>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },
  heroSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  heroGradient: {
    padding: spacing.xxl,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.card,
    opacity: 0.3,
  },
  imanTrackerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  imanTrackerLinkText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  journalWindowSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  journalWindowButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  journalWindowGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  journalWindowIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  journalWindowTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  journalWindowSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  journalWindowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  journalWindowActionText: {
    ...typography.h4,
    color: colors.card,
  },
  quickJournalSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  imanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  imanBadgeText: {
    ...typography.smallBold,
    color: colors.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  quickJournalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  quickJournalInput: {
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  quickJournalButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  quickJournalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickJournalButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  quickJournalHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moodSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  moodItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md * 6) / 7,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  moodDate: {
    ...typography.small,
    color: colors.textSecondary,
  },
  duasSection: {
    marginBottom: spacing.xxl,
  },
  duasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  duaCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  duaGradient: {
    padding: spacing.lg,
    minHeight: 180,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  duaCategory: {
    ...typography.smallBold,
    color: colors.card,
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  duaTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  duaTranslation: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    lineHeight: 20,
  },
  toolsSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toolCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  toolGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  toolTitle: {
    ...typography.h4,
    color: colors.card,
    marginTop: spacing.md,
  },
  crisisCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  crisisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  crisisContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  crisisText: {
    flex: 1,
  },
  crisisTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  crisisSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  quoteSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quoteGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  quoteText: {
    ...typography.h3,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  quoteSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  disclaimerCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
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
  todayPromptSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  todayPromptGradient: {
    padding: spacing.xl,
  },
  todayPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  todayPromptBadgeText: {
    ...typography.smallBold,
    color: colors.card,
  },
  todayPromptText: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.lg,
    lineHeight: 32,
  },
  todayPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  todayPromptButtonText: {
    ...typography.bodyBold,
    color: colors.card,
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
  modalContentContainer: {
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
  moodEmoji2: {
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
  bottomPadding: {
    height: 120,
  },
});
