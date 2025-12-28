
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { supabase } from "@/lib/supabase";

export default function SleepTrackerScreen() {
  const { user } = useAuth();
  const { amanahGoals, updateAmanahGoals, refreshData } = useImanTracker();
  const [refreshing, setRefreshing] = useState(false);
  const [todaySleepHours, setTodaySleepHours] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempGoal, setTempGoal] = useState('7');
  const [customHours, setCustomHours] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Animation values
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const glowAnim = useMemo(() => new Animated.Value(0), []);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    loadData();
    
    // Animations
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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, glowAnim, rotateAnim]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load today's sleep
      const today = new Date().toISOString().split('T')[0];
      const { data: sleepData } = await supabase
        .from('sleep_tracking')
        .select('sleep_hours')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
      
      const hours = sleepData?.sleep_hours ? parseFloat(sleepData.sleep_hours) : 0;
      setTodaySleepHours(hours);
    } catch (error) {
      console.error('Error loading sleep data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const logSleep = async (hours: number) => {
    if (!user || hours <= 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('sleep_tracking')
      .upsert({
        user_id: user.id,
        sleep_hours: hours,
        date: today,
      });

    if (!error) {
      setTodaySleepHours(hours);
      await updateGoalsProgress(hours);
      await refreshData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show completion modal if goal reached
      if (amanahGoals && hours >= amanahGoals.dailySleepGoal && todaySleepHours < amanahGoals.dailySleepGoal) {
        setShowCompletionModal(true);
      }
    }
  };

  const logCustomSleep = async () => {
    const hours = parseFloat(customHours);
    
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Alert.alert('Error', 'Please enter a valid number of hours (0-24).');
      return;
    }
    
    await logSleep(hours);
    setShowCustomModal(false);
    setCustomHours('');
    Alert.alert('Success', `Logged ${hours} hours of sleep!`);
  };

  const updateGoalsProgress = async (hours: number) => {
    if (!user || !amanahGoals) return;

    console.log('😴 Updating Iman Tracker with sleep progress:', hours, 'hours');
    
    await updateAmanahGoals({
      ...amanahGoals,
      dailySleepCompleted: hours,
    });
  };

  const updateGoal = async () => {
    if (!user || !amanahGoals) return;
    
    const newGoal = parseFloat(tempGoal) || 7;
    
    if (newGoal < 1 || newGoal > 12) {
      Alert.alert('Error', 'Please enter a goal between 1 and 12 hours.');
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await updateAmanahGoals({
      ...amanahGoals,
      dailySleepGoal: newGoal,
    });
    
    setShowGoalsModal(false);
    Alert.alert('Success', 'Your sleep goal has been updated!');
  };

  // Ring configuration
  const centerX = 200;
  const centerY = 200;
  const radius = 150;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  const goal = amanahGoals?.dailySleepGoal || 7;
  const completed = todaySleepHours;
  const progress = Math.min(1, completed / goal);
  const offset = circumference * (1 - progress);
  
  const ringColor = '#6366F1'; // Indigo for sleep
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "Masha'Allah! Well rested! 🌟";
    if (percentage >= 80) return "Great sleep! Almost there! 💤";
    if (percentage >= 60) return "Good rest! Keep it up! ✨";
    if (percentage >= 40) return "Getting there! 🌙";
    if (percentage >= 20) return "Need more rest! 😴";
    return "Prioritize your sleep! 🌛";
  };

  const getSleepQuality = (hours: number) => {
    if (hours >= 7 && hours <= 9) return { label: 'Optimal', color: colors.success };
    if (hours >= 6 && hours < 7) return { label: 'Good', color: colors.info };
    if (hours >= 5 && hours < 6) return { label: 'Fair', color: colors.warning };
    if (hours > 0) return { label: 'Poor', color: colors.error };
    return { label: 'Not Logged', color: colors.textSecondary };
  };

  const percentage = Math.round(progress * 100);
  const quality = getSleepQuality(completed);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep Tracker</Text>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTempGoal(goal.toString());
            setShowGoalsModal(true);
          }}
          style={styles.settingsButton}
        >
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Ring Display */}
        <LinearGradient
          colors={['#FFFFFF', '#F5F7FA', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ringContainer}
        >
          <View style={styles.ringsWrapper}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={400} height={400}>
                <Defs>
                  <SvgRadialGradient id="glow" cx="50%" cy="50%">
                    <Stop offset="0%" stopColor={ringColor} stopOpacity="0.3" />
                    <Stop offset="100%" stopColor={ringColor} stopOpacity="0" />
                  </SvgRadialGradient>
                </Defs>
                
                <Animated.View style={{ opacity: glowOpacity }}>
                  <Circle
                    cx={centerX}
                    cy={centerY}
                    r={180}
                    fill="url(#glow)"
                  />
                </Animated.View>
                
                {/* Background ring */}
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke="#E5E7EB"
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={0.3}
                />
                
                {/* Progress ring */}
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${centerX}, ${centerY}`}
                />
              </Svg>
            </Animated.View>
            
            <TouchableOpacity 
              style={styles.centerContentWrapper}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Animated.View 
                style={[
                  styles.centerContent,
                  {
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <IconSymbol
                  ios_icon_name="moon.stars.fill"
                  android_material_icon_name="bedtime"
                  size={48}
                  color={ringColor}
                />
                <Text style={styles.centerTitle}>Sleep</Text>
                <Text style={[styles.centerPercentage, { color: ringColor }]}>{percentage}%</Text>
                <Text style={styles.centerSubtitle}>{completed.toFixed(1)} / {goal} hrs</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Motivational Message */}
          <View style={styles.motivationalContainer}>
            <Text style={styles.motivationalText}>
              {getMotivationalMessage(percentage)}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="moon.fill"
                android_material_icon_name="bedtime"
                size={24}
                color={ringColor}
              />
              <Text style={styles.statValue}>{completed.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Hours Slept</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="target"
                android_material_icon_name="flag"
                size={24}
                color={ringColor}
              />
              <Text style={styles.statValue}>{goal}</Text>
              <Text style={styles.statLabel}>Daily Goal</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={24}
                color={quality.color}
              />
              <Text style={[styles.statValue, { color: quality.color }]}>{quality.label}</Text>
              <Text style={styles.statLabel}>Sleep Quality</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => logSleep(6)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="moon.fill"
                  android_material_icon_name="bedtime"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>6 hrs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => logSleep(7)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="moon.fill"
                  android_material_icon_name="bedtime"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>7 hrs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => logSleep(8)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <IconSymbol
                  ios_icon_name="moon.fill"
                  android_material_icon_name="bedtime"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.quickActionText}>8 hrs</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.customSleepButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCustomModal(true);
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradientSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.customSleepGradient}
            >
              <IconSymbol
                ios_icon_name="pencil.circle.fill"
                android_material_icon_name="edit"
                size={24}
                color={colors.card}
              />
              <Text style={styles.customSleepText}>Log Custom Hours</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sleep Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Sleep Tips</Text>
          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={24}
              color={colors.warning}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Optimal Sleep Duration</Text>
              <Text style={styles.tipText}>
                Adults need 7-9 hours of sleep per night for optimal health and well-being.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={colors.info}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Consistent Schedule</Text>
              <Text style={styles.tipText}>
                Try to go to bed and wake up at the same time every day, even on weekends.
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="moon.stars.fill"
              android_material_icon_name="nights-stay"
              size={24}
              color={ringColor}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Islamic Perspective</Text>
              <Text style={styles.tipText}>
                The Prophet (ﷺ) encouraged sleeping early after Isha and waking for Fajr.
              </Text>
            </View>
          </View>
        </View>

        {/* Connection to Iman Tracker */}
        <TouchableOpacity
          style={styles.imanTrackerCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/(iman)' as any);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradientOcean}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imanTrackerGradient}
          >
            <View style={styles.imanTrackerContent}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={32}
                color={colors.card}
              />
              <View style={styles.imanTrackerTextContainer}>
                <Text style={styles.imanTrackerTitle}>Connected to Iman Tracker</Text>
                <Text style={styles.imanTrackerSubtitle}>
                  Your sleep contributes to the Amanah ring
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="arrow.right.circle.fill"
                android_material_icon_name="arrow-forward"
                size={28}
                color={colors.card}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Islamic Reminder */}
        <View style={styles.reminderCard}>
          <LinearGradient
            colors={colors.gradientTeal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.reminderGradient}
          >
            <IconSymbol
              ios_icon_name="quote.opening"
              android_material_icon_name="format-quote"
              size={28}
              color={colors.card}
            />
            <Text style={styles.reminderText}>
              &quot;Sleep is the brother of death.&quot;
            </Text>
            <Text style={styles.reminderSource}>Prophet Muhammad (ﷺ)</Text>
            <Text style={styles.reminderNote}>
              Rest well to worship better
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Goals Modal */}
      <Modal
        visible={showGoalsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalsModalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many hours of sleep per night?
            </Text>
            
            <TextInput
              style={styles.goalInput}
              value={tempGoal}
              onChangeText={setTempGoal}
              keyboardType="decimal-pad"
              placeholder="7"
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={styles.modalHint}>Recommended: 7-9 hours</Text>
            
            <View style={styles.goalsModalButtons}>
              <TouchableOpacity
                style={styles.goalsModalButton}
                onPress={() => setShowGoalsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.goalsModalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goalsModalButtonPrimary}
                onPress={updateGoal}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.goalsModalButtonGradient}
                >
                  <Text style={styles.goalsModalButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Sleep Modal */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalsModalContent}>
            <Text style={styles.modalTitle}>Log Sleep Hours</Text>
            <Text style={styles.modalSubtitle}>
              How many hours did you sleep?
            </Text>
            
            <TextInput
              style={styles.goalInput}
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="decimal-pad"
              placeholder="7.5"
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={styles.modalHint}>Enter hours (e.g., 7.5 for 7 hours 30 minutes)</Text>
            
            <View style={styles.goalsModalButtons}>
              <TouchableOpacity
                style={styles.goalsModalButton}
                onPress={() => {
                  setShowCustomModal(false);
                  setCustomHours('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.goalsModalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goalsModalButtonPrimary}
                onPress={logCustomSleep}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={colors.gradientSecondary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.goalsModalButtonGradient}
                >
                  <Text style={styles.goalsModalButtonText}>Log Sleep</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModalContent}>
            <LinearGradient
              colors={colors.gradientSuccess}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.completionGradient}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.card}
              />
              <Text style={styles.completionTitle}>Goal Achieved!</Text>
              <Text style={styles.completionMessage}>
                Masha&apos;Allah! You&apos;ve met your sleep goal. Your progress has been updated in the Iman Tracker.
              </Text>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => setShowCompletionModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.completionButtonText}>Continue</Text>
              </TouchableOpacity>
            </LinearGradient>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  ringContainer: {
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
    width: 400,
    height: 400,
  },
  centerContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  centerPercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 64,
    marginTop: spacing.xs,
  },
  centerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  quickActionText: {
    ...typography.bodyBold,
    color: colors.card,
    marginTop: spacing.sm,
  },
  customSleepButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  customSleepGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  customSleepText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  tipsSection: {
    marginBottom: spacing.xxl,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  imanTrackerCard: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  imanTrackerGradient: {
    padding: spacing.lg,
  },
  imanTrackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  imanTrackerTextContainer: {
    flex: 1,
  },
  imanTrackerTitle: {
    ...typography.bodyBold,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  imanTrackerSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  reminderCard: {
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  reminderGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  reminderText: {
    ...typography.h4,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  reminderSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  reminderNote: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.85,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsModalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginHorizontal: spacing.xl,
    width: '85%',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  goalInput: {
    ...typography.h1,
    color: colors.text,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  goalsModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalsModalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.highlight,
  },
  goalsModalButtonTextCancel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  goalsModalButtonPrimary: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  goalsModalButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  goalsModalButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  completionModalContent: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  completionGradient: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  completionTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  completionMessage: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  completionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
  },
  completionButtonText: {
    ...typography.h4,
    color: colors.card,
  },
});
