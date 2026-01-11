-- ============================================================================
-- SUPABASE MIGRATION: Create Journal Entries Table
-- ============================================================================
-- This migration creates the journal_entries table for user journaling
-- ============================================================================

-- ============================================================================
-- 1. JOURNAL_ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Entry',
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    mood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries(user_id, created_at DESC);

-- Add GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON public.journal_entries USING GIN(tags);

-- Add comment
COMMENT ON TABLE public.journal_entries IS 'Stores user journal entries with tags and mood';

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES
-- ============================================================================

-- Users can view their own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'journal_entries' 
        AND policyname = 'Users can view their own journal entries'
    ) THEN
        CREATE POLICY "Users can view their own journal entries" ON public.journal_entries
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can insert their own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'journal_entries' 
        AND policyname = 'Users can insert their own journal entries'
    ) THEN
        CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'journal_entries' 
        AND policyname = 'Users can update their own journal entries'
    ) THEN
        CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can delete their own entries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'journal_entries' 
        AND policyname = 'Users can delete their own journal entries'
    ) THEN
        CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
            FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;

-- ============================================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trigger_update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_entries_updated_at();
