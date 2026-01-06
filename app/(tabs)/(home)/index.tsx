
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from 'react-native-svg';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { router } from "expo-router";
import { 
  getTodayPrayerTimes,
  getNextPrayer, 
  getTimeUntilNextPrayer, 
  PrayerTime,
  DailyPrayerTimes,
} from "@/services/PrayerTimeService";
import { 
  getCurrentLocation,
  UserLocation,
  requestLocationPermission,
} from "@/services/LocationService";
import { schedulePrayerNotifications } from "@/services/PrayerNotificationService";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { 
    prayerGoals, 
    sectionScores, 
    overallScore,
    refreshData,
    updatePrayerGoals,
  } = useImanTracker();
  const { settings, refreshPrayerTimesAndNotifications, requestPermissions, scheduledCount } = useNotifications();

  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{
    location: UserLocation | null;
    locationName: string | null;
    accuracy: number | null;
    source: string;
    confidence: number;
  }>({
    location: null,
    locationName: null,
    accuracy: null,
    source: 'Calculating...',
    confidence: 0,
  });

  // Load prayer times
  const loadPrayerTimes = async () => {
    try {
      setPrayerTimesLoading(true);
      console.log('🕌 HomeScreen: Loading prayer times...');
      
      // Get location
      const location = await getCurrentLocation(true);
      console.log('📍 Location obtained:', location.city);
      
      // Get prayer times
      const prayerTimesData = await getTodayPrayerTimes(
        location,
        user?.id,
        'NorthAmerica',
        true
      );
      
      console.log('✅ HomeScreen: Prayer times loaded:', prayerTimesData.prayers.length, 'prayers');
      
      // Set location info
      setLocationInfo({
        location,
        locationName: location.city,
        accuracy: location.accuracy || null,
        source: 'GPS',
        confidence: 95,
      });
      
      // Sync with prayer goals from context
      if (prayerGoals) {
        const updatedPrayers = prayerTimesData.prayers.map((prayer) => {
          const prayerKey = prayer.name.toLowerCase() as keyof typeof prayerGoals.fardPrayers;
          return {
            ...prayer,
            completed: prayerGoals.fardPrayers[prayerKey] || false,
          };
        });
        setPrayers(updatedPrayers);
      } else {
        setPrayers(prayerTimesData.prayers);
      }

      // Get next prayer
      const next = getNextPrayer(prayerTimesData);
      setNextPrayer(next);
      
      if (next) {
        setTimeUntilNext(getTimeUntilNextPrayer(next));
      }
      
      // Schedule notifications if permissions are granted
      if (settings.notificationPermissionGranted && settings.locationPermissionGranted && settings.prayerNotifications) {
        console.log('🔔 Scheduling prayer notifications from home screen...');
        await schedulePrayerNotifications(prayerTimesData);
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error loading prayer times:', error);
      Alert.alert(
        'Prayer Times',
        'Unable to calculate prayer times. Please enable location permissions for accurate times.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable Location', 
            onPress: async () => {
              await requestPermissions();
              await loadPrayerTimes();
            }
          }
        ]
      );
    } finally {
      setPrayerTimesLoading(false);
    }
  };

  // Load prayer times on mount
  useEffect(() => {
    loadPrayerTimes();
  }, []);

  // Sync prayers with prayerGoals from context
  useEffect(() => {
    if (prayerGoals && prayers.length > 0) {
      const updatedPrayers = prayers.map((prayer) => {
        const prayerKey = prayer.name.toLowerCase() as keyof typeof prayerGoals.fardPrayers;
        return {
          ...prayer,
          completed: prayerGoals.fardPrayers[prayerKey] || false,
        };
      });
      setPrayers(updatedPrayers);
    }
  }, [prayerGoals]);

  // Update time until next prayer every minute
  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilNextPrayer(nextPrayer));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextPrayer]);

  // Load daily content
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
    await Promise.all([
      refreshData(), 
      loadDailyContent(), 
      loadPrayerTimes(),
      refreshPrayerTimesAndNotifications()
    ]);
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
            <Text style={styles.ringsCenterPercentage}>{overallScore}%</Text>
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

  // Get confidence color based on score
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return colors.success;
    if (confidence >= 60) return colors.warning;
    return colors.error;
  };

  // Format location for display
  const formatLocation = (location: UserLocation) => {
    return `${location.city}, ${location.country}`;
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
        {/* Header with Gradient */}
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

        {/* Next Prayer Card */}
        {nextPrayer && !prayerTimesLoading && (
          <View style={styles.nextPrayerCard}>
            <View style={styles.nextPrayerHeader}>
              <View style={styles.nextPrayerIconContainer}>
                <IconSymbol
                  ios_icon_name="bell.fill"
                  android_material_icon_name="notifications-active"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push('/(tabs)/profile/prayer-settings')}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="gear"
                  android_material_icon_name="settings"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.nextPrayerContent}>
              <View style={styles.nextPrayerInfo}>
                <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
                <Text style={styles.nextPrayerArabic}>{nextPrayer.arabicName}</Text>
              </View>
              <View style={styles.nextPrayerTimeContainer}>
                <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
                {timeUntilNext && timeUntilNext !== '0m' && (
                  <Text style={styles.nextPrayerCountdown}>in {timeUntilNext}</Text>
                )}
              </View>
            </View>
            
            {/* Enhanced Location Info with Confidence Score */}
            {locationInfo.location && (
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.locationText}>
                    {locationInfo.locationName || formatLocation(locationInfo.location)}
                  </Text>
                  {locationInfo.accuracy && locationInfo.accuracy < 100 && (
                    <View style={styles.accuracyBadge}>
                      <Text style={styles.accuracyText}>
                        ±{Math.round(locationInfo.accuracy)}m
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.sourceRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.seal.fill"
                    android_material_icon_name="verified"
                    size={12}
                    color={getConfidenceColor(locationInfo.confidence)}
                  />
                  <Text style={[styles.sourceText, { color: getConfidenceColor(locationInfo.confidence) }]}>
                    {locationInfo.source}
                  </Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(locationInfo.confidence) + '20' }]}>
                    <Text style={[styles.confidenceText, { color: getConfidenceColor(locationInfo.confidence) }]}>
                      {locationInfo.confidence.toFixed(0)}% confidence
                    </Text>
                  </View>
                </View>
                
                {/* Notification Status */}
                {settings.notificationPermissionGranted && settings.prayerNotifications && (
                  <View style={styles.notificationStatus}>
                    <IconSymbol
                      ios_icon_name="bell.badge.fill"
                      android_material_icon_name="notifications-active"
                      size={12}
                      color={colors.success}
                    />
                    <Text style={[styles.notificationStatusText, { color: colors.success }]}>
                      {scheduledCount} prayer notifications scheduled
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {!settings.locationPermissionGranted && (
              <TouchableOpacity 
                style={styles.locationWarning}
                onPress={async () => {
                  await requestPermissions();
                  await loadPrayerTimes();
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={14}
                  color={colors.warning}
                />
                <Text style={styles.locationWarningText}>
                  Tap to enable location for accurate prayer times
                </Text>
              </TouchableOpacity>
            )}
            
            {!settings.notificationPermissionGranted && settings.locationPermissionGranted && (
              <TouchableOpacity 
                style={styles.locationWarning}
                onPress={async () => {
                  await requestPermissions();
                  await loadPrayerTimes();
                }}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="bell.slash.fill"
                  android_material_icon_name="notifications-off"
                  size={14}
                  color={colors.warning}
                />
                <Text style={styles.locationWarningText}>
                  Tap to enable notifications for prayer reminders
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Daily Quran Verse Section */}
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
        
        {/* Prayer Tracker Section */}
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

          {/* Prayer List */}
          {prayerTimesLoading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Calculating prayer times with advanced algorithms...</Text>
            </View>
          ) : (
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
          )}
        </View>

        {/* Daily Hadith Section */}
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
  nextPrayerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextPrayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    flex: 1,
  },
  settingsButton: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },
  nextPrayerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPrayerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextPrayerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerInfo: {
    flex: 1,
  },
  nextPrayerName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nextPrayerArabic: {
    ...typography.body,
    color: colors.textSecondary,
  },
  nextPrayerTimeContainer: {
    alignItems: 'flex-end',
  },
  nextPrayerTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  nextPrayerCountdown: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    ...typography.small,
    color: colors.primary,
    flex: 1,
    fontWeight: '500',
  },
  accuracyBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  accuracyText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceText: {
    ...typography.small,
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  notificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  notificationStatusText: {
    ...typography.small,
    fontWeight: '500',
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  locationWarningText: {
    ...typography.small,
    color: colors.warning,
    flex: 1,
  },
});
