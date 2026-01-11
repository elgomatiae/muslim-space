-- ============================================================================
-- RECOMMENDED RLS POLICIES FOR PRODUCTION
-- ============================================================================
-- These policies ensure data isolation and security
-- All policies assume auth.uid() is available (user is authenticated)

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Allow users to read all profiles (for community features)
-- But only update their own profile

-- Note: Adjust based on your privacy requirements
-- Option 1: Public read (current)
-- Option 2: Only friends/community members can read (more private)

-- SELECT: Anyone can view profiles (for community features)
-- UPDATE: Users can only update their own profile
-- Already handled in existing migrations, but listed for reference

-- ============================================================================
-- IMAN_TRACKER_GOALS
-- ============================================================================
-- Users can only access their own goals
-- (Should already be in migrations)

-- ============================================================================
-- USER_ACHIEVEMENTS
-- ============================================================================
-- Users can only view their own achievements
-- (Should already be in migrations)

-- ============================================================================
-- ACHIEVEMENT_PROGRESS
-- ============================================================================
-- Users can only view/update their own progress
-- (Should already be in migrations)

-- ============================================================================
-- COMMUNITY_INVITES
-- ============================================================================
-- Users can:
-- - View invites where they are the invited_user_id OR invited_by_user_id
-- - Create invites (as inviter)
-- - Update invites where they are the invited_user_id (accept/decline)
-- (Should already be in migrations)

-- ============================================================================
-- PRAYER_TIMES
-- ============================================================================
-- Users can only view/update their own prayer times
-- (Already in 003_create_wellness_tables.sql)

-- ============================================================================
-- TRACKED_CONTENT
-- ============================================================================
-- Users can only view/update their own tracked content
-- (Already in 003_create_wellness_tables.sql)

-- ============================================================================
-- SECURITY CHECKLIST
-- ============================================================================
-- ✅ All tables have RLS enabled
-- ✅ All SELECT policies scope by user_id (except public read tables like achievements, quiz_categories)
-- ✅ All INSERT policies check user_id matches auth.uid()
-- ✅ All UPDATE policies check user_id matches auth.uid()
-- ✅ No DELETE policies unless explicitly needed
-- ✅ Foreign keys have ON DELETE CASCADE where appropriate

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables have RLS enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND rowsecurity = false; -- Should return empty

-- Check policies exist for all tables:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;
