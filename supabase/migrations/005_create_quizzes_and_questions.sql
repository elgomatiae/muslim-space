-- ============================================================================
-- QUIZZES AND QUESTIONS MIGRATION
-- ============================================================================
-- Creates/updates tables for Islamic quizzes based on CSV data structure
-- This replaces quiz_categories with quizzes table using quiz_id as text

-- ============================================================================
-- 1. CREATE/ALTER QUIZZES TABLE
-- ============================================================================
DO $$
BEGIN
  -- Drop quiz_categories if it exists (we're replacing it with quizzes)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_categories') THEN
    -- Migrate data if quizzes table doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quizzes') THEN
      CREATE TABLE IF NOT EXISTS public.quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        color TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Try to migrate data from quiz_categories if possible
      INSERT INTO public.quizzes (quiz_id, title, description, order_index, created_at, updated_at)
      SELECT 
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')) as quiz_id,
        name as title,
        description,
        COALESCE(order_index, 0),
        created_at,
        updated_at
      FROM public.quiz_categories
      WHERE is_active = true
      ON CONFLICT (quiz_id) DO NOTHING;
    END IF;
  ELSE
    -- Create quizzes table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.quizzes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
      color TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- Indexes for quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_id ON public.quizzes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_order ON public.quizzes(order_index);

-- ============================================================================
-- 2. CREATE/ALTER QUIZ_QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id TEXT NOT NULL,
  question_id TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE
);

-- Indexes for quiz_questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_question_id ON public.quiz_questions(question_id) WHERE question_id IS NOT NULL;

-- ============================================================================
-- 3. UPDATE USER_QUIZ_ATTEMPTS TO USE QUIZ_ID (TEXT)
-- ============================================================================
DO $$
BEGIN
  -- Add quiz_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_quiz_attempts' 
    AND column_name = 'quiz_id'
  ) THEN
    ALTER TABLE public.user_quiz_attempts 
    ADD COLUMN quiz_id TEXT;
    
    -- If category_id exists, try to map it (though this might not work perfectly)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_quiz_attempts' 
      AND column_name = 'category_id'
    ) THEN
      -- Update quiz_id from category_id (if we can map it)
      UPDATE public.user_quiz_attempts uqa
      SET quiz_id = q.quiz_id
      FROM public.quizzes q
      WHERE q.id::text = uqa.category_id::text;
    END IF;
  END IF;
END $$;

-- Add index for quiz_id in user_quiz_attempts
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz_id ON public.user_quiz_attempts(quiz_id) WHERE quiz_id IS NOT NULL;

-- ============================================================================
-- 4. ENABLE RLS
-- ============================================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes (public read)
DROP POLICY IF EXISTS "Public can view quizzes" ON public.quizzes;
CREATE POLICY "Public can view quizzes" ON public.quizzes
  FOR SELECT
  USING (true);

-- RLS Policies for quiz_questions (public read)
DROP POLICY IF EXISTS "Public can view quiz questions" ON public.quiz_questions;
CREATE POLICY "Public can view quiz questions" ON public.quiz_questions
  FOR SELECT
  USING (true);

-- Comments
COMMENT ON TABLE public.quizzes IS 'Islamic quiz categories (replaces quiz_categories)';
COMMENT ON TABLE public.quiz_questions IS 'Questions for each quiz category';
COMMENT ON COLUMN public.quiz_questions.options IS 'JSON array of 4 answer options';
COMMENT ON COLUMN public.quiz_questions.correct_answer IS 'Index of correct answer (0-3)';
