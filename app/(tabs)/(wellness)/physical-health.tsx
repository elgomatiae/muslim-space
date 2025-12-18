
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, RefreshControl } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;

interface PhysicalWellnessGoals {
  daily_steps_goal: number;
  daily_steps_completed: number;
  daily_exercise_minutes_goal: number;
  daily_exercise_minutes_completed: number;
  daily_water_glasses_goal: number;
  daily_water_glasses_completed: number;
  weekly_workout_sessions_goal: number;
  weekly_workout_sessions_completed: number;
}

interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number;
  date: string;
}

interface FitnessChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  duration_days: number;
  current_progress?: number;
  user_challenge_id?: string;
}

export default function PhysicalHealthHubScreen() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PhysicalWellnessGoals | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<FitnessChallenge[]>([]);
  const [waterIntakeToday, setWaterIntakeToday] = useState(0);
  const [todayExerciseMinutes, setTodayExerciseMinutes] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadAllData();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGoals(),
        loadRecentActivities(),
        loadChallenges(),
        loadTodayStats(),
      ]);
    } catch (error) {
      console.error('Error loading physical health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  const loadGoals = async () => {
    if (!user) return;
    
    let { data, error } = await supabase
      .from('physical_wellness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No goals exist, create default
      const { data: newGoals } = await supabase
        .from('physical_wellness_goals')
        .insert({ user_id: user.id })
        .select()
        .single();
      data = newGoals;
    }

    if (data) setGoals(data);
  };

  const loadRecentActivities = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('physical_activities')
      .select('id, activity_type, duration_minutes, date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setRecentActivities(data);
  };

  const loadChallenges = async () => {
    if (!user) return;
    
    // Get all active challenges
    const { data: allChallenges } = await supabase
      .from('fitness_challenges')
      .select('*')
      .eq('is_active', true)
      .limit(6);

    if (!allChallenges) return;

    // Get user's enrolled challenges
    const { data: userChallenges } = await supabase
      .from('user_fitness_challenges')
      .select('id, challenge_id, current_progress, completed')
      .eq('user_id', user.id);

    // Merge data
    const mergedChallenges = allChallenges.map(challenge => {
      const userChallenge = userChallenges?.find(uc => uc.challenge_id === challenge.id);
      return {
        ...challenge,
        current_progress: userChallenge?.current_progress || 0,
        user_challenge_id: userChallenge?.id,
        is_enrolled: !!userChallenge,
        is_completed: userChallenge?.completed || false,
      };
    });

    setChallenges(mergedChallenges);
  };

  const loadTodayStats = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Water intake
    const { data: waterData } = await supabase
      .from('water_intake')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('date', today);
    
    const totalWater = waterData?.reduce((sum, entry) => sum + entry.amount_ml, 0) || 0;
    setWaterIntakeToday(Math.floor(totalWater / 250)); // Convert to glasses

    // Exercise minutes today
    const { data: activityData } = await supabase
      .from('physical_activities')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('date', today);
    
    const totalMinutes = activityData?.reduce((sum, entry) => sum + entry.duration_minutes, 0) || 0;
    setTodayExerciseMinutes(totalMinutes);

    // Weekly workouts (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    const { data: weeklyData } = await supabase
      .from('physical_activities')
      .select('id')
      .eq('user_id', user.id)
      .gte('date', weekAgoStr);
    
    setWeeklyWorkouts(weeklyData?.length || 0);
  };

  const addWaterIntake = async (amount: number) => {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { error } = await supabase
      .from('water_intake')
      .insert({
        user_id: user.id,
        amount_ml: amount,
      });

    if (!error) {
      await loadTodayStats();
      await updateGoalsProgress();
    }
  };

  const addExerciseSession = async (minutes: number, type: string = 'general') => {
    if (!user || minutes <= 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const { error } = await supabase
      .from('physical_activities')
      .insert({
        user_id: user.id,
        activity_type: type,
        duration_minutes: minutes,
      });

    if (!error) {
      await loadRecentActivities();
      await loadTodayStats();
      await updateGoalsProgress();
    }
  };

  const updateGoalsProgress = async () => {
    if (!user || !goals) return;

    const updatedGoals = {
      daily_water_glasses_completed: waterIntakeToday,
      daily_exercise_minutes_completed: todayExerciseMinutes,
      weekly_workout_sessions_completed: weeklyWorkouts,
    };

    await supabase
      .from('physical_wellness_goals')
      .update(updatedGoals)
      .eq('user_id', user.id);

    await loadGoals();
  };

  const enrollInChallenge = async (challengeId: string) => {
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + challenge.duration_days);

    const { error } = await supabase
      .from('user_fitness_challenges')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        end_date: endDate.toISOString().split('T')[0],
      });

    if (!error) {
      await loadChallenges();
    }
  };

  const getActivityIcon = (type: string) => {
    const iconMap: { [key: string]: { ios: string; android: string } } = {
      walking: { ios: 'figure.walk', android: 'directions-walk' },
      running: { ios: 'figure.run', android: 'directions-run' },
      strength: { ios: 'dumbbell.fill', android: 'fitness-center' },
      sports: { ios: 'sportscourt.fill', android: 'sports' },
      yoga: { ios: 'figure.yoga', android: 'self-improvement' },
      general: { ios: 'figure.mixed.cardio', android: 'fitness-center' },
    };
    return iconMap[type] || iconMap.general;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Hero Section with Stats */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradientAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeader}>
            <IconSymbol
              ios_icon_name="figure.run"
              android_material_icon_name="directions-run"
              size={48}
              color={colors.card}
            />
            <Text style={styles.heroTitle}>Physical Wellness</Text>
            <Text style={styles.heroSubtitle}>
              Strengthen your body, strengthen your faith
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayExerciseMinutes}</Text>
              <Text style={styles.statLabel}>Min Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{waterIntakeToday}</Text>
              <Text style={styles.statLabel}>Glasses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyWorkouts}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>

          {/* Quick Access to Iman Tracker */}
          <TouchableOpacity
            style={styles.imanTrackerLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(iman)' as any);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={20}
              color={colors.card}
            />
            <Text style={styles.imanTrackerLinkText}>View in Iman Tracker</Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.card}
            />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Daily Goals Progress */}
      {goals && (
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="target"
              android_material_icon_name="track-changes"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Today&apos;s Goals</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/physical-goals' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Set Goals</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.goalsGrid}>
            {/* Water Goal */}
            <View style={styles.goalCard}>
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalGradient}
              >
                <IconSymbol
                  ios_icon_name="drop.fill"
                  android_material_icon_name="water-drop"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.goalValue}>
                  {waterIntakeToday}/{goals.daily_water_glasses_goal}
                </Text>
                <Text style={styles.goalLabel}>Glasses</Text>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill,
                      { width: `${Math.min(100, (waterIntakeToday / goals.daily_water_glasses_goal) * 100)}%` }
                    ]} 
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Exercise Goal */}
            <View style={styles.goalCard}>
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goalGradient}
              >
                <IconSymbol
                  ios_icon_name="figure.mixed.cardio"
                  android_material_icon_name="fitness-center"
                  size={32}
                  color={colors.card}
                />
                <Text style={styles.goalValue}>
                  {todayExerciseMinutes}/{goals.daily_exercise_minutes_goal}
                </Text>
                <Text style={styles.goalLabel}>Minutes</Text>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill,
                      { width: `${Math.min(100, (todayExerciseMinutes / goals.daily_exercise_minutes_goal) * 100)}%` }
                    ]} 
                  />
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <View style={styles.sectionHeader}>
          <IconSymbol
            ios_icon_name="bolt.fill"
            android_material_icon_name="bolt"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Quick Track</Text>
        </View>

        {/* Water Intake */}
        <View style={styles.quickActionCard}>
          <View style={styles.quickActionHeader}>
            <IconSymbol
              ios_icon_name="drop.fill"
              android_material_icon_name="water-drop"
              size={24}
              color={colors.info}
            />
            <Text style={styles.quickActionTitle}>Water Intake</Text>
          </View>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => addWaterIntake(250)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickButtonGradient}
              >
                <Text style={styles.quickButtonText}>+1 Glass</Text>
                <Text style={styles.quickButtonSubtext}>(250ml)</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => addWaterIntake(500)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientInfo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickButtonGradient}
              >
                <Text style={styles.quickButtonText}>+2 Glasses</Text>
                <Text style={styles.quickButtonSubtext}>(500ml)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise Tracking */}
        <View style={styles.quickActionCard}>
          <View style={styles.quickActionHeader}>
            <IconSymbol
              ios_icon_name="figure.run"
              android_material_icon_name="directions-run"
              size={24}
              color={colors.warning}
            />
            <Text style={styles.quickActionTitle}>Log Exercise</Text>
          </View>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => addExerciseSession(15, 'general')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickButtonGradient}
              >
                <Text style={styles.quickButtonText}>+15 Min</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => addExerciseSession(30, 'general')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickButtonGradient}
              >
                <Text style={styles.quickButtonText}>+30 Min</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => addExerciseSession(60, 'general')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientWarning}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickButtonGradient}
              >
                <Text style={styles.quickButtonText}>+60 Min</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Activity Types */}
      <View style={styles.activityTypesSection}>
        <View style={styles.sectionHeader}>
          <IconSymbol
            ios_icon_name="figure.mixed.cardio"
            android_material_icon_name="fitness-center"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Activities</Text>
        </View>
        <View style={styles.activityTypesGrid}>
          {[
            { type: 'walking', label: 'Walking', ios: 'figure.walk', android: 'directions-walk', gradient: colors.gradientPrimary },
            { type: 'running', label: 'Running', ios: 'figure.run', android: 'directions-run', gradient: colors.gradientAccent },
            { type: 'strength', label: 'Strength', ios: 'dumbbell.fill', android: 'fitness-center', gradient: colors.gradientWarning },
            { type: 'yoga', label: 'Yoga', ios: 'figure.yoga', android: 'self-improvement', gradient: colors.gradientSecondary },
          ].map((activity, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.activityTypeCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/(wellness)/activity-tracker' as any,
                  params: { type: activity.type }
                })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={activity.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activityTypeGradient}
                >
                  <IconSymbol
                    ios_icon_name={activity.ios}
                    android_material_icon_name={activity.android}
                    size={36}
                    color={colors.card}
                  />
                  <Text style={styles.activityTypeLabel}>{activity.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="history"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(wellness)/activity-history' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesList}>
            {recentActivities.map((activity, index) => {
              const icon = getActivityIcon(activity.activity_type);
              return (
                <React.Fragment key={index}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      <IconSymbol
                        ios_icon_name={icon.ios}
                        android_material_icon_name={icon.android}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityType}>
                        {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                      </Text>
                      <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    </View>
                    <Text style={styles.activityDuration}>{activity.duration_minutes} min</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}

      {/* Fitness Challenges */}
      {challenges.length > 0 && (
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Fitness Challenges</Text>
          </View>
          <View style={styles.challengesGrid}>
            {challenges.map((challenge, index) => (
              <React.Fragment key={index}>
                <View style={styles.challengeCard}>
                  <LinearGradient
                    colors={colors.gradientSunset}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.challengeGradient}
                  >
                    <View style={styles.challengeHeader}>
                      <IconSymbol
                        ios_icon_name="trophy.fill"
                        android_material_icon_name="emoji-events"
                        size={28}
                        color={colors.card}
                      />
                      {challenge.is_enrolled && (
                        <View style={styles.enrolledBadge}>
                          <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.challengeTitle} numberOfLines={2}>
                      {challenge.title}
                    </Text>
                    <Text style={styles.challengeDescription} numberOfLines={2}>
                      {challenge.description}
                    </Text>
                    <View style={styles.challengeStats}>
                      <Text style={styles.challengeStat}>
                        {challenge.duration_days} days
                      </Text>
                      <Text style={styles.challengeStat}>
                        Target: {challenge.target_value}
                      </Text>
                    </View>
                    {challenge.is_enrolled ? (
                      <View style={styles.challengeProgress}>
                        <View style={styles.challengeProgressBar}>
                          <View 
                            style={[
                              styles.challengeProgressFill,
                              { width: `${Math.min(100, (challenge.current_progress! / challenge.target_value) * 100)}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.challengeProgressText}>
                          {challenge.current_progress}/{challenge.target_value}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.enrollButton}
                        onPress={() => enrollInChallenge(challenge.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.enrollButtonText}>Join Challenge</Text>
                      </TouchableOpacity>
                    )}
                  </LinearGradient>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Additional Tools */}
      <View style={styles.toolsSection}>
        <View style={styles.sectionHeader}>
          <IconSymbol
            ios_icon_name="wrench.and.screwdriver.fill"
            android_material_icon_name="build"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>More Tools</Text>
        </View>
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={styles.toolCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/(wellness)/nutrition-tracker' as any)}
          >
            <LinearGradient
              colors={colors.gradientSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolGradient}
            >
              <IconSymbol
                ios_icon_name="fork.knife"
                android_material_icon_name="restaurant"
                size={36}
                color={colors.card}
              />
              <Text style={styles.toolTitle}>Nutrition</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/(wellness)/sleep-tracker' as any)}
          >
            <LinearGradient
              colors={colors.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toolGradient}
            >
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="bedtime"
                size={36}
                color={colors.card}
              />
              <Text style={styles.toolTitle}>Sleep</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Islamic Reminder */}
      <View style={styles.reminderSection}>
        <LinearGradient
          colors={colors.gradientTeal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reminderGradient}
        >
          <IconSymbol
            ios_icon_name="quote.opening"
            android_material_icon_name="format-quote"
            size={32}
            color={colors.card}
          />
          <Text style={styles.reminderText}>
            &quot;Your body has a right over you.&quot;
          </Text>
          <Text style={styles.reminderSource}>Prophet Muhammad (ﷺ)</Text>
        </LinearGradient>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },
  heroSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  heroGradient: {
    padding: spacing.xxl,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.card,
    opacity: 0.3,
  },
  imanTrackerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  imanTrackerLinkText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  goalsSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  goalsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  goalGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  goalValue: {
    ...typography.h2,
    color: colors.card,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalLabel: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  goalProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  quickActionsSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  quickActionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickActionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  quickButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  quickButtonSubtext: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  activityTypesSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  activityTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  activityTypeCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  activityTypeGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  activityTypeLabel: {
    ...typography.h4,
    color: colors.card,
    marginTop: spacing.md,
  },
  recentSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  activitiesList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  activityDuration: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  challengesSection: {
    marginBottom: spacing.xxl,
  },
  challengesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  challengeCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  challengeGradient: {
    padding: spacing.lg,
    minHeight: 240,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  enrolledBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  enrolledBadgeText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '600',
  },
  challengeTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  challengeDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.9,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  challengeStat: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
  challengeProgress: {
    marginTop: spacing.sm,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  challengeProgressText: {
    ...typography.small,
    color: colors.card,
    textAlign: 'center',
  },
  enrollButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  enrollButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  toolsSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toolCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  toolGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  toolTitle: {
    ...typography.h4,
    color: colors.card,
    marginTop: spacing.md,
  },
  reminderSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  reminderGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  reminderText: {
    ...typography.h3,
    color: colors.card,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  reminderSource: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.9,
  },
  bottomPadding: {
    height: 120,
  },
});
