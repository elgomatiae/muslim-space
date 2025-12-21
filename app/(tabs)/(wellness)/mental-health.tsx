
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, TextInput, Modal } from "react-native";
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
  created_at: string;
}

interface ProphetStory {
  id: string;
  title: string;
  mental_health_connection: string;
  category: string;
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

export default function MentalHealthHubScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals } = useImanTracker();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [prophetStories, setProphetStories] = useState<ProphetStory[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [moodStreak, setMoodStreak] = useState(0);
  const [quickJournalText, setQuickJournalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProphetModal, setShowProphetModal] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const loadAllContent = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJournalEntries(),
        loadProphetStories(),
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
      .select('id, title, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setJournalEntries(data);
  };

  const loadProphetStories = async () => {
    const { data } = await supabase
      .from('prophet_stories')
      .select('id, title, mental_health_connection, category')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(4);
    if (data) setProphetStories(data);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'very_happy': '😄',
      'happy': '😊',
      'neutral': '😐',
      'sad': '😔',
      'very_sad': '😢',
      'anxious': '😰',
      'peaceful': '😌',
      'grateful': '🙏',
    };
    return moodMap[mood] || '😊';
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
              <Text style={styles.statValue}>{prophetStories.length}</Text>
              <Text style={styles.statLabel}>Stories</Text>
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

      {/* Prophet's Mental Health Struggles - Featured Section */}
      <View style={styles.prophetSection}>
        <TouchableOpacity
          style={styles.prophetFeatureCard}
          activeOpacity={0.8}
          onPress={() => setShowProphetModal(true)}
        >
          <LinearGradient
            colors={colors.gradientSunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.prophetFeatureGradient}
          >
            <View style={styles.prophetFeatureIcon}>
              <IconSymbol
                ios_icon_name="book.closed.fill"
                android_material_icon_name="auto-stories"
                size={48}
                color={colors.card}
              />
            </View>
            <Text style={styles.prophetFeatureTitle}>
              Prophet Muhammad&apos;s (ﷺ) Mental Health Journey
            </Text>
            <Text style={styles.prophetFeatureSubtitle}>
              Learn how the Prophet (ﷺ) dealt with grief, anxiety, and emotional challenges
            </Text>
            <View style={styles.prophetFeatureAction}>
              <Text style={styles.prophetFeatureActionText}>Explore Stories</Text>
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

      {/* Today's Prompt */}
      {prompts.length > 0 && (
        <View style={styles.promptSection}>
          <TouchableOpacity
            style={styles.promptCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/(wellness)/journal-prompts' as any)}
          >
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promptGradient}
            >
              <View style={styles.promptBadge}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={16}
                  color={colors.card}
                />
                <Text style={styles.promptBadgeText}>TODAY&apos;S PROMPT</Text>
              </View>
              <Text style={styles.promptText}>{prompts[0].prompt_text}</Text>
              <View style={styles.promptAction}>
                <Text style={styles.promptActionText}>Start Writing</Text>
                <IconSymbol
                  ios_icon_name="arrow.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.card}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Journal Entries */}
      {journalEntries.length > 0 && (
        <View style={styles.journalSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="menu-book"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>My Journal</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/journal' as any)}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {journalEntries.map((entry, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.journalCard}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/(wellness)/journal' as any)}
                >
                  <View style={styles.journalCardHeader}>
                    <Text style={styles.journalCardTitle} numberOfLines={1}>
                      {entry.title}
                    </Text>
                    <Text style={styles.journalCardDate}>
                      {formatDate(entry.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.journalCardContent} numberOfLines={4}>
                    {entry.content}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

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

      {/* Prophet Stories */}
      {prophetStories.length > 0 && (
        <View style={styles.storiesSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="book.closed.fill"
              android_material_icon_name="auto-stories"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Prophet Stories</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/prophet-stories' as any)}
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
          <View style={styles.storiesGrid}>
            {prophetStories.map((story, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.storyCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/(tabs)/(wellness)/prophet-stories' as any,
                    params: { storyId: story.id }
                  })}
                >
                  <LinearGradient
                    colors={colors.gradientSunset}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyGradient}
                  >
                    <View style={styles.storyIconContainer}>
                      <IconSymbol
                        ios_icon_name="book.closed.fill"
                        android_material_icon_name="auto-stories"
                        size={32}
                        color={colors.card}
                      />
                    </View>
                    <Text style={styles.storyCategory}>{story.category}</Text>
                    <Text style={styles.storyTitle} numberOfLines={2}>
                      {story.title}
                    </Text>
                    <Text style={styles.storyPreview} numberOfLines={3}>
                      {story.mental_health_connection}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
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

      {/* Prophet Modal */}
      <Modal
        visible={showProphetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProphetModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowProphetModal(false)}
                style={styles.closeButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalTitleSection}>
              <LinearGradient
                colors={colors.gradientSunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalTitleGradient}
              >
                <IconSymbol
                  ios_icon_name="book.closed.fill"
                  android_material_icon_name="auto-stories"
                  size={64}
                  color={colors.card}
                />
                <Text style={styles.modalTitle}>
                  Prophet Muhammad&apos;s (ﷺ) Mental Health Journey
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.modalIntro}>
              <Text style={styles.modalIntroText}>
                The Prophet Muhammad (ﷺ) faced immense emotional and mental challenges throughout his life. 
                His experiences offer profound guidance for dealing with grief, anxiety, depression, and stress.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Grief & Loss</Text>
              <Text style={styles.modalSectionText}>
                The Prophet (ﷺ) experienced profound grief when he lost his beloved wife Khadijah (RA) and his uncle Abu Talib 
                in the same year, known as the &quot;Year of Sorrow.&quot; He openly wept and mourned, showing us that expressing 
                grief is natural and healthy. He taught us that it&apos;s okay to cry and feel sadness, but to always maintain 
                hope in Allah&apos;s mercy.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Anxiety & Stress</Text>
              <Text style={styles.modalSectionText}>
                During times of extreme stress, such as the Battle of Ahzab when the Muslims were surrounded, the Prophet (ﷺ) 
                turned to prayer and dhikr. He would seek solace in the Cave of Hira, spending time in reflection and connection 
                with Allah. This teaches us the importance of spiritual practices in managing anxiety.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Depression & Sadness</Text>
              <Text style={styles.modalSectionText}>
                When the Prophet (ﷺ) felt overwhelmed, he would say: &quot;O Allah, I seek refuge in You from anxiety and sorrow, 
                weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.&quot; 
                This dua acknowledges the reality of these feelings while seeking divine help.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Self-Care & Balance</Text>
              <Text style={styles.modalSectionText}>
                The Prophet (ﷺ) emphasized the importance of taking care of one&apos;s body and mind. He said: &quot;Your body 
                has a right over you, your eyes have a right over you, and your spouse has a right over you.&quot; He practiced 
                moderation in all things and encouraged rest, healthy eating, and physical activity.
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Seeking Support</Text>
              <Text style={styles.modalSectionText}>
                The Prophet (ﷺ) didn&apos;t face his challenges alone. He confided in his companions, sought their counsel, 
                and accepted their support. This teaches us that seeking help from others is a sign of strength, not weakness.
              </Text>
            </View>

            <View style={styles.modalCTA}>
              <TouchableOpacity
                style={styles.modalCTAButton}
                onPress={() => {
                  setShowProphetModal(false);
                  router.push('/(tabs)/(wellness)/prophet-stories' as any);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.gradientSunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalCTAGradient}
                >
                  <Text style={styles.modalCTAText}>Explore More Stories</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={24}
                    color={colors.card}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomPadding} />
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
  prophetSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  prophetFeatureCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  prophetFeatureGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  prophetFeatureIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  prophetFeatureTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  prophetFeatureSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  prophetFeatureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  prophetFeatureActionText: {
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
  promptSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  promptCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  promptGradient: {
    padding: spacing.xl,
  },
  promptBadge: {
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
  promptBadgeText: {
    ...typography.smallBold,
    color: colors.card,
  },
  promptText: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.lg,
    lineHeight: 32,
  },
  promptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promptActionText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  journalSection: {
    marginBottom: spacing.xxl,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  journalCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  journalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  journalCardTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  journalCardDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  journalCardContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
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
  storiesSection: {
    marginBottom: spacing.xxl,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  storyCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  storyGradient: {
    padding: spacing.lg,
    minHeight: 200,
  },
  storyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  storyCategory: {
    ...typography.smallBold,
    color: colors.card,
    opacity: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  storyTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  storyPreview: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    lineHeight: 20,
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
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
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
  modalTitleSection: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  modalTitleGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  modalIntro: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  modalIntroText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  modalSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  modalSectionTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  modalSectionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  modalCTA: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  modalCTAButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  modalCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalCTAText: {
    ...typography.h4,
    color: colors.card,
  },
  bottomPadding: {
    height: 120,
  },
});
