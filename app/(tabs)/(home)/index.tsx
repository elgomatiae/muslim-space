
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { useAuth } from "@/contexts/AuthContext";
import PrayerTimesWidget from '@/components/PrayerTimesWidget';

import { getDailyVerse, getDailyHadith, type DailyVerse, type DailyHadith } from '@/services/DailyContentService';
import DailyVerseWidget from '@/components/DailyVerseWidget';
import DailyHadithWidget from '@/components/DailyHadithWidget';
import AchievementsHomeWidget from '@/components/iman/AchievementsHomeWidget';
import { useAchievementCelebration } from '@/contexts/AchievementCelebrationContext';
import { checkAndUnlockAchievements } from '@/utils/achievementService';


export default function HomeScreen() {
  const { user } = useAuth();
  const { 
    ibadahGoals,
    sectionScores, 
    imanScore,
    refreshScores,
    updateIbadahGoals,
  } = useImanTracker();
  const { checkForUncelebratedAchievements } = useAchievementCelebration();

  const [refreshing, setRefreshing] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [contentLoading, setContentLoading] = useState(true);


  // Load daily content
  useEffect(() => {
    loadDailyContent();
  }, []);

  const loadDailyContent = async () => {
    setContentLoading(true);
    try {
      const [verse, hadith] = await Promise.all([
        getDailyVerse(),
        getDailyHadith(),
      ]);
      setDailyVerse(verse);
      setDailyHadith(hadith);
    } catch (error) {
      console.error('Error loading daily content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshScores(),
      loadDailyContent(),
    ]);
    setRefreshing(false);
  };

  // Check for achievements when component mounts and after activities
  useEffect(() => {
    if (user?.id) {
      // Check achievements on mount
      checkAchievementsAndCelebrate();
      
      // Also check for uncelebrated achievements from queue
      checkForUncelebratedAchievements(user.id);
    }
  }, [user?.id]);

  const checkAchievementsAndCelebrate = async () => {
    if (!user?.id) return;

    try {
      // Check and unlock achievements
      await checkAndUnlockAchievements(user.id);
    } catch (error) {
      console.log('Error checking achievements:', error);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const renderImanRings = () => {
    const centerX = 100;
    const centerY = 100;
    
    const ibadahScore = typeof sectionScores.ibadah === 'number' && !isNaN(sectionScores.ibadah) ? sectionScores.ibadah : 0;
    const ilmScore = typeof sectionScores.ilm === 'number' && !isNaN(sectionScores.ilm) ? sectionScores.ilm : 0;
    const amanahScore = typeof sectionScores.amanah === 'number' && !isNaN(sectionScores.amanah) ? sectionScores.amanah : 0;
    
    // ʿIbādah ring (outer) - Green
    const ibadahRadius = 85;
    const ibadahStroke = 12;
    const ibadahProgressValue = ibadahScore / 100;
    const ibadahCircumference = 2 * Math.PI * ibadahRadius;
    const ibadahOffset = ibadahCircumference * (1 - ibadahProgressValue);
    
    // ʿIlm ring (middle) - Blue
    const ilmRadius = 62;
    const ilmStroke = 10;
    const ilmProgressValue = ilmScore / 100;
    const ilmCircumference = 2 * Math.PI * ilmRadius;
    const ilmOffset = ilmCircumference * (1 - ilmProgressValue);
    
    // Amanah ring (inner) - Amber/Gold
    const amanahRadius = 39;
    const amanahStroke = 8;
    const amanahProgressValue = amanahScore / 100;
    const amanahCircumference = 2 * Math.PI * amanahRadius;
    const amanahOffset = amanahCircumference * (1 - amanahProgressValue);

    const ibadahColor = '#10B981'; // Green
    const ilmColor = '#3B82F6'; // Blue
    const amanahColor = '#F59E0B'; // Amber/Gold

    return (
      <View style={styles.imanRingsContainer}>
        <View style={styles.ringsWrapper}>
          <Svg width={200} height={200}>
            {/* ʿIbādah Ring (Outer) - GREEN */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={ibadahRadius}
              stroke="#808080"
              strokeWidth={ibadahStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={ibadahRadius}
              stroke={ibadahColor}
              strokeWidth={ibadahStroke}
              fill="none"
              strokeDasharray={ibadahCircumference}
              strokeDashoffset={ibadahOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* ʿIlm Ring (Middle) - BLUE */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={ilmRadius}
              stroke="#808080"
              strokeWidth={ilmStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={ilmRadius}
              stroke={ilmColor}
              strokeWidth={ilmStroke}
              fill="none"
              strokeDasharray={ilmCircumference}
              strokeDashoffset={ilmOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* Amanah Ring (Inner) - GOLD */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={amanahRadius}
              stroke="#808080"
              strokeWidth={amanahStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={amanahRadius}
              stroke={amanahColor}
              strokeWidth={amanahStroke}
              fill="none"
              strokeDasharray={amanahCircumference}
              strokeDashoffset={amanahOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
          </Svg>
          
          {/* Center Content */}
          <View style={styles.ringsCenterContent}>
            <Text style={styles.ringsCenterTitle}>Iman</Text>
            <Text style={styles.ringsCenterPercentage}>{imanScore}%</Text>
          </View>
        </View>
        
        {/* Ring Labels */}
        <View style={styles.ringsLabels}>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: ibadahColor }]} />
            <Text style={styles.ringLabelText}>ʿIbādah</Text>
            <Text style={styles.ringLabelValue}>{Math.round(ibadahScore)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: ilmColor }]} />
            <Text style={styles.ringLabelText}>ʿIlm</Text>
            <Text style={styles.ringLabelValue}>{Math.round(ilmScore)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: amanahColor }]} />
            <Text style={styles.ringLabelText}>Amanah</Text>
            <Text style={styles.ringLabelValue}>{Math.round(amanahScore)}%</Text>
          </View>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header with Enhanced Gradient */}
        <LinearGradient
          colors={colors.gradientPrimary as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="nightlight"
                size={28}
                color={colors.card}
              />
            </View>
            <View style={styles.headerTextSection}>
              <Text style={styles.greeting}>As-Salamu Alaykum</Text>
              <Text style={styles.date}>{currentDate}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Prayer Times Widget - Uses exact GPS location */}
        <PrayerTimesWidget />

        {/* Daily Quran Verse Widget */}
        <DailyVerseWidget verse={dailyVerse} loading={contentLoading} />

        {/* Iman Score Rings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="chart.pie.fill"
                android_material_icon_name="pie-chart"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Iman Score</Text>
          </View>
          <View style={styles.imanScoreCard}>
            {renderImanRings()}
          </View>
        </View>
        
        {/* Achievements Widget */}
        <AchievementsHomeWidget />


        {/* Daily Hadith Widget */}
        <View style={styles.section}>
          <DailyHadithWidget hadith={dailyHadith} loading={contentLoading} />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.emphasis,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextSection: {
    flex: 1,
  },
  greeting: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  imanScoreCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imanRingsContainer: {
    alignItems: 'center',
  },
  ringsWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  ringsCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsCenterTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  ringsCenterPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ringsLabels: {
    width: '100%',
    gap: spacing.xs,
  },
  ringLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ringLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ringLabelText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  ringLabelValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  contentCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quoteIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    opacity: 0.3,
  },
  hadithArabic: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 26,
  },
  contentText: {
    ...typography.body,
    lineHeight: 22,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceDivider: {
    width: 32,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  contentSource: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  verseCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.emphasis,
    overflow: 'hidden',
  },
  verseArabic: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  verseDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: spacing.md,
  },
  verseText: {
    ...typography.body,
    lineHeight: 22,
    color: colors.card,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  verseReference: {
    ...typography.captionBold,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.95,
  },
  bottomPadding: {
    height: 100,
  },
});
