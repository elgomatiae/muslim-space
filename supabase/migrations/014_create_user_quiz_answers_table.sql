-- ============================================================================
-- USER QUIZ ANSWERS TABLE MIGRATION
-- ============================================================================
-- Creates table to store individual quiz answers for each attempt

-- ============================================================================
-- 1. CREATE USER_QUIZ_ANSWERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.user_quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL, -- The answer letter (A, B, C, or D)
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_quiz_answers
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_attempt_id ON public.user_quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_question_id ON public.user_quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_attempt_question ON public.user_quiz_answers(attempt_id, question_id);

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_quiz_answers
DROP POLICY IF EXISTS "Users can view their own quiz answers" ON public.user_quiz_answers;
CREATE POLICY "Users can view their own quiz answers" ON public.user_quiz_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_quiz_attempts uqa
      WHERE uqa.id = user_quiz_answers.attempt_id
      AND uqa.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own quiz answers" ON public.user_quiz_answers;
CREATE POLICY "Users can insert their own quiz answers" ON public.user_quiz_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_quiz_attempts uqa
      WHERE uqa.id = user_quiz_answers.attempt_id
      AND uqa.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE public.user_quiz_answers IS 'Stores individual answers for each quiz attempt';
COMMENT ON COLUMN public.user_quiz_answers.user_answer IS 'The answer letter selected by the user (A, B, C, or D)';
COMMENT ON COLUMN public.user_quiz_answers.is_correct IS 'Whether the user answer was correct';
