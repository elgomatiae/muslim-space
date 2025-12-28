
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
        loadAchievements();
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
          .select('*')
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
        {/* Stats Card */}
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="trophy.fill"
                android_material_icon_name="emoji-events"
                size={32}
                color={colors.card}
              />
              <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={32}
                color={colors.card}
              />
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>

          <Text style={styles.statsSubtext}>
            {unlockedCount === 0 
              ? 'Start your journey to unlock achievements!'
              : unlockedCount === achievements.length
              ? 'Masha\'Allah! You\'ve unlocked all achievements!'
              : `Keep going! ${achievements.length - unlockedCount} more to unlock`}
          </Text>
        </LinearGradient>

        {/* Next Achievement Card */}
        {nextAchievement && (
          <TouchableOpacity
            style={styles.nextAchievementCard}
            onPress={() => openAchievementDetails(nextAchievement)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[getTierColor(nextAchievement.tier) + '20', getTierColor(nextAchievement.tier) + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextAchievementGradient}
            >
              <View style={styles.nextAchievementHeader}>
                <IconSymbol
                  ios_icon_name="target"
                  android_material_icon_name="flag"
                  size={20}
                  color={getTierColor(nextAchievement.tier)}
                />
                <Text style={styles.nextAchievementTitle}>Next Achievement</Text>
              </View>

              <View style={styles.nextAchievementContent}>
                <View style={[styles.nextAchievementIcon, { backgroundColor: getTierColor(nextAchievement.tier) }]}>
                  <IconSymbol
                    ios_icon_name="lock.fill"
                    android_material_icon_name="lock"
                    size={24}
                    color={colors.card}
                  />
                </View>

                <View style={styles.nextAchievementInfo}>
                  <Text style={styles.nextAchievementName}>{nextAchievement.title}</Text>
                  <Text style={styles.nextAchievementDesc} numberOfLines={1}>
                    {nextAchievement.description}
                  </Text>

                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${nextAchievement.progress}%`,
                            backgroundColor: getTierColor(nextAchievement.tier)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {nextAchievement.current_value}/{nextAchievement.requirement_value} ({Math.round(nextAchievement.progress)}%)
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.nextAchievementMotivation}>
                You're {Math.round(100 - nextAchievement.progress)}% away from unlocking this! Keep going! 💪
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

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
  statsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.large,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.card,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsSubtext: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    opacity: 0.9,
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
});
