/**
 * Health Check Screen (Dev/Diagnostic Mode)
 * Tests: Supabase connectivity, auth status, location permissions
 * Only accessible via PIN entry from profile
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { hasLocationPermission, requestLocationPermission } from '@/services/LocationService';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface HealthCheckResult {
  name: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export default function HealthCheckScreen() {
  const { user, session } = useAuth();
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [checking, setChecking] = useState(false);

  const runHealthChecks = async () => {
    setChecking(true);
    const checks: HealthCheckResult[] = [];

    // 1. Supabase Connection
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code === 'PGRST116') {
        checks.push({
          name: 'Supabase Connection',
          status: 'warning',
          message: 'Connected but profiles table not found',
          details: error.message,
        });
      } else if (error) {
        checks.push({
          name: 'Supabase Connection',
          status: 'fail',
          message: 'Connection failed',
          details: error.message,
        });
      } else {
        checks.push({
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Connected successfully',
        });
      }
    } catch (error: any) {
      checks.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Connection exception',
        details: error?.message || 'Unknown error',
      });
    }

    // 2. Auth Status
    if (user && session) {
      checks.push({
        name: 'Authentication',
        status: 'pass',
        message: `Authenticated as ${user.email || user.id}`,
        details: `User ID: ${user.id}`,
      });
    } else {
      checks.push({
        name: 'Authentication',
        status: 'warning',
        message: 'Not authenticated',
        details: 'User must be logged in for full functionality',
      });
    }

    // 3. Location Permission
    try {
      const hasPermission = await hasLocationPermission();
      checks.push({
        name: 'Location Permission',
        status: hasPermission ? 'pass' : 'warning',
        message: hasPermission ? 'Permission granted' : 'Permission not granted',
        details: hasPermission ? 'GPS access enabled' : 'Enable in settings for accurate prayer times',
      });
    } catch (error: any) {
      checks.push({
        name: 'Location Permission',
        status: 'fail',
        message: 'Permission check failed',
        details: error?.message,
      });
    }

    // 4. Key Tables Check
    const tablesToCheck = [
      'profiles',
      'achievements',
      'user_achievements',
      'iman_tracker_goals',
      'meditation_sessions',
      'quiz_categories',
      'user_quiz_attempts',
      'tracked_content',
      'prayer_times',
      'mental_health_duas',
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error?.code === 'PGRST205') {
          checks.push({
            name: `Table: ${table}`,
            status: 'warning',
            message: 'Table not found',
            details: 'Run migration to create table',
          });
        } else if (error) {
          checks.push({
            name: `Table: ${table}`,
            status: 'fail',
            message: 'Access error',
            details: error.message,
          });
        } else {
          checks.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: 'Table accessible',
          });
        }
      } catch (error: any) {
        checks.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: 'Check failed',
          details: error?.message,
        });
      }
    }

    setResults(checks);
    setChecking(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass': return '#10B981'; // success green
      case 'fail': return '#EF4444'; // error red
      case 'warning': return '#F59E0B'; // warning amber
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass': return 'checkmark.circle.fill';
      case 'fail': return 'xmark.circle.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      default: return 'clock.fill';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradientInfo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <IconSymbol
            ios_icon_name="stethoscope"
            android_material_icon_name="medical-services"
            size={40}
            color={colors.card}
          />
          <Text style={styles.headerTitle}>Health Check</Text>
          <Text style={styles.headerSubtitle}>System Diagnostics</Text>
        </LinearGradient>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={runHealthChecks}
          disabled={checking}
        >
          <IconSymbol
            ios_icon_name="arrow.clockwise"
            android_material_icon_name="refresh"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.refreshText}>
            {checking ? 'Checking...' : 'Refresh Checks'}
          </Text>
        </TouchableOpacity>

        {/* Results */}
        {checking ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Running health checks...</Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {results.map((result, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <IconSymbol
                    ios_icon_name={getStatusIcon(result.status)}
                    android_material_icon_name={
                      result.status === 'pass' ? 'check-circle' :
                      result.status === 'fail' ? 'error' : 'warning'
                    }
                    size={24}
                    color={getStatusColor(result.status)}
                  />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                      {result.message}
                    </Text>
                    {result.details && (
                      <Text style={styles.resultDetails}>{result.details}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {results.length > 0 && !checking && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              Pass: {results.filter(r => r.status === 'pass').length} | {' '}
              Warnings: {results.filter(r => r.status === 'warning').length} | {' '}
              Failures: {results.filter(r => r.status === 'fail').length}
            </Text>
          </View>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    padding: spacing.xxxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.card,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.small,
  },
  refreshText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  resultsContainer: {
    gap: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  resultHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultMessage: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  resultDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.lg,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  closeButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.medium,
  },
  closeButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
});
