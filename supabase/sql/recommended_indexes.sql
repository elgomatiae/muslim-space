-- ============================================================================
-- RECOMMENDED INDEXES FOR PRODUCTION
-- ============================================================================
-- These indexes improve query performance for frequently accessed columns
-- Run this after creating tables to optimize read performance
-- 
-- NOTE: This script only creates indexes for tables that exist.
-- If a table doesn't exist, the index creation will be skipped gracefully.

-- ============================================================================
-- USER-RELATED INDEXES
-- ============================================================================

-- Profiles table indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE email IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(full_name) WHERE full_name IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- ACHIEVEMENT SYSTEM INDEXES (OPTIONAL - only if tables exist)
-- ============================================================================

-- User achievements (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON public.user_achievements(user_id, achievement_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);
  END IF;
END $$;

-- Achievement progress (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievement_progress') THEN
    CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_achievement ON public.achievement_progress(user_id, achievement_id);
    CREATE INDEX IF NOT EXISTS idx_achievement_progress_updated ON public.achievement_progress(updated_at DESC);
  END IF;
END $$;

-- ============================================================================
-- IMAN TRACKER INDEXES (OPTIONAL - only if tables exist)
-- ============================================================================

-- Iman tracker goals (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iman_tracker_goals') THEN
    CREATE INDEX IF NOT EXISTS idx_iman_tracker_goals_user_date ON public.iman_tracker_goals(user_id, created_at DESC);
  END IF;
END $$;

-- User streaks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_streaks') THEN
    CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_streaks_streak ON public.user_streaks(current_streak DESC) WHERE current_streak > 0;
  END IF;
END $$;

-- User stats (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stats') THEN
    CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
  END IF;
END $$;

-- ============================================================================
-- COMMUNITY INDEXES (OPTIONAL - only if table exists)
-- ============================================================================

-- Community invites (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'community_invites') THEN
    CREATE INDEX IF NOT EXISTS idx_community_invites_invited_user_status ON public.community_invites(invited_user_id, status) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_community_invites_created_at ON public.community_invites(created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- CONTENT INDEXES (from existing migrations)
-- ============================================================================

-- Video categories (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_video_categories_type_active ON public.video_categories(type, is_active) WHERE is_active = TRUE;
  END IF;
END $$;

-- Tracked content indexes (already created in 003_create_wellness_tables.sql, but listed for reference)
-- These are already created in the migration:
-- - idx_tracked_content_user_id
-- - idx_tracked_content_type
-- - idx_tracked_content_user_type
-- - idx_tracked_content_completed

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- These indexes help with:
-- 1. Fast user-scoped queries (always filter by user_id first)
-- 2. Recent activity queries (created_at DESC)
-- 3. Status-based filtering (WHERE status = 'pending')
-- 4. Join performance (foreign key indexes)

-- Monitor index usage with:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
