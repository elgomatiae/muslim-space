
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getCalculationMethod,
  saveCalculationMethod,
  CALCULATION_METHODS,
  getPrayerTimeAdjustments,
  savePrayerTimeAdjustments,
  PrayerTimeAdjustments,
  refreshPrayerTimes,
  shouldUseApi,
  setUseApi,
} from '@/utils/prayerTimeService';
import { getCachedPrayerTimesData } from '@/utils/prayerTimeService';

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState('NorthAmerica');
  const [useApiForTimes, setUseApiForTimes] = useState(true);
  const [adjustments, setAdjustments] = useState<PrayerTimeAdjustments>({
    fajr_offset: 0,
    dhuhr_offset: 0,
    asr_offset: 0,
    maghrib_offset: 0,
    isha_offset: 0,
  });
  const [locationInfo, setLocationInfo] = useState<string>('');
  const [source, setSource] = useState<'api' | 'calculation' | 'default'>('api');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load calculation method
      const method = await getCalculationMethod();
      setCalculationMethod(method);

      // Load API preference
      const useApi = await shouldUseApi();
      setUseApiForTimes(useApi);

      // Load adjustments
      const savedAdjustments = await getPrayerTimeAdjustments();
      if (savedAdjustments) {
        setAdjustments(savedAdjustments);
      }

      // Load location info
      const cachedData = await getCachedPrayerTimesData();
      if (cachedData) {
        setLocationInfo(
          cachedData.locationName || 
          `${cachedData.location.latitude.toFixed(4)}, ${cachedData.location.longitude.toFixed(4)}`
        );
        setSource(cachedData.source || 'api');
      }
    } catch (error) {
      console.error('Error loading prayer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiToggle = async (value: boolean) => {
    try {
      setSaving(true);
      setUseApiForTimes(value);
      await setUseApi(value);
      
      // Refresh prayer times with new source
      await refreshPrayerTimes();
      
      Alert.alert(
        'Success',
        value 
          ? 'Now using online API for city-specific prayer times.'
          : 'Now using local calculation for prayer times.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error changing API preference:', error);
      Alert.alert('Error', 'Failed to update prayer time source');
    } finally {
      setSaving(false);
    }
  };

  const handleMethodChange = async (method: string) => {
    try {
      setSaving(true);
      setCalculationMethod(method);
      await saveCalculationMethod(method);
      
      // Refresh prayer times with new method
      await refreshPrayerTimes();
      
      Alert.alert(
        'Success',
        useApiForTimes 
          ? 'Calculation method updated. Prayer times have been fetched from online API for your location.'
          : 'Calculation method updated. Prayer times have been recalculated based on your location.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error changing calculation method:', error);
      Alert.alert('Error', 'Failed to update calculation method');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustmentChange = (prayer: keyof PrayerTimeAdjustments, delta: number) => {
    setAdjustments(prev => ({
      ...prev,
      [prayer]: prev[prayer] + delta,
    }));
  };

  const handleSaveAdjustments = async () => {
    try {
      setSaving(true);
      await savePrayerTimeAdjustments(adjustments);
      
      // Refresh prayer times with new adjustments
      await refreshPrayerTimes();
      
      Alert.alert(
        'Success',
        'Prayer time adjustments saved successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving adjustments:', error);
      Alert.alert('Error', 'Failed to save adjustments');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAdjustments = () => {
    Alert.alert(
      'Reset Adjustments',
      'Are you sure you want to reset all prayer time adjustments to 0?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const resetAdjustments: PrayerTimeAdjustments = {
              fajr_offset: 0,
              dhuhr_offset: 0,
              asr_offset: 0,
              maghrib_offset: 0,
              isha_offset: 0,
            };
            setAdjustments(resetAdjustments);
            await savePrayerTimeAdjustments(resetAdjustments);
            await refreshPrayerTimes();
            Alert.alert('Success', 'Adjustments reset successfully');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Time Settings</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Time Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer Time Source Card */}
        <View style={[
          styles.infoCard,
          source === 'api' && { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }
        ]}>
          <View style={[
            styles.infoIconContainer,
            source === 'api' && { backgroundColor: colors.primary + '20' }
          ]}>
            <IconSymbol
              ios_icon_name={source === 'api' ? 'globe' : 'location.fill.viewfinder'}
              android_material_icon_name={source === 'api' ? 'public' : 'my-location'}
              size={20}
              color={source === 'api' ? colors.primary : colors.success}
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={[
              styles.infoLabel,
              source === 'api' && { color: colors.primary }
            ]}>
              {source === 'api' ? 'Online API (City-Specific)' : 'Local Calculation'}
            </Text>
            <Text style={styles.infoValue}>
              {source === 'api' 
                ? `Prayer times are fetched from Aladhan API for your exact location.`
                : `Prayer times are calculated locally using the adhan library.`
              }
              {locationInfo && ` Currently: ${locationInfo}`}
            </Text>
          </View>
        </View>

        {/* API Toggle Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Time Source</Text>
          <Text style={styles.sectionDescription}>
            Choose between online API (city-specific times) or local calculation (regional times).
            Online API provides more accurate times for your specific city.
          </Text>

          <View style={styles.toggleList}>
            <TouchableOpacity
              style={[
                styles.toggleItem,
                useApiForTimes && styles.toggleItemSelected,
              ]}
              onPress={() => handleApiToggle(true)}
              disabled={saving}
            >
              <View style={styles.toggleIconContainer}>
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="public"
                  size={24}
                  color={useApiForTimes ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.toggleContent}>
                <Text style={[
                  styles.toggleLabel,
                  useApiForTimes && styles.toggleLabelSelected,
                ]}>
                  Online API (Recommended)
                </Text>
                <Text style={styles.toggleDescription}>
                  Fetches city-specific prayer times from Aladhan API based on your exact GPS coordinates.
                  More accurate for your specific location.
                </Text>
              </View>
              {useApiForTimes && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleItem,
                !useApiForTimes && styles.toggleItemSelected,
              ]}
              onPress={() => handleApiToggle(false)}
              disabled={saving}
            >
              <View style={styles.toggleIconContainer}>
                <IconSymbol
                  ios_icon_name="cpu"
                  android_material_icon_name="memory"
                  size={24}
                  color={!useApiForTimes ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.toggleContent}>
                <Text style={[
                  styles.toggleLabel,
                  !useApiForTimes && styles.toggleLabelSelected,
                ]}>
                  Local Calculation
                </Text>
                <Text style={styles.toggleDescription}>
                  Calculates prayer times locally using the adhan library. Works offline but uses
                  broad regional parameters.
                </Text>
              </View>
              {!useApiForTimes && (
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculation Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculation Method</Text>
          <Text style={styles.sectionDescription}>
            Choose the calculation method that best matches your local mosque or Islamic center.
            For Aurora (US/Canada), ISNA (North America) is recommended. 
            {useApiForTimes 
              ? ' The API will use this method to fetch city-specific times for your location.'
              : ' Prayer times will be calculated locally based on your GPS location.'
            }
          </Text>

          <View style={styles.methodList}>
            {Object.entries(CALCULATION_METHODS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.methodItem,
                  calculationMethod === key && styles.methodItemSelected,
                ]}
                onPress={() => handleMethodChange(key)}
                disabled={saving}
              >
                <View style={styles.methodContent}>
                  <Text
                    style={[
                      styles.methodLabel,
                      calculationMethod === key && styles.methodLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {key === 'NorthAmerica' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                </View>
                {calculationMethod === key && (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manual Adjustments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fine-Tune Prayer Times</Text>
          <Text style={styles.sectionDescription}>
            {useApiForTimes 
              ? 'Prayer times are fetched from online API for your city. Use these adjustments to fine-tune the times if your local mosque times differ slightly.'
              : 'Prayer times are calculated locally based on your location. Use these adjustments to fine-tune the times if your local mosque times differ slightly.'
            } These are small offsets (±minutes) applied to the {useApiForTimes ? 'fetched' : 'calculated'} times.
          </Text>

          <View style={styles.adjustmentList}>
            {[
              { key: 'fajr_offset', label: 'Fajr', arabic: 'الفجر' },
              { key: 'dhuhr_offset', label: 'Dhuhr', arabic: 'الظهر' },
              { key: 'asr_offset', label: 'Asr', arabic: 'العصر' },
              { key: 'maghrib_offset', label: 'Maghrib', arabic: 'المغرب' },
              { key: 'isha_offset', label: 'Isha', arabic: 'العشاء' },
            ].map(({ key, label, arabic }) => (
              <View key={key} style={styles.adjustmentItem}>
                <View style={styles.adjustmentInfo}>
                  <Text style={styles.adjustmentLabel}>{label}</Text>
                  <Text style={styles.adjustmentArabic}>{arabic}</Text>
                </View>
                <View style={styles.adjustmentControls}>
                  <TouchableOpacity
                    style={styles.adjustmentButton}
                    onPress={() => handleAdjustmentChange(key as keyof PrayerTimeAdjustments, -1)}
                  >
                    <IconSymbol
                      ios_icon_name="minus"
                      android_material_icon_name="remove"
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  <View style={styles.adjustmentValue}>
                    <Text style={styles.adjustmentValueText}>
                      {adjustments[key as keyof PrayerTimeAdjustments] > 0 ? '+' : ''}
                      {adjustments[key as keyof PrayerTimeAdjustments]} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustmentButton}
                    onPress={() => handleAdjustmentChange(key as keyof PrayerTimeAdjustments, 1)}
                  >
                    <IconSymbol
                      ios_icon_name="plus"
                      android_material_icon_name="add"
                      size={20}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleResetAdjustments}
              disabled={saving}
            >
              <Text style={styles.buttonSecondaryText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSaveAdjustments}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Save Adjustments</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <View style={styles.helpIconContainer}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.accent}
            />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>How It Works</Text>
            <Text style={styles.helpText}>
              {useApiForTimes ? 'Prayer times are fetched from online API using:' : 'Prayer times are calculated locally using:'}
            </Text>
            <Text style={styles.helpBullet}>• Your GPS location (latitude & longitude)</Text>
            {useApiForTimes ? (
              <>
                <Text style={styles.helpBullet}>• Aladhan API for city-specific times</Text>
                <Text style={styles.helpBullet}>• Your selected calculation method</Text>
                <Text style={styles.helpBullet}>• Optional fine-tuning adjustments</Text>
              </>
            ) : (
              <>
                <Text style={styles.helpBullet}>• The adhan library for calculations</Text>
                <Text style={styles.helpBullet}>• Your selected calculation method</Text>
                <Text style={styles.helpBullet}>• Optional fine-tuning adjustments</Text>
              </>
            )}
            <Text style={styles.helpText} style={{ marginTop: spacing.sm }}>
              Times automatically update when you move to a new location (>5km).
              {useApiForTimes && ' Online API provides more accurate city-specific times.'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.captionBold,
    color: colors.success,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    ...typography.small,
    color: colors.text,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  methodList: {
    gap: spacing.sm,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  methodContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  methodLabel: {
    ...typography.body,
    color: colors.text,
  },
  methodLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  recommendedBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  toggleList: {
    gap: spacing.md,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  toggleItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  toggleLabelSelected: {
    color: colors.primary,
  },
  toggleDescription: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  adjustmentList: {
    gap: spacing.sm,
  },
  adjustmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustmentInfo: {
    flex: 1,
  },
  adjustmentLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  adjustmentArabic: {
    ...typography.small,
    color: colors.textSecondary,
  },
  adjustmentControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adjustmentButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustmentValue: {
    minWidth: 60,
    alignItems: 'center',
  },
  adjustmentValueText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  buttonPrimaryText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  buttonSecondaryText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  helpIconContainer: {
    marginRight: spacing.md,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  helpBullet: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginBottom: 2,
  },
  bottomPadding: {
    height: 40,
  },
});
