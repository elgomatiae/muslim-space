
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface CategoryStats {
  category: string;
  count: number;
}

export default function RecategorizeLecturesScreen() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [totalLectures, setTotalLectures] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalLectures(count || 0);

      // Get category distribution
      const { data, error } = await supabase
        .from('lectures')
        .select('category');

      if (error) throw error;

      const stats: { [key: string]: number } = {};
      data?.forEach((lecture) => {
        const cat = lecture.category || 'Uncategorized';
        stats[cat] = (stats[cat] || 0) + 1;
      });

      const sortedStats = Object.entries(stats)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      setCategoryStats(sortedStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRecategorize = async () => {
    Alert.alert(
      'Confirm Recategorization',
      `This will analyze and recategorize all ${totalLectures} lectures using AI. This process may take several minutes.\n\nDo you want to continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: () => startRecategorization(),
        },
      ]
    );
  };

  const startRecategorization = async () => {
    setLoading(true);
    setAnalyzing(true);
    setProcessedCount(0);
    setCurrentBatch(0);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    try {
      const batchSize = 10;
      let startIndex = 0;
      let hasMore = true;
      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalErrors = 0;

      while (hasMore) {
        setCurrentBatch(Math.floor(startIndex / batchSize) + 1);

        const { data, error } = await supabase.functions.invoke('recategorize-lectures', {
          body: {
            batchSize,
            startIndex,
          },
        });

        if (error) {
          console.error('Error in batch:', error);
          throw error;
        }

        if (data.processed === 0) {
          hasMore = false;
          break;
        }

        totalProcessed += data.processed;
        totalSuccess += data.successCount;
        totalErrors += data.errorCount;
        setProcessedCount(totalProcessed);

        console.log(`Batch ${currentBatch}: Processed ${data.processed}, Success: ${data.successCount}, Errors: ${data.errorCount}`);

        startIndex = data.nextStartIndex;

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Recategorization Complete!',
        `Successfully recategorized ${totalSuccess} lectures.\n${totalErrors > 0 ? `\nErrors: ${totalErrors}` : ''}`,
        [
          {
            text: 'View Results',
            onPress: () => {
              fetchStats();
            },
          },
          {
            text: 'Done',
            onPress: () => {
              fetchStats();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error recategorizing lectures:', error);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      let errorMessage = 'Failed to recategorize lectures. Please try again.';
      
      if (error.message?.includes('OpenAI API key')) {
        errorMessage = 'AI service is not configured. Please contact the administrator.';
      }
      
      Alert.alert('Recategorization Failed', errorMessage);
    } finally {
      setLoading(false);
      setAnalyzing(false);
      setProcessedCount(0);
      setCurrentBatch(0);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            disabled={loading}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.card}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>AI Recategorization</Text>
            <Text style={styles.headerSubtitle}>Automatically categorize lectures</Text>
          </View>
          <View style={styles.headerIcon}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={32}
              color={colors.card}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="bar-chart"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.statsTitle}>Current Statistics</Text>
          </View>
          <View style={styles.totalLecturesContainer}>
            <Text style={styles.totalLecturesNumber}>{totalLectures}</Text>
            <Text style={styles.totalLecturesLabel}>Total Lectures</Text>
          </View>
        </View>

        <View style={styles.categoryDistributionCard}>
          <Text style={styles.categoryDistributionTitle}>Category Distribution</Text>
          {categoryStats.length > 0 ? (
            <View style={styles.categoryList}>
              {categoryStats.map((stat, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{stat.category}</Text>
                    <Text style={styles.categoryCount}>{stat.count} lectures</Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${(stat.count / totalLectures) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>

        <View style={styles.aiFeatureCard}>
          <View style={styles.aiFeatureHeader}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.aiFeatureTitle}>How It Works</Text>
          </View>
          <View style={styles.aiFeatureSteps}>
            <View style={styles.aiFeatureStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                AI analyzes each lecture&apos;s title, description, and scholar name
              </Text>
            </View>
            <View style={styles.aiFeatureStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Determines the most relevant category from 20 available options
              </Text>
            </View>
            <View style={styles.aiFeatureStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Updates the database with accurate categorization
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.categoriesCard}>
          <View style={styles.categoriesHeader}>
            <IconSymbol
              ios_icon_name="folder.fill"
              android_material_icon_name="folder"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.categoriesTitle}>Available Categories</Text>
          </View>
          <Text style={styles.categoriesText}>
            Aqeedah • Fiqh • Hadith Studies • Quran Studies • Seerah • Islamic History • Spirituality & Heart • Personal Development • Family & Relationships • Contemporary Issues • Dawah • Akhirah • Knowledge & Learning • Khutbah & Sermons • Ummah & Unity • Women in Islam • Comparative Religion • Ruqyah & Protection • Personal Stories • Islamic Teachings
          </Text>
        </View>

        {analyzing && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.progressTitle}>Processing Lectures...</Text>
            </View>
            <Text style={styles.progressText}>
              Batch {currentBatch} • Processed {processedCount} of {totalLectures}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(processedCount / totalLectures) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressNote}>
              This may take several minutes. Please don&apos;t close the app.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.recategorizeButton, loading && styles.recategorizeButtonDisabled]}
          onPress={handleRecategorize}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [colors.textSecondary, colors.textSecondary] : ['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recategorizeButtonGradient}
          >
            {loading ? (
              <React.Fragment>
                <ActivityIndicator size="small" color={colors.card} />
                <Text style={styles.recategorizeButtonText}>Processing...</Text>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color={colors.card}
                />
                <Text style={styles.recategorizeButtonText}>Start AI Recategorization</Text>
              </React.Fragment>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={20}
            color={colors.warning}
          />
          <Text style={styles.noteText}>
            <Text style={styles.noteTextBold}>Note: </Text>
            This process will update all lecture categories. The operation cannot be undone. 
            Make sure you have a backup if needed.
          </Text>
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
    paddingTop: Platform.OS === 'android' ? 56 : 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    ...shadows.colored,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    ...typography.h4,
    color: colors.text,
  },
  totalLecturesContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  totalLecturesNumber: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 56,
    fontWeight: '700',
  },
  totalLecturesLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  categoryDistributionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  categoryDistributionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryItem: {
    gap: spacing.xs,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryBar: {
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  aiFeatureCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.medium,
  },
  aiFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  aiFeatureTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  aiFeatureSteps: {
    gap: spacing.md,
  },
  aiFeatureStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.card,
    fontWeight: '700',
  },
  stepText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  categoriesCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoriesTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  categoriesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.large,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressTitle: {
    ...typography.h4,
    color: colors.text,
  },
  progressText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressNote: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recategorizeButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  recategorizeButtonDisabled: {
    opacity: 0.6,
  },
  recategorizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  recategorizeButtonText: {
    ...typography.h4,
    color: colors.card,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  noteText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  noteTextBold: {
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});
