-- ============================================================================
-- SUPABASE MIGRATION: Create Lectures and Recitations Tables
-- ============================================================================
-- This migration creates separate tables for lectures and recitations
-- based on the CSV data structure provided
-- ============================================================================

-- ============================================================================
-- 1. LECTURES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    speaker TEXT,
    duration TEXT, -- Stored as text (e.g., "1h 30m", "45m")
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lectures_category_id ON public.lectures(category_id);
CREATE INDEX IF NOT EXISTS idx_lectures_order ON public.lectures(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON public.lectures(created_at DESC);

-- Add comment
COMMENT ON TABLE public.lectures IS 'Stores Islamic lectures with category_id as text';

-- ============================================================================
-- 2. RECITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recitations (
    id UUID PRIMARY KEY,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    reciter TEXT,
    duration TEXT, -- Stored as text (e.g., "13:20", "11:47")
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recitations_category_id ON public.recitations(category_id);
CREATE INDEX IF NOT EXISTS idx_recitations_order ON public.recitations(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_recitations_created_at ON public.recitations(created_at DESC);

-- Add comment
COMMENT ON TABLE public.recitations IS 'Stores Quran recitations with category_id as text';

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on lectures
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Enable RLS on recitations
ALTER TABLE public.recitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Lectures: Public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lectures' 
        AND policyname = 'Public can view lectures'
    ) THEN
        CREATE POLICY "Public can view lectures" ON public.lectures
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Recitations: Public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'recitations' 
        AND policyname = 'Public can view recitations'
    ) THEN
        CREATE POLICY "Public can view recitations" ON public.recitations
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT to anon role
GRANT SELECT ON public.lectures TO anon;
GRANT SELECT ON public.recitations TO anon;

-- Grant SELECT to authenticated role
GRANT SELECT ON public.lectures TO authenticated;
GRANT SELECT ON public.recitations TO authenticated;
