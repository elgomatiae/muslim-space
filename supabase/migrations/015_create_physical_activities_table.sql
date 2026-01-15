-- ============================================================================
-- PHYSICAL ACTIVITIES TABLE MIGRATION
-- ============================================================================
-- Creates table to store user physical activities and workouts

-- ============================================================================
-- 1. CREATE PHYSICAL_ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.physical_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'cardio', 'strength', 'yoga', etc.
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  workout_type TEXT DEFAULT 'general', -- For backward compatibility
  workout_types TEXT[] DEFAULT ARRAY['general'], -- Array of workout types
  is_multi_workout BOOLEAN DEFAULT false,
  workout_durations JSONB, -- JSON object mapping workout types to durations
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for physical_activities
CREATE INDEX IF NOT EXISTS idx_physical_activities_user_id ON public.physical_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_activities_date ON public.physical_activities(date);
CREATE INDEX IF NOT EXISTS idx_physical_activities_user_date ON public.physical_activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_physical_activities_created_at ON public.physical_activities(created_at DESC);

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================
ALTER TABLE public.physical_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for physical_activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.physical_activities;
CREATE POLICY "Users can view their own activities" ON public.physical_activities
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.physical_activities;
CREATE POLICY "Users can insert their own activities" ON public.physical_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.physical_activities;
CREATE POLICY "Users can update their own activities" ON public.physical_activities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.physical_activities;
CREATE POLICY "Users can delete their own activities" ON public.physical_activities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.physical_activities IS 'Stores user physical activities and workout sessions';
COMMENT ON COLUMN public.physical_activities.workout_types IS 'Array of workout types for multi-workout sessions';
COMMENT ON COLUMN public.physical_activities.workout_durations IS 'JSON object mapping workout types to their durations in minutes';
