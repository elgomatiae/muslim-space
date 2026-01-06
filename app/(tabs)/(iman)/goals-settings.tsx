
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import * as Haptics from 'expo-haptics';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import { IbadahGoals, IlmGoals, AmanahGoals } from '@/utils/imanScoreCalculator';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

type SectionType = 'ibadah' | 'ilm' | 'amanah';
type FrequencyType = 'daily' | 'weekly';

interface GoalConfig {
  id: string;
  label: string;
  description: string;
  goalField: string;
  completedField?: string;
  frequencyField?: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  enabled: boolean;
  canDisable: boolean;
  isRequired?: boolean;
  defaultFrequency: FrequencyType;
  currentFrequency?: FrequencyType;
}

const WORKOUT_TYPES = [
  { id: 'cardio', label: 'Cardio', icon: 'figure.run' },
  { id: 'strength', label: 'Strength', icon: 'dumbbell.fill' },
  { id: 'flexibility', label: 'Flexibility', icon: 'figure.flexibility' },
  { id: 'sports', label: 'Sports', icon: 'sportscourt.fill' },
  { id: 'walking', label: 'Walking', icon: 'figure.walk' },
  { id: 'cycling', label: 'Cycling', icon: 'bicycle' },
];

const FARD_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function GoalsSettingsScreen() {
  const { section } = useLocalSearchParams<{ section?: SectionType }>();
  const { ibadahGoals, ilmGoals, amanahGoals, updateIbadahGoals, updateIlmGoals, updateAmanahGoals } = useImanTracker();
  const { user } = useAuth();
  
  const [selectedSection, setSelectedSection] = useState<SectionType>(section || 'ibadah');
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGoalFrequencies();
    if (selectedSection === 'amanah') {
      loadWorkoutTypes();
    }
  }, [ibadahGoals, ilmGoals, amanahGoals]);

  const loadGoalFrequencies = async () => {
    try {
      // Load frequencies from AsyncStorage or Supabase if needed
    } catch (error) {
      console.error('Error loading goal frequencies:', error);
    }
  };

  const loadWorkoutTypes = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('physical_wellness_goals')
        .select('workout_types')
        .eq('user_id', user.id)
        .single();

      if (data?.workout_types) {
        setSelectedWorkoutTypes(data.workout_types);
      }
    } catch (error) {
      console.error('Error loading workout types:', error);
    }
  };

  const toggleWorkoutType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTypes = selectedWorkoutTypes.includes(type)
      ? selectedWorkoutTypes.filter(t => t !== type)
      : [...selectedWorkoutTypes, type];
    
    setSelectedWorkoutTypes(newTypes);
    saveWorkoutTypes(newTypes);
  };

  const saveWorkoutTypes = async (types: string[]) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('physical_wellness_goals')
        .upsert({
          user_id: user.id,
          workout_types: types,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving workout types:', error);
    }
  };

  const toggleFrequency = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Toggle frequency logic here
  };

  const getCurrentGoals = () => {
    switch (selectedSection) {
      case 'ibadah': return ibadahGoals;
      case 'ilm': return ilmGoals;
      case 'amanah': return amanahGoals;
      default: return ibadahGoals;
    }
  };

  const getCurrentConfigs = (): GoalConfig[] => {
    const currentGoals = getCurrentGoals();
    
    switch (selectedSection) {
      case 'ibadah':
        return [
          {
            id: 'fard_prayers',
            label: 'Fard Prayers',
            description: 'Complete your 5 daily obligatory prayers',
            goalField: 'daily_fard_prayers_goal',
            completedField: 'daily_fard_prayers_completed',
            min: 0,
            max: 5,
            step: 1,
            unit: 'prayers',
            enabled: true,
            canDisable: false,
            isRequired: true,
            defaultFrequency: 'daily',
          },
          {
            id: 'quran_pages',
            label: 'Quran Reading',
            description: 'Read pages of the Quran',
            goalField: 'daily_quran_pages_goal',
            completedField: 'daily_quran_pages_completed',
            frequencyField: 'quran_frequency',
            min: 0,
            max: 20,
            step: 1,
            unit: 'pages',
            enabled: (currentGoals as IbadahGoals).daily_quran_pages_goal > 0,
            canDisable: true,
            defaultFrequency: 'daily',
            currentFrequency: (currentGoals as IbadahGoals).quran_frequency || 'daily',
          },
          {
            id: 'dhikr_count',
            label: 'Dhikr',
            description: 'Remember Allah through dhikr',
            goalField: 'daily_dhikr_count_goal',
            completedField: 'daily_dhikr_count_completed',
            frequencyField: 'dhikr_frequency',
            min: 0,
            max: 500,
            step: 10,
            unit: 'times',
            enabled: (currentGoals as IbadahGoals).daily_dhikr_count_goal > 0,
            canDisable: true,
            defaultFrequency: 'daily',
            currentFrequency: (currentGoals as IbadahGoals).dhikr_frequency || 'daily',
          },
        ];
      
      case 'ilm':
        return [
          {
            id: 'lectures',
            label: 'Islamic Lectures',
            description: 'Watch educational Islamic content',
            goalField: 'weekly_lectures_goal',
            completedField: 'weekly_lectures_completed',
            min: 0,
            max: 20,
            step: 1,
            unit: 'lectures',
            enabled: (currentGoals as IlmGoals).weekly_lectures_goal > 0,
            canDisable: true,
            defaultFrequency: 'weekly',
          },
          {
            id: 'recitations',
            label: 'Quran Recitations',
            description: 'Listen to Quran recitations',
            goalField: 'weekly_recitations_goal',
            completedField: 'weekly_recitations_completed',
            min: 0,
            max: 20,
            step: 1,
            unit: 'recitations',
            enabled: (currentGoals as IlmGoals).weekly_recitations_goal > 0,
            canDisable: true,
            defaultFrequency: 'weekly',
          },
        ];
      
      case 'amanah':
        return [
          {
            id: 'exercise',
            label: 'Exercise',
            description: 'Physical activity minutes',
            goalField: 'daily_exercise_minutes_goal',
            completedField: 'daily_exercise_minutes_completed',
            min: 0,
            max: 120,
            step: 5,
            unit: 'minutes',
            enabled: (currentGoals as AmanahGoals).daily_exercise_minutes_goal > 0,
            canDisable: true,
            defaultFrequency: 'daily',
          },
          {
            id: 'sleep',
            label: 'Sleep',
            description: 'Hours of quality sleep',
            goalField: 'daily_sleep_hours_goal',
            completedField: 'daily_sleep_hours_completed',
            min: 0,
            max: 12,
            step: 0.5,
            unit: 'hours',
            enabled: (currentGoals as AmanahGoals).daily_sleep_hours_goal > 0,
            canDisable: true,
            defaultFrequency: 'daily',
          },
          {
            id: 'water',
            label: 'Water Intake',
            description: 'Glasses of water',
            goalField: 'daily_water_glasses_goal',
            completedField: 'daily_water_glasses_completed',
            min: 0,
            max: 15,
            step: 1,
            unit: 'glasses',
            enabled: (currentGoals as AmanahGoals).daily_water_glasses_goal > 0,
            canDisable: true,
            defaultFrequency: 'daily',
          },
        ];
      
      default:
        return [];
    }
  };

  const updateGoalValue = (goalField: string, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (selectedSection) {
      case 'ibadah':
        updateIbadahGoals({ [goalField]: value });
        break;
      case 'ilm':
        updateIlmGoals({ [goalField]: value });
        break;
      case 'amanah':
        updateAmanahGoals({ [goalField]: value });
        break;
    }
  };

  const toggleGoal = (goalField: string, currentValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentValue > 0) {
      updateGoalValue(goalField, 0);
    } else {
      const defaultValue = getDefaultValue(goalField);
      updateGoalValue(goalField, defaultValue);
    }
  };

  const getDefaultValue = (goalField: string): number => {
    const defaults: { [key: string]: number } = {
      daily_fard_prayers_goal: 5,
      daily_quran_pages_goal: 2,
      daily_dhikr_count_goal: 100,
      weekly_lectures_goal: 3,
      weekly_recitations_goal: 3,
      daily_exercise_minutes_goal: 30,
      daily_sleep_hours_goal: 7,
      daily_water_glasses_goal: 8,
    };
    
    return defaults[goalField] || 1;
  };

  const saveGoals = async () => {
    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Your goals have been saved!');
      router.back();
    }, 500);
  };

  const renderGoalItem = (config: GoalConfig) => {
    const currentGoals = getCurrentGoals();
    const currentValue = currentGoals[config.goalField as keyof typeof currentGoals] as number;
    
    return (
      <View key={`goal-${config.id}-${selectedSection}`} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleRow}>
            <Text style={styles.goalLabel}>{config.label}</Text>
            {config.canDisable && (
              <Switch
                value={config.enabled}
                onValueChange={() => toggleGoal(config.goalField, currentValue)}
                trackColor={{ false: colors.gray[300], true: getSectionColor(selectedSection) }}
                thumbColor={colors.white}
              />
            )}
          </View>
          <Text style={styles.goalDescription}>{config.description}</Text>
        </View>

        {config.enabled && (
          <>
            {config.frequencyField && (
              <TouchableOpacity
                style={styles.frequencyToggle}
                onPress={() => toggleFrequency(config.id)}
              >
                <Text style={styles.frequencyLabel}>Frequency:</Text>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>
                    {config.currentFrequency || config.defaultFrequency}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.goalControls}>
              <TouchableOpacity
                style={[styles.controlButton, currentValue <= config.min && styles.controlButtonDisabled]}
                onPress={() => updateGoalValue(config.goalField, Math.max(config.min, currentValue - config.step))}
                disabled={currentValue <= config.min}
              >
                <IconSymbol name="minus" size={20} color={currentValue <= config.min ? colors.gray[400] : colors.white} />
              </TouchableOpacity>

              <View style={styles.goalValueContainer}>
                <Text style={styles.goalValue}>{currentValue}</Text>
                <Text style={styles.goalUnit}>{config.unit}</Text>
              </View>

              <TouchableOpacity
                style={[styles.controlButton, currentValue >= config.max && styles.controlButtonDisabled]}
                onPress={() => updateGoalValue(config.goalField, Math.min(config.max, currentValue + config.step))}
                disabled={currentValue >= config.max}
              >
                <IconSymbol name="plus" size={20} color={currentValue >= config.max ? colors.gray[400] : colors.white} />
              </TouchableOpacity>
            </View>

            {config.id === 'exercise' && selectedSection === 'amanah' && (
              <View style={styles.workoutTypesContainer}>
                <Text style={styles.workoutTypesLabel}>Workout Types:</Text>
                <View style={styles.workoutTypesGrid}>
                  {WORKOUT_TYPES.map((type, index) => (
                    <TouchableOpacity
                      key={`workout-type-${type.id}-${index}`}
                      style={[
                        styles.workoutTypeChip,
                        selectedWorkoutTypes.includes(type.id) && styles.workoutTypeChipSelected
                      ]}
                      onPress={() => toggleWorkoutType(type.id)}
                    >
                      <IconSymbol 
                        name={type.icon} 
                        size={16} 
                        color={selectedWorkoutTypes.includes(type.id) ? colors.white : colors.gray[600]} 
                      />
                      <Text style={[
                        styles.workoutTypeText,
                        selectedWorkoutTypes.includes(type.id) && styles.workoutTypeTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const getSectionColor = (section: SectionType): string => {
    switch (section) {
      case 'ibadah': return colors.primary;
      case 'ilm': return colors.secondary;
      case 'amanah': return colors.accent;
      default: return colors.primary;
    }
  };

  const getSectionIcon = (section: SectionType): string => {
    switch (section) {
      case 'ibadah': return 'hands.sparkles.fill';
      case 'ilm': return 'book.fill';
      case 'amanah': return 'heart.fill';
      default: return 'star.fill';
    }
  };

  const getSectionTitle = (section: SectionType): string => {
    switch (section) {
      case 'ibadah': return 'Worship Goals';
      case 'ilm': return 'Knowledge Goals';
      case 'amanah': return 'Wellness Goals';
      default: return 'Goals';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[getSectionColor(selectedSection), colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getSectionTitle(selectedSection)}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.sectionTabs}>
          {(['ibadah', 'ilm', 'amanah'] as SectionType[]).map((section) => (
            <TouchableOpacity
              key={`section-tab-${section}`}
              style={[
                styles.sectionTab,
                selectedSection === section && styles.sectionTabActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedSection(section);
              }}
            >
              <IconSymbol 
                name={getSectionIcon(section)} 
                size={20} 
                color={selectedSection === section ? colors.white : colors.gray[400]} 
              />
              <Text style={[
                styles.sectionTabText,
                selectedSection === section && styles.sectionTabTextActive
              ]}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {getCurrentConfigs().map((config) => renderGoalItem(config))}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveGoals}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[getSectionColor(selectedSection), getSectionColor(selectedSection) + 'CC']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>Save Goals</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  sectionTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  sectionTabText: {
    ...typography.caption,
    color: colors.gray[400],
    fontWeight: '600',
  },
  sectionTabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  goalHeader: {
    marginBottom: spacing.md,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  goalLabel: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  goalDescription: {
    ...typography.body,
    color: colors.gray[600],
  },
  frequencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  frequencyLabel: {
    ...typography.body,
    color: colors.gray[700],
    fontWeight: '500',
  },
  frequencyBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  frequencyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  goalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  controlButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  goalValueContainer: {
    alignItems: 'center',
  },
  goalValue: {
    ...typography.h1,
    color: colors.text,
    fontWeight: '700',
  },
  goalUnit: {
    ...typography.caption,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  workoutTypesContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  workoutTypesLabel: {
    ...typography.body,
    color: colors.gray[700],
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  workoutTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  workoutTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  workoutTypeChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  workoutTypeText: {
    ...typography.caption,
    color: colors.gray[600],
    fontWeight: '500',
  },
  workoutTypeTextSelected: {
    color: colors.white,
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  saveButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
  },
});
