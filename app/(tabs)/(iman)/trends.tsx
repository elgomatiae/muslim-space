
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getScreenWidth } from '@/utils/screenDimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import Svg, { Line, Circle, Text as SvgText, Polyline } from 'react-native-svg';

type PeriodType = 'week' | 'month' | 'year';

interface ScoreData {
  date: string;
  overall_score: number;
  ibadah_score: number;
  ilm_score: number;
  amanah_score: number;
}

const SCREEN_WIDTH = getScreenWidth();
const CHART_WIDTH = SCREEN_WIDTH - (spacing.lg * 4);
const CHART_HEIGHT = 200;
const CHART_PADDING = 40;

export default function TrendsScreen() {
  const { user } = useAuth();
  const { sectionScores, imanScore } = useImanTracker();
  const [period, setPeriod] = useState<PeriodType>('week');
  const [scoreHistory, setScoreHistory] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'ibadah' | 'ilm' | 'amanah'>('overall');

  useEffect(() => {
    loadScoreHistory();
  }, [user, period]);

  useEffect(() => {
    // Record current score when it changes
    if (user && imanScore > 0) {
      recordCurrentScore();
    }
  }, [user, sectionScores, imanScore]);

  const recordCurrentScore = async () => {
    if (!user) return;

    try {
      const { recordScoreHistory } = await import('@/utils/scoreHistoryTracker');
      await recordScoreHistory(user.id, imanScore, sectionScores);
    } catch (error) {
      console.log('Error recording score:', error);
    }
  };

  const loadScoreHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      let startDate = new Date();

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const { data, error } = await supabase
        .from('iman_score_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) {
        // Handle table not found gracefully
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.log('ℹ️ iman_score_history table not found - run migration to enable trends feature');
          setScoreHistory([]);
        } else {
          console.log('Error loading score history:', error);
          setScoreHistory([]);
        }
        return;
      }

      // Group by date and aggregate based on period
      const groupedByDate: { [key: string]: ScoreData[] } = {};
      
      data?.forEach(record => {
        let dateKey: string;
        
        if (period === 'year') {
          // For year view, group by month
          const date = new Date(record.recorded_at);
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // For week and month views, group by day
          dateKey = new Date(record.recorded_at).toISOString().split('T')[0];
        }
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push({
          date: dateKey,
          overall_score: record.overall_score,
          ibadah_score: record.ibadah_score,
          ilm_score: record.ilm_score,
          amanah_score: record.amanah_score,
        });
      });

      // Process grouped data: for year view, average by month; for day view, take latest of day
      const processedHistory: ScoreData[] = [];
      
      Object.keys(groupedByDate).forEach(dateKey => {
        const records = groupedByDate[dateKey];
        
        if (period === 'year') {
          // Average scores for the month
          const avgOverall = Math.round(records.reduce((sum, r) => sum + r.overall_score, 0) / records.length);
          const avgIbadah = Math.round(records.reduce((sum, r) => sum + r.ibadah_score, 0) / records.length);
          const avgIlm = Math.round(records.reduce((sum, r) => sum + r.ilm_score, 0) / records.length);
          const avgAmanah = Math.round(records.reduce((sum, r) => sum + r.amanah_score, 0) / records.length);
          
          processedHistory.push({
            date: dateKey + '-01', // Add day for consistent date format
            overall_score: avgOverall,
            ibadah_score: avgIbadah,
            ilm_score: avgIlm,
            amanah_score: avgAmanah,
          });
        } else {
          // Take the latest score for each day
          const latestRecord = records[records.length - 1];
          processedHistory.push(latestRecord);
        }
      });

      // Sort by date
      const history = processedHistory.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setScoreHistory(history);
    } catch (error) {
      console.log('Error in loadScoreHistory:', error);
      setScoreHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'ibadah': return '#10B981';
      case 'ilm': return '#3B82F6';
      case 'amanah': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const getMetricData = () => {
    return scoreHistory.map(item => {
      switch (selectedMetric) {
        case 'ibadah': return item.ibadah_score;
        case 'ilm': return item.ilm_score;
        case 'amanah': return item.amanah_score;
        default: return item.overall_score;
      }
    });
  };

  const formatDateLabel = (dateString: string) => {
    try {
      // Handle year format (YYYY-MM) by adding day
      const normalizedDate = dateString.includes('-') && dateString.split('-').length === 2 
        ? `${dateString}-01` 
        : dateString;
      
      const date = new Date(normalizedDate);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      if (period === 'week') {
        // Show day name for week
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'month') {
        // Show day of month for month
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        // Show month name for year
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    } catch {
      return dateString;
    }
  };

  const renderChart = () => {
    if (scoreHistory.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <IconSymbol
            ios_icon_name="chart.line.uptrend.xyaxis"
            android_material_icon_name="trending-up"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyChartText}>No data available yet</Text>
          <Text style={styles.emptyChartSubtext}>
            Keep tracking your goals to see your progress over time
          </Text>
        </View>
      );
    }

    const data = getMetricData();
    const maxScore = Math.max(...data, 100);
    const minScore = Math.min(...data, 0);
    const scoreRange = maxScore - minScore || 1;

    // Calculate x positions based on actual dates (not just evenly spaced)
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const points = scoreHistory.map((item, index) => {
      const itemDate = new Date(item.date);
      const daysSinceStart = (itemDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const totalDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const x = CHART_PADDING + (daysSinceStart / totalDays) * (CHART_WIDTH - CHART_PADDING * 2);
      const score = data[index];
      const y = CHART_HEIGHT - CHART_PADDING - ((score - minScore) / scoreRange) * (CHART_HEIGHT - CHART_PADDING * 2);
      return { x: Math.max(CHART_PADDING, Math.min(CHART_WIDTH - CHART_PADDING, x)), y, score, date: item.date };
    });

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const metricColor = getMetricColor(selectedMetric);

    // Calculate x-axis label positions
    const xAxisLabelCount = period === 'week' ? 7 : period === 'month' ? 5 : 12;
    const xAxisLabels: { x: number; label: string }[] = [];
    
    // Create date range for x-axis labels
    for (let i = 0; i <= xAxisLabelCount; i++) {
      const date = new Date(startDate);
      if (period === 'week') {
        date.setDate(startDate.getDate() + (i * 7 / xAxisLabelCount));
      } else if (period === 'month') {
        date.setDate(startDate.getDate() + (i * 30 / xAxisLabelCount));
      } else {
        date.setMonth(startDate.getMonth() + (i * 12 / xAxisLabelCount));
      }
      const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const totalDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const x = CHART_PADDING + (daysSinceStart / totalDays) * (CHART_WIDTH - CHART_PADDING * 2);
      xAxisLabels.push({
        x: Math.max(CHART_PADDING, Math.min(CHART_WIDTH - CHART_PADDING, x)),
        label: formatDateLabel(date.toISOString().split('T')[0])
      });
    }

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value, index) => {
            const y = CHART_HEIGHT - CHART_PADDING - ((value - minScore) / scoreRange) * (CHART_HEIGHT - CHART_PADDING * 2);
            return (
              <React.Fragment key={index}>
                <Line
                  x1={CHART_PADDING}
                  y1={y}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={CHART_PADDING - 10}
                  y={y + 5}
                  fontSize="10"
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {value}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
          {xAxisLabels.map((label, index) => (
            <SvgText
              key={index}
              x={label.x}
              y={CHART_HEIGHT + 15}
              fontSize="9"
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {label.label}
            </SvgText>
          ))}

          {/* X-axis line */}
          <Line
            x1={CHART_PADDING}
            y1={CHART_HEIGHT - CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y2={CHART_HEIGHT - CHART_PADDING}
            stroke={colors.border}
            strokeWidth="2"
          />

          {/* Line chart */}
          <Polyline
            points={linePoints}
            fill="none"
            stroke={metricColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={metricColor}
              stroke={colors.card}
              strokeWidth="2"
            />
          ))}
        </Svg>
      </View>
    );
  };

  const getStats = () => {
    if (scoreHistory.length === 0) {
      return { average: 0, highest: 0, lowest: 0, change: 0 };
    }

    const data = getMetricData();
    const average = Math.round(data.reduce((sum, val) => sum + val, 0) / data.length);
    const highest = Math.max(...data);
    const lowest = Math.min(...data);
    const change = data.length > 1 ? data[data.length - 1] - data[0] : 0;

    return { average, highest, lowest, change };
  };

  const stats = getStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as PeriodType[]).map((p, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[styles.periodButton, period === p && styles.periodButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPeriod(p);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Metric Selector */}
        <View style={styles.metricSelector}>
          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'overall' && styles.metricButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMetric('overall');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedMetric === 'overall' ? colors.gradientPrimary : [colors.card, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricButtonGradient}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'overall' && styles.metricButtonTextActive]}>
                Overall
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'ibadah' && styles.metricButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMetric('ibadah');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedMetric === 'ibadah' ? ['#10B981', '#059669'] : [colors.card, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricButtonGradient}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'ibadah' && styles.metricButtonTextActive]}>
                ʿIbādah
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'ilm' && styles.metricButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMetric('ilm');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedMetric === 'ilm' ? ['#3B82F6', '#2563EB'] : [colors.card, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricButtonGradient}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'ilm' && styles.metricButtonTextActive]}>
                ʿIlm
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricButton, selectedMetric === 'amanah' && styles.metricButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMetric('amanah');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedMetric === 'amanah' ? ['#F59E0B', '#D97706'] : [colors.card, colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.metricButtonGradient}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'amanah' && styles.metricButtonTextActive]}>
                Amanah
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          {renderChart()}
        </View>

        {/* Stats Grid */}
        {scoreHistory.length > 0 && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.statValue}>{stats.average}</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="trending-up"
                size={24}
                color={colors.success}
              />
              <Text style={styles.statValue}>{stats.highest}</Text>
              <Text style={styles.statLabel}>Highest</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="arrow.down.circle.fill"
                android_material_icon_name="trending-down"
                size={24}
                color={colors.error}
              />
              <Text style={styles.statValue}>{stats.lowest}</Text>
              <Text style={styles.statLabel}>Lowest</Text>
            </View>

            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name={stats.change >= 0 ? "arrow.up.right" : "arrow.down.right"}
                android_material_icon_name={stats.change >= 0 ? "trending-up" : "trending-down"}
                size={24}
                color={stats.change >= 0 ? colors.success : colors.error}
              />
              <Text style={[styles.statValue, { color: stats.change >= 0 ? colors.success : colors.error }]}>
                {stats.change >= 0 ? '+' : ''}{stats.change}
              </Text>
              <Text style={styles.statLabel}>Change</Text>
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          {stats.change > 0 && (
            <View style={styles.insightCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.insightIcon}
              >
                <IconSymbol
                  ios_icon_name="arrow.up"
                  android_material_icon_name="trending-up"
                  size={20}
                  color={colors.card}
                />
              </LinearGradient>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Great Progress!</Text>
                <Text style={styles.insightText}>
                  Your {selectedMetric} score has increased by {stats.change} points over this period. Keep up the excellent work!
                </Text>
              </View>
            </View>
          )}

          {stats.change < 0 && (
            <View style={styles.insightCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.insightIcon}
              >
                <IconSymbol
                  ios_icon_name="arrow.down"
                  android_material_icon_name="trending-down"
                  size={20}
                  color={colors.card}
                />
              </LinearGradient>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Stay Consistent</Text>
                <Text style={styles.insightText}>
                  Your {selectedMetric} score has decreased by {Math.abs(stats.change)} points. Focus on completing your daily goals to improve.
                </Text>
              </View>
            </View>
          )}

          {stats.change === 0 && scoreHistory.length > 0 && (
            <View style={styles.insightCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.insightIcon}
              >
                <IconSymbol
                  ios_icon_name="equal"
                  android_material_icon_name="drag-handle"
                  size={20}
                  color={colors.card}
                />
              </LinearGradient>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Steady Progress</Text>
                <Text style={styles.insightText}>
                  Your {selectedMetric} score has remained stable. Try setting new goals to challenge yourself!
                </Text>
              </View>
            </View>
          )}

          <View style={styles.tipCard}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={24}
              color={colors.warning}
            />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track Daily</Text>
              <Text style={styles.tipText}>
                Complete your goals every day to see consistent upward trends in your Iman score.
              </Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  periodButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  metricButtonActive: {
    ...shadows.medium,
  },
  metricButtonGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  metricButtonText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
  },
  metricButtonTextActive: {
    color: colors.card,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  chartContainer: {
    alignItems: 'center',
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyChartText: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyChartSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  insightsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insightText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
});
