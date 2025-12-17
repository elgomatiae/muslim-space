
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

interface JournalPrompt {
  id: string;
  prompt_text: string;
  category: string;
  tags: string[];
}

const CATEGORIES = [
  { label: 'All', value: 'all', color: colors.gradientPrimary },
  { label: 'Gratitude', value: 'gratitude', color: colors.gradientSecondary },
  { label: 'Emotions', value: 'emotions', color: colors.gradientPink },
  { label: 'Spirituality', value: 'spirituality', color: colors.gradientPurple },
  { label: 'Growth', value: 'growth', color: colors.gradientInfo },
];

export default function JournalPromptsScreen() {
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<JournalPrompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    filterPrompts();
  }, [selectedCategory, prompts]);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading prompts:', error);
      } else {
        setPrompts(data || []);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrompts = () => {
    if (selectedCategory === 'all') {
      setFilteredPrompts(prompts);
    } else {
      setFilteredPrompts(prompts.filter(p => p.category === selectedCategory));
    }
  };

  const getRandomPrompt = () => {
    if (filteredPrompts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredPrompts.length);
    return filteredPrompts[randomIndex];
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
          <Text style={styles.header}>Journal Prompts</Text>
          <Text style={styles.subtitle}>Guided questions for reflection</Text>
        </View>

        {/* Random Prompt Card */}
        <TouchableOpacity
          style={styles.randomCard}
          activeOpacity={0.8}
          onPress={() => {
            const prompt = getRandomPrompt();
            if (prompt) {
              console.log('Random prompt:', prompt.prompt_text);
            }
          }}
        >
          <LinearGradient
            colors={colors.gradientOcean}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.randomGradient}
          >
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={32}
              color={colors.card}
            />
            <Text style={styles.randomTitle}>Get Random Prompt</Text>
            <Text style={styles.randomSubtitle}>Tap for inspiration</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((category, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === category.value && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.value)}
              >
                {selectedCategory === category.value ? (
                  <LinearGradient
                    colors={category.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.categoryGradient}
                  >
                    <Text style={styles.categoryTextActive}>{category.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.categoryText}>{category.label}</Text>
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Prompts List */}
        <View style={styles.promptsContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading prompts...</Text>
          ) : filteredPrompts.length === 0 ? (
            <Text style={styles.emptyText}>No prompts found</Text>
          ) : (
            filteredPrompts.map((prompt, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.promptCard}
                  activeOpacity={0.7}
                  onPress={() => console.log('Selected prompt:', prompt.prompt_text)}
                >
                  <View style={styles.promptIconContainer}>
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.promptContent}>
                    <Text style={styles.promptText}>{prompt.prompt_text}</Text>
                    <View style={styles.tagsContainer}>
                      {prompt.tags && prompt.tags.slice(0, 3).map((tag, tagIndex) => (
                        <React.Fragment key={tagIndex}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
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
  randomCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.large,
  },
  randomGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  randomTitle: {
    ...typography.h2,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  randomSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
  },
  categoryScroll: {
    marginBottom: spacing.xxl,
  },
  categoryContainer: {
    gap: spacing.md,
  },
  categoryButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  categoryGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryText: {
    ...typography.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryTextActive: {
    ...typography.bodyBold,
    color: colors.card,
  },
  promptsContainer: {
    marginBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  promptCard: {
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
  promptIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptContent: {
    flex: 1,
  },
  promptText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.small,
    color: colors.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
