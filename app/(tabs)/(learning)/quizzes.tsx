
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface QuizCategory {
  id: string;
  quiz_id: string;
  title: string;
  description: string;
  difficulty?: string;
  color?: string;
  order_index: number;
}

interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
}

export default function QuizzesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [stats, setStats] = useState<Record<string, QuizStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, quiz_id, title, description, difficulty, color, order_index')
        .order('order_index', { ascending: true })
        .limit(50); // Pagination limit

      if (error) {
        console.error('Error loading quizzes:', error);
        // If table doesn't exist, use empty array (will show empty state)
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          setCategories([]);
          setLoading(false);
          return;
        }
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to select with quiz_id (new schema)
      let data, error;
      let query = supabase
        .from('user_quiz_attempts')
        .select('quiz_id, category_id, score, percentage')
        .eq('user_id', user.id);

      const result = await query;
      data = result.data;
      error = result.error;

      // If quiz_id column doesn't exist, fall back to category_id only
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        const fallbackResult = await supabase
          .from('user_quiz_attempts')
          .select('category_id, score, percentage')
          .eq('user_id', user.id);
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error loading quiz stats:', error);
        // If table doesn't exist, use empty stats
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          setStats({});
          return;
        }
        return;
      }

      const statsMap: Record<string, QuizStats> = {};
      data?.forEach((attempt) => {
        // Use quiz_id if available, fallback to category_id for backwards compatibility
        const statKey = attempt.quiz_id || attempt.category_id;
        if (!statKey) return;
        
        if (!statsMap[statKey]) {
          statsMap[statKey] = {
            totalAttempts: 0,
            averageScore: 0,
            bestScore: 0,
          };
        }
        
        const stat = statsMap[statKey];
        stat.totalAttempts++;
        stat.averageScore = ((stat.averageScore * (stat.totalAttempts - 1)) + attempt.percentage) / stat.totalAttempts;
        stat.bestScore = Math.max(stat.bestScore, attempt.percentage);
      });

      setStats(statsMap);
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
  };

  const handleCategoryPress = (category: QuizCategory) => {
    router.push({
      pathname: '/(tabs)/(learning)/quiz-take',
      params: { quizId: category.quiz_id, categoryName: category.title },
    });
  };

  const getGradientForIndex = (index: number): string[] => {
    const gradients = [
      colors.gradientPrimary,
      colors.gradientSecondary,
      colors.gradientAccent,
      colors.gradientInfo,
      colors.gradientPurple,
      colors.gradientTeal,
    ];
    return gradients[index % gradients.length];
  };

  const getIconForQuizId = (quizId: string): { ios: string; android: string } => {
    const iconMap: Record<string, { ios: string; android: string }> = {
      'quran': { ios: 'book.fill', android: 'menu-book' },
      'seerah': { ios: 'person.circle.fill', android: 'account-circle' },
      'history': { ios: 'clock.fill', android: 'history' },
      'pillars': { ios: 'star.fill', android: 'star' },
      'fiqh': { ios: 'scale.3d', android: 'balance' },
      'prophets': { ios: 'person.3.fill', android: 'groups' },
    };
    return iconMap[quizId] || { ios: 'questionmark.circle.fill', android: 'quiz' };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Islamic Quizzes</Text>
        <Text style={styles.subtitle}>Test your Islamic knowledge</Text>

        {/* Featured Banner */}
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredBanner}
        >
          <View style={styles.featuredIconContainer}>
            <IconSymbol
              ios_icon_name="brain.head.profile"
              android_material_icon_name="psychology"
              size={36}
              color={colors.card}
            />
          </View>
          <Text style={styles.featuredTitle}>Challenge Yourself</Text>
          <Text style={styles.featuredSubtitle}>
            Each quiz randomly selects 10 questions from a pool of 100+
          </Text>
        </LinearGradient>

        {/* Quiz Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => {
            const categoryStats = stats[category.quiz_id] || stats[category.id];
            const icons = getIconForQuizId(category.quiz_id);
            
            return (
              <React.Fragment key={category.id}>
                <TouchableOpacity
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                  onPress={() => handleCategoryPress(category)}
                >
                  <LinearGradient
                    colors={getGradientForIndex(index)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryGradient}
                  >
                    <View style={styles.categoryContent}>
                      <View style={styles.categoryIconContainer}>
                        <IconSymbol
                          ios_icon_name={icons.ios}
                          android_material_icon_name={icons.android}
                          size={32}
                          color={colors.card}
                        />
                      </View>
                    <View style={styles.categoryTextContainer}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                        
                        {categoryStats && (
                          <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                              <IconSymbol
                                ios_icon_name="chart.bar.fill"
                                android_material_icon_name="bar-chart"
                                size={14}
                                color={colors.card}
                              />
                              <Text style={styles.statText}>
                                {Math.round(categoryStats.averageScore)}% avg
                              </Text>
                            </View>
                            <View style={styles.statItem}>
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={14}
                                color={colors.card}
                              />
                              <Text style={styles.statText}>
                                {Math.round(categoryStats.bestScore)}% best
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={24}
                      color={colors.card}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            - Each quiz has 10 randomly selected questions{'\n'}
            - Questions are drawn from a pool of questions per category{'\n'}
            - Track your progress and improve your knowledge{'\n'}
            - Earn Ilm points for completing quizzes{'\n'}
            - Admins can add more questions via Supabase dashboard
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
  },
  header: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  featuredBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.colored,
  },
  featuredIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featuredTitle: {
    ...typography.h3,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  featuredSubtitle: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: spacing.xxl,
  },
  categoryCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    ...typography.caption,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.small,
    color: colors.card,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
  },
  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 120,
  },
});
