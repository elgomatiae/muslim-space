
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/contexts/NotificationContext';
import { router } from 'expo-router';

export default function NotificationSettingsScreen() {
  const { settings, loading, requestPermissions, updateSettings, scheduledCount, refreshPrayerTimesAndNotifications } = useNotifications();
  const [requesting, setRequesting] = useState(false);
  const [refreshingPrayer, setRefreshingPrayer] = useState(false);

  const handleRequestPermissions = async () => {
    if (requesting || loading) {
      console.log('⏳ Permission request already in progress, skipping...');
      return; // Prevent multiple simultaneous requests
    }
    
    console.log('📱 Starting permission request...');
    setRequesting(true);
    
    try {
      // Request permissions - this may show system dialogs
      // The system dialogs will appear and the user can interact with them
      // The screen should remain open during this process
      await requestPermissions();
      
      console.log('✅ Permissions request completed successfully');
      
      // Wait a bit for state to update, then show success message
      // Use a longer delay to ensure the permission dialogs have fully closed
      setTimeout(() => {
        Alert.alert(
          'Permissions Updated',
          'Your notification and location permissions have been updated. You can now enable specific notification types below.',
          [{ 
            text: 'OK',
            onPress: () => {
              console.log('✅ User acknowledged permissions update');
            }
          }]
        );
      }, 1000);
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      
      // Show error alert after a delay to ensure screen is still mounted
      setTimeout(() => {
        Alert.alert(
          'Error',
          `Failed to update permissions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          [{ 
            text: 'OK',
            onPress: () => {
              console.log('✅ User acknowledged error');
            }
          }]
        );
      }, 500);
    } finally {
      // Ensure we always reset the requesting state
      // Use a delay to ensure any alerts have been shown
      setTimeout(() => {
        setRequesting(false);
        console.log('🔄 Request state reset');
      }, 200);
    }
  };

  const handleToggleSetting = async (key: keyof typeof settings) => {
    if (!settings.notificationPermissionGranted && key !== 'notificationPermissionGranted') {
      Alert.alert(
        'Permissions Required',
        'Please enable notification permissions first.',
        [{ text: 'OK' }]
      );
      return;
    }

    await updateSettings({ [key]: !settings[key] });
  };

  const handleRefreshPrayerTimes = async () => {
    if (!settings.locationPermissionGranted) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to refresh prayer times.',
        [{ text: 'OK' }]
      );
      return;
    }

    setRefreshingPrayer(true);
    try {
      await refreshPrayerTimesAndNotifications();
      Alert.alert(
        'Prayer Times Updated',
        'Prayer times and notifications have been refreshed based on your current location.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error refreshing prayer times:', error);
      Alert.alert(
        'Error',
        'Failed to refresh prayer times. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshingPrayer(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Permissions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.sectionDescription}>
            Grant permissions to receive notifications and location-based prayer times
          </Text>

          <View style={styles.card}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionLeft}>
                <View style={[
                  styles.permissionIcon,
                  settings.notificationPermissionGranted && styles.permissionIconGranted
                ]}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={20}
                    color={settings.notificationPermissionGranted ? colors.card : colors.textSecondary}
                  />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Notifications</Text>
                  <Text style={styles.permissionStatus}>
                    {settings.notificationPermissionGranted ? 'Granted' : 'Not Granted'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                settings.notificationPermissionGranted && styles.statusBadgeGranted
              ]}>
                <Text style={[
                  styles.statusText,
                  settings.notificationPermissionGranted && styles.statusTextGranted
                ]}>
                  {settings.notificationPermissionGranted ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.permissionRow}>
              <View style={styles.permissionLeft}>
                <View style={[
                  styles.permissionIcon,
                  settings.locationPermissionGranted && styles.permissionIconGranted
                ]}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={settings.locationPermissionGranted ? colors.card : colors.textSecondary}
                  />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>Location</Text>
                  <Text style={styles.permissionStatus}>
                    {settings.locationPermissionGranted ? 'Granted' : 'Not Granted'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                settings.locationPermissionGranted && styles.statusBadgeGranted
              ]}>
                <Text style={[
                  styles.statusText,
                  settings.locationPermissionGranted && styles.statusTextGranted
                ]}>
                  {settings.locationPermissionGranted ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.requestButton}
            onPress={(e) => {
              e?.preventDefault?.();
              handleRequestPermissions();
            }}
            disabled={requesting || loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.requestButtonGradient}
            >
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified-user"
                size={20}
                color={colors.card}
              />
              <Text style={styles.requestButtonText}>
                {requesting ? 'Requesting...' : 'Request Permissions'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {settings.locationPermissionGranted && (
            <TouchableOpacity
              style={[styles.requestButton, styles.refreshButton]}
              onPress={handleRefreshPrayerTimes}
              disabled={refreshingPrayer || loading}
              activeOpacity={0.7}
            >
              <View style={styles.refreshButtonContent}>
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.refreshButtonText}>
                  {refreshingPrayer ? 'Refreshing...' : 'Refresh Prayer Times'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which notifications you want to receive
          </Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="schedule"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Prayer Times</Text>
                  <Text style={styles.settingDescription}>
                    Get notified for each prayer time
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.prayerNotifications}
                onValueChange={() => handleToggleSetting('prayerNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="book.fill"
                    android_material_icon_name="menu-book"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Daily Content</Text>
                  <Text style={styles.settingDescription}>
                    Daily Quran verse and Hadith
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.dailyContentNotifications}
                onValueChange={() => handleToggleSetting('dailyContentNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="chart.pie.fill"
                    android_material_icon_name="pie-chart"
                    size={20}
                    color={colors.info}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Iman Score</Text>
                  <Text style={styles.settingDescription}>
                    Daily Iman score updates
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.imanScoreNotifications}
                onValueChange={() => handleToggleSetting('imanScoreNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="target"
                    android_material_icon_name="track-changes"
                    size={20}
                    color={colors.success}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Iman Tracker</Text>
                  <Text style={styles.settingDescription}>
                    Progress and milestone updates
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.imanTrackerNotifications}
                onValueChange={() => handleToggleSetting('imanTrackerNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="bell.badge.fill"
                    android_material_icon_name="notifications-active"
                    size={20}
                    color={colors.warning}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Goal Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Reminders to complete your goals
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.goalReminderNotifications}
                onValueChange={() => handleToggleSetting('goalReminderNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <IconSymbol
                    ios_icon_name="trophy.fill"
                    android_material_icon_name="emoji-events"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Achievements</Text>
                  <Text style={styles.settingDescription}>
                    Achievement unlock notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.achievementNotifications}
                onValueChange={() => handleToggleSetting('achievementNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                disabled={!settings.notificationPermissionGranted}
              />
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Scheduled Notifications</Text>
              <Text style={styles.statusValue}>{scheduledCount}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Notification Permission</Text>
              <Text style={[
                styles.statusValue,
                settings.notificationPermissionGranted && styles.statusValueActive
              ]}>
                {settings.notificationPermissionGranted ? 'Granted' : 'Not Granted'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Location Permission</Text>
              <Text style={[
                styles.statusValue,
                settings.locationPermissionGranted && styles.statusValueActive
              ]}>
                {settings.locationPermissionGranted ? 'Granted' : 'Not Granted'}
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  permissionIconGranted: {
    backgroundColor: colors.primary,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  permissionStatus: {
    ...typography.small,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
  },
  statusBadgeGranted: {
    backgroundColor: colors.primary,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTextGranted: {
    color: colors.card,
  },
  requestButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.colored,
  },
  requestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  requestButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.card,
  },
  refreshButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  refreshButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.small,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statusLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statusValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  statusValueActive: {
    color: colors.primary,
  },
  bottomPadding: {
    height: 100,
  },
});
