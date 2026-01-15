
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

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
      // Fetch all questions for this quiz
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, options, correct_answer, explanation, order_index')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })
        .limit(200); // Fetch more questions for better randomization

      if (error) {
        console.error('Error loading quiz questions:', error);
        Alert.alert('Error', 'Failed to load quiz questions');
        router.back();
        return;
      }

      if (!data || data.length < 10) {
        Alert.alert('Not Enough Questions', 'This quiz needs at least 10 questions to start.');
        router.back();
        return;
      }

      // Parse options from JSON strings if needed
      const parsedData = data.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));

      // Improved random selection: Fisher-Yates shuffle for better distribution
      const shuffled = [...parsedData];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Select 10 random questions
      const selected = shuffled.slice(0, 10);
      
      setQuestions(selected);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      Alert.alert('Error', 'Failed to load quiz questions');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      Alert.alert('No Answer Selected', 'Please select an answer before continuing.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    // Convert selected answer (A/B/C/D) to index (0/1/2/3)
    const selectedIndex = selectedAnswer.charCodeAt(0) - 65; // 'A'=0, 'B'=1, etc.
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
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const score = userAnswers.filter(a => a.isCorrect).length;
    const percentage = (score / questions.length) * 100;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push({
          pathname: '/(tabs)/(learning)/quiz-result',
          params: {
            score: score.toString(),
            total: questions.length.toString(),
            percentage: percentage.toFixed(1),
            categoryName,
          },
        });
        return;
      }

      // Save quiz attempt
      let attemptData = null;
      const attemptPayload: any = {
        user_id: user.id,
        score,
        total_questions: questions.length,
        percentage,
        time_taken_seconds: timeTaken,
      };

      // Try quiz_id first (new schema), fallback to category_id (old schema)
      // Check if quiz_id column exists by trying to insert with it
      attemptPayload.quiz_id = quizId;

      const { data: attemptDataResult, error: attemptError } = await supabase
        .from('user_quiz_attempts')
        .insert(attemptPayload)
        .select()
        .single();

      if (attemptError) {
        console.error('Error saving quiz attempt:', attemptError);
        
        // If quiz_id doesn't exist, try with category_id (legacy schema)
        if (attemptError.message?.includes('column "quiz_id"') || attemptError.code === '42703') {
          console.log('⚠️ quiz_id column not found, trying category_id (legacy schema)');
          // Try to find category_id from quiz_id - this is a fallback
          // For now, just save without category_id/quiz_id
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_quiz_attempts')
            .insert({
              user_id: user.id,
              score,
              total_questions: questions.length,
              percentage,
              time_taken_seconds: timeTaken,
            })
            .select()
            .single();
          
          if (!fallbackError) {
            attemptData = fallbackData;
          } else {
            console.error('Error saving quiz attempt (fallback):', fallbackError);
          }
        } else if (attemptError.code === 'PGRST205' || attemptError.message?.includes('Could not find the table')) {
          console.log('⚠️ Quiz attempts table not found, continuing without saving to database');
        } else {
          // Other errors - log but continue
          console.error('Quiz attempt save error (continuing anyway):', attemptError);
        }
      } else {
        attemptData = attemptDataResult;
      }

      // Save individual answers (only if attempt was saved successfully)
      if (attemptData && attemptData.id) {
        try {
          const answersToInsert = userAnswers.map(ua => ({
            attempt_id: attemptData.id,
            question_id: ua.questionId,
            user_answer: ua.answer,
            is_correct: ua.isCorrect,
          }));

          const { error: answersError } = await supabase
            .from('user_quiz_answers')
            .insert(answersToInsert);

          if (answersError) {
            console.error('Error saving quiz answers:', answersError);
            // If table doesn't exist, that's okay - quiz still works
            if (answersError.code === 'PGRST205' || answersError.message?.includes('Could not find the table')) {
              console.log('⚠️ user_quiz_answers table not found - run migration 014_create_user_quiz_answers_table.sql');
            } else {
              // Log other errors but don't block quiz completion
              console.error('Quiz answers save error (continuing anyway):', answersError);
            }
          } else {
            console.log('✅ Quiz answers saved successfully');
          }
        } catch (error) {
          console.error('Exception saving quiz answers:', error);
          // Don't block quiz completion if answers can't be saved
        }
      }

      // Track quiz completion for achievements
      if (user) {
        try {
          const { trackQuizCompletion } = await import('@/utils/imanActivityIntegration');
          await trackQuizCompletion(user.id);
        } catch (error) {
          console.log('Error tracking quiz:', error);
        }
      }

      // Navigate to results (always navigate, even if saving failed)
      router.push({
        pathname: '/(tabs)/(learning)/quiz-result',
        params: {
          score: score.toString(),
          total: questions.length.toString(),
          percentage: percentage.toFixed(1),
          categoryName,
          timeTaken: timeTaken.toString(),
        },
      });
    } catch (error) {
      console.error('Error finishing quiz:', error);
      // Still navigate to results - don't block user from seeing their score
      router.push({
        pathname: '/(tabs)/(learning)/quiz-result',
        params: {
          score: score.toString(),
          total: questions.length.toString(),
          percentage: percentage.toFixed(1),
          categoryName,
          timeTaken: timeTaken.toString(),
        },
      });
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
            colors={colors.gradientPrimary}
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
