
import { 
  getCurrentLocation,
  UserLocation,
  requestLocationPermission,
} from "@/services/LocationService";
import React, { useState, useEffect } from "react";
import { IconSymbol } from "@/components/IconSymbol";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Svg, { Circle } from 'react-native-svg';
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { 
  getTodayPrayerTimes,
  getNextPrayer, 
  getTimeUntilNextPrayer, 
  PrayerTime,
  DailyPrayerTimes,
} from "@/services/PrayerTimeService";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { schedulePrayerNotifications } from "@/services/PrayerNotificationService";

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

interface CachedPrayerData {
  location: UserLocation;
  source: string;
  confidence: number;
}

const PRAYER_CACHE_KEY = '@prayer_times_cache';

export default function HomeScreen() {
  const { user } = useAuth();
  const { imanScore, sectionScores, refreshImanScore } = useImanTracker();
  
  const [prayerTimes, setPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{ location: UserLocation; source: string; confidence: number } | null>(null);
  const [prayerGoals, setPrayerGoals] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    loadDailyContent();
    loadPrayerTimes();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const loadPrayerProgress = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('prayer_tracking')
            .select('fajr_completed, dhuhr_completed, asr_completed, maghrib_completed, isha_completed')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

          if (data) {
            setPrayerGoals([
              data.fajr_completed || false,
              data.dhuhr_completed || false,
              data.asr_completed || false,
              data.maghrib_completed || false,
              data.isha_completed || false,
            ]);
          }
        } catch (error) {
          console.log('Error loading prayer progress:', error);
        }
      };

      loadPrayerProgress();
    }
  }, [user]);

  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      const timeString = getTimeUntilNextPrayer(nextPrayer.time);
      setTimeUntilNext(timeString);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer]);

  const loadPrayerTimes = async () => {
    try {
      console.log('Loading prayer times...');
      
      // Request location permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to get accurate prayer times.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await getCurrentLocation();
      console.log('Got location:', location);

      // Get prayer times for today
      const times = await getTodayPrayerTimes(location);
      console.log('Got prayer times:', times);
      
      setPrayerTimes(times);

      // Cache the data
      const cacheData: CachedPrayerData = {
        location,
        source: 'gps',
        confidence: 100,
      };
      await AsyncStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(cacheData));
      setLocationInfo(cacheData);

      // Get next prayer
      const next = getNextPrayer(times);
      console.log('Next prayer:', next);
      setNextPrayer(next);

      // Schedule notifications
      await schedulePrayerNotifications(times, location);
      console.log('Scheduled prayer notifications');

    } catch (error) {
      console.error('Error loading prayer times:', error);
      Alert.alert('Error', 'Failed to load prayer times. Please try again.');
    }
  };

  const loadDailyContent = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load daily verse
      const { data: verseData, error: verseError } = await supabase
        .from('daily_verses')
        .select('*')
        .eq('date', today)
        .single();

      if (verseData) {
        setDailyVerse(verseData);
      }

      // Load daily hadith
      const { data: hadithData, error: hadithError } = await supabase
        .from('daily_hadiths')
        .select('*')
        .eq('date', today)
        .single();

      if (hadithData) {
        setDailyHadith(hadithData);
      }
    } catch (error) {
      console.log('Error loading daily content:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadPrayerTimes(),
      loadDailyContent(),
      refreshImanScore(),
    ]);
    setRefreshing(false);
  };

  const togglePrayer = async (index: number) => {
    if (!user?.id) return;

    const newPrayerGoals = [...prayerGoals];
    newPrayerGoals[index] = !newPrayerGoals[index];
    setPrayerGoals(newPrayerGoals);

    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: existing } = await supabase
        .from('prayer_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const updateData = {
        [`${prayerNames[index]}_completed`]: newPrayerGoals[index],
      };

      if (existing) {
        await supabase
          .from('prayer_tracking')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('prayer_tracking')
          .insert({
            user_id: user.id,
            date: today,
            ...updateData,
          });
      }

      // Refresh Iman score after updating prayer
      await refreshImanScore();
    } catch (error) {
      console.log('Error updating prayer:', error);
    }
  };

  const renderProgressCircle = () => {
    const completedPrayers = prayerGoals.filter(Boolean).length;
    const progress = completedPrayers / 5;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={styles.progressCircleContainer}>
        <Svg width={120} height={120}>
          <Circle
            cx={60}
            cy={60}
            r={45}
            stroke={colors.border}
            strokeWidth={8}
            fill="none"
          />
          <Circle
            cx={60}
            cy={60}
            r={45}
            stroke={colors.primary}
            strokeWidth={8}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin="60, 60"
          />
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressNumber}>{completedPrayers}/5</Text>
          <Text style={styles.progressLabel}>Prayers</Text>
        </View>
      </View>
    );
  };

  const renderImanRings = () => {
    const ibadahProgress = sectionScores.ibadah / 100;
    const ilmProgress = sectionScores.ilm / 100;
    const amanahProgress = sectionScores.amanah / 100;

    const ringSize = 140;
    const strokeWidth = 12;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const createRing = (progress: number, color: string, offset: number) => {
      const strokeDashoffset = circumference * (1 - progress);
      return (
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius - offset}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${ringSize / 2}, ${ringSize / 2}`}
        />
      );
    };

    return (
      <View style={styles.imanRingsContainer}>
        <Svg width={ringSize} height={ringSize}>
          {createRing(ibadahProgress, colors.primary, 0)}
          {createRing(ilmProgress, colors.secondary, 16)}
          {createRing(amanahProgress, colors.accent, 32)}
        </Svg>
        <View style={styles.imanScoreContainer}>
          <Text style={styles.imanScoreNumber}>{Math.round(imanScore)}</Text>
          <Text style={styles.imanScoreLabel}>Iman Score</Text>
        </View>
      </View>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return colors.success;
    if (confidence >= 70) return colors.warning;
    return colors.error;
  };

  const formatLocation = (location: UserLocation) => {
    return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>As-salamu alaykum</Text>
          <Text style={styles.username}>{user?.email?.split('@')[0] || 'User'}</Text>
        </View>

        {/* Iman Tracker Rings */}
        <TouchableOpacity
          style={styles.imanCard}
          onPress={() => router.push('/(tabs)/(iman)')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.cardBackground, colors.cardBackgroundAlt]}
            style={styles.imanCardGradient}
          >
            {renderImanRings()}
            <View style={styles.imanLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Ibadah {Math.round(sectionScores.ibadah)}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.legendText}>Ilm {Math.round(sectionScores.ilm)}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.legendText}>Amanah {Math.round(sectionScores.amanah)}%</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Prayer Times Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Prayer Times</Text>
          </View>

          {nextPrayer && (
            <View style={styles.nextPrayerContainer}>
              <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
              <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
              <Text style={styles.nextPrayerTime}>
                {nextPrayer.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Text style={styles.timeUntilNext}>{timeUntilNext}</Text>
            </View>
          )}

          {prayerTimes && (
            <View style={styles.prayerList}>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer, index) => {
                const prayerKey = prayer.toLowerCase() as keyof DailyPrayerTimes;
                const time = prayerTimes[prayerKey];
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.prayerItem}
                    onPress={() => togglePrayer(index)}
                  >
                    <View style={styles.prayerInfo}>
                      <Text style={styles.prayerName}>{prayer}</Text>
                      <Text style={styles.prayerTime}>
                        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, prayerGoals[index] && styles.checkboxChecked]}>
                      {prayerGoals[index] && (
                        <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {locationInfo && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>
                Location: {formatLocation(locationInfo.location)}
              </Text>
              <Text style={[styles.confidenceLabel, { color: getConfidenceColor(locationInfo.confidence) }]}>
                {locationInfo.source.toUpperCase()} • {locationInfo.confidence}% confidence
              </Text>
            </View>
          )}

          {renderProgressCircle()}
        </View>

        {/* Daily Verse */}
        {dailyVerse && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol ios_icon_name="book.fill" android_material_icon_name="menu-book" size={24} color={colors.secondary} />
              <Text style={styles.cardTitle}>Daily Verse</Text>
            </View>
            <Text style={styles.arabicText}>{dailyVerse.arabic_text}</Text>
            <Text style={styles.translationText}>{dailyVerse.translation}</Text>
            <Text style={styles.referenceText}>{dailyVerse.reference}</Text>
          </View>
        )}

        {/* Daily Hadith */}
        {dailyHadith && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol ios_icon_name="text.book.closed.fill" android_material_icon_name="description" size={24} color={colors.accent} />
              <Text style={styles.cardTitle}>Daily Hadith</Text>
            </View>
            {dailyHadith.arabic_text && (
              <Text style={styles.arabicText}>{dailyHadith.arabic_text}</Text>
            )}
            <Text style={styles.translationText}>{dailyHadith.translation}</Text>
            <Text style={styles.referenceText}>{dailyHadith.source}</Text>
          </View>
        )}
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
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  username: {
    ...typography.h1,
    color: colors.text,
  },
  imanCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imanCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  imanRingsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  imanScoreContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imanScoreNumber: {
    ...typography.h1,
    fontSize: 36,
    color: colors.text,
    fontWeight: 'bold',
  },
  imanScoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  imanLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  nextPrayerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  nextPrayerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nextPrayerName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nextPrayerTime: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  timeUntilNext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  prayerList: {
    marginBottom: spacing.md,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  prayerTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  confidenceLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  arabicText: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  translationText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  referenceText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
