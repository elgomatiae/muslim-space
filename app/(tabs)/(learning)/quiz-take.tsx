
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '@/contexts/I18nContext';
import { supabase } from '@/lib/supabase';

function gradient3(c: readonly string[]): readonly [string, string, string] {
  return c as unknown as readonly [string, string, string];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // JSON array of 4 options
  correct_answer: number; // 0-3 index
  explanation: string;
  order_index?: number;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export default function QuizTakeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const quizId = params.quizId as string;
  const categoryName = params.categoryName as string;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      if (!quizId) {
        console.error('No quiz ID provided');
        Alert.alert(t('common.error'), 'Quiz ID is missing');
        router.back();
        return;
      }

      // Fetch all questions for this quiz
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, options, correct_answer, explanation, order_index')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })
        .limit(200); // Fetch more questions for better randomization

      if (error) {
        console.error('Error loading quiz questions:', error);
        // If table doesn't exist, show appropriate message
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          Alert.alert(
            t('common.error'),
            'Quiz questions table not found. Please ensure the database is properly set up.'
          );
        } else {
          Alert.alert(t('common.error'), t('learning.failedToLoadQuestions') || 'Failed to load questions');
        }
        router.back();
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert(
          t('learning.notEnoughQuestions') || 'No Questions Available',
          t('learning.notEnoughQuestionsMessage') || 'This quiz has no questions available.'
        );
        router.back();
        return;
      }

      if (data.length < 10) {
        console.warn(`Only ${data.length} questions available, using all of them`);
      }

      // Parse options from JSON strings if needed, with error handling
      const parsedData = data.map(q => {
        try {
          let options = q.options;
          if (typeof options === 'string') {
            options = JSON.parse(options);
          }
          // Ensure options is an array
          if (!Array.isArray(options)) {
            console.warn('Invalid options format for question:', q.id);
            options = [];
          }
          return {
            ...q,
            options,
          };
        } catch (parseError) {
          console.error('Error parsing options for question:', q.id, parseError);
          return {
            ...q,
            options: [],
          };
        }
      }).filter(q => q.options && q.options.length >= 2); // Filter out questions with invalid options

      if (parsedData.length < 1) {
        Alert.alert(
          t('common.error'),
          'No valid questions found. Please check the quiz data.'
        );
        router.back();
        return;
      }

      // Improved random selection: Fisher-Yates shuffle for better distribution
      const shuffled = [...parsedData];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Select up to 10 random questions (or all if less than 10)
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));
      
      setQuestions(selected);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      Alert.alert(
        t('common.error') || 'Error',
        'Failed to load quiz questions. Please try again later.'
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return; // Prevent changing answer after submission
    if (!answer || typeof answer !== 'string') return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      Alert.alert(
        t('learning.noAnswerSelected') || 'No Answer Selected',
        t('learning.selectAnswerBeforeContinuing') || 'Please select an answer before continuing.'
      );
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !currentQuestion.id) {
      console.error('Invalid question at index:', currentQuestionIndex);
      Alert.alert(t('common.error') || 'Error', 'Invalid question. Please try again.');
      return;
    }

    try {
      // Convert selected answer (A/B/C/D) to index (0/1/2/3)
      const selectedIndex = selectedAnswer.charCodeAt(0) - 65; // 'A'=0, 'B'=1, etc.
      
      // Validate selected index
      if (selectedIndex < 0 || selectedIndex > 3) {
        console.error('Invalid answer selection:', selectedAnswer);
        Alert.alert(t('common.error') || 'Error', 'Invalid answer selection.');
        return;
      }

      const isCorrect = selectedIndex === currentQuestion.correct_answer;

      setUserAnswers([
        ...userAnswers,
        {
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          isCorrect,
        },
      ]);

      setShowExplanation(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to submit answer. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    try {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } else {
        // Quiz completed
        finishQuiz();
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to proceed. Please try again.');
    }
  };

  const finishQuiz = async () => {
    // Validate data before processing
    if (!questions || questions.length === 0) {
      console.error('No questions available to finish quiz');
      Alert.alert(t('common.error') || 'Error', 'Quiz data is invalid. Please try again.');
      router.back();
      return;
    }

    // Safely calculate score
    const validAnswers = (userAnswers || []).filter(a => a && typeof a.isCorrect === 'boolean');
    const score = validAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Always navigate to results first - don't block user from seeing their score
    const navigateToResults = () => {
      router.push({
        pathname: '/(tabs)/(learning)/quiz-result',
        params: {
          score: score.toString(),
          total: totalQuestions.toString(),
          percentage: percentage.toFixed(1),
          categoryName: categoryName || 'Quiz',
          timeTaken: timeTaken.toString(),
        },
      });
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigateToResults();
        return;
      }

      // Save quiz attempt (non-blocking - don't wait for it)
      (async () => {
        try {
          const attemptPayload: any = {
            user_id: user.id,
            score,
            total_questions: totalQuestions,
            percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
            time_taken_seconds: timeTaken,
            quiz_id: quizId,
          };

          const { data: attemptDataResult, error: attemptError } = await supabase
            .from('user_quiz_attempts')
            .insert(attemptPayload)
            .select()
            .single();

          if (attemptError) {
            // Handle different error types gracefully
            if (attemptError.code === 'PGRST205' || attemptError.message?.includes('Could not find the table')) {
              console.log('⚠️ Quiz attempts table not found - continuing without database save');
            } else if (attemptError.message?.includes('column "quiz_id"') || attemptError.code === '42703') {
              // Try without quiz_id (legacy schema)
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('user_quiz_attempts')
                .insert({
                  user_id: user.id,
                  score,
                  total_questions: totalQuestions,
                  percentage: Math.round(percentage * 100) / 100,
                  time_taken_seconds: timeTaken,
                })
                .select()
                .single();
              
              if (!fallbackError && fallbackData) {
                await saveQuizAnswers(fallbackData.id, user.id);
              }
            } else {
              console.error('Quiz attempt save error:', attemptError);
            }
          } else if (attemptDataResult) {
            await saveQuizAnswers(attemptDataResult.id, user.id);
          }
        } catch (error) {
          console.error('Error in quiz save operation:', error);
        }
      })();

      // Track quiz completion for achievements (non-blocking)
      (async () => {
        try {
          const { trackQuizCompletion } = await import('@/utils/imanActivityIntegration');
          await trackQuizCompletion(user.id);
        } catch (error) {
          console.log('Error tracking quiz completion:', error);
        }
      })();

      // Navigate immediately - don't wait for saves
      navigateToResults();
    } catch (error) {
      console.error('Error finishing quiz:', error);
      // Still try to navigate with available data
      try {
        const fallbackScore = (userAnswers || []).filter(a => a?.isCorrect).length;
        const fallbackTotal = questions?.length || 0;
        router.push({
          pathname: '/(tabs)/(learning)/quiz-result',
          params: {
            score: fallbackScore.toString(),
            total: fallbackTotal.toString(),
            percentage: fallbackTotal > 0 ? ((fallbackScore / fallbackTotal) * 100).toFixed(1) : '0',
            categoryName: categoryName || 'Quiz',
            timeTaken: Math.floor((Date.now() - startTime) / 1000).toString(),
          },
        });
      } catch (navError) {
        console.error('Failed to navigate to results:', navError);
        Alert.alert(t('common.error') || 'Error', 'Failed to complete quiz. Please try again.');
        router.back();
      }
    }
  };

  const saveQuizAnswers = async (attemptId: string, userId: string) => {
    try {
      if (!attemptId || !userId) {
        console.warn('Missing attemptId or userId, skipping answer save');
        return;
      }

      if (!userAnswers || userAnswers.length === 0) {
        console.warn('No user answers to save');
        return;
      }

      // Validate and filter answers before inserting
      const answersToInsert = userAnswers
        .filter(ua => ua && ua.questionId && ua.answer)
        .map(ua => ({
          attempt_id: attemptId,
          question_id: ua.questionId,
          user_answer: ua.answer,
          is_correct: ua.isCorrect || false,
        }));

      if (answersToInsert.length === 0) {
        console.warn('No valid answers to insert after filtering');
        return;
      }

      const { error: answersError } = await supabase
        .from('user_quiz_answers')
        .insert(answersToInsert);

      if (answersError) {
        if (answersError.code === 'PGRST205' || answersError.message?.includes('Could not find the table')) {
          console.log('⚠️ user_quiz_answers table not found - answers not saved');
        } else if (answersError.code === '23503') {
          // Foreign key constraint violation
          console.warn('Foreign key constraint violation - attempt may not exist:', answersError);
        } else {
          console.error('Quiz answers save error:', answersError);
        }
      } else {
        console.log(`✅ ${answersToInsert.length} quiz answers saved successfully`);
      }
    } catch (error) {
      console.error('Exception saving quiz answers:', error);
      // Don't throw - this is non-critical
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((option, index) => {
            const optionText = currentQuestion.options && currentQuestion.options[index] ? currentQuestion.options[index] : '';
            const isSelected = selectedAnswer === option;
            const correctOptionIndex = currentQuestion.correct_answer; // 0-3
            const correctOptionLetter = String.fromCharCode(65 + correctOptionIndex); // Convert 0-3 to 'A'-'D'
            const isCorrect = option === correctOptionLetter;
            const showCorrect = showExplanation && isCorrect;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <React.Fragment key={option}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    isSelected && !showExplanation && styles.optionButtonSelected,
                    showCorrect && styles.optionButtonCorrect,
                    showIncorrect && styles.optionButtonIncorrect,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={showExplanation}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.optionCircle,
                      isSelected && !showExplanation && styles.optionCircleSelected,
                      showCorrect && styles.optionCircleCorrect,
                      showIncorrect && styles.optionCircleIncorrect,
                    ]}>
                      <Text style={[
                        styles.optionLetter,
                        (isSelected || showCorrect || showIncorrect) && styles.optionLetterSelected,
                      ]}>
                        {option}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      (isSelected || showCorrect || showIncorrect) && styles.optionTextSelected,
                    ]}>
                      {optionText}
                    </Text>
                    {showCorrect && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.success}
                      />
                    )}
                    {showIncorrect && (
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={24}
                        color={colors.error}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && currentQuestion.explanation && (
          <View style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <IconSymbol
                ios_icon_name="lightbulb.fill"
                android_material_icon_name="lightbulb"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, !selectedAnswer && !showExplanation && styles.actionButtonDisabled]}
          onPress={showExplanation ? handleNextQuestion : handleSubmitAnswer}
          disabled={!selectedAnswer && !showExplanation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradient3(colors.gradientPrimary)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>
              {showExplanation
                ? currentQuestionIndex < questions.length - 1
                  ? 'Next Question'
                  : 'Finish Quiz'
                : 'Submit Answer'}
            </Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.card}
            />
          </LinearGradient>
        </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  categoryName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  questionCounter: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    marginBottom: spacing.xxl,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionText: {
    ...typography.h4,
    color: colors.text,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: spacing.xxl,
  },
  optionButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  optionButtonCorrect: {
    borderColor: colors.success,
    backgroundColor: '#D1FAE5',
  },
  optionButtonIncorrect: {
    borderColor: colors.error,
    backgroundColor: '#FEE2E2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionCircleCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionCircleIncorrect: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  optionLetter: {
    ...typography.bodyBold,
    color: colors.text,
  },
  optionLetterSelected: {
    color: colors.card,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    ...typography.bodyBold,
  },
  explanationCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  explanationTitle: {
    ...typography.h4,
    color: colors.text,
  },
  explanationText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing.xl,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  actionButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 120,
  },
});
