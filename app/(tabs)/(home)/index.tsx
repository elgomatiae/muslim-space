
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';

interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  completed: boolean;
}

export default function HomeScreen() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([
    { name: 'Fajr', time: '5:30 AM', arabicName: 'الفجر', completed: false },
    { name: 'Dhuhr', time: '12:45 PM', arabicName: 'الظهر', completed: false },
    { name: 'Asr', time: '4:15 PM', arabicName: 'العصر', completed: false },
    { name: 'Maghrib', time: '6:30 PM', arabicName: 'المغرب', completed: false },
    { name: 'Isha', time: '8:00 PM', arabicName: 'العشاء', completed: false },
  ]);

  const togglePrayer = (index: number) => {
    const newPrayers = [...prayers];
    newPrayers[index].completed = !newPrayers[index].completed;
    setPrayers(newPrayers);
  };

  const completedCount = prayers.filter(p => p.completed).length;
  const progressPercentage = (completedCount / prayers.length) * 100;

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
              ios_icon_name="moon-stars"
              android_material_icon_name="nightlight"
              size={36}
              color={colors.card}
            />
          </View>
          <Text style={styles.greeting}>As-Salamu Alaykum</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </LinearGradient>
        
        {/* Prayer Tracker Section with Progress Circle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="schedule"
                size={22}
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
                        ios_icon_name="moon"
                        android_material_icon_name="brightness-3"
                        size={18}
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
                        size={18}
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
                ios_icon_name="book"
                android_material_icon_name="menu-book"
                size={22}
                color={colors.accent}
              />
            </View>
            <Text style={styles.sectionTitle}>Daily Hadith</Text>
          </View>
          <View style={styles.contentCard}>
            <View style={styles.quoteIconContainer}>
              <IconSymbol
                ios_icon_name="quote"
                android_material_icon_name="format-quote"
                size={32}
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
                ios_icon_name="book-closed"
                android_material_icon_name="book"
                size={22}
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
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.colored,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
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
    fontSize: 32,
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
    ...typography.bodyBold,
    color: colors.card,
    textAlign: 'center',
  },
  prayerList: {
    gap: spacing.md,
  },
  prayerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    width: 44,
    height: 44,
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
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  prayerNameCompleted: {
    color: colors.primary,
  },
  prayerArabic: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  prayerArabicCompleted: {
    color: colors.primary,
  },
  prayerTime: {
    ...typography.small,
    color: colors.textSecondary,
  },
  prayerTimeCompleted: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    opacity: 0.3,
  },
  contentText: {
    ...typography.body,
    lineHeight: 28,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceDivider: {
    width: 40,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  contentSource: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  verseCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    ...shadows.colored,
  },
  verseArabic: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 40,
  },
  verseDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: spacing.lg,
  },
  verseText: {
    ...typography.body,
    lineHeight: 28,
    color: colors.card,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verseReference: {
    ...typography.captionBold,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.95,
  },
  bottomPadding: {
    height: 120,
  },
});
