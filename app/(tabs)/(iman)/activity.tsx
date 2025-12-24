
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserActivityLog,
  getActivityLogByCategory,
  getTodayActivityStats,
  ActivityLogEntry,
  ActivityCategory,
} from '@/utils/activityLogger';
import { router } from 'expo-router';

type FilterType = 'all' | 'ibadah' | 'ilm' | 'amanah';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [todayStats, setTodayStats] = useState({
    totalActivities: 0,
    ibadahCount: 0,
    ilmCount: 0,
    amanahCount: 0,
    totalPoints: 0,
  });

  const loadActivities = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load activities based on filter
      let data: ActivityLogEntry[];
      if (filter === 'all') {
        data = await getUserActivityLog(user.id, 100);
      } else {
        data = await getActivityLogByCategory(user.id, filter as ActivityCategory, 100);
      }

      setActivities(data);

      // Load today's stats
      const stats = await getTodayActivityStats(user.id);
      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  }, [loadActivities]);

  const getActivityIcon = (activityType: string): { ios: string; android: string } => {
    const iconMap: Record<string, { ios: string; android: string }> = {
      prayer_completed: { ios: 'hands.sparkles.fill', android: 'mosque' },
      sunnah_prayer: { ios: 'moon.stars.fill', android: 'nights-stay' },
      tahajjud_prayer: { ios: 'moon.fill', android: 'bedtime' },
      quran_reading: { ios: 'book.fill', android: 'menu-book' },
      quran_memorization: { ios: 'brain.head.profile', android: 'psychology' },
      dhikr_session: { ios: 'repeat.circle.fill', android: 'repeat' },
      dua_completed: { ios: 'hands.and.sparkles.fill', android: 'volunteer-activism' },
      fasting: { ios: 'moon.circle.fill', android: 'nightlight' },
      lecture_watched: { ios: 'play.circle.fill', android: 'play-circle' },
      recitation_listened: { ios: 'speaker.wave.3.fill', android: 'volume-up' },
      quiz_completed: { ios: 'checkmark.circle.fill', android: 'check-circle' },
      reflection_written: { ios: 'pencil.circle.fill', android: 'edit' },
      exercise_completed: { ios: 'figure.walk', android: 'directions-walk' },
      water_logged: { ios: 'drop.fill', android: 'water-drop' },
      workout_completed: { ios: 'figure.strengthtraining.traditional', android: 'fitness-center' },
      meditation_session: { ios: 'leaf.fill', android: 'spa' },
      sleep_logged: { ios: 'bed.double.fill', android: 'hotel' },
      journal_entry: { ios: 'book.closed.fill', android: 'book' },
      achievement_unlocked: { ios: 'trophy.fill', android: 'emoji-events' },
      goal_completed: { ios: 'flag.fill', android: 'flag' },
    };

    return iconMap[activityType] || { ios: 'circle.fill', android: 'circle' };
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'ibadah':
        return '#10B981';
      case 'ilm':
        return '#3B82F6';
      case 'amanah':
        return '#F59E0B';
      default:
        return colors.primary;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const groupActivitiesByDate = (activities: ActivityLogEntry[]) => {
    const grouped: Record<string, ActivityLogEntry[]> = {};

    activities.forEach((activity) => {
      const date = new Date(activity.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <LinearGradient
        colors={colors.gradientOcean}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <IconSymbol
              ios_icon_name="list.bullet.clipboard.fill"
              android_material_icon_name="assignment"
              size={40}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.header}>Activity Log</Text>
            <Text style={styles.subtitle}>Track your spiritual journey</Text>
          </View>
        </View>
      </LinearGradient>

      {/* TODAY'S STATS */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <Text style={styles.statsTitle}>Today&apos;s Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.totalActivities}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.ibadahCount}</Text>
              <Text style={styles.statLabel}>ʿIbādah</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.ilmCount}</Text>
              <Text style={styles.statLabel}>ʿIlm</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.amanahCount}</Text>
              <Text style={styles.statLabel}>Amanah</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'ibadah' && styles.filterTabActive]}
            onPress={() => setFilter('ibadah')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.filterText, filter === 'ibadah' && styles.filterTextActive]}>
              ʿIbādah
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'ilm' && styles.filterTabActive]}
            onPress={() => setFilter('ilm')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.filterText, filter === 'ilm' && styles.filterTextActive]}>
              ʿIlm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'amanah' && styles.filterTabActive]}
            onPress={() => setFilter('amanah')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.filterText, filter === 'amanah' && styles.filterTextActive]}>
              Amanah
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ACTIVITY LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="tray.fill"
            android_material_icon_name="inbox"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateTitle}>No Activities Yet</Text>
          <Text style={styles.emptyStateText}>
            Start tracking your spiritual journey by completing prayers, reading Quran, and more!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {Object.entries(groupedActivities).map(([date, dateActivities], dateIndex) => (
            <React.Fragment key={dateIndex}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{date}</Text>
                <View style={styles.dateLine} />
              </View>

              {dateActivities.map((activity, activityIndex) => {
                const icon = getActivityIcon(activity.activity_type);
                const categoryColor = getCategoryColor(activity.activity_category);

                return (
                  <React.Fragment key={activityIndex}>
                    <View style={styles.activityCard}>
                      <View style={[styles.activityIcon, { backgroundColor: categoryColor + '20' }]}>
                        <IconSymbol
                          ios_icon_name={icon.ios}
                          android_material_icon_name={icon.android}
                          size={24}
                          color={categoryColor}
                        />
                      </View>

                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.activity_title}</Text>
                        {activity.activity_description && (
                          <Text style={styles.activityDescription} numberOfLines={2}>
                            {activity.activity_description}
                          </Text>
                        )}
                        <View style={styles.activityMeta}>
                          {activity.activity_value && activity.activity_unit && (
                            <View style={styles.activityMetaItem}>
                              <IconSymbol
                                ios_icon_name="chart.bar.fill"
                                android_material_icon_name="bar-chart"
                                size={14}
                                color={colors.textSecondary}
                              />
                              <Text style={styles.activityMetaText}>
                                {activity.activity_value} {activity.activity_unit}
                              </Text>
                            </View>
                          )}
                          {activity.points_earned && activity.points_earned > 0 && (
                            <View style={styles.activityMetaItem}>
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={14}
                                color="#FBBF24"
                              />
                              <Text style={styles.activityMetaText}>
                                +{activity.points_earned} pts
                              </Text>
                            </View>
                          )}
                          <Text style={styles.activityTime}>{formatTimeAgo(activity.created_at)}</Text>
                        </View>
                      </View>

                      <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                        <Text style={styles.categoryBadgeText}>
                          {activity.activity_category === 'ibadah'
                            ? 'ʿIbādah'
                            : activity.activity_category === 'ilm'
                            ? 'ʿIlm'
                            : 'Amanah'}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.large,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  statsGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  statsTitle: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statLabel: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    ...shadows.small,
  },
  filterTabActive: {
    backgroundColor: colors.highlight,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  filterText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dateText: {
    ...typography.bodyBold,
    color: colors.text,
    marginRight: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityMetaText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  activityTime: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  bottomPadding: {
    height: 100,
  },
});
