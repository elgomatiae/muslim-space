
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";

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

export default function ProphetStoriesScreen() {
  const [stories, setStories] = useState<ProphetStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<ProphetStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={colors.gradientSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="book.closed.fill"
              android_material_icon_name="auto-stories"
              size={48}
              color={colors.card}
            />
            <Text style={styles.header}>Prophet Stories</Text>
            <Text style={styles.subtitle}>Learn from the life of Prophet Muhammad ﷺ</Text>
          </LinearGradient>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            These stories show how the Prophet ﷺ dealt with mental and emotional challenges, offering guidance for our own struggles.
          </Text>
        </View>

        {/* Stories List */}
        <View style={styles.storiesContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading stories...</Text>
          ) : stories.length === 0 ? (
            <Text style={styles.emptyText}>No stories available</Text>
          ) : (
            stories.map((story, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.storyCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedStory(story)}
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
                      <Text style={styles.readMoreText}>Read Story</Text>
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

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Story Detail Modal */}
      <Modal
        visible={selectedStory !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedStory(null)}
      >
        {selectedStory && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedStory(null)}
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

              {/* Story Content */}
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
                      <Text style={styles.sectionTitle}>Mental Health Connection</Text>
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

              <View style={styles.bottomPadding} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
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
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  header: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.95,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  storiesContainer: {
    marginBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  storyCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
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
  storyDetailCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
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
  bottomPadding: {
    height: 120,
  },
});
