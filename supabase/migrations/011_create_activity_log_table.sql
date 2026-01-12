-- ============================================================================
-- SUPABASE MIGRATION: Create Activity Log Table
-- ============================================================================
-- This migration creates the activity_log table for tracking user activities
-- ============================================================================

-- ============================================================================
-- 1. ACTIVITY_LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'prayer_completed',
        'sunnah_prayer',
        'tahajjud_prayer',
        'quran_reading',
        'quran_memorization',
        'dhikr_session',
        'dua_completed',
        'fasting',
        'lecture_watched',
        'recitation_listened',
        'quiz_completed',
        'reflection_written',
        'exercise_completed',
        'water_logged',
        'workout_completed',
        'meditation_session',
        'sleep_logged',
        'journal_entry',
        'achievement_unlocked',
        'goal_completed'
    )),
    activity_category TEXT NOT NULL CHECK (activity_category IN ('ibadah', 'ilm', 'amanah', 'general')),
    activity_title TEXT NOT NULL,
    activity_description TEXT,
    activity_value NUMERIC,
    activity_unit TEXT,
    points_earned NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_category ON public.activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_category ON public.activity_log(user_id, activity_category);

-- Add GIN index for metadata JSONB search
CREATE INDEX IF NOT EXISTS idx_activity_log_metadata ON public.activity_log USING GIN(metadata);

-- Add comment
COMMENT ON TABLE public.activity_log IS 'Stores user activity logs for tracking Iman Tracker actions';

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES
-- ============================================================================

-- Users can view their own activity logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log' 
        AND policyname = 'Users can view their own activity logs'
    ) THEN
        CREATE POLICY "Users can view their own activity logs" ON public.activity_log
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can insert their own activity logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log' 
        AND policyname = 'Users can insert their own activity logs'
    ) THEN
        CREATE POLICY "Users can insert their own activity logs" ON public.activity_log
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own activity logs (if needed for corrections)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log' 
        AND policyname = 'Users can update their own activity logs'
    ) THEN
        CREATE POLICY "Users can update their own activity logs" ON public.activity_log
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can delete their own activity logs (for cleanup)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activity_log' 
        AND policyname = 'Users can delete their own activity logs'
    ) THEN
        CREATE POLICY "Users can delete their own activity logs" ON public.activity_log
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
