
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { useAchievementCelebration } from '@/contexts/AchievementCelebrationContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCAL_ACHIEVEMENTS } from '@/data/localAchievements';
import { sendAchievementUnlocked } from '@/utils/notificationService';
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
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  current_value: number;
  unlock_message?: string;
  next_steps?: string;
}

export default function AchievementsBadges() {
  const { user } = useAuth();
  const { ibadahGoals } = useImanTracker();
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
      let progressData: any[] = [];
      let useLocalFallback = false;

      // Try to load from Supabase first
      try {
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

        if (achievementsResult.error || !achievementsResult.data || achievementsResult.data.length === 0) {
          console.log('⚠️ Supabase achievements not available, using local fallback');
          useLocalFallback = true;
        } else {
          allAchievements = achievementsResult.data;
          userAchievements = userAchievementsResult.data || [];
          progressData = progressResult.data || [];
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

          // Load user's progress from AsyncStorage
          const progressDataStr = await AsyncStorage.getItem(`achievement_progress_${user.id}`);
          if (progressDataStr) {
            progressData = JSON.parse(progressDataStr);
          }
        } catch (error) {
          console.log('Error loading local achievement data:', error);
        }
      }

      // Calculate progress from Iman Tracker data (for local achievements)
      if (useLocalFallback) {
        progressData = await calculateProgressFromImanTracker(allAchievements, user.id, ibadahGoals);
      }

      // Create lookup maps
      const unlockedMap = new Map(
        userAchievements.map((ua: any) => [ua.achievement_id || ua.id, ua.unlocked_at])
      );
      const progressMap = new Map(
        progressData.map((p: any) => [p.achievement_id || p.id, p.current_value || p.current])
      );

      // Merge data and check for auto-unlock
      const newlyUnlockedAchievements: any[] = [];
      const mergedAchievements = allAchievements.map((achievement) => {
        const achievementId = achievement.id;
        const unlockedAt = unlockedMap.get(achievementId);
        let unlocked = !!unlockedAt;
        const currentValue = progressMap.get(achievementId) || 0;
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

  // Calculate achievement progress from Iman Tracker data
  const calculateProgressFromImanTracker = async (achievements: any[], userId: string, ibadahGoals: any): Promise<any[]> => {
    try {
      // Load historical totals from AsyncStorage (these are accumulated over time)
      const historyKey = `iman_tracker_history_${userId}`;
      const historyData = await AsyncStorage.getItem(historyKey);
      const history = historyData ? JSON.parse(historyData) : {};

      // Calculate current values from ibadah goals and history
      // Count completed prayers today
      const todayPrayers = ibadahGoals?.fardPrayers 
        ? Object.values(ibadahGoals.fardPrayers).filter((p: any) => p === true).length 
        : 0;
      
      // Get totals from history (lifetime totals)
      const totalPrayers = (history.totalPrayers || 0) + todayPrayers;
      const totalDhikr = history.totalDhikr || ibadahGoals?.dhikrCount || 0;
      const totalQuranPages = history.totalQuranPages || ibadahGoals?.quranPagesRead || 0;
      const currentStreak = history.currentStreak || history.streak || 0;
      const daysActive = history.daysActive || (history.activeDays?.length || 0);
      
      // These would come from other sources, but default to 0 for now
      const lecturesWatched = history.lecturesWatched || 0;
      const quizzesCompleted = history.quizzesCompleted || 0;
      const workoutsCompleted = history.workoutsCompleted || 0;
      const meditationSessions = history.meditationSessions || 0;

      // Calculate progress for each achievement
      return achievements.map(achievement => {
        let currentValue = 0;
        switch (achievement.requirement_type) {
          case 'total_prayers':
            currentValue = totalPrayers;
            break;
          case 'total_dhikr':
            currentValue = totalDhikr;
            break;
          case 'total_quran_pages':
            currentValue = totalQuranPages;
            break;
          case 'streak':
            currentValue = currentStreak;
            break;
          case 'days_active':
            currentValue = daysActive;
            break;
          case 'lectures_watched':
            currentValue = lecturesWatched;
            break;
          case 'quizzes_completed':
            currentValue = quizzesCompleted;
            break;
          case 'workouts_completed':
            currentValue = workoutsCompleted;
            break;
          case 'meditation_sessions':
            currentValue = meditationSessions;
            break;
          default:
            currentValue = 0;
        }

        return {
          id: achievement.id,
          achievement_id: achievement.id,
          current_value: currentValue,
          current: currentValue,
        };
      });
    } catch (error) {
      console.log('Error calculating progress:', error);
      return [];
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

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const tierColor = getTierColor(achievement.tier);
    
    return (
      <React.Fragment key={index}>
        <TouchableOpacity
          style={[
            styles.achievementCard,
            !achievement.unlocked && styles.achievementCardLocked
          ]}
          onPress={() => openAchievementDetails(achievement)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={achievement.unlocked 
              ? [tierColor + '80', tierColor + '60']
              : [colors.card, colors.cardAlt]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementCardGradient}
          >
            <View style={[
              styles.achievementIconContainer,
              !achievement.unlocked && styles.achievementIconContainerLocked
            ]}>
              <IconSymbol
                ios_icon_name={achievement.unlocked ? 'star.fill' : 'lock.fill'}
                android_material_icon_name={achievement.unlocked ? 'star' : 'lock'}
                size={32}
                color={achievement.unlocked ? colors.card : colors.textSecondary}
              />
            </View>
            
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierBadgeText}>{achievement.tier}</Text>
            </View>
            
            <Text style={[
              styles.achievementTitle,
              achievement.unlocked && styles.achievementTitleUnlocked
            ]}>
              {achievement.title}
            </Text>
            
            <Text style={[
              styles.achievementDescription,
              achievement.unlocked && styles.achievementDescriptionUnlocked
            ]} numberOfLines={2}>
              {achievement.description}
            </Text>
            
            {achievement.unlocked ? (
              <View style={styles.unlockedBadge}>
                <IconSymbol
                  ios_icon_name="checkmark.seal.fill"
                  android_material_icon_name="verified"
                  size={16}
                  color={colors.card}
                />
                <Text style={styles.unlockedText}>Unlocked</Text>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${achievement.progress}%`,
                        backgroundColor: tierColor
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(achievement.progress)}%
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={colors.gradientPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconContainer}
          >
            <IconSymbol
              ios_icon_name="rosette"
              android_material_icon_name="workspace-premium"
              size={20}
              color={colors.card}
            />
          </LinearGradient>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.sectionSubtitle}>Loading...</Text>
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
          <LinearGradient
            colors={colors.gradientPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconContainer}
          >
            <IconSymbol
              ios_icon_name="rosette"
              android_material_icon_name="workspace-premium"
              size={20}
              color={colors.card}
            />
          </LinearGradient>
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

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={colors.gradientPurple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconContainer}
        >
          <IconSymbol
            ios_icon_name="rosette"
            android_material_icon_name="workspace-premium"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubtitle}>{unlockedCount}/{achievements.length} unlocked</Text>
        </View>
      </View>

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

      {/* All Achievements Section */}
      <View style={styles.allAchievementsSection}>
        <View style={styles.allAchievementsHeader}>
          <Text style={styles.allAchievementsTitle}>All Achievements</Text>
          <Text style={styles.allAchievementsSubtitle}>
            {filteredAchievements.length} shown
          </Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.achievementsScroll}
          contentContainerStyle={styles.achievementsScrollContent}
        >
          {filteredAchievements.map((achievement, index) => renderAchievementCard(achievement, index))}
        </ScrollView>
      </View>

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
    marginTop: spacing.xl,
    width: '100%',
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
  recentSection: {
    marginBottom: spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  recentTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
  },
  allAchievementsSection: {
    marginTop: spacing.md,
  },
  allAchievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  allAchievementsTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 15,
  },
  achievementsScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  achievementsScrollContent: {
    paddingRight: spacing.xl,
  },
  achievementCard: {
    width: 140,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 200,
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementIconContainerLocked: {
    backgroundColor: colors.highlight,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  tierBadgeText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 9,
  },
  achievementTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementTitleUnlocked: {
    color: colors.card,
  },
  achievementDescription: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  achievementDescriptionUnlocked: {
    color: colors.card,
    opacity: 0.9,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
  },
  unlockedText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    ...typography.small,
    color: colors.card,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 10,
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
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
  progressBarContainer: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  allAchievementsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
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
