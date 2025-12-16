
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import ImanRingsDisplay from "@/components/iman/ImanRingsDisplay";
import QuickStatsCards from "@/components/iman/QuickStatsCards";
import SunnahPrayerTracker from "@/components/iman/SunnahPrayerTracker";
import CharityTracker from "@/components/iman/CharityTracker";
import FastingTracker from "@/components/iman/FastingTracker";
import DailyDuaTracker from "@/components/iman/DailyDuaTracker";
import ChallengesSection from "@/components/iman/ChallengesSection";
import AchievementsBadges from "@/components/iman/AchievementsBadges";

interface PrayerProgress {
  completed: number;
  total: number;
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

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export default function ImanTrackerScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [prayerProgress, setPrayerProgress] = useState<PrayerProgress>({
    completed: 0,
    total: 5,
  });
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
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
  });

  const loadData = useCallback(async () => {
    try {
      const lastDate = await AsyncStorage.getItem('lastImanDate');
      const today = new Date().toDateString();
      
      if (lastDate !== today) {
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
  }, []);

  const loadPrayerProgress = useCallback(async () => {
    try {
      const savedPrayerProgress = await AsyncStorage.getItem('prayerProgress');
      if (savedPrayerProgress) {
        setPrayerProgress(JSON.parse(savedPrayerProgress));
      } else {
        const savedPrayerData = await AsyncStorage.getItem('prayerData');
        if (savedPrayerData) {
          const prayers = JSON.parse(savedPrayerData);
          const completed = prayers.filter((p: any) => p.completed).length;
          setPrayerProgress({ completed, total: 5 });
        }
      }
    } catch (error) {
      console.log('Error loading prayer progress:', error);
    }
  }, []);

  const loadStreakData = useCallback(async () => {
    try {
      const savedStreak = await AsyncStorage.getItem('imanStreak');
      if (savedStreak) {
        setStreakData(JSON.parse(savedStreak));
      }
    } catch (error) {
      console.log('Error loading streak data:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadData(),
      loadPrayerProgress(),
      loadStreakData(),
    ]);
    setRefreshing(false);
  }, [loadData, loadPrayerProgress, loadStreakData]);

  useEffect(() => {
    loadData();
    loadPrayerProgress();
    loadStreakData();
  }, [loadData, loadPrayerProgress, loadStreakData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadPrayerProgress();
    }, 1000);
    return () => clearInterval(interval);
  }, [loadPrayerProgress]);

  const prayerProgressValue = prayerProgress.completed / prayerProgress.total;
  const quranProgressValue = ((quranGoals.versesMemorized / quranGoals.versesToMemorize) + 
                        (quranGoals.pagesRead / quranGoals.pagesToRead)) / 2;
  const dhikrProgressValue = dhikrGoals.currentCount / dhikrGoals.dailyTarget;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.header}>Iman Tracker</Text>
            <Text style={styles.subtitle}>Your spiritual journey dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/modal');
            }}
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

        <ImanRingsDisplay
          prayerProgress={prayerProgressValue}
          quranProgress={quranProgressValue}
          dhikrProgress={dhikrProgressValue}
          streakData={streakData}
          prayerCompleted={prayerProgress.completed}
          prayerTotal={prayerProgress.total}
          quranCompleted={quranGoals.versesMemorized + quranGoals.pagesRead}
          quranTotal={quranGoals.versesToMemorize + quranGoals.pagesToRead}
          dhikrCompleted={dhikrGoals.currentCount}
          dhikrTotal={dhikrGoals.dailyTarget}
        />

        <QuickStatsCards
          prayerProgress={prayerProgressValue}
          quranProgress={quranProgressValue}
          dhikrProgress={dhikrProgressValue}
          streakData={streakData}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconContainer}
            >
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={20}
                color={colors.card}
              />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/quran-tracker');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="book"
                  size={28}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>Quran</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/dhikr-counter');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="back-hand"
                  size={28}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>Dhikr</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/good-deeds');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.success, '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="heart.fill"
                  android_material_icon_name="favorite"
                  size={28}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>Good Deeds</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(iman)/reflection');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientPurple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={28}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>Reflect</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <SunnahPrayerTracker />
        <CharityTracker />
        <FastingTracker />
        <DailyDuaTracker />
        <ChallengesSection />
        <AchievementsBadges />

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  quickActionText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  bottomPadding: {
    height: 100,
  },
});
