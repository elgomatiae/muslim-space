
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Modal, Animated } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

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

interface PrayerProgress {
  completed: number;
  total: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export default function ImanTrackerScreen() {
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

  const [prayerProgress, setPrayerProgress] = useState<PrayerProgress>({
    completed: 0,
    total: 5,
  });

  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'quran' | 'dhikr' | 'goals' | null>(null);
  const [tempQuranGoals, setTempQuranGoals] = useState<QuranGoals>(quranGoals);
  const [tempDhikrTarget, setTempDhikrTarget] = useState(dhikrGoals.dailyTarget.toString());
  
  // Animation values
  const pulseAnim = useState(new Animated.Value(1))[0];
  const glowAnim = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Load data and check for daily reset
  useEffect(() => {
    loadData();
    loadPrayerProgress();
    loadStreakData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Pulse animation for center score
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();
  };

  const celebrateCompletion = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      const lastDate = await AsyncStorage.getItem('lastImanDate');
      const today = new Date().toDateString();
      
      if (lastDate !== today) {
        // Reset for new day
        await AsyncStorage.setItem('lastImanDate', today);
        const savedQuranGoals = await AsyncStorage.getItem('quranGoalTargets');
        const savedDhikrTarget = await AsyncStorage.getItem('dhikrGoalTarget');
        
        const newQuranGoals = savedQuranGoals ? JSON.parse(savedQuranGoals) : quranGoals;
        const newDhikrTarget = savedDhikrTarget ? parseInt(savedDhikrTarget) : dhikrGoals.dailyTarget;
        
        setQuranGoals({
          ...newQuranGoals,
          versesMemorized: 0,
          pagesRead: 0,
        });
        setDhikrGoals({
          dailyTarget: newDhikrTarget,
          currentCount: 0,
        });
        
        await AsyncStorage.setItem('quranProgress', JSON.stringify({
          ...newQuranGoals,
          versesMemorized: 0,
          pagesRead: 0,
        }));
        await AsyncStorage.setItem('dhikrProgress', JSON.stringify({
          dailyTarget: newDhikrTarget,
          currentCount: 0,
        }));
      } else {
        const savedQuranProgress = await AsyncStorage.getItem('quranProgress');
        const savedDhikrProgress = await AsyncStorage.getItem('dhikrProgress');
        
        if (savedQuranProgress) {
          setQuranGoals(JSON.parse(savedQuranProgress));
        }
        if (savedDhikrProgress) {
          setDhikrGoals(JSON.parse(savedDhikrProgress));
        }
      }
    } catch (error) {
      console.log('Error loading iman data:', error);
    }
  };

  const loadPrayerProgress = async () => {
    try {
      const savedPrayerData = await AsyncStorage.getItem('prayerData');
      if (savedPrayerData) {
        const prayers = JSON.parse(savedPrayerData);
        const completed = prayers.filter((p: any) => p.completed).length;
        setPrayerProgress({ completed, total: 5 });
      }
    } catch (error) {
      console.log('Error loading prayer progress:', error);
    }
  };

  const loadStreakData = async () => {
    try {
      const savedStreak = await AsyncStorage.getItem('imanStreak');
      if (savedStreak) {
        setStreakData(JSON.parse(savedStreak));
      }
    } catch (error) {
      console.log('Error loading streak data:', error);
    }
  };

  const updateStreakData = async (totalProgress: number) => {
    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (totalProgress >= 0.8) { // 80% completion threshold
        let newStreak = { ...streakData };
        
        if (streakData.lastCompletedDate === yesterday) {
          newStreak.currentStreak += 1;
        } else if (streakData.lastCompletedDate !== today) {
          newStreak.currentStreak = 1;
        }
        
        newStreak.longestStreak = Math.max(newStreak.currentStreak, newStreak.longestStreak);
        newStreak.lastCompletedDate = today;
        
        setStreakData(newStreak);
        await AsyncStorage.setItem('imanStreak', JSON.stringify(newStreak));
      }
    } catch (error) {
      console.log('Error updating streak:', error);
    }
  };

  const updateQuranProgress = async (field: keyof QuranGoals, increment: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newGoals = { ...quranGoals };
    if (field === 'versesMemorized') {
      newGoals.versesMemorized = increment 
        ? Math.min(newGoals.versesMemorized + 1, newGoals.versesToMemorize)
        : Math.max(newGoals.versesMemorized - 1, 0);
    } else if (field === 'pagesRead') {
      newGoals.pagesRead = increment 
        ? Math.min(newGoals.pagesRead + 1, newGoals.pagesToRead)
        : Math.max(newGoals.pagesRead - 1, 0);
    }
    setQuranGoals(newGoals);
    await AsyncStorage.setItem('quranProgress', JSON.stringify(newGoals));
    
    // Check if goal completed
    if ((field === 'versesMemorized' && newGoals.versesMemorized === newGoals.versesToMemorize) ||
        (field === 'pagesRead' && newGoals.pagesRead === newGoals.pagesToRead)) {
      celebrateCompletion();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const incrementDhikr = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCount = Math.min(dhikrGoals.currentCount + 1, dhikrGoals.dailyTarget);
    const newDhikrGoals = { ...dhikrGoals, currentCount: newCount };
    setDhikrGoals(newDhikrGoals);
    await AsyncStorage.setItem('dhikrProgress', JSON.stringify(newDhikrGoals));
    
    // Celebrate milestones
    if (newCount === dhikrGoals.dailyTarget) {
      celebrateCompletion();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (newCount % 33 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const resetDhikr = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDhikrGoals = { ...dhikrGoals, currentCount: 0 };
    setDhikrGoals(newDhikrGoals);
    await AsyncStorage.setItem('dhikrProgress', JSON.stringify(newDhikrGoals));
  };

  const openGoalsModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempQuranGoals(quranGoals);
    setTempDhikrTarget(dhikrGoals.dailyTarget.toString());
    setModalType('goals');
    setModalVisible(true);
  };

  const saveGoals = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newQuranGoals = {
      ...tempQuranGoals,
      versesMemorized: Math.min(tempQuranGoals.versesMemorized, tempQuranGoals.versesToMemorize),
      pagesRead: Math.min(tempQuranGoals.pagesRead, tempQuranGoals.pagesToRead),
    };
    const newDhikrTarget = parseInt(tempDhikrTarget) || 100;
    
    setQuranGoals(newQuranGoals);
    setDhikrGoals({ ...dhikrGoals, dailyTarget: newDhikrTarget });
    
    await AsyncStorage.setItem('quranGoalTargets', JSON.stringify({
      versesToMemorize: newQuranGoals.versesToMemorize,
      pagesToRead: newQuranGoals.pagesToRead,
    }));
    await AsyncStorage.setItem('quranProgress', JSON.stringify(newQuranGoals));
    await AsyncStorage.setItem('dhikrGoalTarget', newDhikrTarget.toString());
    await AsyncStorage.setItem('dhikrProgress', JSON.stringify({
      dailyTarget: newDhikrTarget,
      currentCount: dhikrGoals.currentCount,
    }));
    
    setModalVisible(false);
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "Masha'Allah! Perfect day! 🌟";
    if (percentage >= 80) return "Excellent progress! Keep going! 💪";
    if (percentage >= 60) return "Great effort! You're doing well! ✨";
    if (percentage >= 40) return "Good start! Keep it up! 🌱";
    if (percentage >= 20) return "Every step counts! 🚀";
    return "Begin your journey today! 🌙";
  };

  const getAchievementBadge = (percentage: number) => {
    if (percentage >= 100) return { icon: "star.fill", color: colors.accent, label: "Perfect" };
    if (percentage >= 80) return { icon: "flame.fill", color: colors.warning, label: "On Fire" };
    if (percentage >= 60) return { icon: "bolt.fill", color: colors.info, label: "Strong" };
    return { icon: "leaf.fill", color: colors.primary, label: "Growing" };
  };

  const getDailyInsight = (prayerProg: number, quranProg: number, dhikrProg: number) => {
    if (prayerProg === 1 && quranProg === 1 && dhikrProg === 1) {
      return { text: "All goals completed! 🎉", color: colors.success };
    }
    if (prayerProg === 1) {
      return { text: "All prayers completed! 🤲", color: colors.primary };
    }
    if (quranProg === 1) {
      return { text: "Quran goals achieved! 📖", color: colors.accent };
    }
    if (dhikrProg === 1) {
      return { text: "Dhikr goal reached! ✨", color: colors.info };
    }
    const highest = Math.max(prayerProg, quranProg, dhikrProg);
    if (highest >= 0.5) {
      return { text: "Great progress today! 💫", color: colors.primary };
    }
    return { text: "Keep building momentum! 🌱", color: colors.textSecondary };
  };

  const renderNestedRings = () => {
    const centerX = 170;
    const centerY = 170;
    
    // Prayer ring (outer) - Green
    const prayerRadius = 140;
    const prayerStroke = 20;
    const prayerProgressValue = prayerProgress.completed / prayerProgress.total;
    const prayerCircumference = 2 * Math.PI * prayerRadius;
    const prayerOffset = prayerCircumference * (1 - prayerProgressValue);
    
    // Quran ring (middle) - Amber
    const quranRadius = 100;
    const quranStroke = 18;
    const quranProgressValue = ((quranGoals.versesMemorized / quranGoals.versesToMemorize) + 
                          (quranGoals.pagesRead / quranGoals.pagesToRead)) / 2;
    const quranCircumference = 2 * Math.PI * quranRadius;
    const quranOffset = quranCircumference * (1 - quranProgressValue);
    
    // Dhikr ring (inner) - Blue
    const dhikrRadius = 60;
    const dhikrStroke = 16;
    const dhikrProgressValue = dhikrGoals.currentCount / dhikrGoals.dailyTarget;
    const dhikrCircumference = 2 * Math.PI * dhikrRadius;
    const dhikrOffset = dhikrCircumference * (1 - dhikrProgressValue);

    const totalProgress = (prayerProgressValue + quranProgressValue + dhikrProgressValue) / 3;
    const totalPercentage = Math.round(totalProgress * 100);
    const badge = getAchievementBadge(totalPercentage);
    const insight = getDailyInsight(prayerProgressValue, quranProgressValue, dhikrProgressValue);

    // Update streak when progress changes
    useEffect(() => {
      updateStreakData(totalProgress);
    }, [totalProgress]);

    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <LinearGradient
        colors={['#F8F8FF', '#E8E8F8', '#F8F8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nestedRingsContainer}
      >
        <View style={styles.ringsWrapper}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={340} height={340}>
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%">
                  <Stop offset="0%" stopColor={badge.color} stopOpacity="0.3" />
                  <Stop offset="100%" stopColor={badge.color} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              
              {/* Animated glow effect */}
              <Animated.View style={{ opacity: glowOpacity }}>
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={150}
                  fill="url(#glow)"
                />
              </Animated.View>
              
              {/* Prayer Ring (Outer) */}
              <Circle
                cx={centerX}
                cy={centerY}
                r={prayerRadius}
                stroke={colors.highlight}
                strokeWidth={prayerStroke}
                fill="none"
                opacity={0.3}
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
                stroke={colors.highlight}
                strokeWidth={quranStroke}
                fill="none"
                opacity={0.3}
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
                stroke={colors.highlight}
                strokeWidth={dhikrStroke}
                fill="none"
                opacity={0.3}
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
          </Animated.View>
          
          {/* Center Content - Perfectly Centered */}
          <Animated.View 
            style={[
              styles.centerContent,
              {
                transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }],
              }
            ]}
          >
            <View style={[styles.badgeContainer, { backgroundColor: badge.color + '20' }]}>
              <IconSymbol
                ios_icon_name={badge.icon}
                android_material_icon_name="star"
                size={32}
                color={badge.color}
              />
            </View>
            <Text style={styles.centerTitle}>Iman</Text>
            <Text style={styles.centerSubtitle}>Score</Text>
            <Text style={[styles.centerPercentage, { color: badge.color }]}>{totalPercentage}%</Text>
            <View style={[styles.badgeLabelContainer, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
            </View>
          </Animated.View>
        </View>
        
        {/* Daily Insight */}
        <LinearGradient
          colors={[insight.color + '20', insight.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.insightContainer}
        >
          <IconSymbol
            ios_icon_name="lightbulb.fill"
            android_material_icon_name="lightbulb"
            size={20}
            color={insight.color}
          />
          <Text style={[styles.insightText, { color: insight.color }]}>
            {insight.text}
          </Text>
        </LinearGradient>
        
        {/* Motivational Message */}
        <View style={styles.motivationalContainer}>
          <Text style={styles.motivationalText}>
            {getMotivationalMessage(totalPercentage)}
          </Text>
        </View>
        
        {/* Ring Labels with Progress */}
        <View style={styles.ringLabelsContainer}>
          <TouchableOpacity 
            style={styles.ringLabel}
            activeOpacity={0.7}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ringLabelDot}
            />
            <View style={styles.ringLabelContent}>
              <Text style={styles.ringLabelText}>Prayer</Text>
              <Text style={styles.ringLabelProgress}>{prayerProgress.completed}/{prayerProgress.total} completed</Text>
            </View>
            <View style={styles.ringLabelPercentage}>
              <Text style={[styles.ringLabelPercentText, { color: colors.primary }]}>
                {Math.round(prayerProgressValue * 100)}%
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.ringLabel}
            activeOpacity={0.7}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ringLabelDot}
            />
            <View style={styles.ringLabelContent}>
              <Text style={styles.ringLabelText}>Quran</Text>
              <Text style={styles.ringLabelProgress}>
                {quranGoals.versesMemorized + quranGoals.pagesRead}/{quranGoals.versesToMemorize + quranGoals.pagesToRead} completed
              </Text>
            </View>
            <View style={styles.ringLabelPercentage}>
              <Text style={[styles.ringLabelPercentText, { color: colors.accent }]}>
                {Math.round(quranProgressValue * 100)}%
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.ringLabel}
            activeOpacity={0.7}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ringLabelDot}
            />
            <View style={styles.ringLabelContent}>
              <Text style={styles.ringLabelText}>Dhikr</Text>
              <Text style={styles.ringLabelProgress}>{dhikrGoals.currentCount}/{dhikrGoals.dailyTarget} counted</Text>
            </View>
            <View style={styles.ringLabelPercentage}>
              <Text style={[styles.ringLabelPercentText, { color: colors.info }]}>
                {Math.round(dhikrProgressValue * 100)}%
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Streak Display */}
        {streakData.currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.streakBadge}
            >
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="local-fire-department"
                size={24}
                color={colors.card}
              />
              <View>
                <Text style={styles.streakText}>{streakData.currentStreak} Day Streak!</Text>
                {streakData.longestStreak > streakData.currentStreak && (
                  <Text style={styles.streakSubtext}>
                    Best: {streakData.longestStreak} days
                  </Text>
                )}
              </View>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.header}>Iman Tracker</Text>
            <Text style={styles.subtitle}>Track your daily spiritual goals</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openGoalsModal}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="gear"
              android_material_icon_name="settings"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Nested Rings Display */}
        {renderNestedRings()}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={[colors.success + '20', colors.success + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.statCard}
          >
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={28}
              color={colors.success}
            />
            <Text style={styles.statValue}>
              {prayerProgress.completed + (quranGoals.versesMemorized > 0 ? 1 : 0) + (dhikrGoals.currentCount > 0 ? 1 : 0)}
            </Text>
            <Text style={styles.statLabel}>Active Today</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={[colors.primary + '20', colors.primary + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.statCard}
          >
            <IconSymbol
              ios_icon_name="target"
              android_material_icon_name="track-changes"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.statValue}>
              {Math.round(((prayerProgress.completed / 5) + 
                (quranGoals.versesMemorized / quranGoals.versesToMemorize) + 
                (quranGoals.pagesRead / quranGoals.pagesToRead) + 
                (dhikrGoals.currentCount / dhikrGoals.dailyTarget)) / 4 * 100)}%
            </Text>
            <Text style={styles.statLabel}>Overall</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={[colors.info + '20', colors.info + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.statCard}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={28}
              color={colors.info}
            />
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </LinearGradient>
        </View>

        {/* Quran Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="book"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quran Goals</Text>
          </View>
          
          {/* Verses to Memorize */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleContainer}>
                <IconSymbol
                  ios_icon_name="brain"
                  android_material_icon_name="psychology"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.goalName}>Verses to Memorize</Text>
              </View>
              <Text style={styles.goalProgress}>
                {quranGoals.versesMemorized} / {quranGoals.versesToMemorize}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${(quranGoals.versesMemorized / quranGoals.versesToMemorize) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <View style={styles.goalButtons}>
              <TouchableOpacity
                style={[styles.goalButton, styles.goalButtonSecondary]}
                onPress={() => updateQuranProgress('versesMemorized', false)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="minus"
                  android_material_icon_name="remove"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goalButton, { backgroundColor: colors.accent }]}
                onPress={() => updateQuranProgress('versesMemorized', true)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color={colors.card}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pages to Read */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleContainer}>
                <IconSymbol
                  ios_icon_name="book.pages"
                  android_material_icon_name="menu-book"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.goalName}>Pages to Read</Text>
              </View>
              <Text style={styles.goalProgress}>
                {quranGoals.pagesRead} / {quranGoals.pagesToRead}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${(quranGoals.pagesRead / quranGoals.pagesToRead) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <View style={styles.goalButtons}>
              <TouchableOpacity
                style={[styles.goalButton, styles.goalButtonSecondary]}
                onPress={() => updateQuranProgress('pagesRead', false)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="minus"
                  android_material_icon_name="remove"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goalButton, { backgroundColor: colors.accent }]}
                onPress={() => updateQuranProgress('pagesRead', true)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color={colors.card}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tasbih Counter Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={colors.gradientInfo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="back-hand"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Tasbih Counter</Text>
          </View>
          
          <LinearGradient
            colors={colors.gradientInfo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tasbihCard}
          >
            <View style={styles.tasbihHeader}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={24}
                color={colors.card}
              />
              <Text style={styles.tasbihTitle}>Daily Dhikr</Text>
            </View>
            <Text style={styles.tasbihCount}>{dhikrGoals.currentCount}</Text>
            <Text style={styles.tasbihTarget}>Goal: {dhikrGoals.dailyTarget}</Text>
            
            <View style={styles.tasbihProgressContainer}>
              <View style={styles.tasbihProgressBackground}>
                <View
                  style={[
                    styles.tasbihProgressFill,
                    { width: `${Math.min((dhikrGoals.currentCount / dhikrGoals.dailyTarget) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.tasbihProgressText}>
                {Math.round((dhikrGoals.currentCount / dhikrGoals.dailyTarget) * 100)}% Complete
              </Text>
            </View>

            <View style={styles.tasbihButtons}>
              <TouchableOpacity
                style={styles.tasbihResetButton}
                onPress={resetDhikr}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color={colors.card}
                />
                <Text style={styles.tasbihResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tasbihIncrementButton}
                onPress={incrementDhikr}
                activeOpacity={0.7}
                disabled={dhikrGoals.currentCount >= dhikrGoals.dailyTarget}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={40}
                  color={colors.card}
                />
                <Text style={styles.tasbihIncrementText}>Count</Text>
              </TouchableOpacity>
            </View>
            
            {dhikrGoals.currentCount >= dhikrGoals.dailyTarget && (
              <View style={styles.completionBadge}>
                <IconSymbol
                  ios_icon_name="checkmark.seal.fill"
                  android_material_icon_name="verified"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.completionText}>Goal Completed! 🎉</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Goals Settings Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Daily Goals</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
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

            <ScrollView style={styles.modalScroll}>
              {/* Quran Goals */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <IconSymbol
                    ios_icon_name="book.fill"
                    android_material_icon_name="book"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.modalSectionTitle}>Quran Goals</Text>
                </View>
                
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Verses to Memorize</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempQuranGoals.versesToMemorize.toString()}
                    onChangeText={(text) => setTempQuranGoals({
                      ...tempQuranGoals,
                      versesToMemorize: parseInt(text) || 0,
                    })}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Pages to Read</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempQuranGoals.pagesToRead.toString()}
                    onChangeText={(text) => setTempQuranGoals({
                      ...tempQuranGoals,
                      pagesToRead: parseInt(text) || 0,
                    })}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Dhikr Goal */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <IconSymbol
                    ios_icon_name="hand.raised.fill"
                    android_material_icon_name="back-hand"
                    size={20}
                    color={colors.info}
                  />
                  <Text style={styles.modalSectionTitle}>Dhikr Goal</Text>
                </View>
                
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Daily Target</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempDhikrTarget}
                    onChangeText={setTempDhikrTarget}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={saveGoals}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  header: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  nestedRingsContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  ringsWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 340,
    height: 340,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -75 }],
    width: 100,
  },
  badgeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  centerTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  centerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  centerPercentage: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 44,
    marginBottom: spacing.xs,
  },
  badgeLabelContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  badgeLabel: {
    ...typography.small,
    color: colors.card,
    fontWeight: '700',
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  insightText: {
    ...typography.bodyBold,
    flex: 1,
  },
  motivationalContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  motivationalText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ringLabelsContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  ringLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  ringLabelDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  ringLabelContent: {
    flex: 1,
  },
  ringLabelText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  ringLabelProgress: {
    ...typography.small,
    color: colors.textSecondary,
  },
  ringLabelPercentage: {
    paddingHorizontal: spacing.sm,
  },
  ringLabelPercentText: {
    ...typography.captionBold,
    fontSize: 16,
  },
  streakContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  streakText: {
    ...typography.h4,
    color: colors.card,
    fontWeight: '700',
  },
  streakSubtext: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
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
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  goalProgress: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  goalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  goalButtonSecondary: {
    backgroundColor: colors.highlight,
  },
  tasbihCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.colored,
  },
  tasbihHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tasbihTitle: {
    ...typography.h4,
    color: colors.card,
  },
  tasbihCount: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.card,
    marginBottom: spacing.xs,
    lineHeight: 80,
  },
  tasbihTarget: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  tasbihProgressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  tasbihProgressBackground: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  tasbihProgressFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  tasbihProgressText: {
    ...typography.caption,
    color: colors.card,
    textAlign: 'center',
    fontWeight: '600',
  },
  tasbihButtons: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  tasbihResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
  },
  tasbihResetText: {
    ...typography.body,
    color: colors.card,
    fontWeight: '600',
  },
  tasbihIncrementButton: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
  },
  tasbihIncrementText: {
    ...typography.body,
    color: colors.card,
    fontWeight: '700',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.md,
  },
  completionText: {
    ...typography.bodyBold,
    color: colors.success,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginBottom: spacing.xl,
  },
  modalSection: {
    marginBottom: spacing.xl,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalInputGroup: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  modalButtonCancel: {
    backgroundColor: colors.highlight,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  modalButtonTextConfirm: {
    color: colors.card,
  },
});
