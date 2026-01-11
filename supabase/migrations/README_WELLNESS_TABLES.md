# Wellness Tables Migration

This migration creates the missing tables needed for meditation, quizzes, and wellness features.

## Tables Created

1. **meditation_sessions** - Stores user meditation and mindfulness practice sessions
2. **quiz_categories** - Categories for organizing quiz questions  
3. **user_quiz_attempts** - Tracks user quiz attempts and scores
4. **tracked_content** - Tracks user engagement with lectures and recitations
5. **prayer_times** - Stores calculated prayer times for users
6. **prayer_time_adjustments** - Stores user prayer time adjustments
7. **mental_health_duas** - Stores healing duas for mental wellness

## How to Run

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `003_create_wellness_tables.sql`
4. Click "Run" to execute the migration

### Option 2: Via Supabase CLI

```bash
supabase migration up
```

Or if you need to run a specific migration:

```bash
psql -h [your-db-host] -U postgres -d postgres -f supabase/migrations/003_create_wellness_tables.sql
```

## What This Fixes

- ✅ Meditation sessions can now be saved to the database
- ✅ Quiz categories can be loaded and displayed
- ✅ Quiz attempts can be tracked and saved
- ✅ Lecture and recitation tracking works properly
- ✅ Prayer times can be saved to the database
- ✅ Prayer time adjustments can be saved to the database
- ✅ Mental health duas can be loaded and displayed
- ✅ Achievement system can count meditation sessions, quizzes, and lectures

## Fallback Behavior

The app includes fallback logic:
- If tables don't exist, meditation sessions are saved locally to AsyncStorage
- Quiz features will work but won't save to database until tables are created
- Lecture/recitation tracking will work but won't save to database until table is created
- Prayer times are cached locally, so they work without database (but won't sync across devices)
- Prayer adjustments are stored locally if database table doesn't exist
- Mental health duas will show empty state if table doesn't exist
- Achievements will still work using local storage fallback

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('meditation_sessions', 'quiz_categories', 'user_quiz_attempts', 'tracked_content', 'prayer_times', 'prayer_time_adjustments', 'mental_health_duas');
```

You should see all three tables listed.
