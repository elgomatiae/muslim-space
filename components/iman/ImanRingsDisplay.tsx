
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface ImanRingsDisplayProps {
  prayerProgress: number;
  quranProgress: number;
  dhikrProgress: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
  };
  prayerCompleted: number;
  prayerTotal: number;
  quranCompleted: number;
  quranTotal: number;
  dhikrCompleted: number;
  dhikrTotal: number;
}

export default function ImanRingsDisplay({
  prayerProgress,
  quranProgress,
  dhikrProgress,
  streakData,
  prayerCompleted,
  prayerTotal,
  quranCompleted,
  quranTotal,
  dhikrCompleted,
  dhikrTotal,
}: ImanRingsDisplayProps) {
  const pulseAnim = useState(new Animated.Value(1))[0];
  const glowAnim = useState(new Animated.Value(0))[0];
  const rotateAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
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
  }, []);

  const totalProgress = (prayerProgress + quranProgress + dhikrProgress) / 3;
  const totalPercentage = Math.round(totalProgress * 100);

  const getAchievementBadge = (percentage: number) => {
    if (percentage >= 100) return { icon: "star.fill", color: colors.accent, label: "Perfect" };
    if (percentage >= 80) return { icon: "flame.fill", color: colors.warning, label: "On Fire" };
    if (percentage >= 60) return { icon: "bolt.fill", color: colors.info, label: "Strong" };
    return { icon: "leaf.fill", color: colors.primary, label: "Growing" };
  };

  const getDailyInsight = () => {
    if (prayerProgress === 1 && quranProgress === 1 && dhikrProgress === 1) {
      return { text: "All goals completed! 🎉", color: colors.success };
    }
    if (prayerProgress === 1) {
      return { text: "All prayers completed! 🤲", color: colors.primary };
    }
    if (quranProgress === 1) {
      return { text: "Quran goals achieved! 📖", color: colors.accent };
    }
    if (dhikrProgress === 1) {
      return { text: "Dhikr goal reached! ✨", color: colors.info };
    }
    const highest = Math.max(prayerProgress, quranProgress, dhikrProgress);
    if (highest >= 0.5) {
      return { text: "Great progress today! 💫", color: colors.primary };
    }
    return { text: "Keep building momentum! 🌱", color: colors.textSecondary };
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "Masha'Allah! Perfect day! 🌟";
    if (percentage >= 80) return "Excellent progress! Keep going! 💪";
    if (percentage >= 60) return "Great effort! You're doing well! ✨";
    if (percentage >= 40) return "Good start! Keep it up! 🌱";
    if (percentage >= 20) return "Every step counts! 🚀";
    return "Begin your journey today! 🌙";
  };

  const badge = getAchievementBadge(totalPercentage);
  const insight = getDailyInsight();

  const centerX = 170;
  const centerY = 170;
  
  const prayerRadius = 140;
  const prayerStroke = 20;
  const prayerCircumference = 2 * Math.PI * prayerRadius;
  const prayerOffset = prayerCircumference * (1 - prayerProgress);
  
  const quranRadius = 100;
  const quranStroke = 18;
  const quranCircumference = 2 * Math.PI * quranRadius;
  const quranOffset = quranCircumference * (1 - quranProgress);
  
  const dhikrRadius = 60;
  const dhikrStroke = 16;
  const dhikrCircumference = 2 * Math.PI * dhikrRadius;
  const dhikrOffset = dhikrCircumference * (1 - dhikrProgress);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <LinearGradient
      colors={['#F8F8FF', '#E8E8F8', '#F8F8FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.ringsWrapper}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Svg width={340} height={340}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%">
                <Stop offset="0%" stopColor={badge.color} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={badge.color} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            
            <Animated.View style={{ opacity: glowOpacity }}>
              <Circle
                cx={centerX}
                cy={centerY}
                r={150}
                fill="url(#glow)"
              />
            </Animated.View>
            
            <Circle
              cx={centerX}
              cy={centerY}
              r={prayerRadius}
              stroke="#808080"
              strokeWidth={prayerStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={prayerRadius}
              stroke={colors.primary}
              strokeWidth={prayerStroke}
              fill="none"
              strokeDasharray={prayerCircumference}
              strokeDashoffset={prayerOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            <Circle
              cx={centerX}
              cy={centerY}
              r={quranRadius}
              stroke="#808080"
              strokeWidth={quranStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={quranRadius}
              stroke={colors.accent}
              strokeWidth={quranStroke}
              fill="none"
              strokeDasharray={quranCircumference}
              strokeDashoffset={quranOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            <Circle
              cx={centerX}
              cy={centerY}
              r={dhikrRadius}
              stroke="#808080"
              strokeWidth={dhikrStroke}
              fill="none"
              opacity={0.6}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={dhikrRadius}
              stroke={colors.info}
              strokeWidth={dhikrStroke}
              fill="none"
              strokeDasharray={dhikrCircumference}
              strokeDashoffset={dhikrOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
          </Svg>
        </Animated.View>
        
        <View style={styles.centerContentWrapper}>
          <Animated.View 
            style={[
              styles.centerContent,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <Text style={styles.centerTitle}>Iman Score</Text>
            <Text style={[styles.centerPercentage, { color: badge.color }]}>{totalPercentage}%</Text>
          </Animated.View>
        </View>
      </View>
      
      <LinearGradient
        colors={[insight.color + '20', insight.color + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.insightContainer}
      >
        <IconSymbol
          ios_icon_name="lightbulb.fill"
          android_material_icon_name="lightbulb"
          size={20}
          color={insight.color}
        />
        <Text style={[styles.insightText, { color: insight.color }]}>
          {insight.text}
        </Text>
      </LinearGradient>
      
      <View style={styles.motivationalContainer}>
        <Text style={styles.motivationalText}>
          {getMotivationalMessage(totalPercentage)}
        </Text>
      </View>
      
      <View style={styles.ringLabelsContainer}>
        <View style={styles.ringLabel}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringLabelDot}
          />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Prayer</Text>
            <Text style={styles.ringLabelProgress}>{prayerCompleted}/{prayerTotal} completed</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.primary }]}>
              {Math.round(prayerProgress * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.ringLabel}>
          <LinearGradient
            colors={[colors.accent, colors.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringLabelDot}
          />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Quran</Text>
            <Text style={styles.ringLabelProgress}>
              {quranCompleted}/{quranTotal} completed
            </Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.accent }]}>
              {Math.round(quranProgress * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.ringLabel}>
          <LinearGradient
            colors={colors.gradientInfo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringLabelDot}
          />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Dhikr</Text>
            <Text style={styles.ringLabelProgress}>{dhikrCompleted}/{dhikrTotal} counted</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.info }]}>
              {Math.round(dhikrProgress * 100)}%
            </Text>
          </View>
        </View>
      </View>
      
      {streakData.currentStreak > 0 && (
        <View style={styles.streakContainer}>
          <LinearGradient
            colors={[colors.accent, colors.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakBadge}
          >
            <IconSymbol
              ios_icon_name="flame.fill"
              android_material_icon_name="local-fire-department"
              size={24}
              color={colors.card}
            />
            <View>
              <Text style={styles.streakText}>{streakData.currentStreak} Day Streak!</Text>
              {streakData.longestStreak > streakData.currentStreak && (
                <Text style={styles.streakSubtext}>
                  Best: {streakData.longestStreak} days
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 340,
    height: 340,
  },
  centerContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  centerPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 52,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  insightText: {
    ...typography.bodyBold,
    flex: 1,
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
  ringLabelsContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  ringLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  ringLabelDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  ringLabelContent: {
    flex: 1,
  },
  ringLabelText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  ringLabelProgress: {
    ...typography.small,
    color: colors.textSecondary,
  },
  ringLabelPercentage: {
    paddingHorizontal: spacing.sm,
  },
  ringLabelPercentText: {
    ...typography.captionBold,
    fontSize: 16,
  },
  streakContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  streakText: {
    ...typography.h4,
    color: colors.card,
    fontWeight: '700',
  },
  streakSubtext: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
});
