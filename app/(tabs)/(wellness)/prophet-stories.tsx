
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from 'expo-haptics';

interface ProphetStory {
  id: string;
  title: string;
  story_text: string;
  lesson: string;
  mental_health_connection: string;
  category: string;
  tags: string[];
  source: string;
}

export default function ProphetMentalHealthScreen() {
  const params = useLocalSearchParams();
  const storyId = params.storyId as string | undefined;

  const [stories, setStories] = useState<ProphetStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ProphetStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStoriesModal, setShowStoriesModal] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    // Auto-open story if storyId is provided
    if (storyId && stories.length > 0) {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        setSelectedStory(story);
        setShowStoriesModal(true);
      }
    }
  }, [storyId, stories]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('prophet_stories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading stories:', error);
      } else {
        setStories(data || []);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string[] } = {
      grief: colors.gradientPink,
      anxiety: colors.gradientInfo,
      depression: colors.gradientPurple,
      resilience: colors.gradientSecondary,
      'self-care': colors.gradientOcean,
    };
    return colorMap[category] || colors.gradientPrimary;
  };

  const openStoriesWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStoriesModal(true);
  };

  const closeStoriesWindow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStoriesModal(false);
    setSelectedStory(null);
  };

  const viewStory = (story: ProphetStory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStory(story);
  };

  const backToList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStory(null);
  };

  // Main screen - button to open stories
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContent}>
        <TouchableOpacity
          style={styles.openStoriesButton}
          onPress={openStoriesWindow}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientSunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.openStoriesGradient}
          >
            <IconSymbol
              ios_icon_name="book.closed.fill"
              android_material_icon_name="auto-stories"
              size={64}
              color={colors.card}
            />
            <Text style={styles.openStoriesTitle}>Prophet Muhammad (ﷺ)</Text>
            <Text style={styles.openStoriesTitle}>and Mental Health</Text>
            <Text style={styles.openStoriesSubtitle}>
              {stories.length} stories and analyses
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stories Modal Window */}
      <Modal
        visible={showStoriesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStoriesWindow}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={selectedStory ? backToList : closeStoriesWindow}
              style={styles.backButton}
            >
              <IconSymbol
                ios_icon_name={selectedStory ? "chevron.left" : "xmark"}
                android_material_icon_name={selectedStory ? "arrow-back" : "close"}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedStory ? 'Story Details' : 'Prophet Muhammad (ﷺ) & Mental Health'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Stories Bar */}
          {!selectedStory && (
            <View style={styles.storiesBar}>
              <Text style={styles.storiesBarTitle}>Browse Stories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesBarScroll}
              >
                {stories.map((story, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={styles.storyBarItem}
                      onPress={() => viewStory(story)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={getCategoryColor(story.category)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.storyBarGradient}
                      >
                        <IconSymbol
                          ios_icon_name="book.fill"
                          android_material_icon_name="menu-book"
                          size={24}
                          color={colors.card}
                        />
                        <Text style={styles.storyBarCategory}>{story.category.toUpperCase()}</Text>
                        <Text style={styles.storyBarTitle} numberOfLines={2}>
                          {story.title}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Content Area */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {selectedStory ? (
              // Story Detail View
              <View style={styles.storyDetailCard}>
                <LinearGradient
                  colors={getCategoryColor(selectedStory.category)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyDetailHeader}
                >
                  <Text style={styles.storyDetailTitle}>{selectedStory.title}</Text>
                  <Text style={styles.storyDetailCategory}>
                    {selectedStory.category.toUpperCase()}
                  </Text>
                </LinearGradient>

                <View style={styles.storyDetailContent}>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <IconSymbol
                        ios_icon_name="book.fill"
                        android_material_icon_name="menu-book"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.sectionTitle}>The Story</Text>
                    </View>
                    <Text style={styles.sectionText}>{selectedStory.story_text}</Text>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <IconSymbol
                        ios_icon_name="lightbulb.fill"
                        android_material_icon_name="lightbulb"
                        size={20}
                        color={colors.secondary}
                      />
                      <Text style={styles.sectionTitle}>The Lesson</Text>
                    </View>
                    <Text style={styles.sectionText}>{selectedStory.lesson}</Text>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <IconSymbol
                        ios_icon_name="heart.fill"
                        android_material_icon_name="favorite"
                        size={20}
                        color={colors.accent}
                      />
                      <Text style={styles.sectionTitle}>Mental Health Analysis</Text>
                    </View>
                    <Text style={styles.sectionText}>{selectedStory.mental_health_connection}</Text>
                  </View>

                  {selectedStory.source && (
                    <View style={styles.sourceContainer}>
                      <Text style={styles.sourceLabel}>Source:</Text>
                      <Text style={styles.sourceText}>{selectedStory.source}</Text>
                    </View>
                  )}

                  {selectedStory.tags && selectedStory.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {selectedStory.tags.map((tag, tagIndex) => (
                        <React.Fragment key={tagIndex}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Stories List View
              <View>
                <View style={styles.introCard}>
                  <LinearGradient
                    colors={colors.gradientSunset}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.introGradient}
                  >
                    <IconSymbol
                      ios_icon_name="book.closed.fill"
                      android_material_icon_name="auto-stories"
                      size={48}
                      color={colors.card}
                    />
                    <Text style={styles.introTitle}>
                      Learn from the Prophet&apos;s (ﷺ) Journey
                    </Text>
                    <Text style={styles.introText}>
                      Discover how Prophet Muhammad (ﷺ) dealt with grief, anxiety, and emotional challenges, 
                      offering timeless guidance for our own mental health struggles.
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.storiesGrid}>
                  {loading ? (
                    <Text style={styles.loadingText}>Loading stories...</Text>
                  ) : stories.length === 0 ? (
                    <Text style={styles.emptyText}>No stories available</Text>
                  ) : (
                    stories.map((story, index) => (
                      <React.Fragment key={index}>
                        <TouchableOpacity
                          style={styles.storyCard}
                          activeOpacity={0.7}
                          onPress={() => viewStory(story)}
                        >
                          <LinearGradient
                            colors={getCategoryColor(story.category)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.storyGradient}
                          >
                            <View style={styles.storyHeader}>
                              <View style={styles.storyIconContainer}>
                                <IconSymbol
                                  ios_icon_name="book.fill"
                                  android_material_icon_name="menu-book"
                                  size={28}
                                  color={colors.card}
                                />
                              </View>
                              <View style={styles.storyHeaderText}>
                                <Text style={styles.storyTitle}>{story.title}</Text>
                                <Text style={styles.storyCategory}>{story.category.toUpperCase()}</Text>
                              </View>
                            </View>
                            <Text style={styles.storyPreview} numberOfLines={2}>
                              {story.mental_health_connection}
                            </Text>
                            <View style={styles.readMoreContainer}>
                              <Text style={styles.readMoreText}>Read Analysis</Text>
                              <IconSymbol
                                ios_icon_name="chevron.right"
                                android_material_icon_name="chevron-right"
                                size={20}
                                color={colors.card}
                              />
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </React.Fragment>
                    ))
                  )}
                </View>
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
  openStoriesButton: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  openStoriesGradient: {
    padding: spacing.xxxl * 2,
    alignItems: 'center',
  },
  openStoriesTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  openStoriesSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    marginTop: spacing.sm,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  placeholder: {
    width: 40,
  },
  storiesBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  storiesBarTitle: {
    ...typography.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  storiesBarScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  storyBarItem: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  storyBarGradient: {
    padding: spacing.md,
    minWidth: 140,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBarCategory: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  storyBarTitle: {
    ...typography.caption,
    color: colors.card,
    textAlign: 'center',
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  introCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.large,
  },
  introGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  introTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  introText: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 24,
  },
  storiesGrid: {
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  storyCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  storyGradient: {
    padding: spacing.lg,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  storyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyHeaderText: {
    flex: 1,
  },
  storyTitle: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  storyCategory: {
    ...typography.smallBold,
    color: colors.card,
    opacity: 0.8,
  },
  storyPreview: {
    ...typography.body,
    color: colors.card,
    marginBottom: spacing.md,
    lineHeight: 22,
    opacity: 0.9,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readMoreText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  storyDetailCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  storyDetailHeader: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  storyDetailTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  storyDetailCategory: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  storyDetailContent: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  sourceContainer: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sourceLabel: {
    ...typography.captionBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sourceText: {
    ...typography.caption,
    color: colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
  },
});
