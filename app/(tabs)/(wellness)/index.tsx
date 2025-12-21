
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";

// Import the hub screens
import MentalHealthHubScreen from './mental-health';
import PhysicalHealthHubScreen from './physical-health';

type TabType = 'mental' | 'physical';

export default function WellnessScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('mental');
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const { amanahGoals, sectionScores } = useImanTracker();

  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate tab switch
    Animated.spring(slideAnim, {
      toValue: tab === 'mental' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    
    setActiveTab(tab);
  };

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // Half of container width minus padding
  });

  // Calculate Amanah completion percentage
  const calculateAmanahCompletion = () => {
    if (!amanahGoals) return 0;
    
    let totalGoals = 0;
    let completedGoals = 0;
    
    // Physical goals
    if (amanahGoals.dailyExerciseGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailyExerciseCompleted >= amanahGoals.dailyExerciseGoal) completedGoals++;
    }
    if (amanahGoals.dailyWaterGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailyWaterCompleted >= amanahGoals.dailyWaterGoal) completedGoals++;
    }
    if (amanahGoals.weeklyWorkoutGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyWorkoutCompleted >= amanahGoals.weeklyWorkoutGoal) completedGoals++;
    }
    
    // Mental goals
    if (amanahGoals.weeklyMentalHealthGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyMentalHealthCompleted >= amanahGoals.weeklyMentalHealthGoal) completedGoals++;
    }
    if (amanahGoals.weeklyStressManagementGoal > 0) {
      totalGoals++;
      if (amanahGoals.weeklyStressManagementCompleted >= amanahGoals.weeklyStressManagementGoal) completedGoals++;
    }
    
    // Sleep goals
    if (amanahGoals.dailySleepGoal > 0) {
      totalGoals++;
      if (amanahGoals.dailySleepCompleted >= amanahGoals.dailySleepGoal) completedGoals++;
    }
    
    return totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  };

  const amanahCompletion = calculateAmanahCompletion();
  const amanahScore = sectionScores.amanah || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <IconSymbol
              ios_icon_name="heart.circle.fill"
              android_material_icon_name="favorite"
              size={40}
              color={colors.card}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Wellness Hub</Text>
              <Text style={styles.headerSubtitle}>Nurture mind, body, and soul</Text>
            </View>
          </View>

          {/* Amanah Ring Reflection */}
          <View style={styles.amanahReflection}>
            <View style={styles.amanahRingContainer}>
              <View style={styles.amanahRingBackground}>
                <View 
                  style={[
                    styles.amanahRingFill,
                    { 
                      transform: [{ 
                        rotate: `${(amanahScore / 100) * 360}deg` 
                      }] 
                    }
                  ]} 
                />
              </View>
              <View style={styles.amanahRingCenter}>
                <Text style={styles.amanahScore}>{Math.round(amanahScore)}</Text>
                <Text style={styles.amanahLabel}>Amanah</Text>
              </View>
            </View>
            <View style={styles.amanahStats}>
              <Text style={styles.amanahStatsTitle}>Well-Being Score</Text>
              <Text style={styles.amanahStatsText}>
                {amanahCompletion}% of goals completed
              </Text>
              <Text style={styles.amanahStatsSubtext}>
                Linked to your Iman Tracker
              </Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <View style={styles.tabBackground}>
              <Animated.View 
                style={[
                  styles.tabIndicator,
                  {
                    transform: [{ translateX: indicatorTranslateX }],
                  }
                ]}
              />
              
              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchTab('mental')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="brain.head.profile"
                  android_material_icon_name="psychology"
                  size={20}
                  color={activeTab === 'mental' ? colors.primary : colors.card}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'mental' && styles.tabTextActive
                ]}>
                  Mental
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchTab('physical')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="figure.run"
                  android_material_icon_name="directions-run"
                  size={20}
                  color={activeTab === 'physical' ? colors.primary : colors.card}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'physical' && styles.tabTextActive
                ]}>
                  Physical
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'mental' ? (
          <MentalHealthHubScreen />
        ) : (
          <PhysicalHealthHubScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  headerGradient: {
    padding: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
  },
  amanahReflection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  amanahRingContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  amanahRingBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  amanahRingFill: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: colors.card,
    borderStyle: 'solid',
    position: 'absolute',
  },
  amanahRingCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amanahScore: {
    ...typography.h3,
    color: colors.card,
    fontWeight: '800',
  },
  amanahLabel: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
  amanahStats: {
    flex: 1,
  },
  amanahStatsTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  amanahStatsText: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.xs,
  },
  amanahStatsSubtext: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.8,
  },
  tabContainer: {
    width: '100%',
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: '48%',
    height: '85%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    zIndex: 1,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.card,
    opacity: 0.8,
  },
  tabTextActive: {
    color: colors.primary,
    opacity: 1,
  },
  content: {
    flex: 1,
  },
});
