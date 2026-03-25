
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useAchievementCelebration } from '@/contexts/AchievementCelebrationContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_ACHIEVEMENTS } from '@/data/localAchievements';
import { sendAchievementUnlocked } from '@/utils/notificationService';
import {
  checkAndUnlockAchievements,
  calculateUserStats,
  getCurrentValueForRequirement,
  syncLocalAchievementHistoryCache,
} from '@/utils/achievementService';

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
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  current_value: number;
  unlock_message?: string;
  next_steps?: string;
}

export default function AchievementsBadges() {
  const { user } = useAuth();
  const { celebrateAchievement } = useAchievementCelebration();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ibadah' | 'ilm' | 'amanah' | 'general'>('all');
  const cacheRef = useRef<{ data: Achievement[]; timestamp: number } | null>(null);
  const previousUnlockedIdsRef = useRef<Set<string>>(new Set());
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Load achievements only when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        // First check and unlock any achievements that reached 100% (for Supabase)
        checkAndUnlockAchievements(user.id).then(() => {
          // Then load achievements to show updated progress
          loadAchievements();
          checkForNewUnlocks();
        });
      }
    }, [user])
  );

  // Check for newly unlocked achievements from achievement service
  const checkForNewUnlocks = async () => {
    if (!user?.id) return;

    try {
      const celebrationQueueKey = `achievement_celebration_queue_${user.id}`;
      const queueData = await AsyncStorage.getItem(celebrationQueueKey);
      
      if (queueData) {
        const queue = JSON.parse(queueData);
        const achievementsToCelebrate: any[] = [];
        
        // Check each achievement in the queue to see if it's already been celebrated
        for (const item of queue) {
          if (item.achievement) {
            // Check if this achievement has already been celebrated
            const celebratedKey = `achievement_celebrated_${user.id}_${item.achievement.id}`;
            const celebratedData = await AsyncStorage.getItem(celebratedKey);
            
            if (!celebratedData) {
              // Not yet celebrated, add to list
              achievementsToCelebrate.push(item);
              console.log('🎉 Found uncelebrated achievement in queue:', item.achievement.title);
            } else {
              console.log('✅ Achievement already celebrated:', item.achievement.title);
            }
          }
        }

        // Only celebrate achievements that haven't been celebrated yet
        for (const item of achievementsToCelebrate) {
          if (item.achievement) {
            // Trigger celebration
            celebrateAchievement({
              id: item.achievement.id,
              title: item.achievement.title,
              description: item.achievement.description,
              icon_name: item.achievement.icon_name,
              tier: item.achievement.tier,
              unlock_message: item.achievement.unlock_message,
              points: item.achievement.points,
            });

            // Mark as processed in memory (for this session)
            previousUnlockedIdsRef.current.add(item.achievement.id);
          }
        }

        // Clear the queue after processing (even if all were already celebrated)
        await AsyncStorage.removeItem(celebrationQueueKey);
      }
    } catch (error) {
      console.log('Error checking for new unlocks:', error);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;

    try {
      // Check cache first
      const now = Date.now();
      if (cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_DURATION) {
        console.log('🏆 Using cached achievements data');
        setAchievements(cacheRef.current.data);
        updateRecentAchievements(cacheRef.current.data);
        setLoading(false);
        return;
      }

      console.log('🏆 Loading achievements for user:', user.id);

      let allAchievements: any[] = [];
      let userAchievements: any[] = [];
      let useLocalFallback = false;

      // Try to load from Supabase first
      try {
        const [achievementsResult, userAchievementsResult] = await Promise.all([
          supabase
            .from('achievements')
            .select('id, title, description, icon_name, requirement_type, requirement_value, points, tier, category, order_index, is_active, unlock_message, next_steps')
            .eq('is_active', true)
            .order('order_index', { ascending: true }),
          supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', user.id),
        ]);

        if (achievementsResult.error || !achievementsResult.data || achievementsResult.data.length === 0) {
          console.log('⚠️ Supabase achievements not available, using local fallback');
          useLocalFallback = true;
        } else {
          allAchievements = achievementsResult.data;
          userAchievements = userAchievementsResult.data || [];
          console.log('✅ Loaded from Supabase:', allAchievements.length, 'achievements');
        }
      } catch (error) {
        console.log('⚠️ Supabase error, using local fallback:', error);
        useLocalFallback = true;
      }

      // Use local achievements as fallback
      if (useLocalFallback) {
        console.log('🏆 Using LOCAL achievements fallback');
        allAchievements = LOCAL_ACHIEVEMENTS.filter(a => a.is_active);
        
        // Load user's unlocked achievements from AsyncStorage
        try {
          const unlockedData = await AsyncStorage.getItem(`user_achievements_${user.id}`);
          if (unlockedData) {
            userAchievements = JSON.parse(unlockedData);
          }

        } catch (error) {
          console.log('Error loading local achievement data:', error);
        }
      }

      // Single source of truth: same stats as checkAndUnlockAchievements / Supabase achievements
      const stats = await calculateUserStats(user.id);
      await syncLocalAchievementHistoryCache(user.id, stats);

      // Create lookup maps
      const unlockedMap = new Map(
        userAchievements.map((ua: any) => [ua.achievement_id || ua.id, ua.unlocked_at])
      );

      // Merge data and check for auto-unlock
      const newlyUnlockedAchievements: any[] = [];
      const mergedAchievements = allAchievements.map((achievement) => {
        const achievementId = achievement.id;
        const unlockedAt = unlockedMap.get(achievementId);
        let unlocked = !!unlockedAt;
        const currentValue = getCurrentValueForRequirement(achievement.requirement_type, stats);
        const progress = unlocked ? 100 : Math.min(100, (currentValue / achievement.requirement_value) * 100);

        // Auto-unlock if progress reaches 100% and not already unlocked
        // (Celebration check will happen later after async operations)
        if (!unlocked && progress >= 100 && currentValue >= achievement.requirement_value) {
          console.log(`🎉 AUTO-UNLOCKING: ${achievement.title} (${currentValue}/${achievement.requirement_value})`);
          unlocked = true;
          const unlockTimestamp = new Date().toISOString();
          
          // Add to newly unlocked list for saving
          newlyUnlockedAchievements.push({
            achievement_id: achievementId,
            id: achievementId,
            unlocked_at: unlockTimestamp,
          });
        }

        return {
          ...achievement,
          unlocked,
          unlocked_at: unlocked || newlyUnlockedAchievements.find(nu => nu.achievement_id === achievementId)?.unlocked_at || unlockedAt,
          progress,
          current_value: currentValue,
        };
      });

      // Check and celebrate newly auto-unlocked achievements (async check)
      for (const newUnlock of newlyUnlockedAchievements) {
        const achievement = mergedAchievements.find(a => a.id === newUnlock.achievement_id);
        if (achievement) {
          // Check if this achievement has already been celebrated
          const celebratedKey = `achievement_celebrated_${user.id}_${newUnlock.achievement_id}`;
          const celebratedData = await AsyncStorage.getItem(celebratedKey);
          
          if (!celebratedData) {
            // Trigger celebration (this will mark it as celebrated)
            celebrateAchievement({
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              icon_name: achievement.icon_name,
              tier: achievement.tier,
              unlock_message: achievement.unlock_message,
              points: achievement.points,
            });

            // Send notification
            sendAchievementUnlocked(
              achievement.title,
              achievement.unlock_message || achievement.description
            ).catch(err => console.log('Error sending notification:', err));
          } else {
            console.log(`✅ Achievement already celebrated: ${achievement.title}`);
          }
        }
      }

      // Save newly unlocked achievements to AsyncStorage (for local fallback)
      if (useLocalFallback && newlyUnlockedAchievements.length > 0) {
        try {
          const existingUnlocked = await AsyncStorage.getItem(`user_achievements_${user.id}`);
          const unlockedList = existingUnlocked ? JSON.parse(existingUnlocked) : [];
          
          // Add new unlocks (avoid duplicates)
          const existingIds = new Set(unlockedList.map((u: any) => u.achievement_id || u.id));
          newlyUnlockedAchievements.forEach(newUnlock => {
            if (!existingIds.has(newUnlock.achievement_id || newUnlock.id)) {
              unlockedList.push(newUnlock);
            }
          });

          await AsyncStorage.setItem(`user_achievements_${user.id}`, JSON.stringify(unlockedList));
          console.log(`✅ Saved ${newlyUnlockedAchievements.length} newly unlocked achievements to local storage`);
        } catch (error) {
          console.log('Error saving newly unlocked achievements:', error);
        }
      }

      console.log('✅ Merged achievements:', mergedAchievements.length);
      const unlockedCount = mergedAchievements.filter(a => a.unlocked).length;
      console.log('📊 Unlocked count:', unlockedCount);

      // Check for newly unlocked achievements and trigger celebrations
      const currentUnlockedIds = new Set(
        mergedAchievements.filter(a => a.unlocked).map(a => a.id)
      );
      
      // Find newly unlocked achievements (not in previous session AND not already celebrated)
      const newlyUnlocked: Achievement[] = [];
      for (const achievement of mergedAchievements) {
        if (achievement.unlocked && !previousUnlockedIdsRef.current.has(achievement.id)) {
          // Check if already celebrated in AsyncStorage
          const celebratedKey = `achievement_celebrated_${user.id}_${achievement.id}`;
          const celebratedData = await AsyncStorage.getItem(celebratedKey);
          
          if (!celebratedData) {
            newlyUnlocked.push(achievement);
          }
        }
      }

      // Update previous unlocked set
      previousUnlockedIdsRef.current = currentUnlockedIds;

      // Trigger celebrations for newly unlocked achievements (that haven't been celebrated)
      for (const achievement of newlyUnlocked) {
        console.log('🎉 NEW ACHIEVEMENT UNLOCKED:', achievement.title);
        
        // Send notification
        await sendAchievementUnlocked(
          achievement.title,
          achievement.unlock_message || achievement.description
        );

        // Trigger celebration (this will mark it as celebrated)
        celebrateAchievement({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon_name: achievement.icon_name,
          tier: achievement.tier,
          unlock_message: achievement.unlock_message,
          points: achievement.points,
        });
      }

      // Update cache
      cacheRef.current = {
        data: mergedAchievements,
        timestamp: Date.now()
      };

      setAchievements(mergedAchievements);
      updateRecentAchievements(mergedAchievements);
    } catch (error) {
      console.log('❌ Error in loadAchievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRecentAchievements = (allAchievements: Achievement[]) => {
    // Get recent achievements (unlocked in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = allAchievements
      .filter(a => a.unlocked && a.unlocked_at && new Date(a.unlocked_at) >= sevenDaysAgo)
      .sort((a, b) => {
        if (!a.unlocked_at || !b.unlocked_at) return 0;
        return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
      })
      .slice(0, 5); // Show top 5 recent achievements

    console.log('✅ Recent achievements:', recent.length);
    setRecentAchievements(recent);
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

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
  const inProgressCount = achievements.filter(a => !a.unlocked && a.progress > 0).length;

  // Filter achievements based on current filters
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked' && !achievement.unlocked) return false;
    if (filter === 'locked' && achievement.unlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

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
        router.push('/(tabs)/(learning)/lectures' as any);
        break;
      case 'quizzes_completed':
        router.push('/(tabs)/(learning)/quizzes' as any);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ibadah': return { ios: 'hands.sparkles.fill', android: 'self-improvement' };
      case 'ilm': return { ios: 'book.fill', android: 'menu-book' };
      case 'amanah': return { ios: 'heart.fill', android: 'favorite' };
      default: return { ios: 'star.fill', android: 'star' };
    }
  };

  const getAchievementIcon = (achievement: Achievement) => {
    const ios = achievement.unlocked ? (achievement.icon_name || 'star.fill') : 'lock.fill';
    const androidMap: Record<string, string> = {
      'moon.fill': 'nightlight', 'moon.stars.fill': 'nightlight', 'sun.max.fill': 'wb-sunny',
      'star.fill': 'star', 'book.fill': 'menu-book', 'flame.fill': 'local-fire-department',
      'heart.fill': 'favorite', 'trophy.fill': 'emoji-events', 'crown.fill': 'workspace-premium',
      'lock.fill': 'lock', 'checkmark.circle.fill': 'check-circle', 'sparkles': 'auto-awesome',
      'leaf.fill': 'eco', 'play.circle.fill': 'play-circle', 'target': 'track-changes',
    };
    const android = (achievement.unlocked ? androidMap[achievement.icon_name || ''] : 'lock') || 'star';
    return { ios, android };
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

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const tierColor = getTierColor(achievement.tier);

    return (
      <TouchableOpacity
        style={[
          styles.achievementCard,
          !achievement.unlocked && styles.achievementCardLocked,
        ]}
        onPress={() => openAchievementDetails(achievement)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.achievementIconWrap,
            { backgroundColor: achievement.unlocked ? tierColor + '22' : colors.highlight },
          ]}
        >
          <IconSymbol
            ios_icon_name={getAchievementIcon(achievement).ios}
            android_material_icon_name={getAchievementIcon(achievement).android as any}
            size={28}
            color={achievement.unlocked ? tierColor : colors.textSecondary}
          />
        </View>
        <Text style={styles.achievementTitle} numberOfLines={2}>
          {achievement.title}
        </Text>
        <View style={styles.achievementFooter}>
          <View style={[styles.tierChip, { backgroundColor: tierColor + '25' }]}>
            <Text style={[styles.tierChipText, { color: tierColor }]}>{achievement.tier}</Text>
          </View>
          {achievement.unlocked ? (
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={16} color={colors.success} />
          ) : (
            <Text style={styles.progressPct}>{Math.round(achievement.progress)}%</Text>
          )}
        </View>
        {!achievement.unlocked && achievement.progress > 0 ? (
          <View style={styles.miniProgress}>
            <View style={[styles.miniProgressFill, { width: `${achievement.progress}%`, backgroundColor: tierColor }]} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <IconSymbol ios_icon_name="trophy.fill" android_material_icon_name="emoji-events" size={22} color={colors.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>Loading…</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <IconSymbol ios_icon_name="trophy.fill" android_material_icon_name="emoji-events" size={22} color={colors.primary} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>No achievements available</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No achievements found. Check back later!</Text>
        </View>
      </View>
    );
  }

  const categoryPill = (cat: typeof categoryFilter, label: string) => (
    <TouchableOpacity
      key={cat}
      style={[styles.filterPill, categoryFilter === cat && styles.categoryPillActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCategoryFilter(cat);
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterPillText, categoryFilter === cat && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <IconSymbol
            ios_icon_name="trophy.fill"
            android_material_icon_name="emoji-events"
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubtitle}>
            {unlockedCount} of {achievements.length} unlocked · {totalPoints} pts
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statPill, filter === 'unlocked' && styles.statPillActive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter('unlocked'); setCategoryFilter('all'); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.statPillValue, filter === 'unlocked' && styles.statPillValueActive]}>{unlockedCount}</Text>
          <Text style={[styles.statPillLabel, filter === 'unlocked' && styles.statPillLabelActive]}>Unlocked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statPill, filter === 'locked' && styles.statPillActive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter('locked'); setCategoryFilter('all'); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.statPillValue, filter === 'locked' && styles.statPillValueActive]}>{inProgressCount}</Text>
          <Text style={[styles.statPillLabel, filter === 'locked' && styles.statPillLabelActive]}>In progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statPill, filter === 'all' && styles.statPillActive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter('all'); setCategoryFilter('all'); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.statPillValue, filter === 'all' && styles.statPillValueActive]}>{totalPoints}</Text>
          <Text style={[styles.statPillLabel, filter === 'all' && styles.statPillLabelActive]}>Points</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryPillsRow}
        contentContainerStyle={styles.categoryPillsContent}
      >
        {categoryPill('all', 'All')}
        {categoryPill('ibadah', 'ʿIbādah')}
        {categoryPill('ilm', 'ʿIlm')}
        {categoryPill('amanah', 'Amanah')}
        {categoryPill('general', 'General')}
      </ScrollView>

      {filteredAchievements.length > 0 ? (
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement, index) => (
            <View key={achievement.id || index} style={styles.gridCell}>
              {renderAchievementCard(achievement, index)}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="tray"
            android_material_icon_name="inbox"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyStateText}>
            {filter === 'unlocked' ? 'No achievements unlocked yet' : filter === 'locked' ? 'No achievements in progress' : 'No achievements match this filter'}
          </Text>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlightPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statPillActive: {
    backgroundColor: colors.highlightPurple,
    borderColor: colors.primary + '40',
  },
  statPillValue: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '800',
  },
  statPillValueActive: {
    color: colors.primaryDark,
  },
  statPillLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  statPillLabelActive: {
    color: colors.primary,
    opacity: 0.9,
  },
  categoryPillsRow: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  categoryPillsContent: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxl,
    gap: spacing.sm,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {},
  categoryPillActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary + '40',
  },
  filterPillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  filterPillTextActive: {
    color: colors.primaryDark,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    paddingBottom: spacing.xl,
  },
  gridCell: {
    width: '50%',
    padding: spacing.xs,
  },
  achievementCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  achievementCardLocked: {
    opacity: 0.9,
  },
  achievementIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementTitle: {
    ...typography.captionBold,
    color: colors.text,
    fontSize: 13,
    flex: 1,
    minHeight: 36,
  },
  achievementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tierChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  miniProgress: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
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
});
