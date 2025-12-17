
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";

interface EmotionalResource {
  id: string;
  title: string;
  description: string;
  content: string;
  emotion_category: string;
  resource_type: string;
  tags: string[];
  crisis_level: string;
}

const EMOTIONS = [
  { label: 'All', value: 'all', icon: 'sparkles', color: colors.gradientPrimary },
  { label: 'Depression', value: 'depression', icon: 'cloud.rain.fill', color: colors.gradientPurple },
  { label: 'Anxiety', value: 'anxiety', icon: 'wind', color: colors.gradientInfo },
  { label: 'Loneliness', value: 'loneliness', icon: 'person.fill', color: colors.gradientPink },
  { label: 'Anger', value: 'anger', icon: 'flame.fill', color: colors.gradientRed },
  { label: 'Trauma', value: 'trauma', icon: 'heart.fill', color: colors.gradientTeal },
  { label: 'Crisis', value: 'crisis', icon: 'exclamationmark.triangle.fill', color: colors.gradientRed },
];

export default function EmotionalSupportScreen() {
  const [resources, setResources] = useState<EmotionalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<EmotionalResource[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [selectedResource, setSelectedResource] = useState<EmotionalResource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [selectedEmotion, resources]);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('emotional_support_resources')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading resources:', error);
      } else {
        setResources(data || []);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    if (selectedEmotion === 'all') {
      setFilteredResources(resources);
    } else {
      setFilteredResources(resources.filter(r => r.emotion_category === selectedEmotion));
    }
  };

  const getEmotionColor = (emotion: string) => {
    const emotionObj = EMOTIONS.find(e => e.value === emotion);
    return emotionObj ? emotionObj.color : colors.gradientPrimary;
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
            colors={colors.gradientPink}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="heart.text.square.fill"
              android_material_icon_name="favorite"
              size={48}
              color={colors.card}
            />
            <Text style={styles.header}>Emotional Support</Text>
            <Text style={styles.subtitle}>Guidance for different emotions</Text>
          </LinearGradient>
        </View>

        {/* Emotion Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.emotionScroll}
          contentContainerStyle={styles.emotionContainer}
        >
          {EMOTIONS.map((emotion, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[
                  styles.emotionButton,
                  selectedEmotion === emotion.value && styles.emotionButtonActive,
                ]}
                onPress={() => setSelectedEmotion(emotion.value)}
              >
                {selectedEmotion === emotion.value ? (
                  <LinearGradient
                    colors={emotion.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emotionGradient}
                  >
                    <Text style={styles.emotionTextActive}>{emotion.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.emotionText}>{emotion.label}</Text>
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Resources List */}
        <View style={styles.resourcesContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading resources...</Text>
          ) : filteredResources.length === 0 ? (
            <Text style={styles.emptyText}>No resources found</Text>
          ) : (
            filteredResources.map((resource, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.resourceCard,
                    resource.crisis_level === 'crisis' && styles.crisisCard,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedResource(resource)}
                >
                  <View style={styles.resourceHeader}>
                    <View style={[
                      styles.resourceIconContainer,
                      resource.crisis_level === 'crisis' && styles.crisisIconContainer,
                    ]}>
                      <IconSymbol
                        ios_icon_name={resource.crisis_level === 'crisis' ? 'exclamationmark.triangle.fill' : 'heart.fill'}
                        android_material_icon_name={resource.crisis_level === 'crisis' ? 'warning' : 'favorite'}
                        size={24}
                        color={resource.crisis_level === 'crisis' ? colors.error : colors.primary}
                      />
                    </View>
                    <View style={styles.resourceHeaderText}>
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <Text style={styles.resourceType}>{resource.resource_type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.resourceDescription} numberOfLines={2}>
                    {resource.description}
                  </Text>
                  <View style={styles.readMoreContainer}>
                    <Text style={styles.readMoreText}>Read More</Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Resource Detail Modal */}
      <Modal
        visible={selectedResource !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedResource(null)}
      >
        {selectedResource && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedResource(null)}
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

              {/* Resource Content */}
              <View style={styles.resourceDetailCard}>
                <LinearGradient
                  colors={getEmotionColor(selectedResource.emotion_category)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.resourceDetailHeader}
                >
                  <Text style={styles.resourceDetailTitle}>{selectedResource.title}</Text>
                  <Text style={styles.resourceDetailType}>
                    {selectedResource.resource_type.toUpperCase()}
                  </Text>
                </LinearGradient>

                <View style={styles.resourceDetailContent}>
                  <Text style={styles.resourceDetailDescription}>
                    {selectedResource.description}
                  </Text>
                  <View style={styles.divider} />
                  <Text style={styles.resourceDetailText}>
                    {selectedResource.content}
                  </Text>

                  {selectedResource.tags && selectedResource.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {selectedResource.tags.map((tag, tagIndex) => (
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
  emotionScroll: {
    marginBottom: spacing.xxl,
  },
  emotionContainer: {
    gap: spacing.md,
  },
  emotionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emotionButtonActive: {
    borderColor: 'transparent',
  },
  emotionGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emotionText: {
    ...typography.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emotionTextActive: {
    ...typography.bodyBold,
    color: colors.card,
  },
  resourcesContainer: {
    marginBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  resourceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  crisisCard: {
    borderColor: colors.error + '50',
    borderWidth: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crisisIconContainer: {
    backgroundColor: colors.error + '20',
  },
  resourceHeaderText: {
    flex: 1,
  },
  resourceTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resourceType: {
    ...typography.smallBold,
    color: colors.primary,
  },
  resourceDescription: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readMoreText: {
    ...typography.bodyBold,
    color: colors.primary,
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
  resourceDetailCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.large,
  },
  resourceDetailHeader: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  resourceDetailTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resourceDetailType: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  resourceDetailContent: {
    padding: spacing.xl,
  },
  resourceDetailDescription: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  resourceDetailText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
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
