
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: 'kahf',
    title: 'Surah Al-Kahf Friday',
    description: 'Recite Surah Al-Kahf on Friday',
    points: 20,
    completed: false,
  },
  {
    id: 'morning_adhkar',
    title: 'Morning Adhkar Streak',
    description: 'Complete morning adhkar for 7 days',
    points: 30,
    completed: false,
  },
  {
    id: 'tahajjud',
    title: 'Night Prayer',
    description: 'Pray Tahajjud 3 times this week',
    points: 25,
    completed: false,
  },
];

export default function ChallengesSection() {
  const [challenges, setChallenges] = useState<Challenge[]>(WEEKLY_CHALLENGES);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const saved = await AsyncStorage.getItem('challenges');
      if (saved) {
        setChallenges(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading challenges:', error);
    }
  };

  const toggleChallenge = async (challengeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newChallenges = challenges.map(c => 
      c.id === challengeId ? { ...c, completed: !c.completed } : c
    );
    
    setChallenges(newChallenges);
    await AsyncStorage.setItem('challenges', JSON.stringify(newChallenges));
    
    const challenge = newChallenges.find(c => c.id === challengeId);
    if (challenge?.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalPoints = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.points, 0);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconContainer}
        >
          <IconSymbol
            ios_icon_name="trophy.fill"
            android_material_icon_name="emoji-events"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Weekly Challenges</Text>
          <Text style={styles.sectionSubtitle}>{completedCount}/{challenges.length} • {totalPoints} points</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.challengesScroll}>
        {challenges.map((challenge, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[
                styles.challengeCard,
                challenge.completed && styles.challengeCardCompleted
              ]}
              onPress={() => toggleChallenge(challenge.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={challenge.completed 
                  ? [colors.accent, colors.accentDark]
                  : [colors.card, colors.cardAlt]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.challengeCardGradient}
              >
                <View style={styles.challengeHeader}>
                  <View style={[
                    styles.challengeCheckCircle,
                    challenge.completed && styles.challengeCheckCircleCompleted
                  ]}>
                    {challenge.completed && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.card}
                      />
                    )}
                  </View>
                  <View style={styles.challengePoints}>
                    <Text style={[
                      styles.challengePointsText,
                      challenge.completed && styles.challengePointsTextCompleted
                    ]}>
                      +{challenge.points}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.challengeTitle,
                  challenge.completed && styles.challengeTitleCompleted
                ]}>
                  {challenge.title}
                </Text>
                <Text style={[
                  styles.challengeDescription,
                  challenge.completed && styles.challengeDescriptionCompleted
                ]}>
                  {challenge.description}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>
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
  challengesScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  challengeCard: {
    width: 200,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  challengeCardCompleted: {
    ...shadows.colored,
  },
  challengeCardGradient: {
    padding: spacing.lg,
    minHeight: 150,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  challengeCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeCheckCircleCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: colors.card,
  },
  challengePoints: {
    backgroundColor: colors.accent + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  challengePointsText: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '700',
  },
  challengePointsTextCompleted: {
    color: colors.card,
  },
  challengeTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  challengeTitleCompleted: {
    color: colors.card,
  },
  challengeDescription: {
    ...typography.small,
    color: colors.textSecondary,
  },
  challengeDescriptionCompleted: {
    color: colors.card,
    opacity: 0.9,
  },
});
