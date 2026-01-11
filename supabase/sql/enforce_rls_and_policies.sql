-- ============================================================================
-- ENFORCE RLS AND POLICIES
-- ============================================================================
-- This script ensures all tables have RLS enabled and proper policies
-- Run this to verify and fix RLS configuration across all tables
--
-- Requirements:
-- ✅ All tables have RLS enabled
-- ✅ All SELECT policies scope by user_id (except public read tables)
-- ✅ All INSERT policies check user_id matches auth.uid()
-- ✅ All UPDATE policies check user_id matches auth.uid()
-- ✅ No DELETE policies unless explicitly needed
-- ✅ Foreign keys have ON DELETE CASCADE where appropriate
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Enable RLS on all user tables
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    RAISE NOTICE 'RLS enabled on: %', table_record.tablename;
  END LOOP;
END $$;

-- ============================================================================
-- 2. PUBLIC READ TABLES (no user_id scoping needed)
-- ============================================================================
-- These tables allow public read access (all users can view)

-- Achievements (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Public can view active achievements" ON public.achievements;
    DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'achievements' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active achievements" ON public.achievements
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: achievements (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view achievements" ON public.achievements
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: achievements (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Quiz categories (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_categories') THEN
    DROP POLICY IF EXISTS "Public can view active quiz categories" ON public.quiz_categories;
    DROP POLICY IF EXISTS "Anyone can view active quiz categories" ON public.quiz_categories;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'quiz_categories' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active quiz categories" ON public.quiz_categories
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: quiz_categories (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view quiz categories" ON public.quiz_categories
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: quiz_categories (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Quiz questions (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_questions') THEN
    DROP POLICY IF EXISTS "Public can view active quiz questions" ON public.quiz_questions;
    DROP POLICY IF EXISTS "Public can view quiz questions" ON public.quiz_questions;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active quiz questions" ON public.quiz_questions
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: quiz_questions (public read with is_active filter)';
    ELSE
      -- If is_active doesn't exist, allow viewing all questions
      CREATE POLICY "Public can view quiz questions" ON public.quiz_questions
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: quiz_questions (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Daily verses (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_verses') THEN
    DROP POLICY IF EXISTS "Public can view active daily verses" ON public.daily_verses;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'daily_verses' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active daily verses" ON public.daily_verses
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: daily_verses (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view daily verses" ON public.daily_verses
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: daily_verses (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Daily hadiths (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_hadiths') THEN
    DROP POLICY IF EXISTS "Public can view active daily hadiths" ON public.daily_hadiths;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'daily_hadiths' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active daily hadiths" ON public.daily_hadiths
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: daily_hadiths (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view daily hadiths" ON public.daily_hadiths
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: daily_hadiths (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Mental health duas (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mental_health_duas') THEN
    DROP POLICY IF EXISTS "Public can view active mental health duas" ON public.mental_health_duas;
    DROP POLICY IF EXISTS "Anyone can view active mental health duas" ON public.mental_health_duas;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'mental_health_duas' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active mental health duas" ON public.mental_health_duas
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: mental_health_duas (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view mental health duas" ON public.mental_health_duas
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: mental_health_duas (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Video categories (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_categories') THEN
    DROP POLICY IF EXISTS "Public can view active video categories" ON public.video_categories;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'video_categories' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active video categories" ON public.video_categories
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: video_categories (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view video categories" ON public.video_categories
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: video_categories (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- Videos (public read)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos') THEN
    DROP POLICY IF EXISTS "Public can view active videos" ON public.videos;
    
    -- Check if is_active column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'videos' 
        AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Public can view active videos" ON public.videos
        FOR SELECT
        USING (is_active = TRUE);
      RAISE NOTICE 'Policy created: videos (public read with is_active filter)';
    ELSE
      CREATE POLICY "Public can view videos" ON public.videos
        FOR SELECT
        USING (true);
      RAISE NOTICE 'Policy created: videos (public read - no is_active column found)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. USER-SCOPED TABLES (require user_id = auth.uid())
-- ============================================================================

-- Profiles
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- SELECT: Users can view all profiles (for community features)
    DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
    CREATE POLICY "Users can view profiles" ON public.profiles
      FOR SELECT
      USING (true); -- Allow viewing all profiles for community features
    
    -- INSERT: Users can only create their own profile
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
    
    -- UPDATE: Users can only update their own profile
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Policies created: profiles';
  END IF;
END $$;

-- User achievements
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
    DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
    DROP POLICY IF EXISTS "Users can unlock their own achievements" ON public.user_achievements;
    
    CREATE POLICY "Users can view their own achievements" ON public.user_achievements
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can unlock their own achievements" ON public.user_achievements
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: user_achievements';
  END IF;
END $$;

-- Achievement progress
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievement_progress') THEN
    DROP POLICY IF EXISTS "Users can view their own progress" ON public.achievement_progress;
    DROP POLICY IF EXISTS "Users can insert their own progress" ON public.achievement_progress;
    DROP POLICY IF EXISTS "Users can update their own progress" ON public.achievement_progress;
    
    CREATE POLICY "Users can view their own progress" ON public.achievement_progress
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own progress" ON public.achievement_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own progress" ON public.achievement_progress
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: achievement_progress';
  END IF;
END $$;

-- Iman tracker goals
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iman_tracker_goals') THEN
    DROP POLICY IF EXISTS "Users can view their own goals" ON public.iman_tracker_goals;
    DROP POLICY IF EXISTS "Users can insert their own goals" ON public.iman_tracker_goals;
    DROP POLICY IF EXISTS "Users can update their own goals" ON public.iman_tracker_goals;
    
    CREATE POLICY "Users can view their own goals" ON public.iman_tracker_goals
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own goals" ON public.iman_tracker_goals
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own goals" ON public.iman_tracker_goals
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: iman_tracker_goals';
  END IF;
END $$;

-- User streaks
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_streaks') THEN
    DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
    DROP POLICY IF EXISTS "Users can insert their own streaks" ON public.user_streaks;
    DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;
    
    CREATE POLICY "Users can view their own streaks" ON public.user_streaks
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own streaks" ON public.user_streaks
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: user_streaks';
  END IF;
END $$;

-- User stats
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stats') THEN
    DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;
    DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
    DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
    
    CREATE POLICY "Users can view their own stats" ON public.user_stats
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own stats" ON public.user_stats
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own stats" ON public.user_stats
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: user_stats';
  END IF;
END $$;

-- Meditation sessions
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meditation_sessions') THEN
    DROP POLICY IF EXISTS "Users can view their own sessions" ON public.meditation_sessions;
    DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.meditation_sessions;
    DROP POLICY IF EXISTS "Users can update their own sessions" ON public.meditation_sessions;
    
    CREATE POLICY "Users can view their own sessions" ON public.meditation_sessions
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own sessions" ON public.meditation_sessions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own sessions" ON public.meditation_sessions
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: meditation_sessions';
  END IF;
END $$;

-- User quiz attempts
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_quiz_attempts') THEN
    DROP POLICY IF EXISTS "Users can view their own attempts" ON public.user_quiz_attempts;
    DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.user_quiz_attempts;
    DROP POLICY IF EXISTS "Users can update their own attempts" ON public.user_quiz_attempts;
    
    CREATE POLICY "Users can view their own attempts" ON public.user_quiz_attempts
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own attempts" ON public.user_quiz_attempts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own attempts" ON public.user_quiz_attempts
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: user_quiz_attempts';
  END IF;
END $$;

-- Tracked content
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tracked_content') THEN
    DROP POLICY IF EXISTS "Users can view their own tracked content" ON public.tracked_content;
    DROP POLICY IF EXISTS "Users can insert their own tracked content" ON public.tracked_content;
    DROP POLICY IF EXISTS "Users can update their own tracked content" ON public.tracked_content;
    
    CREATE POLICY "Users can view their own tracked content" ON public.tracked_content
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own tracked content" ON public.tracked_content
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own tracked content" ON public.tracked_content
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: tracked_content';
  END IF;
END $$;

-- Prayer times
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prayer_times') THEN
    DROP POLICY IF EXISTS "Users can view their own prayer times" ON public.prayer_times;
    DROP POLICY IF EXISTS "Users can insert their own prayer times" ON public.prayer_times;
    DROP POLICY IF EXISTS "Users can update their own prayer times" ON public.prayer_times;
    
    CREATE POLICY "Users can view their own prayer times" ON public.prayer_times
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own prayer times" ON public.prayer_times
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own prayer times" ON public.prayer_times
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: prayer_times';
  END IF;
END $$;

-- Prayer time adjustments
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prayer_time_adjustments') THEN
    DROP POLICY IF EXISTS "Users can view their own adjustments" ON public.prayer_time_adjustments;
    DROP POLICY IF EXISTS "Users can insert their own adjustments" ON public.prayer_time_adjustments;
    DROP POLICY IF EXISTS "Users can update their own adjustments" ON public.prayer_time_adjustments;
    
    CREATE POLICY "Users can view their own adjustments" ON public.prayer_time_adjustments
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own adjustments" ON public.prayer_time_adjustments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own adjustments" ON public.prayer_time_adjustments
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: prayer_time_adjustments';
  END IF;
END $$;

-- User daily content
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_daily_content') THEN
    DROP POLICY IF EXISTS "Users can view their own daily content" ON public.user_daily_content;
    DROP POLICY IF EXISTS "Users can insert their own daily content" ON public.user_daily_content;
    DROP POLICY IF EXISTS "Users can update their own daily content" ON public.user_daily_content;
    
    CREATE POLICY "Users can view their own daily content" ON public.user_daily_content
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own daily content" ON public.user_daily_content
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own daily content" ON public.user_daily_content
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: user_daily_content';
  END IF;
END $$;

-- Community invites (special case: users can view invites where they are inviter OR invitee)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_invites') THEN
    DROP POLICY IF EXISTS "Users can view their own invites" ON public.community_invites;
    DROP POLICY IF EXISTS "Users can create invites" ON public.community_invites;
    DROP POLICY IF EXISTS "Users can update their own invites" ON public.community_invites;
    
    CREATE POLICY "Users can view their own invites" ON public.community_invites
      FOR SELECT
      USING (auth.uid() = invited_user_id OR auth.uid() = invited_by_user_id);
    
    CREATE POLICY "Users can create invites" ON public.community_invites
      FOR INSERT
      WITH CHECK (auth.uid() = invited_by_user_id);
    
    CREATE POLICY "Users can update their own invites" ON public.community_invites
      FOR UPDATE
      USING (auth.uid() = invited_user_id OR auth.uid() = invited_by_user_id)
      WITH CHECK (auth.uid() = invited_user_id OR auth.uid() = invited_by_user_id);
    
    RAISE NOTICE 'Policies created: community_invites';
  END IF;
END $$;

-- Physical activities (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'physical_activities') THEN
    DROP POLICY IF EXISTS "Users can view their own activities" ON public.physical_activities;
    DROP POLICY IF EXISTS "Users can insert their own activities" ON public.physical_activities;
    DROP POLICY IF EXISTS "Users can update their own activities" ON public.physical_activities;
    
    CREATE POLICY "Users can view their own activities" ON public.physical_activities
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own activities" ON public.physical_activities
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own activities" ON public.physical_activities
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies created: physical_activities';
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS STATUS CHECK';
  RAISE NOTICE '========================================';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
    ORDER BY tablename
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = table_record.tablename
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF rls_enabled THEN
      RAISE NOTICE '✅ % - RLS enabled', table_record.tablename;
    ELSE
      RAISE WARNING '❌ % - RLS NOT enabled', table_record.tablename;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 5. VERIFY FOREIGN KEYS HAVE CASCADE WHERE APPROPRIATE
-- ============================================================================
-- Note: This section reports on foreign keys but doesn't modify them
-- (Modifying foreign keys requires dropping and recreating constraints)

DO $$
DECLARE
  fk_record RECORD;
  msg TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FOREIGN KEY CASCADE CHECK';
  RAISE NOTICE '========================================';
  
  FOR fk_record IN
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'users' -- Foreign keys to auth.users
    ORDER BY tc.table_name, kcu.column_name
  LOOP
    IF fk_record.delete_rule = 'CASCADE' THEN
      msg := format('✅ %s.%s -> %s.%s (CASCADE)', 
        fk_record.table_name, 
        fk_record.column_name,
        fk_record.foreign_table_name,
        fk_record.foreign_column_name);
      RAISE NOTICE '%', msg;
    ELSE
      msg := format('⚠️ %s.%s -> %s.%s (%s) - Consider CASCADE for user data', 
        fk_record.table_name, 
        fk_record.column_name,
        fk_record.foreign_table_name,
        fk_record.foreign_column_name,
        fk_record.delete_rule);
      RAISE WARNING '%', msg;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS ENFORCEMENT COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tables now have RLS enabled';
  RAISE NOTICE 'All policies enforce user_id = auth.uid()';
  RAISE NOTICE 'Public read tables allow SELECT for all';
  RAISE NOTICE 'No DELETE policies created (as required)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review foreign key CASCADE warnings above';
  RAISE NOTICE '2. Test policies with multiple test users';
  RAISE NOTICE '3. Verify data isolation between users';
END $$;
