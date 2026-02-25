
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/I18nContext';
import { supabase } from '@/lib/supabase';

interface QadaPrayer {
  id: string;
  prayerName: string;
  count: number;
  dateAdded: string;
}

export default function QadaTrackerScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [qadaPrayers, setQadaPrayers] = useState<QadaPrayer[]>([
    { id: 'fajr', prayerName: 'Fajr', count: 0, dateAdded: new Date().toISOString() },
    { id: 'dhuhr', prayerName: 'Dhuhr', count: 0, dateAdded: new Date().toISOString() },
    { id: 'asr', prayerName: 'Asr', count: 0, dateAdded: new Date().toISOString() },
    { id: 'maghrib', prayerName: 'Maghrib', count: 0, dateAdded: new Date().toISOString() },
    { id: 'isha', prayerName: 'Isha', count: 0, dateAdded: new Date().toISOString() },
  ]);

  const [addingCount, setAddingCount] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadQadaPrayers();
  }, []);

  const loadQadaPrayers = async () => {
    try {
      const saved = await AsyncStorage.getItem('qadaPrayers');
      if (saved) {
        setQadaPrayers(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading qada prayers:', error);
    }
  };

  const saveQadaPrayers = async (prayers: QadaPrayer[]) => {
    try {
      await AsyncStorage.setItem('qadaPrayers', JSON.stringify(prayers));
      setQadaPrayers(prayers);
    } catch (error) {
      console.log('Error saving qada prayers:', error);
    }
  };

  const addQadaPrayer = (prayerId: string, amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = qadaPrayers.map(prayer => 
      prayer.id === prayerId 
        ? { ...prayer, count: prayer.count + amount }
        : prayer
    );
    saveQadaPrayers(updated);
  };

  const completeQadaPrayer = (prayerId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = qadaPrayers.map(prayer => 
      prayer.id === prayerId && prayer.count > 0
        ? { ...prayer, count: prayer.count - 1 }
        : prayer
    );
    saveQadaPrayers(updated);
  };

  const handleAddCustomCount = (prayerId: string) => {
    const count = parseInt(addingCount[prayerId] || '0');
    if (count > 0 && count <= 1000) {
      addQadaPrayer(prayerId, count);
      setAddingCount({ ...addingCount, [prayerId]: '' });
    } else {
      Alert.alert('Invalid Input', 'Please enter a number between 1 and 1000');
    }
  };

  const totalQada = qadaPrayers.reduce((sum, prayer) => sum + prayer.count, 0);

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
        <Text style={styles.headerTitle}>Qada Prayers</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Track and make up missed prayers (Qada). Add missed prayers and mark them as completed when you pray them.
          </Text>
        </View>

        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>Total Qada Prayers</Text>
          <Text style={styles.summaryCount}>{totalQada}</Text>
          <Text style={styles.summarySubtitle}>
            {totalQada === 0 ? 'All caught up! Alhamdulillah 🎉' : 'Keep making them up consistently'}
          </Text>
        </LinearGradient>

        {qadaPrayers.map((prayer, index) => (
          <React.Fragment key={index}>
            <View style={styles.prayerCard}>
              <View style={styles.prayerHeader}>
                <View style={styles.prayerTitleRow}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.prayerIcon}
                  >
                    <IconSymbol
                      ios_icon_name="moon.fill"
                      android_material_icon_name="brightness-3"
                      size={20}
                      color={colors.card}
                    />
                  </LinearGradient>
                  <View style={styles.prayerTitleContainer}>
                    <Text style={styles.prayerName}>{prayer.prayerName}</Text>
                    <Text style={styles.prayerCount}>
                      {prayer.count} {prayer.count === 1 ? 'prayer' : 'prayers'} to make up
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.prayerActions}>
                <View style={styles.quickAddButtons}>
                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => addQadaPrayer(prayer.id, 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickAddButtonText}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => addQadaPrayer(prayer.id, 5)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickAddButtonText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => addQadaPrayer(prayer.id, 10)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickAddButtonText}>+10</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.customAddRow}>
                  <TextInput
                    style={styles.customInput}
                    value={addingCount[prayer.id] || ''}
                    onChangeText={(text) => setAddingCount({ ...addingCount, [prayer.id]: text })}
                    keyboardType="number-pad"
                    placeholder={t('iman.custom')}
                    placeholderTextColor={colors.textSecondary}
                    maxLength={4}
                  />
                  <TouchableOpacity
                    style={styles.customAddButton}
                    onPress={() => handleAddCustomCount(prayer.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.customAddButtonGradient}
                    >
                      <IconSymbol
                        ios_icon_name="plus"
                        android_material_icon_name="add"
                        size={16}
                        color={colors.card}
                      />
                      <Text style={styles.customAddButtonText}>Add</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {prayer.count > 0 && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => completeQadaPrayer(prayer.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[colors.success, colors.successDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.completeButtonGradient}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={colors.card}
                      />
                      <Text style={styles.completeButtonText}>Mark 1 as Completed</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </React.Fragment>
        ))}

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.tipsTitle}>Tips for Making Up Qada</Text>
          </View>
          <Text style={styles.tipsText}>
            - Make a consistent schedule to pray qada prayers{'\n'}
            - You can combine qada prayers with current prayers{'\n'}
            - Start with the oldest missed prayers first{'\n'}
            - Be patient and consistent, even if it takes time{'\n'}
            - Make sincere repentance (Tawbah) for missed prayers
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.colored,
  },
  summaryTitle: {
    ...typography.body,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  summaryCount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.card,
    marginBottom: spacing.sm,
  },
  summarySubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
  },
  prayerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  prayerHeader: {
    marginBottom: spacing.md,
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerTitleContainer: {
    flex: 1,
  },
  prayerName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  prayerCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prayerActions: {
    gap: spacing.md,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAddButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  customAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  customAddButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.medium,
  },
  customAddButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  customAddButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  completeButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  completeButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  tipsCard: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  tipsText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
