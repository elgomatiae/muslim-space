/**
 * PrayerSettingsScreen - Simplified settings for GPS-based prayer times
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getCurrentLocation, hasLocationPermission, requestLocationPermission } from '@/services/LocationService';
import { getTodayPrayerTimes } from '@/services/PrayerTimeService';

export default function PrayerSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<string>('');
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Check location permission
      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        setLocationInfo('Location permission not granted');
        setLoading(false);
        return;
      }

      // Get current location
      try {
        const location = await getCurrentLocation();
        setLocationInfo(`${location.city} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`);
        
        // Get prayer times for display
        const times = await getTodayPrayerTimes();
        setPrayerTimes(times);
      } catch (error: any) {
        setLocationInfo('Unable to get location: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading prayer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      await loadSettings();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prayer settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Settings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Location Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <IconSymbol
            ios_icon_name="location.fill"
            android_material_icon_name="location-on"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Location</Text>
        </View>
        <Text style={styles.cardText}>{locationInfo || 'Not available'}</Text>
        <Text style={styles.cardDescription}>
          Prayer times are calculated using your exact GPS location for maximum accuracy.
        </Text>
        {!locationInfo && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Prayer Times Card */}
      {prayerTimes && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Today's Prayer Times</Text>
          </View>
          <View style={styles.prayerTimesList}>
            {prayerTimes.prayers.map((prayer: any) => (
              <View key={prayer.name} style={styles.prayerTimeRow}>
                <View style={styles.prayerTimeLeft}>
                  <Text style={styles.prayerTimeName}>{prayer.name}</Text>
                  <Text style={styles.prayerTimeArabic}>{prayer.arabicName}</Text>
                </View>
                <Text style={styles.prayerTimeValue}>{prayer.time}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>How It Works</Text>
        </View>
        <Text style={styles.cardDescription}>
          Prayer times are calculated using astronomical algorithms based on your exact GPS coordinates.
          The system uses the ISNA (Islamic Society of North America) calculation method, which is widely
          accepted and provides accurate times for your specific location.
        </Text>
        <Text style={[styles.cardDescription, { marginTop: spacing.sm }]}>
          Times automatically update when you move to a new location. Your location is cached for 24 hours
          to save battery while maintaining accuracy.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
  },
  cardText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  permissionButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  prayerTimesList: {
    gap: spacing.sm,
  },
  prayerTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prayerTimeLeft: {
    flex: 1,
  },
  prayerTimeName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  prayerTimeArabic: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  prayerTimeValue: {
    ...typography.h4,
    color: colors.primary,
  },
});
