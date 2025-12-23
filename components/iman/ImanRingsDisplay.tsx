
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import AchievementsBadges from "./AchievementsBadges";

interface ImanRingsDisplayProps {
  onRefresh?: () => void;
}

export default function ImanRingsDisplay({ onRefresh }: ImanRingsDisplayProps) {
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

  // Ring configuration - LARGER SIZES
  const centerX = 200;
  const centerY = 200;
  
  // ʿIbādah ring (outer) - GREEN
  const ibadahRadius = 170;
  const ibadahStroke = 24;
  const ibadahCircumference = 2 * Math.PI * ibadahRadius;
  const ibadahProgress = sectionScores.ibadah / 100;
  const ibadahOffset = ibadahCircumference * (1 - ibadahProgress);
  
  // ʿIlm ring (middle) - BLUE
  const ilmRadius = 125;
  const ilmStroke = 22;
  const ilmCircumference = 2 * Math.PI * ilmRadius;
  const ilmProgress = sectionScores.ilm / 100;
  const ilmOffset = ilmCircumference * (1 - ilmProgress);
  
  // Amanah ring (inner) - YELLOW/GOLD
  const amanahRadius = 80;
  const amanahStroke = 20;
  const amanahCircumference = 2 * Math.PI * amanahRadius;
  const amanahProgress = sectionScores.amanah / 100;
  const amanahOffset = amanahCircumference * (1 - amanahProgress);

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

  // Ring colors
  const ibadahColor = '#10B981'; // Green
  const ilmColor = '#3B82F6'; // Blue
  const amanahColor = '#F59E0B'; // Amber/Gold

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
            
            {/* ʿIbādah Ring (Outer) - GREEN */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={ibadahRadius}
              stroke="#E5E7EB"
              strokeWidth={ibadahStroke}
              fill="none"
              opacity={0.3}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={ibadahRadius}
              stroke={ibadahColor}
              strokeWidth={ibadahStroke}
              fill="none"
              strokeDasharray={ibadahCircumference}
              strokeDashoffset={ibadahOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* ʿIlm Ring (Middle) - BLUE */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={ilmRadius}
              stroke="#E5E7EB"
              strokeWidth={ilmStroke}
              fill="none"
              opacity={0.3}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={ilmRadius}
              stroke={ilmColor}
              strokeWidth={ilmStroke}
              fill="none"
              strokeDasharray={ilmCircumference}
              strokeDashoffset={ilmOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${centerX}, ${centerY}`}
            />
            
            {/* Amanah Ring (Inner) - GOLD */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={amanahRadius}
              stroke="#E5E7EB"
              strokeWidth={amanahStroke}
              fill="none"
              opacity={0.3}
            />
            <Circle
              cx={centerX}
              cy={centerY}
              r={amanahRadius}
              stroke={amanahColor}
              strokeWidth={amanahStroke}
              fill="none"
              strokeDasharray={amanahCircumference}
              strokeDashoffset={amanahOffset}
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
                <View style={[styles.colorDot, { backgroundColor: ibadahColor }]} />
                <View>
                  <Text style={styles.breakdownLabel}>ʿIbādah (Worship)</Text>
                  <Text style={styles.breakdownSubLabel}>العبادة</Text>
                </View>
              </View>
              <Text style={[styles.breakdownValue, { color: ibadahColor }]}>
                {Math.round(sectionScores.ibadah)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: ilmColor }]} />
                <View>
                  <Text style={styles.breakdownLabel}>ʿIlm (Knowledge)</Text>
                  <Text style={styles.breakdownSubLabel}>العلم</Text>
                </View>
              </View>
              <Text style={[styles.breakdownValue, { color: ilmColor }]}>
                {Math.round(sectionScores.ilm)}%
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelRow}>
                <View style={[styles.colorDot, { backgroundColor: amanahColor }]} />
                <View>
                  <Text style={styles.breakdownLabel}>Amanah (Well-Being)</Text>
                  <Text style={styles.breakdownSubLabel}>الأمانة</Text>
                </View>
              </View>
              <Text style={[styles.breakdownValue, { color: amanahColor }]}>
                {Math.round(sectionScores.amanah)}%
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
          <View style={[styles.ringLabelDot, { backgroundColor: ibadahColor }]} />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>ʿIbādah (العبادة)</Text>
            <Text style={styles.ringLabelProgress}>Ṣalāh • Qur&apos;an • Dhikr • Duʿāʾ • Fasting</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: ibadahColor }]}>
              {Math.round(sectionScores.ibadah)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.ringLabel}>
          <View style={[styles.ringLabelDot, { backgroundColor: ilmColor }]} />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>ʿIlm (العلم)</Text>
            <Text style={styles.ringLabelProgress}>Learning • Lectures • Quizzes • Reflection</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: ilmColor }]}>
              {Math.round(sectionScores.ilm)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.ringLabel}>
          <View style={[styles.ringLabelDot, { backgroundColor: amanahColor }]} />
          <View style={styles.ringLabelContent}>
            <Text style={styles.ringLabelText}>Amanah (الأمانة)</Text>
            <Text style={styles.ringLabelProgress}>Physical • Mental • Sleep • Balance</Text>
          </View>
          <View style={styles.ringLabelPercentage}>
            <Text style={[styles.ringLabelPercentText, { color: amanahColor }]}>
              {Math.round(sectionScores.amanah)}%
            </Text>
          </View>
        </View>
      </View>

      {/* ACHIEVEMENTS BADGES - NOW DISPLAYED HERE */}
      <AchievementsBadges />
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
  breakdownSubLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
