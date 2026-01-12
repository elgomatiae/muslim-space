
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useImanTracker } from '@/contexts/ImanTrackerContext';

export default function IbadahSection() {
  const { ibadahGoals, updateIbadahGoals } = useImanTracker();

  if (!ibadahGoals) return null;

  const toggleFardPrayer = async (prayer: keyof typeof ibadahGoals.fardPrayers) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedGoals = {
      ...ibadahGoals,
      fardPrayers: {
        ...ibadahGoals.fardPrayers,
        [prayer]: !ibadahGoals.fardPrayers[prayer],
      },
    };
    await updateIbadahGoals(updatedGoals);
  };

  const incrementCounter = async (field: string, amount: number, maxField: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentValue = ibadahGoals[field as keyof typeof ibadahGoals] as number;
    const maxValue = ibadahGoals[maxField as keyof typeof ibadahGoals] as number;
    const updatedGoals = {
      ...ibadahGoals,
      [field]: Math.min(currentValue + amount, maxValue),
    };
    await updateIbadahGoals(updatedGoals);
  };

  const fardPrayers = [
    { key: 'fajr' as const, name: 'Fajr', icon: 'sunrise.fill' },
    { key: 'dhuhr' as const, name: 'Dhuhr', icon: 'sun.max.fill' },
    { key: 'asr' as const, name: 'Asr', icon: 'sun.haze.fill' },
    { key: 'maghrib' as const, name: 'Maghrib', icon: 'sunset.fill' },
    { key: 'isha' as const, name: 'Isha', icon: 'moon.stars.fill' },
  ];

  const fardCompleted = Object.values(ibadahGoals.fardPrayers).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B98115', '#10B98105', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionWrapper}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <IconSymbol
              ios_icon_name="hands.sparkles.fill"
              android_material_icon_name="auto-awesome"
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>ʿIbādah (Worship)</Text>
            <Text style={styles.subtitle}>العبادة - Direct acts of devotion</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/(tabs)/(iman)/goals-settings',
                params: { section: 'ibadah' }
              });
            }}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

      {/* Salah Section */}
      <View style={styles.subsection}>
        <View style={styles.subsectionHeader}>
          <IconSymbol
            ios_icon_name="hands.sparkles"
            android_material_icon_name="mosque"
            size={18}
            color="#10B981"
          />
          <Text style={styles.subsectionTitle}>Ṣalāh (Prayer)</Text>
        </View>

        <View style={styles.subsectionContent}>
          <Text style={styles.goalLabel}>Five Daily Prayers ({fardCompleted}/5)</Text>
          <View style={styles.prayersGrid}>
            {fardPrayers.map((prayer, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.prayerCard,
                    ibadahGoals.fardPrayers[prayer.key] && styles.prayerCardCompleted
                  ]}
                  onPress={() => toggleFardPrayer(prayer.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkCircle,
                    ibadahGoals.fardPrayers[prayer.key] && styles.checkCircleCompleted
                  ]}>
                    {ibadahGoals.fardPrayers[prayer.key] && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.prayerName,
                    ibadahGoals.fardPrayers[prayer.key] && styles.prayerNameCompleted
                  ]}>
                    {prayer.name}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {ibadahGoals.sunnahDailyGoal > 0 && (
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Sunnah Prayers ({ibadahGoals.sunnahCompleted}/{ibadahGoals.sunnahDailyGoal} today)
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ibadahGoals.sunnahDailyGoal > 0 ? (ibadahGoals.sunnahCompleted / ibadahGoals.sunnahDailyGoal) * 100 : 0}%`,
                      backgroundColor: '#10B981',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('sunnahCompleted', 1, 'sunnahDailyGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.incrementText}>Mark Sunnah</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {ibadahGoals.tahajjudWeeklyGoal > 0 && (
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Tahajjud ({ibadahGoals.tahajjudCompleted}/{ibadahGoals.tahajjudWeeklyGoal} this week)
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ibadahGoals.tahajjudWeeklyGoal > 0 ? (ibadahGoals.tahajjudCompleted / ibadahGoals.tahajjudWeeklyGoal) * 100 : 0}%`,
                      backgroundColor: '#10B981',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('tahajjudCompleted', 1, 'tahajjudWeeklyGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.incrementText}>Mark Tahajjud</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Quran Section */}
      {(ibadahGoals.quranDailyPagesGoal > 0 || ibadahGoals.quranDailyVersesGoal > 0 || ibadahGoals.quranWeeklyMemorizationGoal > 0) && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="book.fill"
              android_material_icon_name="book"
              size={18}
              color="#10B981"
            />
            <Text style={styles.subsectionTitle}>Qur&apos;an</Text>
          </View>

          <View style={styles.subsectionContent}>
            {ibadahGoals.quranDailyPagesGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Pages ({ibadahGoals.quranDailyPagesCompleted}/{ibadahGoals.quranDailyPagesGoal})
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${ibadahGoals.quranDailyPagesGoal > 0 ? (ibadahGoals.quranDailyPagesCompleted / ibadahGoals.quranDailyPagesGoal) * 100 : 0}%`,
                        backgroundColor: '#10B981',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranDailyPagesCompleted', 1, 'quranDailyPagesGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+1</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranDailyPagesCompleted', 5, 'quranDailyPagesGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+5</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ibadahGoals.quranDailyVersesGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Verses ({ibadahGoals.quranDailyVersesCompleted}/{ibadahGoals.quranDailyVersesGoal})
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${ibadahGoals.quranDailyVersesGoal > 0 ? (ibadahGoals.quranDailyVersesCompleted / ibadahGoals.quranDailyVersesGoal) * 100 : 0}%`,
                        backgroundColor: '#10B981',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranDailyVersesCompleted', 1, 'quranDailyVersesGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+1</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranDailyVersesCompleted', 5, 'quranDailyVersesGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+5</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranDailyVersesCompleted', 10, 'quranDailyVersesGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+10</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ibadahGoals.quranWeeklyMemorizationGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Weekly Memorization ({ibadahGoals.quranWeeklyMemorizationCompleted}/{ibadahGoals.quranWeeklyMemorizationGoal} verses)
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${ibadahGoals.quranWeeklyMemorizationGoal > 0 ? (ibadahGoals.quranWeeklyMemorizationCompleted / ibadahGoals.quranWeeklyMemorizationGoal) * 100 : 0}%`,
                        backgroundColor: '#10B981',
                      }
                    ]} 
                  />
                </View>
                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranWeeklyMemorizationCompleted', 1, 'quranWeeklyMemorizationGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+1</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => incrementCounter('quranWeeklyMemorizationCompleted', 3, 'quranWeeklyMemorizationGoal')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+3</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Dhikr & Dua Section */}
      {(ibadahGoals.dhikrDailyGoal > 0 || ibadahGoals.duaDailyGoal > 0) && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="back-hand"
              size={18}
              color="#10B981"
            />
            <Text style={styles.subsectionTitle}>Dhikr & Duʿāʾ</Text>
          </View>

          <View style={styles.subsectionContent}>
            {ibadahGoals.dhikrDailyGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Dhikr ({ibadahGoals.dhikrDailyCompleted}/{ibadahGoals.dhikrDailyGoal})
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${ibadahGoals.dhikrDailyGoal > 0 ? Math.min(100, (ibadahGoals.dhikrDailyCompleted / ibadahGoals.dhikrDailyGoal) * 100) : 0}%`,
                        backgroundColor: '#10B981',
                      }
                    ]} 
                  />
                </View>

                {/* OPEN DHIKR WINDOW BUTTON */}
                <TouchableOpacity
                  style={styles.dhikrWindowButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(tabs)/(iman)/dhikr-window' as any);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dhikrWindowGradient}
                  >
                    <IconSymbol
                      ios_icon_name="hand.raised.fingers.spread.fill"
                      android_material_icon_name="back-hand"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.dhikrWindowText}>Open Tasbih Counter</Text>
                    <IconSymbol
                      ios_icon_name="arrow.right"
                      android_material_icon_name="arrow-forward"
                      size={20}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.counterButtons}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const updatedGoals = {
                        ...ibadahGoals,
                        dhikrDailyCompleted: ibadahGoals.dhikrDailyCompleted + 10,
                        dhikrWeeklyCompleted: ibadahGoals.dhikrWeeklyCompleted + 10,
                      };
                      updateIbadahGoals(updatedGoals);
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+10</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const updatedGoals = {
                        ...ibadahGoals,
                        dhikrDailyCompleted: ibadahGoals.dhikrDailyCompleted + 33,
                        dhikrWeeklyCompleted: ibadahGoals.dhikrWeeklyCompleted + 33,
                      };
                      updateIbadahGoals(updatedGoals);
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+33</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const updatedGoals = {
                        ...ibadahGoals,
                        dhikrDailyCompleted: ibadahGoals.dhikrDailyCompleted + 100,
                        dhikrWeeklyCompleted: ibadahGoals.dhikrWeeklyCompleted + 100,
                      };
                      updateIbadahGoals(updatedGoals);
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.counterGradient}
                    >
                      <Text style={styles.counterText}>+100</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ibadahGoals.duaDailyGoal > 0 && (
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>
                  Daily Duʿāʾ ({ibadahGoals.duaDailyCompleted}/{ibadahGoals.duaDailyGoal})
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${ibadahGoals.duaDailyGoal > 0 ? (ibadahGoals.duaDailyCompleted / ibadahGoals.duaDailyGoal) * 100 : 0}%`,
                        backgroundColor: '#10B981',
                      }
                    ]} 
                  />
                </View>
                <TouchableOpacity
                  style={styles.incrementButton}
                  onPress={() => incrementCounter('duaDailyCompleted', 1, 'duaDailyGoal')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.incrementGradient}
                  >
                    <IconSymbol
                      ios_icon_name="plus"
                      android_material_icon_name="add"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.incrementText}>Mark Duʿāʾ</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Fasting Section */}
      {ibadahGoals.fastingWeeklyGoal > 0 && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <IconSymbol
              ios_icon_name="moon.fill"
              android_material_icon_name="nightlight"
              size={18}
              color="#10B981"
            />
            <Text style={styles.subsectionTitle}>Fasting (Optional)</Text>
          </View>

          <View style={styles.subsectionContent}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>
                Weekly Fasting ({ibadahGoals.fastingWeeklyCompleted}/{ibadahGoals.fastingWeeklyGoal} days)
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${ibadahGoals.fastingWeeklyGoal > 0 ? (ibadahGoals.fastingWeeklyCompleted / ibadahGoals.fastingWeeklyGoal) * 100 : 0}%`,
                      backgroundColor: '#10B981',
                    }
                  ]} 
                />
              </View>
              <TouchableOpacity
                style={styles.incrementButton}
                onPress={() => incrementCounter('fastingWeeklyCompleted', 1, 'fastingWeeklyGoal')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.incrementGradient}
                >
                  <IconSymbol
                    ios_icon_name="plus"
                    android_material_icon_name="add"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.incrementText}>Mark Fast</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionWrapper: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#10B98120',
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  subsection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#10B98115',
    ...shadows.small,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subsectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  subsectionContent: {
    gap: spacing.md,
  },
  goalItem: {
    gap: spacing.sm,
  },
  goalLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  prayersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  prayerCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  prayerCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#10B98110',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  checkCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  prayerName: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  prayerNameCompleted: {
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  dhikrWindowButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
    marginBottom: spacing.sm,
  },
  dhikrWindowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  dhikrWindowText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  incrementButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  incrementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  incrementText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  counterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  counterButton: {
    flex: 1,
    minWidth: '22%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.medium,
  },
  counterGradient: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
