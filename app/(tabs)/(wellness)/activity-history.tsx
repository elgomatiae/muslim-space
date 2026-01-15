
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { supabase } from "@/app/integrations/supabase/client";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyStats {
  date: string;
  exercise_minutes: number;
  water_glasses: number;
  sleep_hours: number;
  workout_sessions: number;
  meditation_sessions: number;
  journal_entries: number;
  mental_health_activities: number;
}

interface WeeklyStats {
  week_start: string;
  total_exercise: number;
  total_water: number;
  avg_sleep: number;
  total_workouts: number;
  total_meditation: number;
  total_journal: number;
  total_mental_health: number;
  days_active: number;
}

export default function ActivityHistoryScreen() {
  const { user } = useAuth();
  const { amanahGoals } = useImanTracker();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [viewMode]);

  const loadHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (viewMode === 'daily') {
        await loadDailyHistory();
      } else {
        await loadWeeklyHistory();
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyHistory = async () => {
    if (!user) return;

    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    // Load amanah activities from activity_log table
    const { data: activityData, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_category', 'amanah')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading activity history:', error);
      // Fallback to empty array if table doesn't exist
      if (error.code === 'PGRST205') {
        console.warn('⚠️ activity_log table not found. Please run migration 011_create_activity_log_table.sql');
        // Try fallback to old tables if activity_log doesn't exist
        await loadDailyHistoryFallback();
        return;
      }
      // For other errors, set empty array
      setDailyStats([]);
      return;
    }

    // Aggregate by date
    const statsMap = new Map<string, DailyStats>();

    activityData?.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      
      if (!statsMap.has(date)) {
        statsMap.set(date, {
          date: date,
          exercise_minutes: 0,
          water_glasses: 0,
          sleep_hours: 0,
          workout_sessions: 0,
          meditation_sessions: 0,
          journal_entries: 0,
          mental_health_activities: 0,
        });
      }
      
      const stats = statsMap.get(date)!;
      
      // Process different activity types
      switch (entry.activity_type) {
        case 'exercise_completed':
          stats.exercise_minutes += entry.activity_value || 0;
          break;
        case 'water_logged':
          stats.water_glasses += entry.activity_value || 0;
          break;
        case 'sleep_logged':
          stats.sleep_hours += entry.activity_value || 0;
          break;
        case 'workout_completed':
          stats.workout_sessions += entry.activity_value || 1;
          break;
        case 'meditation_session':
          stats.meditation_sessions += entry.activity_value || 1;
          break;
        case 'journal_entry':
          stats.journal_entries += entry.activity_value || 1;
          break;
        default:
          // Check if it's a mental health activity (could be journal_entry or other)
          if (entry.activity_title?.toLowerCase().includes('mental health')) {
            stats.mental_health_activities += entry.activity_value || 1;
          }
          break;
      }
    });

    const stats = Array.from(statsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setDailyStats(stats);
  };

  // Fallback to old tables if activity_log doesn't exist
  const loadDailyHistoryFallback = async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Try to load from old tables as fallback
    const [exerciseResult, waterResult, sleepResult] = await Promise.all([
      supabase.from('physical_activities').select('date, duration_minutes').eq('user_id', user.id).gte('date', startDate),
      supabase.from('water_intake').select('date, amount_ml').eq('user_id', user.id).gte('date', startDate),
      supabase.from('sleep_tracking').select('date, sleep_hours').eq('user_id', user.id).gte('date', startDate),
    ]);

    const statsMap = new Map<string, DailyStats>();

    // Process exercise (if table exists and no PGRST205 error)
    if (!exerciseResult.error && exerciseResult.data && 
        exerciseResult.error?.code !== 'PGRST205' && 
        !exerciseResult.error?.message?.includes('Could not find the table')) {
      exerciseResult.data.forEach(entry => {
        if (!statsMap.has(entry.date)) {
          statsMap.set(entry.date, {
            date: entry.date,
            exercise_minutes: 0,
            water_glasses: 0,
            sleep_hours: 0,
            workout_sessions: 0,
            meditation_sessions: 0,
            journal_entries: 0,
            mental_health_activities: 0,
          });
        }
        const stats = statsMap.get(entry.date)!;
        stats.exercise_minutes += entry.duration_minutes || 0;
        stats.workout_sessions += 1;
      });
    }

    // Process water (if table exists)
    if (!waterResult.error && waterResult.data) {
      waterResult.data.forEach(entry => {
        if (!statsMap.has(entry.date)) {
          statsMap.set(entry.date, {
            date: entry.date,
            exercise_minutes: 0,
            water_glasses: 0,
            sleep_hours: 0,
            workout_sessions: 0,
            meditation_sessions: 0,
            journal_entries: 0,
            mental_health_activities: 0,
          });
        }
        const stats = statsMap.get(entry.date)!;
        stats.water_glasses += Math.floor((entry.amount_ml || 0) / 250);
      });
    }

    // Process sleep (if table exists)
    if (!sleepResult.error && sleepResult.data) {
      sleepResult.data.forEach(entry => {
        if (!statsMap.has(entry.date)) {
          statsMap.set(entry.date, {
            date: entry.date,
            exercise_minutes: 0,
            water_glasses: 0,
            sleep_hours: 0,
            workout_sessions: 0,
            meditation_sessions: 0,
            journal_entries: 0,
            mental_health_activities: 0,
          });
        }
        const stats = statsMap.get(entry.date)!;
        stats.sleep_hours = parseFloat(entry.sleep_hours || '0');
      });
    }

    const stats = Array.from(statsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setDailyStats(stats);
  };

  const loadWeeklyHistory = async () => {
    if (!user) return;

    // Get last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const startDate = twelveWeeksAgo.toISOString();

    // Load amanah activities from activity_log table
    const { data: activityData, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_category', 'amanah')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading weekly activity history:', error);
      // Fallback to empty array if table doesn't exist
      if (error.code === 'PGRST205') {
        console.warn('⚠️ activity_log table not found. Please run migration 011_create_activity_log_table.sql');
        // Try fallback to old tables if activity_log doesn't exist
        await loadWeeklyHistoryFallback();
        return;
      }
      // For other errors, set empty array
      setWeeklyStats([]);
      return;
    }

    // Group by week
    const weekMap = new Map<string, WeeklyStats>();
    const daysByWeek = new Map<string, Set<string>>();
    const sleepByWeek = new Map<string, number[]>();

    const getWeekStart = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day;
      const weekStart = new Date(date.setDate(diff));
      return weekStart.toISOString().split('T')[0];
    };

    // Process activities
    activityData?.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      const weekStart = getWeekStart(date);
      
      if (!weekMap.has(weekStart)) {
        weekMap.set(weekStart, {
          week_start: weekStart,
          total_exercise: 0,
          total_water: 0,
          avg_sleep: 0,
          total_workouts: 0,
          total_meditation: 0,
          total_journal: 0,
          total_mental_health: 0,
          days_active: 0,
        });
      }
      
      if (!daysByWeek.has(weekStart)) {
        daysByWeek.set(weekStart, new Set());
      }
      daysByWeek.get(weekStart)!.add(date);
      
      const stats = weekMap.get(weekStart)!;
      
      // Process different activity types
      switch (entry.activity_type) {
        case 'exercise_completed':
          stats.total_exercise += entry.activity_value || 0;
          break;
        case 'water_logged':
          stats.total_water += entry.activity_value || 0;
          break;
        case 'sleep_logged':
          if (!sleepByWeek.has(weekStart)) {
            sleepByWeek.set(weekStart, []);
          }
          sleepByWeek.get(weekStart)!.push(entry.activity_value || 0);
          break;
        case 'workout_completed':
          stats.total_workouts += entry.activity_value || 1;
          break;
        case 'meditation_session':
          stats.total_meditation += entry.activity_value || 1;
          break;
        case 'journal_entry':
          stats.total_journal += entry.activity_value || 1;
          break;
        default:
          if (entry.activity_title?.toLowerCase().includes('mental health')) {
            stats.total_mental_health += entry.activity_value || 1;
          }
          break;
      }
    });

    // Calculate average sleep and days active
    sleepByWeek.forEach((hours, weekStart) => {
      if (weekMap.has(weekStart)) {
        const stats = weekMap.get(weekStart)!;
        stats.avg_sleep = hours.reduce((a, b) => a + b, 0) / hours.length;
      }
    });

    daysByWeek.forEach((days, weekStart) => {
      if (weekMap.has(weekStart)) {
        const stats = weekMap.get(weekStart)!;
        stats.days_active = days.size;
      }
    });

    const stats = Array.from(weekMap.values()).sort((a, b) => 
      new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
    );

    setWeeklyStats(stats);
  };

  // Fallback to old tables if activity_log doesn't exist
  const loadWeeklyHistoryFallback = async () => {
    if (!user) return;

    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const startDate = twelveWeeksAgo.toISOString().split('T')[0];

    // Try to load from old tables as fallback
    const [exerciseResult, waterResult, sleepResult] = await Promise.all([
      supabase.from('physical_activities').select('date, duration_minutes').eq('user_id', user.id).gte('date', startDate),
      supabase.from('water_intake').select('date, amount_ml').eq('user_id', user.id).gte('date', startDate),
      supabase.from('sleep_tracking').select('date, sleep_hours').eq('user_id', user.id).gte('date', startDate),
    ]);

    const weekMap = new Map<string, WeeklyStats>();
    const daysByWeek = new Map<string, Set<string>>();
    const sleepByWeek = new Map<string, number[]>();

    const getWeekStart = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day;
      const weekStart = new Date(date.setDate(diff));
      return weekStart.toISOString().split('T')[0];
    };

    // Process exercise (if table exists and no PGRST205 error)
    if (!exerciseResult.error && exerciseResult.data && 
        exerciseResult.error?.code !== 'PGRST205' && 
        !exerciseResult.error?.message?.includes('Could not find the table')) {
      exerciseResult.data.forEach(entry => {
        const weekStart = getWeekStart(entry.date);
        if (!weekMap.has(weekStart)) {
          weekMap.set(weekStart, {
            week_start: weekStart,
            total_exercise: 0,
            total_water: 0,
            avg_sleep: 0,
            total_workouts: 0,
            total_meditation: 0,
            total_journal: 0,
            total_mental_health: 0,
            days_active: 0,
          });
        }
        if (!daysByWeek.has(weekStart)) {
          daysByWeek.set(weekStart, new Set());
        }
        daysByWeek.get(weekStart)!.add(entry.date);
        const stats = weekMap.get(weekStart)!;
        stats.total_exercise += entry.duration_minutes || 0;
        stats.total_workouts += 1;
      });
    }

    // Process water (if table exists)
    if (!waterResult.error && waterResult.data) {
      waterResult.data.forEach(entry => {
        const weekStart = getWeekStart(entry.date);
        if (!weekMap.has(weekStart)) {
          weekMap.set(weekStart, {
            week_start: weekStart,
            total_exercise: 0,
            total_water: 0,
            avg_sleep: 0,
            total_workouts: 0,
            total_meditation: 0,
            total_journal: 0,
            total_mental_health: 0,
            days_active: 0,
          });
        }
        if (!daysByWeek.has(weekStart)) {
          daysByWeek.set(weekStart, new Set());
        }
        daysByWeek.get(weekStart)!.add(entry.date);
        const stats = weekMap.get(weekStart)!;
        stats.total_water += Math.floor((entry.amount_ml || 0) / 250);
      });
    }

    // Process sleep (if table exists)
    if (!sleepResult.error && sleepResult.data) {
      sleepResult.data.forEach(entry => {
        const weekStart = getWeekStart(entry.date);
        if (!sleepByWeek.has(weekStart)) {
          sleepByWeek.set(weekStart, []);
        }
        if (!daysByWeek.has(weekStart)) {
          daysByWeek.set(weekStart, new Set());
        }
        daysByWeek.get(weekStart)!.add(entry.date);
        sleepByWeek.get(weekStart)!.push(parseFloat(entry.sleep_hours || '0'));
      });
    }

    // Calculate average sleep and days active
    sleepByWeek.forEach((hours, weekStart) => {
      if (weekMap.has(weekStart)) {
        const stats = weekMap.get(weekStart)!;
        stats.avg_sleep = hours.reduce((a, b) => a + b, 0) / hours.length;
      }
    });

    daysByWeek.forEach((days, weekStart) => {
      if (weekMap.has(weekStart)) {
        const stats = weekMap.get(weekStart)!;
        stats.days_active = days.size;
      }
    });

    const stats = Array.from(weekMap.values()).sort((a, b) => 
      new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
    );

    setWeeklyStats(stats);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [viewMode]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const renderDailyStats = () => {
    if (dailyStats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="chart.line.uptrend.xyaxis"
            android_material_icon_name="trending-up"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No Amanah activity history yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete wellness activities in the Iman Tracker to see your Amanah history here
          </Text>
        </View>
      );
    }

    return dailyStats.map((stat, index) => (
      <View key={`daily-${stat.date}-${index}`} style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statDate}>{formatDate(stat.date)}</Text>
          <View style={styles.statBadge}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={14}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.statGrid}>
          {stat.exercise_minutes > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="figure.run"
                android_material_icon_name="directions-run"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.statValue}>{stat.exercise_minutes}</Text>
              <Text style={styles.statLabel}>min exercise</Text>
            </View>
          )}

          {stat.water_glasses > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="drop.fill"
                android_material_icon_name="water-drop"
                size={20}
                color={colors.info}
              />
              <Text style={styles.statValue}>{stat.water_glasses}</Text>
              <Text style={styles.statLabel}>glasses water</Text>
            </View>
          )}

          {stat.sleep_hours > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="bedtime"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.statValue}>{stat.sleep_hours.toFixed(1)}</Text>
              <Text style={styles.statLabel}>hrs sleep</Text>
            </View>
          )}

          {stat.workout_sessions > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="dumbbell.fill"
                android_material_icon_name="fitness-center"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.statValue}>{stat.workout_sessions}</Text>
              <Text style={styles.statLabel}>workouts</Text>
            </View>
          )}

          {stat.meditation_sessions > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="spa"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.statValue}>{stat.meditation_sessions}</Text>
              <Text style={styles.statLabel}>meditation</Text>
            </View>
          )}

          {stat.journal_entries > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.statValue}>{stat.journal_entries}</Text>
              <Text style={styles.statLabel}>journal</Text>
            </View>
          )}
        </View>
      </View>
    ));
  };

  const renderWeeklyStats = () => {
    if (weeklyStats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="chart.bar.fill"
            android_material_icon_name="bar-chart"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>No weekly Amanah data yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete a full week of Amanah activities to see weekly summaries
          </Text>
        </View>
      );
    }

    return weeklyStats.map((stat, index) => (
      <View key={`weekly-${stat.week_start}-${index}`} style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statDate}>{formatWeekRange(stat.week_start)}</Text>
          <View style={styles.statBadge}>
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="date-range"
              size={14}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.weeklyInfo}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={16}
            color={colors.success}
          />
          <Text style={styles.weeklyInfoText}>
            {stat.days_active} {stat.days_active === 1 ? 'day' : 'days'} active this week
          </Text>
        </View>

        <View style={styles.statGrid}>
          {stat.total_exercise > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="figure.run"
                android_material_icon_name="directions-run"
                size={20}
                color={colors.warning}
              />
              <Text style={styles.statValue}>{stat.total_exercise}</Text>
              <Text style={styles.statLabel}>min total</Text>
            </View>
          )}

          {stat.total_water > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="drop.fill"
                android_material_icon_name="water-drop"
                size={20}
                color={colors.info}
              />
              <Text style={styles.statValue}>{stat.total_water}</Text>
              <Text style={styles.statLabel}>glasses total</Text>
            </View>
          )}

          {stat.avg_sleep > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="moon.stars.fill"
                android_material_icon_name="bedtime"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.statValue}>{stat.avg_sleep.toFixed(1)}</Text>
              <Text style={styles.statLabel}>avg sleep</Text>
            </View>
          )}

          {stat.total_workouts > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="dumbbell.fill"
                android_material_icon_name="fitness-center"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.statValue}>{stat.total_workouts}</Text>
              <Text style={styles.statLabel}>workouts</Text>
            </View>
          )}

          {stat.total_meditation > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="spa"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.statValue}>{stat.total_meditation}</Text>
              <Text style={styles.statLabel}>meditation</Text>
            </View>
          )}

          {stat.total_journal > 0 && (
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.statValue}>{stat.total_journal}</Text>
              <Text style={styles.statLabel}>journal</Text>
            </View>
          )}
        </View>
      </View>
    ));
  };

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
        <Text style={styles.headerTitle}>Amanah History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'daily' && styles.toggleButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode('daily');
          }}
          activeOpacity={0.7}
        >
          {viewMode === 'daily' ? (
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toggleGradient}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={18}
                color={colors.card}
              />
              <Text style={styles.toggleTextActive}>Daily</Text>
            </LinearGradient>
          ) : (
            <View style={styles.toggleInactive}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.toggleText}>Daily</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'weekly' && styles.toggleButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setViewMode('weekly');
          }}
          activeOpacity={0.7}
        >
          {viewMode === 'weekly' ? (
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toggleGradient}
            >
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="date-range"
                size={18}
                color={colors.card}
              />
              <Text style={styles.toggleTextActive}>Weekly</Text>
            </LinearGradient>
          ) : (
            <View style={styles.toggleInactive}>
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="date-range"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.toggleText}>Weekly</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : (
          <>
            {viewMode === 'daily' ? renderDailyStats() : renderWeeklyStats()}
          </>
        )}

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
                <Text style={styles.imanTrackerTitle}>View in Iman Tracker</Text>
                <Text style={styles.imanTrackerSubtitle}>
                  See how your wellness activities contribute to your Amanah ring
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
  placeholder: {
    width: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButtonActive: {
    borderColor: 'transparent',
    ...shadows.small,
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  toggleInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  toggleText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    ...typography.bodyBold,
    color: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statDate: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  statBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  weeklyInfoText: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imanTrackerCard: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
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
  bottomPadding: {
    height: 100,
  },
});
