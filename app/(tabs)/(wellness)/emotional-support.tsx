
import React, { useState, useEffect, useCallback } from "react";
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
  islamic_verse?: string;
  islamic_hadith?: string;
  islamic_story?: string;
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

// Islamic content for each emotion category
const ISLAMIC_CONTENT: { [key: string]: { verse?: string; hadith?: string; story?: string } } = {
  depression: {
    verse: "\"So verily, with the hardship, there is relief. Verily, with the hardship, there is relief.\" (Quran 94:5-6)",
    hadith: "The Prophet (ﷺ) said: \"No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.\" (Sahih Bukhari)",
    story: "Prophet Yusuf (AS) faced years of hardship - betrayed by his brothers, thrown into a well, sold into slavery, falsely accused, and imprisoned. Yet he remained patient and faithful. Eventually, Allah elevated him to a position of great honor. His story teaches us that after every difficulty comes ease, and that maintaining faith during trials leads to ultimate success."
  },
  anxiety: {
    verse: "\"Those who believe, and whose hearts find satisfaction in the remembrance of Allah: for without doubt in the remembrance of Allah do hearts find satisfaction.\" (Quran 13:28)",
    hadith: "The Prophet (ﷺ) taught us to say: \"O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.\" (Sahih Bukhari)",
    story: "When the Prophet Muhammad (ﷺ) and Abu Bakr were in the cave during migration, with enemies at the entrance, Abu Bakr was anxious. The Prophet reassured him: \"Do not grieve; indeed Allah is with us.\" (Quran 9:40). This teaches us to trust in Allah's protection during times of fear and anxiety."
  },
  loneliness: {
    verse: "\"And He is with you wherever you are. And Allah, of what you do, is Seeing.\" (Quran 57:4)",
    hadith: "The Prophet (ﷺ) said: \"The strong believer is better and more beloved to Allah than the weak believer, while there is good in both. Strive for that which will benefit you, seek the help of Allah, and do not feel helpless.\" (Sahih Muslim)",
    story: "Prophet Yunus (AS) found himself alone in the belly of a whale in the depths of the ocean. In that moment of complete isolation, he turned to Allah with sincere repentance: \"There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.\" Allah responded to his call and saved him. This teaches us that we are never truly alone when we remember Allah."
  },
  anger: {
    verse: "\"And when they are angry, they forgive.\" (Quran 42:37)",
    hadith: "The Prophet (ﷺ) said: \"The strong person is not the one who can overpower others. Rather, the strong person is the one who controls himself when he is angry.\" (Sahih Bukhari)",
    story: "When the Prophet Muhammad (ﷺ) was stoned by the people of Ta'if until he bled, the Angel of Mountains came and offered to crush them between two mountains. Instead, the Prophet (ﷺ) prayed for their guidance, saying: \"O Allah, guide my people for they do not know.\" His response to anger with patience and forgiveness is the ultimate example for us."
  },
  trauma: {
    verse: "\"Indeed, Allah is with those who are patient.\" (Quran 2:153)",
    hadith: "The Prophet (ﷺ) said: \"How wonderful is the affair of the believer, for his affairs are all good, and this applies to no one but the believer. If something good happens to him, he is thankful for it and that is good for him. If something bad happens to him, he bears it with patience and that is good for him.\" (Sahih Muslim)",
    story: "Prophet Ayyub (Job) (AS) suffered immense trials - loss of wealth, children, and health. Despite his suffering, he remained patient and never complained against Allah. He said: \"Indeed, adversity has touched me, and you are the Most Merciful of the merciful.\" (Quran 21:83). Allah restored his health and gave him back his family and wealth. His story teaches us that patience in the face of trauma brings divine reward and relief."
  },
  crisis: {
    verse: "\"And whoever fears Allah - He will make for him a way out. And will provide for him from where he does not expect.\" (Quran 65:2-3)",
    hadith: "The Prophet (ﷺ) said: \"Know that victory comes with patience, relief with affliction, and ease with hardship.\" (Tirmidhi)",
    story: "When the Muslims were surrounded by enemy forces during the Battle of the Trench, facing starvation and fear, they dug a trench for protection. The Prophet (ﷺ) himself participated in the digging despite hunger. Allah sent a strong wind that destroyed the enemy camp, and the Muslims were saved without fighting. This teaches us that in times of crisis, taking action while trusting in Allah brings relief."
  },
  all: {
    verse: "\"Indeed, with hardship comes ease.\" (Quran 94:6)",
    hadith: "The Prophet (ﷺ) said: \"The supplication of every one of you will be granted if he does not get impatient and say: 'I supplicated but my prayer has not been granted.'\" (Sahih Bukhari)",
    story: "The life of Prophet Muhammad (ﷺ) was filled with trials - orphaned as a child, faced rejection and persecution, lost loved ones. Yet through it all, he remained steadfast in faith and character. His life teaches us that challenges are part of the journey, and maintaining faith and good character through difficulties leads to ultimate success in this life and the Hereafter."
  }
};

export default function EmotionalSupportScreen() {
  const [resources, setResources] = useState<EmotionalResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<EmotionalResource[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [selectedResource, setSelectedResource] = useState<EmotionalResource | null>(null);
  const [loading, setLoading] = useState(true);

  const filterResources = useCallback(() => {
    if (selectedEmotion === 'all') {
      setFilteredResources(resources);
    } else {
      setFilteredResources(resources.filter(r => r.emotion_category === selectedEmotion));
    }
  }, [selectedEmotion, resources]);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [filterResources]);

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
        // Enhance resources with Islamic content
        const enhancedResources = (data || []).map(resource => ({
          ...resource,
          islamic_verse: ISLAMIC_CONTENT[resource.emotion_category]?.verse || ISLAMIC_CONTENT.all.verse,
          islamic_hadith: ISLAMIC_CONTENT[resource.emotion_category]?.hadith || ISLAMIC_CONTENT.all.hadith,
          islamic_story: ISLAMIC_CONTENT[resource.emotion_category]?.story || ISLAMIC_CONTENT.all.story,
        }));
        setResources(enhancedResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
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
            <Text style={styles.subtitle}>Islamic guidance for different emotions</Text>
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

        {/* Islamic Wisdom Section */}
        {selectedEmotion && ISLAMIC_CONTENT[selectedEmotion] && (
          <View style={styles.islamicSection}>
            <View style={styles.islamicHeader}>
              <IconSymbol
                ios_icon_name="book.closed.fill"
                android_material_icon_name="menu-book"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.islamicTitle}>Islamic Wisdom</Text>
            </View>

            {ISLAMIC_CONTENT[selectedEmotion].verse && (
              <View style={styles.islamicCard}>
                <View style={styles.islamicCardHeader}>
                  <IconSymbol
                    ios_icon_name="quote.opening"
                    android_material_icon_name="format-quote"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.islamicCardTitle}>Quranic Verse</Text>
                </View>
                <Text style={styles.islamicCardText}>{ISLAMIC_CONTENT[selectedEmotion].verse}</Text>
              </View>
            )}

            {ISLAMIC_CONTENT[selectedEmotion].hadith && (
              <View style={styles.islamicCard}>
                <View style={styles.islamicCardHeader}>
                  <IconSymbol
                    ios_icon_name="text.book.closed.fill"
                    android_material_icon_name="auto-stories"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.islamicCardTitle}>Hadith</Text>
                </View>
                <Text style={styles.islamicCardText}>{ISLAMIC_CONTENT[selectedEmotion].hadith}</Text>
              </View>
            )}

            {ISLAMIC_CONTENT[selectedEmotion].story && (
              <View style={styles.islamicCard}>
                <View style={styles.islamicCardHeader}>
                  <IconSymbol
                    ios_icon_name="book.pages.fill"
                    android_material_icon_name="menu-book"
                    size={20}
                    color={colors.info}
                  />
                  <Text style={styles.islamicCardTitle}>Prophetic Story</Text>
                </View>
                <Text style={styles.islamicCardText}>{ISLAMIC_CONTENT[selectedEmotion].story}</Text>
              </View>
            )}
          </View>
        )}

        {/* Resources List */}
        <View style={styles.resourcesContainer}>
          <Text style={styles.resourcesTitle}>Support Resources</Text>
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

                  {/* Islamic Content in Modal */}
                  {selectedResource.islamic_verse && (
                    <View style={styles.modalIslamicSection}>
                      <View style={styles.modalIslamicHeader}>
                        <IconSymbol
                          ios_icon_name="quote.opening"
                          android_material_icon_name="format-quote"
                          size={20}
                          color={colors.primary}
                        />
                        <Text style={styles.modalIslamicTitle}>Quranic Guidance</Text>
                      </View>
                      <Text style={styles.modalIslamicText}>{selectedResource.islamic_verse}</Text>
                    </View>
                  )}

                  {selectedResource.islamic_hadith && (
                    <View style={styles.modalIslamicSection}>
                      <View style={styles.modalIslamicHeader}>
                        <IconSymbol
                          ios_icon_name="text.book.closed.fill"
                          android_material_icon_name="auto-stories"
                          size={20}
                          color={colors.accent}
                        />
                        <Text style={styles.modalIslamicTitle}>Prophetic Wisdom</Text>
                      </View>
                      <Text style={styles.modalIslamicText}>{selectedResource.islamic_hadith}</Text>
                    </View>
                  )}

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
  islamicSection: {
    marginBottom: spacing.xxl,
  },
  islamicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  islamicTitle: {
    ...typography.h3,
    color: colors.text,
  },
  islamicCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  islamicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  islamicCardTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  islamicCardText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  resourcesContainer: {
    marginBottom: spacing.xxl,
  },
  resourcesTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
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
  modalIslamicSection: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  modalIslamicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalIslamicTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  modalIslamicText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
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
