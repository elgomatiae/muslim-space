
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";

interface MentalHealthDua {
  id: string;
  title: string;
  arabic_text: string;
  transliteration: string;
  translation: string;
  context: string;
  emotion_category: string;
  source: string;
  benefits: string[];
}

const EMOTION_CATEGORIES = [
  { label: 'All', value: 'all', icon: 'sparkles', color: colors.gradientPrimary },
  { label: 'Anxiety', value: 'anxiety', icon: 'wind', color: colors.gradientInfo },
  { label: 'Depression', value: 'depression', icon: 'cloud.rain.fill', color: colors.gradientPurple },
  { label: 'Distress', value: 'distress', icon: 'exclamationmark.triangle.fill', color: colors.gradientRed },
  { label: 'Peace', value: 'peace', icon: 'leaf.fill', color: colors.gradientSecondary },
  { label: 'Patience', value: 'patience', icon: 'hourglass', color: colors.gradientTeal },
  { label: 'Hope', value: 'hope', icon: 'sun.max.fill', color: colors.gradientSunset },
];

export default function MentalDuasScreen() {
  const [duas, setDuas] = useState<MentalHealthDua[]>([]);
  const [filteredDuas, setFilteredDuas] = useState<MentalHealthDua[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDua, setSelectedDua] = useState<MentalHealthDua | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDuas();
  }, []);

  useEffect(() => {
    filterDuas();
  }, [selectedCategory, duas]);

  const loadDuas = async () => {
    try {
      const { data, error } = await supabase
        .from('mental_health_duas')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading duas:', error);
      } else {
        setDuas(data || []);
      }
    } catch (error) {
      console.error('Error loading duas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDuas = () => {
    if (selectedCategory === 'all') {
      setFilteredDuas(duas);
    } else {
      setFilteredDuas(duas.filter(d => d.emotion_category === selectedCategory));
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = EMOTION_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : colors.gradientPrimary;
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
            colors={colors.gradientPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="hands.sparkles.fill"
              android_material_icon_name="self-improvement"
              size={48}
              color={colors.card}
            />
            <Text style={styles.header}>Healing Duas</Text>
            <Text style={styles.subtitle}>Prayers for mental wellness</Text>
          </LinearGradient>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {EMOTION_CATEGORIES.map((category, index) => (
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

        {/* Duas List */}
        <View style={styles.duasContainer}>
          {loading ? (
            <Text style={styles.emptyText}>Loading duas...</Text>
          ) : filteredDuas.length === 0 ? (
            <Text style={styles.emptyText}>No duas found</Text>
          ) : (
            filteredDuas.map((dua, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.duaCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDua(dua)}
                >
                  <View style={styles.duaHeader}>
                    <View style={styles.duaIconContainer}>
                      <IconSymbol
                        ios_icon_name="hands.sparkles.fill"
                        android_material_icon_name="self-improvement"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.duaHeaderText}>
                      <Text style={styles.duaTitle}>{dua.title}</Text>
                      <Text style={styles.duaCategory}>{dua.emotion_category.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.duaArabic}>{dua.arabic_text}</Text>
                  <Text style={styles.duaTranslation} numberOfLines={2}>
                    {dua.translation}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Dua Detail Modal */}
      <Modal
        visible={selectedDua !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDua(null)}
      >
        {selectedDua && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedDua(null)}
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

              {/* Dua Content */}
              <View style={styles.duaDetailCard}>
                <LinearGradient
                  colors={getCategoryColor(selectedDua.emotion_category)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.duaDetailHeader}
                >
                  <Text style={styles.duaDetailTitle}>{selectedDua.title}</Text>
                  <Text style={styles.duaDetailCategory}>
                    {selectedDua.emotion_category.toUpperCase()}
                  </Text>
                </LinearGradient>

                <View style={styles.duaDetailContent}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Arabic</Text>
                    <Text style={styles.arabicText}>{selectedDua.arabic_text}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transliteration</Text>
                    <Text style={styles.transliterationText}>{selectedDua.transliteration}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Translation</Text>
                    <Text style={styles.translationText}>{selectedDua.translation}</Text>
                  </View>

                  {selectedDua.context && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Context</Text>
                      <Text style={styles.contextText}>{selectedDua.context}</Text>
                    </View>
                  )}

                  {selectedDua.benefits && selectedDua.benefits.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Benefits</Text>
                      {selectedDua.benefits.map((benefit, benefitIndex) => (
                        <React.Fragment key={benefitIndex}>
                          <View style={styles.benefitItem}>
                            <IconSymbol
                              ios_icon_name="checkmark.circle.fill"
                              android_material_icon_name="check-circle"
                              size={20}
                              color={colors.success}
                            />
                            <Text style={styles.benefitText}>{benefit}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  )}

                  {selectedDua.source && (
                    <View style={styles.sourceContainer}>
                      <Text style={styles.sourceLabel}>Source:</Text>
                      <Text style={styles.sourceText}>{selectedDua.source}</Text>
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
  duasContainer: {
    marginBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  duaCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  duaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duaHeaderText: {
    flex: 1,
  },
  duaTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  duaCategory: {
    ...typography.smallBold,
    color: colors.primary,
  },
  duaArabic: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  duaTranslation: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
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
  duaDetailCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.large,
  },
  duaDetailHeader: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  duaDetailTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  duaDetailCategory: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  duaDetailContent: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  arabicText: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 40,
  },
  transliterationText: {
    ...typography.body,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  translationText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  contextText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  benefitText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  sourceContainer: {
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
  bottomPadding: {
    height: 120,
  },
});
