
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { checkAndUnlockAchievements } from '@/utils/achievementService';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  order_index: number;
  unlock_message: string;
  next_steps: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  current_value: number;
}

export default function AchievementsScreen() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ibadah' | 'ilm' | 'amanah' | 'general'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const cacheRef = useRef<{ data: Achievement[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Load achievements when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        // Check and unlock any new achievements first
        checkAndUnlockAchievements(user.id).then(() => {
          // Then load achievements to show updated progress
          loadAchievements();
        });
      }
    }, [user])
  );

  const loadAchievements = async () => {
    if (!user) return;

    try {
      // Check cache first
      const now = Date.now();
      if (cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_DURATION) {
        console.log('🏆 Using cached achievements data');
        setAchievements(cacheRef.current.data);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Load all data in parallel for better performance
      const [achievementsResult, userAchievementsResult, progressResult] = await Promise.all([
          supabase
            .from('achievements')
            .select('id, title, description, icon_name, requirement_type, requirement_value, points, tier, category, order_index, is_active, unlock_message, next_steps')
            .eq('is_active', true)
            .order('order_index', { ascending: true }),
        supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id),
        supabase
          .from('achievement_progress')
          .select('achievement_id, current_value')
          .eq('user_id', user.id)
      ]);

      if (achievementsResult.error) {
        console.log('Error loading achievements:', achievementsResult.error);
        return;
      }

      const allAchievements = achievementsResult.data || [];
      const userAchievements = userAchievementsResult.data || [];
      const progressData = progressResult.data || [];

      // Create lookup maps for O(1) access
      const unlockedMap = new Map(
        userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at])
      );
      const progressMap = new Map(
        progressData.map(p => [p.achievement_id, p.current_value])
      );

      // Merge data synchronously (no async operations in map)
      const mergedAchievements = allAchievements.map((achievement) => {
        const unlockedAt = unlockedMap.get(achievement.id);
        const unlocked = !!unlockedAt;
        const currentValue = progressMap.get(achievement.id) || 0;
        const progress = unlocked ? 100 : Math.min(100, (currentValue / achievement.requirement_value) * 100);

        return {
          ...achievement,
          unlocked,
          unlocked_at: unlockedAt,
          progress,
          current_value: currentValue,
        };
      });

      // Update cache
      cacheRef.current = {
        data: mergedAchievements,
        timestamp: Date.now()
      };

      setAchievements(mergedAchievements);
    } catch (error) {
      console.log('Error in loadAchievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#A78BFA';
      case 'gold': return '#FBBF24';
      case 'silver': return '#9CA3AF';
      case 'bronze': return '#CD7F32';
      default: return colors.textSecondary;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ibadah': return '#10B981';
      case 'ilm': return '#3B82F6';
      case 'amanah': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ibadah': return { ios: 'hands.sparkles.fill', android: 'self-improvement' };
      case 'ilm': return { ios: 'book.fill', android: 'menu-book' };
      case 'amanah': return { ios: 'heart.fill', android: 'favorite' };
      default: return { ios: 'star.fill', android: 'star' };
    }
  };

  // Navigate to relevant action based on achievement requirement type
  const navigateToAction = (requirementType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (requirementType) {
      case 'total_prayers':
        router.push('/(tabs)/(iman)' as any);
        break;
      case 'total_dhikr':
        router.push('/(tabs)/(iman)/dhikr-window' as any);
        break;
      case 'total_quran_pages':
        router.push('/(tabs)/(iman)' as any);
        break;
      case 'lectures_watched':
        router.push('/(tabs)/(ilm)' as any);
        break;
      case 'quizzes_completed':
        router.push('/(tabs)/(ilm)' as any);
        break;
      case 'workouts_completed':
        router.push('/(tabs)/(wellness)/physical-health' as any);
        break;
      case 'meditation_sessions':
        router.push('/(tabs)/(wellness)/mental-health' as any);
        break;
      case 'streak':
      case 'days_active':
        router.push('/(tabs)/(iman)' as any);
        break;
      default:
        router.push('/(tabs)/(iman)' as any);
    }
  };

  const openAchievementDetails = (achievement: Achievement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAchievement(achievement);
    setDetailsModalVisible(true);
  };

  const closeAchievementDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailsModalVisible(false);
    setTimeout(() => setSelectedAchievement(null), 300);
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  // Earned achievements (unlocked)
  const earnedAchievements = achievements
    .filter(a => a.unlocked)
    .sort((a, b) => {
      const dateA = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
      const dateB = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    })
    .slice(0, 6); // Show top 6

  // Close to accomplishing (high progress but not unlocked)
  const closeAchievements = achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6); // Show top 6

  // Category-based achievements
  const categoryAchievements = {
    ibadah: achievements.filter(a => a.category === 'ibadah'),
    ilm: achievements.filter(a => a.category === 'ilm'),
    amanah: achievements.filter(a => a.category === 'amanah'),
    general: achievements.filter(a => a.category === 'general'),
  };

  const nextAchievement = achievements
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('unlocked');
              setCategoryFilter('all');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.success + '20', colors.success + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={28}
                color={colors.success}
              />
              <Text style={styles.statCardValue}>{unlockedCount}</Text>
              <Text style={styles.statCardLabel}>Unlocked</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('locked');
              setCategoryFilter('all');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.warning + '20', colors.warning + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <IconSymbol
                ios_icon_name="target"
                android_material_icon_name="flag"
                size={28}
                color={colors.warning}
              />
              <Text style={styles.statCardValue}>{closeAchievements.length}</Text>
              <Text style={styles.statCardLabel}>In Progress</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter('all');
              setCategoryFilter('all');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={28}
                color={colors.primary}
              />
              <Text style={styles.statCardValue}>{totalPoints}</Text>
              <Text style={styles.statCardLabel}>Total Points</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Featured Sections */}
        <View style={styles.featuredSection}>
          {/* Earned Achievements */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredHeader}>
              <View style={styles.featuredHeaderLeft}>
                <View style={[styles.featuredIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <IconSymbol
                    ios_icon_name="trophy.fill"
                    android_material_icon_name="emoji-events"
                    size={20}
                    color={colors.success}
                  />
                </View>
                <View>
                  <Text style={styles.featuredTitle}>Earned</Text>
                  <Text style={styles.featuredSubtitle}>{earnedAchievements.length} achievements</Text>
                </View>
              </View>
              {earnedAchievements.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilter('unlocked');
                    setCategoryFilter('all');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.featuredViewAll}>View All →</Text>
                </TouchableOpacity>
              )}
            </View>
            {earnedAchievements.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.featuredScroll}
                contentContainerStyle={styles.featuredScrollContent}
              >
                {earnedAchievements.map((achievement, index) => (
                  <TouchableOpacity
                    key={achievement.id || index}
                    style={styles.featuredItem}
                    onPress={() => openAchievementDetails(achievement)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.featuredItemIcon, { backgroundColor: getTierColor(achievement.tier) }]}>
                      <IconSymbol
                        ios_icon_name={achievement.icon_name || 'star.fill'}
                        android_material_icon_name="star"
                        size={24}
                        color={colors.card}
                      />
                    </View>
                    <Text style={styles.featuredItemTitle} numberOfLines={1}>
                      {achievement.title}
                    </Text>
                    <View style={styles.featuredItemBadge}>
                      <Text style={styles.featuredItemBadgeText}>{achievement.tier}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.featuredEmpty}>
                <Text style={styles.featuredEmptyText}>Complete activities to unlock achievements</Text>
              </View>
            )}
          </View>

          {/* In Progress Achievements */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredHeader}>
              <View style={styles.featuredHeaderLeft}>
                <View style={[styles.featuredIconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <IconSymbol
                    ios_icon_name="target"
                    android_material_icon_name="flag"
                    size={20}
                    color={colors.warning}
                  />
                </View>
                <View>
                  <Text style={styles.featuredTitle}>In Progress</Text>
                  <Text style={styles.featuredSubtitle}>{closeAchievements.length} achievements</Text>
                </View>
              </View>
              {closeAchievements.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilter('locked');
                    setCategoryFilter('all');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.featuredViewAll}>View All →</Text>
                </TouchableOpacity>
              )}
            </View>
            {closeAchievements.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.featuredScroll}
                contentContainerStyle={styles.featuredScrollContent}
              >
                {closeAchievements.map((achievement, index) => (
                  <TouchableOpacity
                    key={achievement.id || index}
                    style={styles.featuredItem}
                    onPress={() => openAchievementDetails(achievement)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.featuredItemIcon, { backgroundColor: getTierColor(achievement.tier) + '60' }]}>
                      <IconSymbol
                        ios_icon_name="lock.fill"
                        android_material_icon_name="lock"
                        size={24}
                        color={colors.card}
                      />
                    </View>
                    <Text style={styles.featuredItemTitle} numberOfLines={1}>
                      {achievement.title}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${achievement.progress}%`,
                              backgroundColor: getTierColor(achievement.tier)
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={styles.featuredItemProgress}>{Math.round(achievement.progress)}%</Text>
                    <TouchableOpacity
                      style={styles.featuredActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigateToAction(achievement.requirement_type);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.featuredActionButtonText}>Action</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.featuredEmpty}>
                <Text style={styles.featuredEmptyText}>Start activities to see progress</Text>
              </View>
            )}
          </View>
        </View>

        {/* Category Quick Access */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoryGrid}>
            <TouchableOpacity
              style={[styles.categoryCard, categoryFilter === 'ibadah' && styles.categoryCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('ibadah');
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={categoryFilter === 'ibadah' 
                  ? [getCategoryColor('ibadah'), getCategoryColor('ibadah') + 'DD']
                  : [getCategoryColor('ibadah') + '20', getCategoryColor('ibadah') + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryCardGradient}
              >
                <View style={[styles.categoryCardIcon, { backgroundColor: categoryFilter === 'ibadah' ? colors.card + '30' : getCategoryColor('ibadah') + '30' }]}>
                  <IconSymbol
                    ios_icon_name={getCategoryIcon('ibadah').ios}
                    android_material_icon_name={getCategoryIcon('ibadah').android}
                    size={28}
                    color={categoryFilter === 'ibadah' ? colors.card : getCategoryColor('ibadah')}
                  />
                </View>
                <Text style={[styles.categoryCardTitle, categoryFilter === 'ibadah' && styles.categoryCardTitleActive]}>
                  ʿIbādah
                </Text>
                <Text style={[styles.categoryCardCount, categoryFilter === 'ibadah' && styles.categoryCardCountActive]}>
                  {categoryAchievements.ibadah.filter(a => a.unlocked).length}/{categoryAchievements.ibadah.length}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, categoryFilter === 'ilm' && styles.categoryCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('ilm');
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={categoryFilter === 'ilm' 
                  ? [getCategoryColor('ilm'), getCategoryColor('ilm') + 'DD']
                  : [getCategoryColor('ilm') + '20', getCategoryColor('ilm') + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryCardGradient}
              >
                <View style={[styles.categoryCardIcon, { backgroundColor: categoryFilter === 'ilm' ? colors.card + '30' : getCategoryColor('ilm') + '30' }]}>
                  <IconSymbol
                    ios_icon_name={getCategoryIcon('ilm').ios}
                    android_material_icon_name={getCategoryIcon('ilm').android}
                    size={28}
                    color={categoryFilter === 'ilm' ? colors.card : getCategoryColor('ilm')}
                  />
                </View>
                <Text style={[styles.categoryCardTitle, categoryFilter === 'ilm' && styles.categoryCardTitleActive]}>
                  ʿIlm
                </Text>
                <Text style={[styles.categoryCardCount, categoryFilter === 'ilm' && styles.categoryCardCountActive]}>
                  {categoryAchievements.ilm.filter(a => a.unlocked).length}/{categoryAchievements.ilm.length}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, categoryFilter === 'amanah' && styles.categoryCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('amanah');
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={categoryFilter === 'amanah' 
                  ? [getCategoryColor('amanah'), getCategoryColor('amanah') + 'DD']
                  : [getCategoryColor('amanah') + '20', getCategoryColor('amanah') + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryCardGradient}
              >
                <View style={[styles.categoryCardIcon, { backgroundColor: categoryFilter === 'amanah' ? colors.card + '30' : getCategoryColor('amanah') + '30' }]}>
                  <IconSymbol
                    ios_icon_name={getCategoryIcon('amanah').ios}
                    android_material_icon_name={getCategoryIcon('amanah').android}
                    size={28}
                    color={categoryFilter === 'amanah' ? colors.card : getCategoryColor('amanah')}
                  />
                </View>
                <Text style={[styles.categoryCardTitle, categoryFilter === 'amanah' && styles.categoryCardTitleActive]}>
                  Amanah
                </Text>
                <Text style={[styles.categoryCardCount, categoryFilter === 'amanah' && styles.categoryCardCountActive]}>
                  {categoryAchievements.amanah.filter(a => a.unlocked).length}/{categoryAchievements.amanah.length}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryCard, categoryFilter === 'general' && styles.categoryCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('general');
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={categoryFilter === 'general' 
                  ? [getCategoryColor('general'), getCategoryColor('general') + 'DD']
                  : [getCategoryColor('general') + '20', getCategoryColor('general') + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryCardGradient}
              >
                <View style={[styles.categoryCardIcon, { backgroundColor: categoryFilter === 'general' ? colors.card + '30' : getCategoryColor('general') + '30' }]}>
                  <IconSymbol
                    ios_icon_name={getCategoryIcon('general').ios}
                    android_material_icon_name={getCategoryIcon('general').android}
                    size={28}
                    color={categoryFilter === 'general' ? colors.card : getCategoryColor('general')}
                  />
                </View>
                <Text style={[styles.categoryCardTitle, categoryFilter === 'general' && styles.categoryCardTitleActive]}>
                  General
                </Text>
                <Text style={[styles.categoryCardCount, categoryFilter === 'general' && styles.categoryCardCountActive]}>
                  {categoryAchievements.general.filter(a => a.unlocked).length}/{categoryAchievements.general.length}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>


        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter('all');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'unlocked' && styles.filterTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter('unlocked');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === 'unlocked' && styles.filterTabTextActive]}>
                Unlocked
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filter === 'locked' && styles.filterTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter('locked');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === 'locked' && styles.filterTabTextActive]}>
                Locked
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'all' && styles.categoryChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('all');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="square.grid.2x2.fill"
                android_material_icon_name="apps"
                size={16}
                color={categoryFilter === 'all' ? colors.card : colors.text}
              />
              <Text style={[styles.categoryChipText, categoryFilter === 'all' && styles.categoryChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'ibadah' && styles.categoryChipActive, categoryFilter === 'ibadah' && { backgroundColor: getCategoryColor('ibadah') }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('ibadah');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={getCategoryIcon('ibadah').ios}
                android_material_icon_name={getCategoryIcon('ibadah').android}
                size={16}
                color={categoryFilter === 'ibadah' ? colors.card : colors.text}
              />
              <Text style={[styles.categoryChipText, categoryFilter === 'ibadah' && styles.categoryChipTextActive]}>
                ʿIbādah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'ilm' && styles.categoryChipActive, categoryFilter === 'ilm' && { backgroundColor: getCategoryColor('ilm') }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('ilm');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={getCategoryIcon('ilm').ios}
                android_material_icon_name={getCategoryIcon('ilm').android}
                size={16}
                color={categoryFilter === 'ilm' ? colors.card : colors.text}
              />
              <Text style={[styles.categoryChipText, categoryFilter === 'ilm' && styles.categoryChipTextActive]}>
                ʿIlm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'amanah' && styles.categoryChipActive, categoryFilter === 'amanah' && { backgroundColor: getCategoryColor('amanah') }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('amanah');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={getCategoryIcon('amanah').ios}
                android_material_icon_name={getCategoryIcon('amanah').android}
                size={16}
                color={categoryFilter === 'amanah' ? colors.card : colors.text}
              />
              <Text style={[styles.categoryChipText, categoryFilter === 'amanah' && styles.categoryChipTextActive]}>
                Amanah
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'general' && styles.categoryChipActive, categoryFilter === 'general' && { backgroundColor: getCategoryColor('general') }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategoryFilter('general');
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={getCategoryIcon('general').ios}
                android_material_icon_name={getCategoryIcon('general').android}
                size={16}
                color={categoryFilter === 'general' ? colors.card : colors.text}
              />
              <Text style={[styles.categoryChipText, categoryFilter === 'general' && styles.categoryChipTextActive]}>
                General
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Achievements List */}
        <View style={styles.achievementsList}>
          {filteredAchievements.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="trophy"
                android_material_icon_name="emoji-events"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No achievements found</Text>
              <Text style={styles.emptyStateSubtext}>
                {filter === 'unlocked' 
                  ? 'Start completing activities to unlock achievements!'
                  : 'Try changing your filters'}
              </Text>
            </View>
          ) : (
            filteredAchievements.map((achievement, index) => {
              const tierColor = getTierColor(achievement.tier);
              const categoryColor = getCategoryColor(achievement.category);

              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[
                      styles.achievementCard,
                      achievement.unlocked && styles.achievementCardUnlocked,
                    ]}
                    onPress={() => openAchievementDetails(achievement)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={achievement.unlocked ? [tierColor + '40', tierColor + '20'] : [colors.card, colors.card]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.achievementGradient}
                    >
                      <View style={[
                        styles.achievementIcon,
                        { backgroundColor: achievement.unlocked ? tierColor : colors.border },
                      ]}>
                        <IconSymbol
                          ios_icon_name={achievement.unlocked ? 'star.fill' : 'lock.fill'}
                          android_material_icon_name={achievement.unlocked ? 'star' : 'lock'}
                          size={32}
                          color={achievement.unlocked ? colors.card : colors.textSecondary}
                        />
                      </View>

                      <View style={styles.achievementContent}>
                        <View style={styles.achievementHeader}>
                          <Text style={[
                            styles.achievementTitle,
                            !achievement.unlocked && styles.achievementTitleLocked,
                          ]}>
                            {achievement.title}
                          </Text>
                          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                            <Text style={styles.tierBadgeText}>{achievement.tier}</Text>
                          </View>
                        </View>

                        <Text style={[
                          styles.achievementDescription,
                          !achievement.unlocked && styles.achievementDescriptionLocked,
                        ]} numberOfLines={2}>
                          {achievement.description}
                        </Text>

                        {!achievement.unlocked && achievement.progress > 0 && (
                          <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBackground}>
                              <View 
                                style={[
                                  styles.progressBarFill, 
                                  { 
                                    width: `${achievement.progress}%`,
                                    backgroundColor: tierColor
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={styles.progressText}>
                              {achievement.current_value}/{achievement.requirement_value}
                            </Text>
                          </View>
                        )}

                        <View style={styles.achievementFooter}>
                          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                              {achievement.category}
                            </Text>
                          </View>

                          <View style={styles.pointsBadge}>
                            <IconSymbol
                              ios_icon_name="star.fill"
                              android_material_icon_name="star"
                              size={14}
                              color={colors.warning}
                            />
                            <Text style={styles.pointsText}>{achievement.points} pts</Text>
                          </View>
                        </View>
                      </View>

                      <IconSymbol
                        ios_icon_name="chevron.right"
                        android_material_icon_name="chevron-right"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Achievement Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAchievementDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeAchievementDetails}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <LinearGradient
                    colors={selectedAchievement.unlocked 
                      ? [getTierColor(selectedAchievement.tier) + '40', getTierColor(selectedAchievement.tier) + '20']
                      : [colors.card, colors.card]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalAchievementHeader}
                  >
                    <View style={[
                      styles.modalAchievementIcon,
                      { backgroundColor: selectedAchievement.unlocked ? getTierColor(selectedAchievement.tier) : colors.border },
                    ]}>
                      <IconSymbol
                        ios_icon_name={selectedAchievement.unlocked ? 'star.fill' : 'lock.fill'}
                        android_material_icon_name={selectedAchievement.unlocked ? 'star' : 'lock'}
                        size={64}
                        color={selectedAchievement.unlocked ? colors.card : colors.textSecondary}
                      />
                    </View>

                    <Text style={styles.modalAchievementTitle}>{selectedAchievement.title}</Text>
                    
                    <View style={styles.modalBadgesRow}>
                      <View style={[styles.modalTierBadge, { backgroundColor: getTierColor(selectedAchievement.tier) }]}>
                        <Text style={styles.modalTierBadgeText}>{selectedAchievement.tier}</Text>
                      </View>
                      <View style={[styles.modalCategoryBadge, { backgroundColor: getCategoryColor(selectedAchievement.category) + '20' }]}>
                        <Text style={[styles.modalCategoryBadgeText, { color: getCategoryColor(selectedAchievement.category) }]}>
                          {selectedAchievement.category}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <View style={styles.modalDetailsSection}>
                    <View style={styles.modalDetailRow}>
                      <IconSymbol
                        ios_icon_name="doc.text.fill"
                        android_material_icon_name="description"
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Description</Text>
                        <Text style={styles.modalDetailText}>{selectedAchievement.description}</Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <IconSymbol
                        ios_icon_name="target"
                        android_material_icon_name="flag"
                        size={24}
                        color={colors.success}
                      />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Requirement</Text>
                        <Text style={styles.modalDetailText}>
                          {selectedAchievement.requirement_type.replace(/_/g, ' ')}: {selectedAchievement.requirement_value}
                        </Text>
                        {!selectedAchievement.unlocked && (
                          <Text style={styles.modalDetailProgress}>
                            Current: {selectedAchievement.current_value} ({Math.round(selectedAchievement.progress)}%)
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.modalDetailRow}>
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={24}
                        color={colors.warning}
                      />
                      <View style={styles.modalDetailContent}>
                        <Text style={styles.modalDetailLabel}>Reward</Text>
                        <Text style={styles.modalDetailText}>{selectedAchievement.points} points</Text>
                      </View>
                    </View>

                    {selectedAchievement.unlocked && selectedAchievement.unlocked_at && (
                      <>
                        <View style={styles.modalDetailRow}>
                          <IconSymbol
                            ios_icon_name="calendar.badge.checkmark"
                            android_material_icon_name="event-available"
                            size={24}
                            color={colors.success}
                          />
                          <View style={styles.modalDetailContent}>
                            <Text style={styles.modalDetailLabel}>Unlocked On</Text>
                            <Text style={styles.modalDetailText}>
                              {new Date(selectedAchievement.unlocked_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                        </View>

                        {selectedAchievement.unlock_message && (
                          <View style={styles.modalCelebrationCard}>
                            <IconSymbol
                              ios_icon_name="party.popper.fill"
                              android_material_icon_name="celebration"
                              size={24}
                              color={getTierColor(selectedAchievement.tier)}
                            />
                            <View style={styles.modalCelebrationContent}>
                              <Text style={styles.modalCelebrationTitle}>Congratulations!</Text>
                              <Text style={styles.modalCelebrationText}>
                                {selectedAchievement.unlock_message}
                              </Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}

                    {!selectedAchievement.unlocked && (
                      <>
                        {selectedAchievement.progress > 0 && (
                          <View style={styles.modalProgressCard}>
                            <View style={styles.modalProgressHeader}>
                              <IconSymbol
                                ios_icon_name="chart.bar.fill"
                                android_material_icon_name="bar-chart"
                                size={24}
                                color={getTierColor(selectedAchievement.tier)}
                              />
                              <Text style={styles.modalProgressTitle}>Your Progress</Text>
                            </View>
                            <View style={styles.modalProgressBarContainer}>
                              <View style={styles.modalProgressBarBackground}>
                                <View 
                                  style={[
                                    styles.modalProgressBarFill, 
                                    { 
                                      width: `${selectedAchievement.progress}%`,
                                      backgroundColor: getTierColor(selectedAchievement.tier)
                                    }
                                  ]} 
                                />
                              </View>
                              <Text style={styles.modalProgressPercentage}>
                                {Math.round(selectedAchievement.progress)}%
                              </Text>
                            </View>
                            <Text style={styles.modalProgressSubtext}>
                              {selectedAchievement.requirement_value - selectedAchievement.current_value} more to go!
                            </Text>
                          </View>
                        )}

                        {/* Action Button */}
                        <TouchableOpacity
                          style={[styles.modalActionButton, { backgroundColor: getTierColor(selectedAchievement.tier) }]}
                          onPress={() => {
                            closeAchievementDetails();
                            navigateToAction(selectedAchievement.requirement_type);
                          }}
                          activeOpacity={0.8}
                        >
                          <IconSymbol
                            ios_icon_name="arrow.right.circle.fill"
                            android_material_icon_name="arrow-forward"
                            size={20}
                            color={colors.card}
                          />
                          <Text style={styles.modalActionButtonText}>
                            {selectedAchievement.requirement_type === 'total_prayers' ? 'Go to Prayers' :
                             selectedAchievement.requirement_type === 'total_dhikr' ? 'Go to Dhikr' :
                             selectedAchievement.requirement_type === 'total_quran_pages' ? 'Go to Quran' :
                             selectedAchievement.requirement_type === 'lectures_watched' ? 'Go to Lectures' :
                             selectedAchievement.requirement_type === 'quizzes_completed' ? 'Go to Quizzes' :
                             selectedAchievement.requirement_type === 'workouts_completed' ? 'Go to Workouts' :
                             selectedAchievement.requirement_type === 'meditation_sessions' ? 'Go to Meditation' :
                             'Take Action'}
                          </Text>
                        </TouchableOpacity>

                        {selectedAchievement.next_steps && (
                          <View style={styles.modalTipCard}>
                            <IconSymbol
                              ios_icon_name="lightbulb.fill"
                              android_material_icon_name="lightbulb"
                              size={24}
                              color={colors.warning}
                            />
                            <View style={styles.modalTipContent}>
                              <Text style={styles.modalTipTitle}>Next Steps</Text>
                              <Text style={styles.modalTipText}>
                                {selectedAchievement.next_steps}
                              </Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  statCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statCardValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statCardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  nextAchievementCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  nextAchievementGradient: {
    padding: spacing.lg,
  },
  nextAchievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nextAchievementTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  nextAchievementContent: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nextAchievementIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAchievementInfo: {
    flex: 1,
  },
  nextAchievementName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  nextAchievementDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nextAchievementMotivation: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  filterTabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  categoryScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: colors.card,
    fontWeight: '700',
  },
  achievementsList: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  achievementCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.medium,
  },
  achievementCardUnlocked: {
    borderColor: 'transparent',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  achievementTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  tierBadgeText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  achievementDescription: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  achievementDescriptionLocked: {
    color: colors.textSecondary,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  achievementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    ...typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '90%',
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  modalAchievementHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  modalAchievementIcon: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalAchievementTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalTierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  modalTierBadgeText: {
    ...typography.body,
    color: colors.card,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalCategoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  modalCategoryBadgeText: {
    ...typography.body,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modalDetailsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  modalDetailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDetailContent: {
    flex: 1,
  },
  modalDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  modalDetailText: {
    ...typography.body,
    color: colors.text,
  },
  modalDetailProgress: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  modalCelebrationCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.success + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  modalCelebrationContent: {
    flex: 1,
  },
  modalCelebrationTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalCelebrationText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  modalProgressCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalProgressTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  modalProgressBarContainer: {
    marginBottom: spacing.sm,
  },
  modalProgressBarBackground: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modalProgressBarFill: {
    height: '100%',
    borderRadius: borderRadius.md,
  },
  modalProgressPercentage: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
  },
  modalProgressSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalTipCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warning + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  modalTipContent: {
    flex: 1,
  },
  modalTipTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalTipText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.medium,
  },
  modalActionButtonText: {
    ...typography.bodyBold,
    color: colors.card,
    fontSize: 16,
  },
  widgetSection: {
    marginBottom: spacing.xl,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  widgetTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  widgetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  widgetViewAll: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  widgetScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  widgetScrollContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  widgetCard: {
    width: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  widgetCardGradient: {
    padding: spacing.md,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  widgetCardIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  widgetCardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  widgetCardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card + '40',
    marginTop: spacing.xs,
  },
  widgetCardBadgeText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  widgetCardProgress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  widgetActionButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card + '30',
    alignItems: 'center',
  },
  widgetActionButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  categoryWidget: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  categoryWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryWidgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryWidgetIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryWidgetTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontWeight: '700',
  },
  categoryWidgetSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  categoryWidgetScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  categoryWidgetItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 100,
  },
  categoryWidgetItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryWidgetItemTitle: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
    fontSize: 11,
  },
  emptyWidgetState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyWidgetText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  emptyWidgetSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  featuredSection: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featuredCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  featuredHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featuredIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontWeight: '700',
  },
  featuredSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  featuredViewAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  featuredScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  featuredScrollContent: {
    gap: spacing.sm,
  },
  featuredItem: {
    width: 120,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featuredItemTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 11,
  },
  featuredItemBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
  },
  featuredItemBadgeText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 9,
  },
  featuredItemProgress: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 10,
  },
  featuredActionButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
  },
  featuredActionButtonText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  featuredEmpty: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  featuredEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  categoryCardActive: {
    ...shadows.medium,
  },
  categoryCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  categoryCardIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryCardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  categoryCardTitleActive: {
    color: colors.card,
  },
  categoryCardCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryCardCountActive: {
    color: colors.card + 'DD',
  },
});
