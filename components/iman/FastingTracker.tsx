
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function FastingTracker() {
  const [isFasting, setIsFasting] = useState(false);
  const [fastingCount, setFastingCount] = useState(0);

  useEffect(() => {
    loadFastingData();
  }, []);

  const loadFastingData = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('fastingDate');
      const todayFasting = await AsyncStorage.getItem('todayFasting');
      const count = await AsyncStorage.getItem('fastingCount');
      
      if (lastDate !== today) {
        await AsyncStorage.setItem('fastingDate', today);
        await AsyncStorage.setItem('todayFasting', 'false');
        setIsFasting(false);
      } else {
        setIsFasting(todayFasting === 'true');
      }
      
      if (count) {
        setFastingCount(parseInt(count));
      }
    } catch (error) {
      console.log('Error loading fasting data:', error);
    }
  };

  const toggleFasting = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newFasting = !isFasting;
    setIsFasting(newFasting);
    
    if (newFasting) {
      const newCount = fastingCount + 1;
      setFastingCount(newCount);
      await AsyncStorage.setItem('fastingCount', newCount.toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    await AsyncStorage.setItem('todayFasting', newFasting.toString());
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const isRecommendedDay = () => {
    const day = getDayOfWeek();
    return day === 'Monday' || day === 'Thursday';
  };

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
            ios_icon_name="moon.fill"
            android_material_icon_name="nightlight"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Fasting Tracker</Text>
          <Text style={styles.sectionSubtitle}>{fastingCount} voluntary fasts</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fastingCard}
        onPress={toggleFasting}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isFasting ? colors.gradientPurple : [colors.card, colors.cardAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fastingCardGradient}
        >
          <View style={styles.fastingCardContent}>
            <View style={[
              styles.fastingCheckCircle,
              isFasting && styles.fastingCheckCircleActive
            ]}>
              {isFasting && (
                <IconSymbol
                  ios_icon_name="checkmark"
                  android_material_icon_name="check"
                  size={24}
                  color={colors.card}
                />
              )}
            </View>
            <View style={styles.fastingInfo}>
              <Text style={[
                styles.fastingTitle,
                isFasting && styles.fastingTitleActive
              ]}>
                {isFasting ? 'Fasting Today' : 'Not Fasting Today'}
              </Text>
              <Text style={[
                styles.fastingSubtitle,
                isFasting && styles.fastingSubtitleActive
              ]}>
                {getDayOfWeek()}
                {isRecommendedDay() && ' (Recommended)'}
              </Text>
            </View>
            <IconSymbol
              ios_icon_name={isFasting ? "checkmark.circle.fill" : "circle"}
              android_material_icon_name={isFasting ? "check-circle" : "radio-button-unchecked"}
              size={32}
              color={isFasting ? colors.card : colors.border}
            />
          </View>
          
          {isRecommendedDay() && !isFasting && (
            <View style={styles.recommendationBanner}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.recommendationText}>
                Sunnah to fast on {getDayOfWeek()}s
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
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
  fastingCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  fastingCardGradient: {
    padding: spacing.lg,
  },
  fastingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fastingCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastingCheckCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: colors.card,
  },
  fastingInfo: {
    flex: 1,
  },
  fastingTitle: {
    ...typography.h4,
    color: colors.text,
  },
  fastingTitleActive: {
    color: colors.card,
  },
  fastingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fastingSubtitleActive: {
    color: colors.card,
    opacity: 0.9,
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recommendationText: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '600',
  },
});
