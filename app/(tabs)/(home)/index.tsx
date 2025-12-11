
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  completed: boolean;
}

interface QuranGoals {
  versesToMemorize: number;
  versesMemorized: number;
  pagesToRead: number;
  pagesRead: number;
}

interface DhikrGoals {
  dailyTarget: number;
  currentCount: number;
}

export default function HomeScreen() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([
    { name: 'Fajr', time: '5:30 AM', arabicName: 'الفجر', completed: false },
    { name: 'Dhuhr', time: '12:45 PM', arabicName: 'الظهر', completed: false },
    { name: 'Asr', time: '4:15 PM', arabicName: 'العصر', completed: false },
    { name: 'Maghrib', time: '6:30 PM', arabicName: 'المغرب', completed: false },
    { name: 'Isha', time: '8:00 PM', arabicName: 'العشاء', completed: false },
  ]);

  const [quranGoals, setQuranGoals] = useState<QuranGoals>({
    versesToMemorize: 5,
    versesMemorized: 0,
    pagesToRead: 2,
    pagesRead: 0,
  });

  const [dhikrGoals, setDhikrGoals] = useState<DhikrGoals>({
    dailyTarget: 100,
    currentCount: 0,
  });

  // Load prayer data and check for daily reset
  useEffect(() => {
    loadPrayerData();
    loadImanData();
  }, []);

  const loadPrayerData = async () => {
    try {
      const lastDate = await AsyncStorage.getItem('lastPrayerDate');
      const today = new Date().toDateString();
      
      if (lastDate !== today) {
        // Reset prayers for new day
        await AsyncStorage.setItem('lastPrayerDate', today);
        await AsyncStorage.removeItem('prayerData');
        setPrayers([
          { name: 'Fajr', time: '5:30 AM', arabicName: 'الفجر', completed: false },
          { name: 'Dhuhr', time: '12:45 PM', arabicName: 'الظهر', completed: false },
          { name: 'Asr', time: '4:15 PM', arabicName: 'العصر', completed: false },
          { name: 'Maghrib', time: '6:30 PM', arabicName: 'المغرب', completed: false },
          { name: 'Isha', time: '8:00 PM', arabicName: 'العشاء', completed: false },
        ]);
      } else {
        const savedData = await AsyncStorage.getItem('prayerData');
        if (savedData) {
          setPrayers(JSON.parse(savedData));
        }
      }
    } catch (error) {
      console.log('Error loading prayer data:', error);
    }
  };

  const loadImanData = async () => {
    try {
      const savedQuranProgress = await AsyncStorage.getItem('quranProgress');
      const savedDhikrProgress = await AsyncStorage.getItem('dhikrProgress');
      
      if (savedQuranProgress) {
        setQuranGoals(JSON.parse(savedQuranProgress));
      }
      if (savedDhikrProgress) {
        setDhikrGoals(JSON.parse(savedDhikrProgress));
      }
    } catch (error) {
      console.log('Error loading iman data:', error);
    }
  };

  const togglePrayer = async (index: number) => {
    const newPrayers = [...prayers];
    newPrayers[index].completed = !newPrayers[index].completed;
    setPrayers(newPrayers);
    
    try {
      // Save prayer data
      await AsyncStorage.setItem('prayerData', JSON.stringify(newPrayers));
      
      // Update prayer progress for Iman Tracker
      const completedCount = newPrayers.filter(p => p.completed).length;
      await AsyncStorage.setItem('prayerProgress', JSON.stringify({
        completed: completedCount,
        total: 5,
      }));
      
      console.log('Prayer progress updated:', completedCount, '/ 5');
    } catch (error) {
      console.log('Error saving prayer data:', error);
    }
  };

  const completedCount = prayers.filter(p => p.completed).length;

  const dailyHadith = {
    text: "The best of you are those who are best to their families.",
    source: "Tirmidhi"
  };

  const dailyVerse = {
    text: "Indeed, with hardship comes ease.",
    reference: "Quran 94:6",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا"
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const renderProgressCircle = () => {
    const size = 140;
    const strokeWidth = 12;
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
    const centerX = 120;
    const centerY = 120;
    
    // Prayer ring (outer) - Green
    const prayerRadius = 100;
    const prayerStroke = 14;
    const prayerProgressValue = completedCount / prayers.length;
    const prayerCircumference = 2 * Math.PI * prayerRadius;
    const prayerOffset = prayerCircumference * (1 - prayerProgressValue);
    
    // Quran ring (middle) - Amber
    const quranRadius = 72;
    const quranStroke = 12;
    const quranProgressValue = ((quranGoals.versesMemorized / quranGoals.versesToMemorize) + 
                          (quranGoals.pagesRead / quranGoals.pagesToRead)) / 2;
    const quranCircumference = 2 * Math.PI * quranRadius;
    const quranOffset = quranCircumference * (1 - quranProgressValue);
    
    // Dhikr ring (inner) - Blue
    const dhikrRadius = 44;
    const dhikrStroke = 10;
    const dhikrProgressValue = dhikrGoals.currentCount / dhikrGoals.dailyTarget;
    const dhikrCircumference = 2 * Math.PI * dhikrRadius;
    const dhikrOffset = dhikrCircumference * (1 - dhikrProgressValue);

    const totalProgress = (prayerProgressValue + quranProgressValue + dhikrProgressValue) / 3;
    const totalPercentage = Math.round(totalProgress * 100);

    return (
      <View style={styles.imanRingsContainer}>
        <View style={styles.ringsWrapper}>
          <Svg width={240} height={240}>
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
            <Text style={styles.ringsCenterPercentage}>{totalPercentage}%</Text>
          </View>
        </View>
        
        {/* Ring Labels */}
        <View style={styles.ringsLabels}>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.ringLabelText}>Prayer</Text>
            <Text style={styles.ringLabelValue}>{Math.round(prayerProgressValue * 100)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.ringLabelText}>Quran</Text>
            <Text style={styles.ringLabelValue}>{Math.round(quranProgressValue * 100)}%</Text>
          </View>
          <View style={styles.ringLabelItem}>
            <View style={[styles.ringLabelDot, { backgroundColor: colors.info }]} />
            <Text style={styles.ringLabelText}>Dhikr</Text>
            <Text style={styles.ringLabelValue}>{Math.round(dhikrProgressValue * 100)}%</Text>
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
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerIconContainer}>
            <IconSymbol
              ios_icon_name="moon.fill"
              android_material_icon_name="nightlight"
              size={32}
              color={colors.card}
            />
          </View>
          <Text style={styles.greeting}>As-Salamu Alaykum</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </LinearGradient>

        {/* Iman Score Rings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="chart.pie.fill"
                android_material_icon_name="pie-chart"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Iman Score</Text>
          </View>
          <View style={styles.imanScoreCard}>
            {renderImanRings()}
          </View>
        </View>
        
        {/* Prayer Tracker Section with Progress Circle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={20}
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

          {/* Prayer List */}
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
                        size={16}
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
                        size={16}
                        color={colors.card}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Daily Hadith Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={20}
                color={colors.accent}
              />
            </View>
            <Text style={styles.sectionTitle}>Daily Hadith</Text>
          </View>
          <View style={styles.contentCard}>
            <View style={styles.quoteIconContainer}>
              <IconSymbol
                ios_icon_name="quote.opening"
                android_material_icon_name="format-quote"
                size={28}
                color={colors.accent}
              />
            </View>
            <Text style={styles.contentText}>{dailyHadith.text}</Text>
            <View style={styles.sourceContainer}>
              <View style={styles.sourceDivider} />
              <Text style={styles.contentSource}>{dailyHadith.source}</Text>
            </View>
          </View>
        </View>

        {/* Daily Quran Verse Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="book.closed.fill"
                android_material_icon_name="book"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Daily Verse</Text>
          </View>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.verseCard}
          >
            <Text style={styles.verseArabic}>{dailyVerse.arabic}</Text>
            <View style={styles.verseDivider} />
            <Text style={styles.verseText}>{dailyVerse.text}</Text>
            <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
          </LinearGradient>
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
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
    marginBottom: spacing.xxl,
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
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  imanScoreCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
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
    width: 240,
    height: 240,
    marginBottom: spacing.lg,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ringsLabels: {
    width: '100%',
    gap: spacing.sm,
  },
  ringLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ringLabelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.colored,
  },
  progressCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 28,
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
    width: 40,
    height: 40,
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
    width: 28,
    height: 28,
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
    padding: spacing.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    opacity: 0.3,
  },
  contentText: {
    ...typography.body,
    lineHeight: 24,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceDivider: {
    width: 36,
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
    padding: spacing.xl,
    ...shadows.colored,
  },
  verseArabic: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  verseDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: spacing.md,
  },
  verseText: {
    ...typography.body,
    lineHeight: 24,
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
