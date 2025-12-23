
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  completed: boolean;
}

interface DailyVerse {
  id: string;
  arabic_text: string;
  translation: string;
  reference: string;
}

interface DailyHadith {
  id: string;
  arabic_text?: string;
  translation: string;
  source: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { 
    prayerGoals, 
    dhikrGoals, 
    quranGoals,
    ibadahGoals,
    sectionScores, 
    overallScore,
    refreshData,
    updatePrayerGoals,
  } = useImanTracker();

  const [prayers, setPrayers] = useState<PrayerTime[]>([
    { name: 'Fajr', time: '5:30 AM', arabicName: 'الفجر', completed: false },
    { name: 'Dhuhr', time: '12:45 PM', arabicName: 'الظهر', completed: false },
    { name: 'Asr', time: '4:15 PM', arabicName: 'العصر', completed: false },
    { name: 'Maghrib', time: '6:30 PM', arabicName: 'المغرب', completed: false },
    { name: 'Isha', time: '8:00 PM', arabicName: 'العشاء', completed: false },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync prayers with prayerGoals from context
  useEffect(() => {
    if (prayerGoals) {
      const updatedPrayers = [
        { name: 'Fajr', time: '5:30 AM', arabicName: 'الفجر', completed: prayerGoals.fardPrayers.fajr },
        { name: 'Dhuhr', time: '12:45 PM', arabicName: 'الظهر', completed: prayerGoals.fardPrayers.dhuhr },
        { name: 'Asr', time: '4:15 PM', arabicName: 'العصر', completed: prayerGoals.fardPrayers.asr },
        { name: 'Maghrib', time: '6:30 PM', arabicName: 'المغرب', completed: prayerGoals.fardPrayers.maghrib },
        { name: 'Isha', time: '8:00 PM', arabicName: 'العشاء', completed: prayerGoals.fardPrayers.isha },
      ];
      setPrayers(updatedPrayers);
    }
  }, [prayerGoals]);

  useEffect(() => {
    loadDailyContent();
  }, [user]);

  const loadDailyContent = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if user already has content for today
      const { data: existingContent } = await supabase
        .from('user_daily_content')
        .select('*, daily_verses(*), daily_hadiths(*)')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existingContent && existingContent.daily_verses && existingContent.daily_hadiths) {
        // User already has content for today
        setDailyVerse(existingContent.daily_verses);
        setDailyHadith(existingContent.daily_hadiths);
      } else {
        // Get random verse and hadith
        const { data: verses } = await supabase
          .from('daily_verses')
          .select('*')
          .eq('is_active', true);

        const { data: hadiths } = await supabase
          .from('daily_hadiths')
          .select('*')
          .eq('is_active', true);

        if (verses && verses.length > 0 && hadiths && hadiths.length > 0) {
          // Select random verse and hadith
          const randomVerse = verses[Math.floor(Math.random() * verses.length)];
          const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];

          setDailyVerse(randomVerse);
          setDailyHadith(randomHadith);

          // Save to user_daily_content
          await supabase
            .from('user_daily_content')
            .upsert({
              user_id: user.id,
              date: today,
              verse_id: randomVerse.id,
              hadith_id: randomHadith.id,
            });
        }
      }
    } catch (error) {
      console.error('Error loading daily content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), loadDailyContent()]);
    setRefreshing(false);
  };

  const togglePrayer = async (index: number) => {
    if (!prayerGoals) return;

    const prayerKeys: (keyof typeof prayerGoals.fardPrayers)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerKey = prayerKeys[index];

    const updatedGoals = {
      ...prayerGoals,
      fardPrayers: {
        ...prayerGoals.fardPrayers,
        [prayerKey]: !prayerGoals.fardPrayers[prayerKey],
      },
    };

    await updatePrayerGoals(updatedGoals);
  };

  const completedCount = prayers.filter(p => p.completed).length;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const renderProgressCircle = () => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - completedCount / prayers.length);

    return (
      <View style={styles.progressCircleContainer}>
        <Svg width={size} height={size}>
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
            stroke={colors.card}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.progressContent}>
          <Text style={styles.progressNumber}>{completedCount}/{prayers.length}</Text>
          <Text style={styles.progressLabel}>Prayers</Text>
        </View>
      </View>
    );
  };

  const renderImanRings = () => {
    const centerX = 100;
    const centerY = 100;
    
    // Calculate individual ring percentages from ibadahGoals
    let prayerScore = 0;
    let quranScore = 0;
    let dhikrScore = 0;

    if (ibadahGoals) {
      // Prayer score (based on fard prayers + sunnah)
      const fardCount = Object.values(ibadahGoals.fardPrayers).filter(Boolean).length;
      const fardPercentage = (fardCount / 5) * 100;
      const sunnahPercentage = ibadahGoals.sunnahDailyGoal > 0 
        ? Math.min(100, (ibadahGoals.sunnahCompleted / ibadahGoals.sunnahDailyGoal) * 100)
        : 100;
      prayerScore = (fardPercentage * 0.75 + sunnahPercentage * 0.25); // 75% fard, 25% sunnah

      // Quran score (based on pages and verses)
      const pagesPercentage = ibadahGoals.quranDailyPagesGoal > 0
        ? Math.min(100, (ibadahGoals.quranDailyPagesCompleted / ibadahGoals.quranDailyPagesGoal) * 100)
        : 0;
      const versesPercentage = ibadahGoals.quranDailyVersesGoal > 0
        ? Math.min(100, (ibadahGoals.quranDailyVersesCompleted / ibadahGoals.quranDailyVersesGoal) * 100)
        : 0;
      quranScore = (pagesPercentage + versesPercentage) / 2;

      // Dhikr score (based on daily dhikr)
      dhikrScore = ibadahGoals.dhikrDailyGoal > 0
        ? Math.min(100, (ibadahGoals.dhikrDailyCompleted / ibadahGoals.dhikrDailyGoal) * 100)
        : 0;
    }
    
    // Ensure scores are valid numbers
    prayerScore = typeof prayerScore === 'number' && !isNaN(prayerScore) ? prayerScore : 0;
    quranScore = typeof quranScore === 'number' && !isNaN(quranScore) ? quranScore : 0;
    dhikrScore = typeof dhikrScore === 'number' && !isNaN(dhikrScore) ? dhikrScore : 0;
    
    console.log('Home Screen - Individual Ring Scores:', { prayer: prayerScore, quran: quranScore, dhikr: dhikrScore });
    
    // Prayer ring (outer) - Green
    const prayerRadius = 85;
    const prayerStroke = 12;
    const prayerProgressValue = prayerScore / 100;
    const prayerCircumference = 2 * Math.PI * prayerRadius;
    const prayerOffset = prayerCircumference * (1 - prayerProgressValue);
    
    // Quran ring (middle) - Amber
    const quranRadius = 62;
    const quranStroke = 10;
    const quranProgressValue = quranScore / 100;
    const quranCircumference = 2 * Math.PI * quranRadius;
    const quranOffset = quranCircumference * (1 - quranProgressValue);
    
    // Dhikr ring (inner) - Blue
    const dhikrRadius = 39;
    const dhikrStroke = 8;
    const dhikrProgressValue = dhikrScore / 100;
    const dhikrCircumference = 2 * Math.PI * dhikrRadius;
    const dhikrOffset = dhikrCircumference * (1 - dhikrProgressValue);

    return (
      <View style={styles.imanRingsContainer}>
        <View style={styles.ringsWrapper}>
          <Svg width={200} height={200}>
            {/* Prayer Ring (Outer) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={prayerRadius}
              stroke="#808080"
              strokeWidth={prayerStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={prayerRadius}
              stroke={colors.primary}
              strokeWidth={prayerStroke}
              fill="none"
              strokeDasharray={prayerCircumference}
              strokeDashoffset={prayerOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* Quran Ring (Middle) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={quranRadius}
              stroke="#808080"
              strokeWidth={quranStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={quranRadius}
              stroke={colors.accent}
              strokeWidth={quranStroke}
              fill="none"
              strokeDasharray={quranCircumference}
              strokeDashoffset={quranOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* Dhikr Ring (Inner) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={dhikrRadius}
              stroke="#808080"
              strokeWidth={dhikrStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={dhikrRadius}
              stroke={colors.info}
              strokeWidth={dhikrStroke}
              fill="none"
              strokeDasharray={dhikrCircumference}
              strokeDashoffset={dhikrOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
          </Svg>
          
          {/* Center Content */}
          <View style={styles.ringsCenterContent}>
            <Text style={styles.ringsCenterTitle}>Iman</Text>
            <Text style={styles.ringsCenterPercentage}>{overallScore}%</Text>
          </View>
        </View>
        
        {/* Ring Labels */}
        <View style={styles.ringsLabels}>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.ringLabelText}>Prayer</Text>
            <Text style={styles.ringLabelValue}>{Math.round(prayerScore)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.ringLabelText}>Quran</Text>
            <Text style={styles.ringLabelValue}>{Math.round(quranScore)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.info }]} />
            <Text style={styles.ringLabelText}>Dhikr</Text>
            <Text style={styles.ringLabelValue}>{Math.round(dhikrScore)}%</Text>
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
        {/* Header with Gradient - IMPROVED DESIGN */}
        <LinearGradient
          colors={colors.gradientPrimary}
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

        {/* Daily Quran Verse Section - ENHANCED DESIGN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="book.closed.fill"
                android_material_icon_name="book"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Daily Verse</Text>
          </View>
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading verse...</Text>
            </View>
          ) : dailyVerse ? (
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.verseCard}
            >
              <Text style={styles.verseArabic}>{dailyVerse.arabic_text}</Text>
              <View style={styles.verseDivider} />
              <Text style={styles.verseText}>{dailyVerse.translation}</Text>
              <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>No verse available today</Text>
            </View>
          )}
        </View>

        {/* Iman Score Rings - IMPROVED LAYOUT */}
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
        
        {/* Prayer Tracker Section - IMPROVED DESIGN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Prayer Tracker</Text>
          </View>
          
          {/* Progress Summary Card */}
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            {renderProgressCircle()}
            <Text style={styles.summaryText}>
              {completedCount === prayers.length 
                ? 'All prayers completed! 🎉' 
                : `${completedCount} of ${prayers.length} prayers completed`}
            </Text>
          </LinearGradient>

          {/* Prayer List - IMPROVED SPACING */}
          <View style={styles.prayerList}>
            {prayers.map((prayer, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.prayerCard,
                    prayer.completed && styles.prayerCardCompleted
                  ]}
                  onPress={() => togglePrayer(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.prayerLeft}>
                    <View style={[
                      styles.prayerIconContainer,
                      prayer.completed && styles.prayerIconContainerCompleted
                    ]}>
                      <IconSymbol
                        ios_icon_name="moon.fill"
                        android_material_icon_name="brightness-3"
                        size={14}
                        color={prayer.completed ? colors.card : colors.primary}
                      />
                    </View>
                    <View style={styles.prayerInfo}>
                      <Text style={[
                        styles.prayerName,
                        prayer.completed && styles.prayerNameCompleted
                      ]}>
                        {prayer.name}
                      </Text>
                      <Text style={[
                        styles.prayerArabic,
                        prayer.completed && styles.prayerArabicCompleted
                      ]}>
                        {prayer.arabicName}
                      </Text>
                      <Text style={[
                        styles.prayerTime,
                        prayer.completed && styles.prayerTimeCompleted
                      ]}>
                        {prayer.time}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    prayer.completed && styles.checkboxCompleted
                  ]}>
                    {prayer.completed && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={14}
                        color={colors.card}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Daily Hadith Section - IMPROVED DESIGN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={18}
                color={colors.accent}
              />
            </View>
            <Text style={styles.sectionTitle}>Daily Hadith</Text>
          </View>
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading hadith...</Text>
            </View>
          ) : dailyHadith ? (
            <View style={styles.contentCard}>
              <View style={styles.quoteIconContainer}>
                <IconSymbol
                  ios_icon_name="quote.opening"
                  android_material_icon_name="format-quote"
                  size={24}
                  color={colors.accent}
                />
              </View>
              {dailyHadith.arabic_text && (
                <Text style={styles.hadithArabic}>{dailyHadith.arabic_text}</Text>
              )}
              <Text style={styles.contentText}>{dailyHadith.translation}</Text>
              <View style={styles.sourceContainer}>
                <View style={styles.sourceDivider} />
                <Text style={styles.contentSource}>{dailyHadith.source}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>No hadith available today</Text>
            </View>
          )}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.colored,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
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
  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.colored,
  },
  progressCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.card,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    marginTop: spacing.xs,
  },
  summaryText: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    fontWeight: '600',
  },
  prayerList: {
    gap: spacing.sm,
  },
  prayerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prayerCardCompleted: {
    backgroundColor: colors.highlight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prayerIconContainerCompleted: {
    backgroundColor: colors.primary,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  prayerNameCompleted: {
    color: colors.primary,
  },
  prayerArabic: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  prayerArabicCompleted: {
    color: colors.primary,
  },
  prayerTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  prayerTimeCompleted: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contentCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.medium,
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
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.colored,
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
