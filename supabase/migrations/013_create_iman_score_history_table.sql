-- ============================================================================
-- IMAN SCORE HISTORY TABLE
-- ============================================================================
-- This table tracks Iman scores over time for trends visualization
-- Scores are recorded daily (one record per day per user)

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS iman_score_history CASCADE;

-- Create iman_score_history table
CREATE TABLE iman_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  ibadah_score INTEGER NOT NULL CHECK (ibadah_score >= 0 AND ibadah_score <= 100),
  ilm_score INTEGER NOT NULL CHECK (ilm_score >= 0 AND ilm_score <= 100),
  amanah_score INTEGER NOT NULL CHECK (amanah_score >= 0 AND amanah_score <= 100),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_iman_score_history_user_id ON iman_score_history(user_id);
CREATE INDEX idx_iman_score_history_recorded_at ON iman_score_history(recorded_at DESC);

-- Ensure one record per user per day (based on date, not exact timestamp)
-- Using date_trunc which is immutable - truncates to start of day in UTC
CREATE UNIQUE INDEX idx_iman_score_history_user_date_unique 
  ON iman_score_history(user_id, date_trunc('day', recorded_at AT TIME ZONE 'UTC'));

-- Enable Row Level Security
ALTER TABLE iman_score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own score history
CREATE POLICY "Users can view their own score history" ON iman_score_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own score history
CREATE POLICY "Users can insert their own score history" ON iman_score_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own score history
CREATE POLICY "Users can update their own score history" ON iman_score_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_iman_score_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER iman_score_history_updated_at
  BEFORE UPDATE ON iman_score_history
  FOR EACH ROW
  EXECUTE FUNCTION update_iman_score_history_updated_at();

-- Add comment
COMMENT ON TABLE iman_score_history IS 'Tracks Iman scores over time for trends visualization. One record per user per day.';
