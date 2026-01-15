-- ============================================================================
-- USER STATS TABLE MIGRATION
-- ============================================================================
-- Creates table to store aggregated user statistics for achievements

-- ============================================================================
-- 1. CREATE USER_STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_prayers INTEGER DEFAULT 0,
  total_dhikr INTEGER DEFAULT 0,
  total_quran_pages INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  lectures_watched INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  workouts_completed INTEGER DEFAULT 0,
  meditation_sessions INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_active_date ON public.user_stats(last_active_date);

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
CREATE POLICY "Users can insert their own stats" ON public.user_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.user_stats IS 'Stores aggregated user statistics for achievements and tracking';
COMMENT ON COLUMN public.user_stats.total_prayers IS 'Total lifetime prayers completed';
COMMENT ON COLUMN public.user_stats.total_dhikr IS 'Total lifetime dhikr count';
COMMENT ON COLUMN public.user_stats.total_quran_pages IS 'Total lifetime Quran pages read';
COMMENT ON COLUMN public.user_stats.current_streak IS 'Current consecutive days active';
COMMENT ON COLUMN public.user_stats.longest_streak IS 'Longest consecutive days active';
COMMENT ON COLUMN public.user_stats.days_active IS 'Total days user has been active';
