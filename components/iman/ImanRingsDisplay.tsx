
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";

interface ImanRingsDisplayProps {
  onRefresh?: () => void;
}

export default function ImanRingsDisplay({ onRefresh }: ImanRingsDisplayProps) {
  // Initialize all Animated.Value instances at the top level
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const glowAnim = useMemo(() => new Animated.Value(0), []);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);
  
  const { sectionScores, overallScore } = useImanTracker();
  const [showBreakdown, setShowBreakdown] = useState(false);

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
  }, [pulseAnim, glowAnim, rotateAnim]);

  const getAchievementBadge = (percentage: number) => {
    if (percentage >= 100) return { icon: "star.fill", color: colors.accent, label: "Perfect" };
    if (percentage >= 80) return { icon: "flame.fill", color: colors.warning, label: "On Fire" };
    if (percentage >= 60) return { icon: "bolt.fill", color: colors.info, label: "Strong" };
    return { icon: "leaf.fill", color: colors.primary, label: "Growing" };
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "Masha'Allah! Perfect! 🌟";
    if (percentage >= 90) return "Outstanding! Almost there! 💪";
    if (percentage >= 80) return "Excellent progress! ✨";
    if (percentage >= 70) return "Great effort! Keep going! 🌟";
    if (percentage >= 60) return "Good progress! Stay consistent! 💫";
    if (percentage >= 50) return "Halfway there! 🌱";
    if (percentage >= 40) return "Keep pushing forward! 🚀";
    if (percentage >= 30) return "Every action counts! 💪";
    if (percentage >= 20) return "Start small, grow big! 🌱";
    return "Begin your journey today! 🌙";
  };

  const getDecayWarning = () => {
    if (overallScore < 30) {
      return { text: "⚠️ Low Iman score! Complete goals to increase.", color: colors.error };
    }
    if (overallScore < 50) {
      return { text: "⏰ Score decaying. Stay active!", color: colors.warning };
    }
    return null;
  };

  const badge = getAchievementBadge(overallScore);
  const decayWarning = getDecayWarning();

  // INCREASED RING SIZES - Made significantly larger
  const centerX = 200;
  const centerY = 200;
  
  // Prayer ring (outer) - INCREASED
  const prayerRadius = 170;
  const prayerStroke = 22;
  const prayerCircumference = 2 * Math.PI * prayerRadius;
  const prayerProgress = sectionScores.prayer / 100;
  const prayerOffset = prayerCircumference * (1 - prayerProgress);
  
  // Quran ring (middle) - INCREASED
  const quranRadius = 125;
  const quranStroke = 20;
  const quranCircumference = 2 * Math.PI * quranRadius;
  const quranProgress = sectionScores.quran / 100;
  const quranOffset = quranCircumference * (1 - quranProgress);
  
  // Dhikr ring (inner) - INCREASED
  const dhikrRadius = 80;
  const dhikrStroke = 18;
  const dhikrCircumference = 2 * Math.PI * dhikrRadius;
  const dhikrProgress = sectionScores.dhikr / 100;
  const dhikrOffset = dhikrCircumference * (1 - dhikrProgress);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const toggleBreakdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBreakdown(!showBreakdown);
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F5F7FA', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.ringsWrapper}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Svg width={400} height={400}>
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
                r={180}
                fill="url(#glow)"
              />
            </Animated.View>
            
            {/* Prayer Ring (Outer) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={prayerRadius}
              stroke="#E5E7EB"
              strokeWidth={prayerStroke}
              fill="none"
              opacity={0.3}
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
            
            {/* Quran Ring (Middle) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={quranRadius}
              stroke="#E5E7EB"
              strokeWidth={quranStroke}
              fill="none"
              opacity={0.3}
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
            
            {/* Dhikr Ring (Inner) */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={dhikrRadius}
              stroke="#E5E7EB"
              strokeWidth={dhikrStroke}
              fill="none"
              opacity={0.3}
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
        
        <TouchableOpacity 
          style={styles.centerContentWrapper}
          onPress={toggleBreakdown}
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
            <Text style={styles.centerTitle}>Iman Score</Text>
            <Text style={[styles.centerPercentage, { color: badge.color }]}>{overallScore}%</Text>
            <Text style={styles.centerHint}>Tap for details</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      {decayWarning && (
        <LinearGradient
          colors={[decayWarning.color + '20', decayWarning.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.warningContainer}
        >
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={20}
            color={decayWarning.color}
          />
          <Text style={[styles.warningText, { color: decayWarning.color }]}>
            {decayWarning.text}
          </Text>
        </LinearGradient>
      )}
      
      <View style={styles.motivationalContainer}>
        <Text style={styles.motivationalText}>
          {getMotivationalMessage(overallScore)}
        </Text>
      </View>
      
      {showBreakdown && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Score Breakdown</Text>
          
          <View style={styles.breakdownSection}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.breakdownLabel}>Prayer</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                {Math.round(sectionScores.prayer)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.breakdownLabel}>Quran</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.accent }]}>
                {Math.round(sectionScores.quran)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: colors.info }]} />
                <Text style={styles.breakdownLabel}>Dhikr</Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.info }]}>
                {Math.round(sectionScores.dhikr)}%
              </Text>
            </View>
          </View>

          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Overall Score</Text>
            <Text style={[styles.breakdownTotalValue, { color: badge.color }]}>
              {overallScore}%
            </Text>
          </View>
          
          <Text style={styles.breakdownNote}>
            Each ring reaches 100% when all daily and weekly goals are met.
          </Text>
        </View>
      )}
      
      <View style={styles.ringLabelsContainer}>
        <View style={styles.ringLabel}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringLabelDot}
          />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Prayer</Text>
            <Text style={styles.ringLabelProgress}>5 Fard + Sunnah + Tahajjud</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.primary }]}>
              {Math.round(sectionScores.prayer)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.ringLabel}>
          <LinearGradient
            colors={colors.gradientAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringLabelDot}
          />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Quran</Text>
            <Text style={styles.ringLabelProgress}>Reading + Memorization</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.accent }]}>
              {Math.round(sectionScores.quran)}%
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
            <Text style={styles.ringLabelProgress}>Daily + Weekly Goals</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: colors.info }]}>
              {Math.round(sectionScores.dhikr)}%
            </Text>
          </View>
        </View>
      </View>
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
    marginBottom: spacing.xs,
  },
  centerPercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 64,
  },
  centerHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  warningText: {
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
  breakdownContainer: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.medium,
  },
  breakdownTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  breakdownSection: {
    marginBottom: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  breakdownValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  breakdownTotalLabel: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  breakdownTotalValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  breakdownNote: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
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
});
