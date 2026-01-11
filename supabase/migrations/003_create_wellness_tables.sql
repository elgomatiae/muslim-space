-- ============================================================================
-- WELLNESS TABLES MIGRATION
-- ============================================================================
-- Creates tables for meditation, quizzes, and other wellness features

-- ============================================================================
-- 1. MEDITATION_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_type TEXT NOT NULL, -- 'mindfulness', 'dhikr', 'breathing', etc.
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for meditation_sessions
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON public.meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_date ON public.meditation_sessions(date);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_date ON public.meditation_sessions(user_id, date);

-- ============================================================================
-- 2. QUIZ_CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. USER_QUIZ_ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.quiz_categories(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_quiz_attempts
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_category_id ON public.user_quiz_attempts(category_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_category ON public.user_quiz_attempts(user_id, category_id);

-- ============================================================================
-- 4. PRAYER_TIMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prayer_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  fajr_time TIME NOT NULL,
  dhuhr_time TIME NOT NULL,
  asr_time TIME NOT NULL,
  maghrib_time TIME NOT NULL,
  isha_time TIME NOT NULL,
  calculation_method TEXT DEFAULT 'NorthAmerica',
  is_manual BOOLEAN DEFAULT FALSE,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for prayer_times
CREATE INDEX IF NOT EXISTS idx_prayer_times_user_id ON public.prayer_times(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON public.prayer_times(date);
CREATE INDEX IF NOT EXISTS idx_prayer_times_user_date ON public.prayer_times(user_id, date);

-- ============================================================================
-- 5. PRAYER_TIME_ADJUSTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prayer_time_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fajr_offset INTEGER DEFAULT 0,
  dhuhr_offset INTEGER DEFAULT 0,
  asr_offset INTEGER DEFAULT 0,
  maghrib_offset INTEGER DEFAULT 0,
  isha_offset INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for prayer_time_adjustments
CREATE INDEX IF NOT EXISTS idx_prayer_time_adjustments_user_id ON public.prayer_time_adjustments(user_id);

-- ============================================================================
-- 6. MENTAL_HEALTH_DUAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mental_health_duas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  arabic_text TEXT NOT NULL,
  transliteration TEXT,
  translation TEXT NOT NULL,
  context TEXT,
  emotion_category TEXT NOT NULL CHECK (emotion_category IN ('anxiety', 'depression', 'distress', 'peace', 'patience', 'hope')),
  source TEXT,
  benefits TEXT[], -- Array of benefit descriptions
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for mental_health_duas
CREATE INDEX IF NOT EXISTS idx_mental_health_duas_category ON public.mental_health_duas(emotion_category);
CREATE INDEX IF NOT EXISTS idx_mental_health_duas_active ON public.mental_health_duas(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_mental_health_duas_order ON public.mental_health_duas(order_index);

-- ============================================================================
-- 7. TRACKED_CONTENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tracked_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('lecture', 'recitation')),
  video_id UUID,
  video_title TEXT,
  video_url TEXT,
  scholar_name TEXT,
  reciter_name TEXT,
  completed BOOLEAN DEFAULT FALSE,
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tracked_content
CREATE INDEX IF NOT EXISTS idx_tracked_content_user_id ON public.tracked_content(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_content_type ON public.tracked_content(content_type);
CREATE INDEX IF NOT EXISTS idx_tracked_content_user_type ON public.tracked_content(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_tracked_content_completed ON public.tracked_content(user_id, content_type, completed) WHERE completed = TRUE;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Meditation Sessions: Users can view and insert their own
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own meditation sessions" ON public.meditation_sessions;
CREATE POLICY "Users can view their own meditation sessions"
  ON public.meditation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meditation sessions" ON public.meditation_sessions;
CREATE POLICY "Users can insert their own meditation sessions"
  ON public.meditation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meditation sessions" ON public.meditation_sessions;
CREATE POLICY "Users can update their own meditation sessions"
  ON public.meditation_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz Categories: Public read access
ALTER TABLE public.quiz_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active quiz categories" ON public.quiz_categories;
CREATE POLICY "Anyone can view active quiz categories"
  ON public.quiz_categories
  FOR SELECT
  USING (is_active = TRUE);

-- User Quiz Attempts: Users can view and insert their own
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts"
  ON public.user_quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.user_quiz_attempts;
CREATE POLICY "Users can insert their own quiz attempts"
  ON public.user_quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tracked Content: Users can view and manage their own
ALTER TABLE public.tracked_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tracked content" ON public.tracked_content;
CREATE POLICY "Users can view their own tracked content"
  ON public.tracked_content
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tracked content" ON public.tracked_content;
CREATE POLICY "Users can insert their own tracked content"
  ON public.tracked_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tracked content" ON public.tracked_content;
CREATE POLICY "Users can update their own tracked content"
  ON public.tracked_content
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Prayer Times: Users can view and manage their own
ALTER TABLE public.prayer_times ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own prayer times" ON public.prayer_times;
CREATE POLICY "Users can view their own prayer times"
  ON public.prayer_times
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own prayer times" ON public.prayer_times;
CREATE POLICY "Users can insert their own prayer times"
  ON public.prayer_times
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prayer times" ON public.prayer_times;
CREATE POLICY "Users can update their own prayer times"
  ON public.prayer_times
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Prayer Time Adjustments: Users can view and manage their own
ALTER TABLE public.prayer_time_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own prayer adjustments" ON public.prayer_time_adjustments;
CREATE POLICY "Users can view their own prayer adjustments"
  ON public.prayer_time_adjustments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own prayer adjustments" ON public.prayer_time_adjustments;
CREATE POLICY "Users can insert their own prayer adjustments"
  ON public.prayer_time_adjustments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prayer adjustments" ON public.prayer_time_adjustments;
CREATE POLICY "Users can update their own prayer adjustments"
  ON public.prayer_time_adjustments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Mental Health Duas: Public read access for active duas
ALTER TABLE public.mental_health_duas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active mental health duas" ON public.mental_health_duas;
CREATE POLICY "Anyone can view active mental health duas"
  ON public.mental_health_duas
  FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================
COMMENT ON TABLE public.meditation_sessions IS 'Stores user meditation and mindfulness practice sessions';
COMMENT ON TABLE public.quiz_categories IS 'Categories for organizing quiz questions';
COMMENT ON TABLE public.user_quiz_attempts IS 'Tracks user quiz attempts and scores';
COMMENT ON TABLE public.tracked_content IS 'Tracks user engagement with lectures and recitations';
COMMENT ON TABLE public.prayer_times IS 'Stores calculated prayer times for users';
COMMENT ON TABLE public.prayer_time_adjustments IS 'Stores user prayer time adjustments';
COMMENT ON TABLE public.mental_health_duas IS 'Stores healing duas for mental wellness';
