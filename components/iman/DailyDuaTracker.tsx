
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const DAILY_DUAS = [
  {
    id: 'morning',
    name: 'Morning Adhkar',
    arabic: 'أَذْكَارُ الصَّبَاحِ',
    time: 'After Fajr',
  },
  {
    id: 'evening',
    name: 'Evening Adhkar',
    arabic: 'أَذْكَارُ الْمَسَاءِ',
    time: 'After Asr',
  },
  {
    id: 'sleep',
    name: 'Before Sleep',
    arabic: 'أَذْكَارُ النَّوْمِ',
    time: 'Bedtime',
  },
];

export default function DailyDuaTracker() {
  const [completedDuas, setCompletedDuas] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDuaData();
  }, []);

  const loadDuaData = async () => {
    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem('duaDate');
      
      if (lastDate !== today) {
        await AsyncStorage.setItem('duaDate', today);
        await AsyncStorage.setItem('completedDuas', JSON.stringify([]));
        setCompletedDuas(new Set());
      } else {
        const saved = await AsyncStorage.getItem('completedDuas');
        if (saved) {
          setCompletedDuas(new Set(JSON.parse(saved)));
        }
      }
    } catch (error) {
      console.log('Error loading dua data:', error);
    }
  };

  const toggleDua = async (duaId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newCompleted = new Set(completedDuas);
    
    if (newCompleted.has(duaId)) {
      newCompleted.delete(duaId);
    } else {
      newCompleted.add(duaId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setCompletedDuas(newCompleted);
    await AsyncStorage.setItem('completedDuas', JSON.stringify(Array.from(newCompleted)));
  };

  const completedCount = completedDuas.size;
  const totalCount = DAILY_DUAS.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={colors.gradientInfo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconContainer}
        >
          <IconSymbol
            ios_icon_name="text.bubble.fill"
            android_material_icon_name="chat-bubble"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Daily Duas</Text>
          <Text style={styles.sectionSubtitle}>{completedCount}/{totalCount} completed</Text>
        </View>
      </View>

      <View style={styles.duasContainer}>
        {DAILY_DUAS.map((dua, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[
                styles.duaCard,
                completedDuas.has(dua.id) && styles.duaCardCompleted
              ]}
              onPress={() => toggleDua(dua.id)}
              activeOpacity={0.7}
            >
              <View style={styles.duaCardContent}>
                <View style={[
                  styles.duaCheckCircle,
                  completedDuas.has(dua.id) && styles.duaCheckCircleCompleted
                ]}>
                  {completedDuas.has(dua.id) && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color={colors.card}
                    />
                  )}
                </View>
                <View style={styles.duaInfo}>
                  <Text style={[
                    styles.duaName,
                    completedDuas.has(dua.id) && styles.duaNameCompleted
                  ]}>
                    {dua.name}
                  </Text>
                  <Text style={styles.duaArabic}>{dua.arabic}</Text>
                  <Text style={styles.duaTime}>{dua.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
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
  duasContainer: {
    gap: spacing.sm,
  },
  duaCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.small,
  },
  duaCardCompleted: {
    borderColor: colors.info,
    backgroundColor: colors.info + '10',
  },
  duaCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  duaCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duaCheckCircleCompleted: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  duaInfo: {
    flex: 1,
  },
  duaName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  duaNameCompleted: {
    color: colors.info,
  },
  duaArabic: {
    ...typography.caption,
    color: colors.text,
    marginTop: 2,
  },
  duaTime: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
