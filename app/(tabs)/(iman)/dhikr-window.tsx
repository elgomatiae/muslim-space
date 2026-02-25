
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from '@/contexts/I18nContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import Svg, { Circle } from 'react-native-svg';

interface DhikrPhrase {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  color: string;
  gradientColors: string[];
}

const DHIKR_PHRASES: DhikrPhrase[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللّٰهِ',
    transliteration: 'Subḥān Allāh',
    translation: 'Glory be to Allah',
    color: '#10B981',
    gradientColors: ['#10B981', '#059669'],
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلّٰهِ',
    transliteration: 'Al-ḥamdu lillāh',
    translation: 'All praise is due to Allah',
    color: '#3B82F6',
    gradientColors: ['#3B82F6', '#2563EB'],
  },
  {
    id: 'allahuakbar',
    arabic: 'اللّٰهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    translation: 'Allah is the Greatest',
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#D97706'],
  },
  {
    id: 'lailahaillallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    transliteration: 'Lā ilāha illallāh',
    translation: 'There is no god but Allah',
    color: '#8B5CF6',
    gradientColors: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللّٰهَ',
    transliteration: 'Astaghfirullāh',
    translation: 'I seek forgiveness from Allah',
    color: '#EF4444',
    gradientColors: ['#EF4444', '#DC2626'],
  },
  {
    id: 'subhanallahwalhamdulillah',
    arabic: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ',
    transliteration: 'Subḥān Allāh wal-ḥamdu lillāh',
    translation: 'Glory be to Allah and all praise is due to Allah',
    color: '#06B6D4',
    gradientColors: ['#06B6D4', '#0891B2'],
  },
  {
    id: 'lahawalawala',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ',
    transliteration: 'Lā ḥawla wa lā quwwata illā billāh',
    translation: 'There is no power nor strength except with Allah',
    color: '#EC4899',
    gradientColors: ['#EC4899', '#DB2777'],
  },
  {
    id: 'allahummasalli',
    arabic: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allāhumma ṣalli ʿalā Muḥammad',
    translation: 'O Allah, send blessings upon Muhammad',
    color: '#14B8A6',
    gradientColors: ['#14B8A6', '#0D9488'],
  },
];

export default function DhikrWindowScreen() {
  const { ibadahGoals, updateIbadahGoals } = useImanTracker();
  const [selectedPhrase, setSelectedPhrase] = useState<DhikrPhrase>(DHIKR_PHRASES[0]);
  const [showPhraseSelector, setShowPhraseSelector] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (ibadahGoals) {
      setTotalCount(ibadahGoals.dhikrDailyCompleted);
    }
  }, [ibadahGoals]);

  const handleMainButtonPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newSessionCount = sessionCount + 1;
    const newTotalCount = totalCount + 1;
    
    setSessionCount(newSessionCount);
    setTotalCount(newTotalCount);
    
    if (ibadahGoals) {
      const updatedGoals = {
        ...ibadahGoals,
        dhikrDailyCompleted: newTotalCount,
        dhikrWeeklyCompleted: ibadahGoals.dhikrWeeklyCompleted + 1,
      };
      await updateIbadahGoals(updatedGoals);
    }
  };

  const handleIncrementPress = async (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newSessionCount = sessionCount + amount;
    const newTotalCount = totalCount + amount;
    
    setSessionCount(newSessionCount);
    setTotalCount(newTotalCount);
    
    if (ibadahGoals) {
      const updatedGoals = {
        ...ibadahGoals,
        dhikrDailyCompleted: newTotalCount,
        dhikrWeeklyCompleted: ibadahGoals.dhikrWeeklyCompleted + amount,
      };
      await updateIbadahGoals(updatedGoals);
    }
  };

  const handlePhraseSelect = (phrase: DhikrPhrase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhrase(phrase);
    setShowPhraseSelector(false);
  };

  const handleResetSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      t('dhikr.resetSessionCounter'),
      t('dhikr.resetSessionMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('dhikr.reset'),
          style: 'destructive',
          onPress: () => {
            setSessionCount(0);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const dailyGoal = ibadahGoals?.dhikrDailyGoal || 100;
  const progress = dailyGoal > 0 ? Math.min(totalCount / dailyGoal, 1) : 0;
  
  const size = 280;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

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
        <Text style={styles.headerTitle}>Dhikr Counter</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetSession}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="arrow.counterclockwise"
            android_material_icon_name="refresh"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <LinearGradient
          colors={[selectedPhrase.color + '20', selectedPhrase.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoCard}
        >
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={selectedPhrase.color}
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Tap the counter to track your dhikr. Your progress is automatically saved to the Iman Tracker.
            </Text>
          </View>
        </LinearGradient>

        {/* Phrase Selector Button */}
        <TouchableOpacity
          style={styles.phraseSelectorButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPhraseSelector(true);
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={selectedPhrase.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.phraseSelectorGradient}
          >
            <View style={styles.phraseSelectorContent}>
              <View style={styles.phraseTextContainer}>
                <Text style={styles.phraseArabic}>{selectedPhrase.arabic}</Text>
                <Text style={styles.phraseTransliteration}>{selectedPhrase.transliteration}</Text>
                <Text style={styles.phraseTranslation}>{selectedPhrase.translation}</Text>
              </View>
              <View style={styles.swapIconContainer}>
                <IconSymbol
                  ios_icon_name="arrow.triangle.2.circlepath"
                  android_material_icon_name="swap-horiz"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.swapText}>Change</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Main Counter */}
        <View style={styles.counterSection}>
          <TouchableOpacity
            style={styles.circularButtonContainer}
            onPress={handleMainButtonPress}
            activeOpacity={0.8}
          >
            <Svg width={size} height={size} style={styles.progressRing}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.highlight}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={selectedPhrase.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            
            <LinearGradient
              colors={selectedPhrase.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.circularButton}
            >
              <Text style={styles.sessionLabel}>Session</Text>
              <Text style={styles.countText}>{sessionCount}</Text>
              <Text style={styles.tapText}>Tap to count</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today&apos;s Total</Text>
              <Text style={[styles.statValue, { color: selectedPhrase.color }]}>
                {totalCount}
              </Text>
              <Text style={styles.statSubtext}>of {dailyGoal} goal</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Progress</Text>
              <Text style={[styles.statValue, { color: selectedPhrase.color }]}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={styles.statSubtext}>
                {totalCount >= dailyGoal ? 'Goal reached! 🎉' : `${dailyGoal - totalCount} to go`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Increment Buttons */}
        <View style={styles.incrementSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.incrementButtonsContainer}>
            <TouchableOpacity
              style={styles.incrementButton}
              onPress={() => handleIncrementPress(10)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={selectedPhrase.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.incrementButtonGradient}
              >
                <Text style={styles.incrementButtonText}>+10</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incrementButton}
              onPress={() => handleIncrementPress(33)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={selectedPhrase.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.incrementButtonGradient}
              >
                <Text style={styles.incrementButtonText}>+33</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.incrementButton}
              onPress={() => handleIncrementPress(100)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={selectedPhrase.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.incrementButtonGradient}
              >
                <Text style={styles.incrementButtonText}>+100</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Dhikr Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • After each prayer: Subḥān Allāh (33x), Al-ḥamdu lillāh (33x), Allāhu Akbar (34x)
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Morning & Evening: Recite the daily adhkār for protection and blessings
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Throughout the day: Remember Allah with your heart and tongue
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Phrase Selector Modal */}
      <Modal
        visible={showPhraseSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhraseSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dhikr Phrase</Text>
              <TouchableOpacity
                onPress={() => setShowPhraseSelector(false)}
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

            <ScrollView style={styles.phraseList} showsVerticalScrollIndicator={false}>
              {DHIKR_PHRASES.map((phrase, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.phraseItem,
                      selectedPhrase.id === phrase.id && styles.phraseItemSelected,
                    ]}
                    onPress={() => handlePhraseSelect(phrase)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.phraseColorIndicator, { backgroundColor: phrase.color }]} />
                    <View style={styles.phraseItemContent}>
                      <Text style={styles.phraseItemArabic}>{phrase.arabic}</Text>
                      <Text style={styles.phraseItemTransliteration}>{phrase.transliteration}</Text>
                      <Text style={styles.phraseItemTranslation}>{phrase.translation}</Text>
                    </View>
                    {selectedPhrase.id === phrase.id && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={phrase.color}
                      />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ))}
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
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
    ...shadows.small,
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
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
  },
  phraseSelectorButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  phraseSelectorGradient: {
    padding: spacing.lg,
  },
  phraseSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phraseTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  phraseArabic: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  phraseTransliteration: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  phraseTranslation: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  swapIconContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
  },
  swapText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  circularButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressRing: {
    position: 'absolute',
  },
  circularButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
  },
  sessionLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  tapText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statSubtext: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  incrementSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  incrementButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  incrementButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  incrementButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementButtonText: {
    ...typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tipsSection: {
    marginBottom: spacing.xxl,
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
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
  phraseList: {
    padding: spacing.lg,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.small,
  },
  phraseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  phraseColorIndicator: {
    width: 4,
    height: '100%',
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  phraseItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  phraseItemArabic: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  phraseItemTransliteration: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  phraseItemTranslation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
