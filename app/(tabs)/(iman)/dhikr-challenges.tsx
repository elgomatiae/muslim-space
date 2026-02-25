
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '@/contexts/I18nContext';

interface DhikrChallenge {
  id: string;
  title: string;
  description: string;
  theme: 'gratitude' | 'forgiveness' | 'protection' | 'morning' | 'evening' | 'general';
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  color: string;
  icon: string;
  phrases: string[];
}

interface CustomPhrase {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  dateAdded: string;
}

export default function DhikrChallengesScreen() {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState<DhikrChallenge[]>([]);
  const [customPhrases, setCustomPhrases] = useState<CustomPhrase[]>([]);
  const [showAddPhraseModal, setShowAddPhraseModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState({
    arabic: '',
    transliteration: '',
    translation: '',
  });

  const getDefaultChallenges = useCallback((): DhikrChallenge[] => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: '1',
        title: 'Gratitude Week',
        description: 'Say Alhamdulillah 100 times daily for 7 days',
        theme: 'gratitude',
        targetCount: 700,
        currentCount: 0,
        startDate: today.toISOString(),
        endDate: weekFromNow.toISOString(),
        completed: false,
        color: '#4CAF50',
        icon: 'heart.fill',
        phrases: ['Alhamdulillah', 'All praise is due to Allah'],
      },
      {
        id: '2',
        title: 'Forgiveness Challenge',
        description: 'Seek forgiveness 100 times daily',
        theme: 'forgiveness',
        targetCount: 700,
        currentCount: 0,
        startDate: today.toISOString(),
        endDate: weekFromNow.toISOString(),
        completed: false,
        color: '#F44336',
        icon: 'hands.sparkles.fill',
        phrases: ['Astaghfirullah', 'I seek forgiveness from Allah'],
      },
      {
        id: '3',
        title: 'Morning Remembrance',
        description: 'Complete morning adhkar daily',
        theme: 'morning',
        targetCount: 7,
        currentCount: 0,
        startDate: today.toISOString(),
        endDate: weekFromNow.toISOString(),
        completed: false,
        color: '#FF9800',
        icon: 'sunrise.fill',
        phrases: ['Morning Adhkar', 'Ayat al-Kursi', 'Last 2 verses of Al-Baqarah'],
      },
      {
        id: '4',
        title: 'Evening Protection',
        description: 'Complete evening adhkar daily',
        theme: 'evening',
        targetCount: 7,
        currentCount: 0,
        startDate: today.toISOString(),
        endDate: weekFromNow.toISOString(),
        completed: false,
        color: '#9C27B0',
        icon: 'moon.stars.fill',
        phrases: ['Evening Adhkar', 'Ayat al-Kursi', 'Al-Mu\'awwidhatayn'],
      },
    ];
  }, []);

  const loadChallenges = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('dhikrChallenges');
      if (saved) {
        setChallenges(JSON.parse(saved));
      } else {
        const defaultChallenges = getDefaultChallenges();
        setChallenges(defaultChallenges);
        await AsyncStorage.setItem('dhikrChallenges', JSON.stringify(defaultChallenges));
      }
    } catch (error) {
      console.log('Error loading challenges:', error);
    }
  }, [getDefaultChallenges]);

  const loadCustomPhrases = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('customDhikrPhrases');
      if (saved) {
        setCustomPhrases(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading custom phrases:', error);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
    loadCustomPhrases();
  }, [loadChallenges, loadCustomPhrases]);

  const saveChallenges = async (updatedChallenges: DhikrChallenge[]) => {
    try {
      await AsyncStorage.setItem('dhikrChallenges', JSON.stringify(updatedChallenges));
      setChallenges(updatedChallenges);
    } catch (error) {
      console.log('Error saving challenges:', error);
    }
  };

  const saveCustomPhrases = async (phrases: CustomPhrase[]) => {
    try {
      await AsyncStorage.setItem('customDhikrPhrases', JSON.stringify(phrases));
      setCustomPhrases(phrases);
    } catch (error) {
      console.log('Error saving custom phrases:', error);
    }
  };

  const incrementChallenge = (challengeId: string, amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const newCount = Math.min(challenge.currentCount + amount, challenge.targetCount);
        const isCompleted = newCount >= challenge.targetCount;
        
        if (isCompleted && !challenge.completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t('iman.challengeCompleted'), t('iman.challengeCompletedMessage', { title: challenge.title }));
        }
        
        return {
          ...challenge,
          currentCount: newCount,
          completed: isCompleted,
        };
      }
      return challenge;
    });
    saveChallenges(updated);
  };

  const addCustomPhrase = () => {
    if (!newPhrase.arabic || !newPhrase.transliteration || !newPhrase.translation) {
      Alert.alert(t('common.error'), t('iman.fillAllFields'));
      return;
    }

    const phrase: CustomPhrase = {
      id: Date.now().toString(),
      arabic: newPhrase.arabic,
      transliteration: newPhrase.transliteration,
      translation: newPhrase.translation,
      count: 0,
      dateAdded: new Date().toISOString(),
    };

    const updated = [...customPhrases, phrase];
    saveCustomPhrases(updated);
    setNewPhrase({ arabic: '', transliteration: '', translation: '' });
    setShowAddPhraseModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('common.success'), t('iman.customDhikrPhraseAdded'));
  };

  const incrementCustomPhrase = (phraseId: string, amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = customPhrases.map(phrase =>
      phrase.id === phraseId
        ? { ...phrase, count: phrase.count + amount }
        : phrase
    );
    saveCustomPhrases(updated);
  };

  const deleteCustomPhrase = (phraseId: string) => {
    Alert.alert(
      t('iman.deletePhrase'),
      t('iman.deletePhraseConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const updated = customPhrases.filter(phrase => phrase.id !== phraseId);
            saveCustomPhrases(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dhikr Challenges</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.info}
          />
          <Text style={styles.infoText}>
            Take on themed dhikr challenges to build consistency and earn rewards. Create custom phrases for your personal remembrance.
          </Text>
        </View>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            {activeChallenges.map((challenge, index) => (
              <React.Fragment key={index}>
                <View style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <LinearGradient
                      colors={[challenge.color, challenge.color + 'DD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.challengeIcon}
                    >
                      <IconSymbol
                        ios_icon_name={challenge.icon as any}
                        android_material_icon_name="auto-awesome"
                        size={24}
                        color={colors.card}
                      />
                    </LinearGradient>
                    <View style={styles.challengeTitleContainer}>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={[styles.progressValue, { color: challenge.color }]}>
                        {challenge.currentCount}/{challenge.targetCount}
                      </Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${(challenge.currentCount / challenge.targetCount) * 100}%`,
                            backgroundColor: challenge.color,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.phrasesSection}>
                    <Text style={styles.phrasesLabel}>Phrases:</Text>
                    {challenge.phrases.map((phrase, pIndex) => (
                      <React.Fragment key={pIndex}>
                        <Text style={styles.phraseText}>• {phrase}</Text>
                      </React.Fragment>
                    ))}
                  </View>

                  <View style={styles.challengeActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => incrementChallenge(challenge.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => incrementChallenge(challenge.id, 10)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>+10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => incrementChallenge(challenge.id, 100)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>+100</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Custom Phrases */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Custom Dhikr Phrases</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddPhraseModal(true);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={16}
                  color={colors.card}
                />
                <Text style={styles.addButtonText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {customPhrases.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="text.bubble"
                android_material_icon_name="chat-bubble-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No custom phrases yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your own dhikr phrases to track</Text>
            </View>
          ) : (
            customPhrases.map((phrase, index) => (
              <React.Fragment key={index}>
                <View style={styles.customPhraseCard}>
                  <View style={styles.customPhraseHeader}>
                    <View style={styles.customPhraseContent}>
                      <Text style={styles.customPhraseArabic}>{phrase.arabic}</Text>
                      <Text style={styles.customPhraseTransliteration}>{phrase.transliteration}</Text>
                      <Text style={styles.customPhraseTranslation}>{phrase.translation}</Text>
                      <Text style={styles.customPhraseCount}>Count: {phrase.count}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteCustomPhrase(phrase.id)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.customPhraseActions}>
                    <TouchableOpacity
                      style={styles.customActionButton}
                      onPress={() => incrementCustomPhrase(phrase.id, 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.customActionButtonText}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.customActionButton}
                      onPress={() => incrementCustomPhrase(phrase.id, 10)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.customActionButtonText}>+10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.customActionButton}
                      onPress={() => incrementCustomPhrase(phrase.id, 33)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.customActionButtonText}>+33</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Challenges 🎉</Text>
            {completedChallenges.map((challenge, index) => (
              <React.Fragment key={index}>
                <View style={[styles.challengeCard, styles.completedChallengeCard]}>
                  <View style={styles.challengeHeader}>
                    <LinearGradient
                      colors={[colors.success, colors.successDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.challengeIcon}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.card}
                      />
                    </LinearGradient>
                    <View style={styles.challengeTitleContainer}>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                      <Text style={styles.completedLabel}>Completed! Masha&apos;Allah!</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Custom Phrase Modal */}
      <Modal
        visible={showAddPhraseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPhraseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Dhikr</Text>
              <TouchableOpacity
                onPress={() => setShowAddPhraseModal(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Arabic Text</Text>
                <TextInput
                  style={styles.input}
                  value={newPhrase.arabic}
                  onChangeText={(text) => setNewPhrase({ ...newPhrase, arabic: text })}
                  placeholder={t('iman.enterArabicText')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Transliteration</Text>
                <TextInput
                  style={styles.input}
                  value={newPhrase.transliteration}
                  onChangeText={(text) => setNewPhrase({ ...newPhrase, transliteration: text })}
                  placeholder={t('iman.enterTransliteration')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Translation</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newPhrase.translation}
                  onChangeText={(text) => setNewPhrase({ ...newPhrase, translation: text })}
                  placeholder={t('iman.enterEnglishTranslation')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={addCustomPhrase}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={20}
                    color={colors.card}
                  />
                  <Text style={styles.submitButtonText}>Add Phrase</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.info + '30',
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  addButton: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.medium,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    ...typography.captionBold,
    color: colors.card,
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  completedChallengeCard: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  completedLabel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  progressValue: {
    ...typography.bodyBold,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  phrasesSection: {
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  phrasesLabel: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  phraseText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  customPhraseCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  customPhraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  customPhraseContent: {
    flex: 1,
  },
  customPhraseArabic: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  customPhraseTransliteration: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  customPhraseTranslation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  customPhraseCount: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPhraseActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customActionButton: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  customActionButtonText: {
    ...typography.bodyBold,
    color: colors.info,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
    marginTop: spacing.md,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  bottomPadding: {
    height: 100,
  },
});
