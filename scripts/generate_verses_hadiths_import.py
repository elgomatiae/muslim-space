#!/usr/bin/env python3
"""
Generate SQL migration to import quran_verses and hadiths from CSV files
"""
import csv
import json
import sys
from datetime import datetime

# Reconfigure stdout for UTF-8
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

def generate_verses_sql(csv_path):
    """Generate INSERT statements for quran_verses"""
    inserts = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            id_val = escape_sql_string(row['id'])
            arabic = escape_sql_string(row['arabic'])
            translation = escape_sql_string(row['translation'])
            reference = escape_sql_string(row['reference'])
            surah_number = row.get('surah_number', 'NULL')
            verse_number = row.get('verse_number', 'NULL')
            created_at = escape_sql_string(row.get('created_at', datetime.now().isoformat()))
            
            insert = f"""INSERT INTO public.quran_verses (id, arabic, translation, reference, surah_number, verse_number, created_at)
VALUES ({id_val}, {arabic}, {translation}, {reference}, {surah_number}, {verse_number}, {created_at}::timestamptz)
ON CONFLICT (id) DO NOTHING;"""
            inserts.append(insert)
    
    return inserts

def generate_hadiths_sql(csv_path):
    """Generate INSERT statements for hadiths"""
    inserts = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            id_val = escape_sql_string(row['id'])
            arabic = escape_sql_string(row.get('arabic', '')) if row.get('arabic') else 'NULL'
            translation = escape_sql_string(row['translation'])
            reference = escape_sql_string(row['reference'])
            collection = escape_sql_string(row.get('collection', '')) if row.get('collection') else 'NULL'
            book_number = escape_sql_string(row.get('book_number', '')) if row.get('book_number') else 'NULL'
            hadith_number = escape_sql_string(row.get('hadith_number', '')) if row.get('hadith_number') else 'NULL'
            created_at = escape_sql_string(row.get('created_at', datetime.now().isoformat()))
            
            # Handle NULL for arabic
            if arabic == "''":
                arabic = 'NULL'
            else:
                arabic = f"{arabic}"
            
            insert = f"""INSERT INTO public.hadiths (id, arabic, translation, reference, collection, book_number, hadith_number, created_at)
VALUES ({id_val}, {arabic}, {translation}, {reference}, {collection}, {book_number}, {hadith_number}, {created_at}::timestamptz)
ON CONFLICT (id) DO NOTHING;"""
            inserts.append(insert)
    
    return inserts

def main():
    verses_csv = r'c:\Users\Elgom\Downloads\quran_verses_rows (1).csv'
    hadiths_csv = r'c:\Users\Elgom\Downloads\hadiths_rows (1).csv'
    
    print("-- ============================================================================")
    print("-- IMPORT QURAN VERSES AND HADITHS")
    print("-- ============================================================================")
    print("-- This migration creates tables and imports data from CSV files")
    print("")
    
    # Create tables
    print("-- ============================================================================")
    print("-- 1. CREATE QURAN_VERSES TABLE")
    print("-- ============================================================================")
    print("""
CREATE TABLE IF NOT EXISTS public.quran_verses (
  id UUID PRIMARY KEY,
  arabic TEXT NOT NULL,
  translation TEXT NOT NULL,
  reference TEXT NOT NULL,
  surah_number INTEGER,
  verse_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quran_verses_reference ON public.quran_verses(reference);
CREATE INDEX IF NOT EXISTS idx_quran_verses_surah_verse ON public.quran_verses(surah_number, verse_number);
""")
    
    # Create hadiths table
    print("-- ============================================================================")
    print("-- 2. CREATE HADITHS TABLE")
    print("-- ============================================================================")
    print("""
CREATE TABLE IF NOT EXISTS public.hadiths (
  id UUID PRIMARY KEY,
  arabic TEXT,
  translation TEXT NOT NULL,
  reference TEXT NOT NULL,
  collection TEXT,
  book_number TEXT,
  hadith_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hadiths_reference ON public.hadiths(reference);
CREATE INDEX IF NOT EXISTS idx_hadiths_collection ON public.hadiths(collection);
""")
    
    # Enable RLS
    print("-- ============================================================================")
    print("-- 3. ENABLE RLS AND CREATE POLICIES")
    print("-- ============================================================================")
    print("""
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

-- Public read access for quran_verses
DROP POLICY IF EXISTS "Public can view quran verses" ON public.quran_verses;
CREATE POLICY "Public can view quran verses" ON public.quran_verses
  FOR SELECT
  USING (true);

-- Public read access for hadiths
DROP POLICY IF EXISTS "Public can view hadiths" ON public.hadiths;
CREATE POLICY "Public can view hadiths" ON public.hadiths
  FOR SELECT
  USING (true);
""")
    
    # Import verses
    print("-- ============================================================================")
    print("-- 4. IMPORT QURAN VERSES")
    print("-- ============================================================================")
    try:
        verses = generate_verses_sql(verses_csv)
        for insert in verses:
            print(insert)
        print(f"\n-- Imported {len(verses)} verses")
    except Exception as e:
        print(f"-- ERROR importing verses: {e}", file=sys.stderr)
    
    # Import hadiths
    print("\n-- ============================================================================")
    print("-- 5. IMPORT HADITHS")
    print("-- ============================================================================")
    try:
        hadiths = generate_hadiths_sql(hadiths_csv)
        for insert in hadiths:
            print(insert)
        print(f"\n-- Imported {len(hadiths)} hadiths")
    except Exception as e:
        print(f"-- ERROR importing hadiths: {e}", file=sys.stderr)
    
    # Verification
    print("\n-- ============================================================================")
    print("-- 6. VERIFICATION")
    print("-- ============================================================================")
    print("""
-- Verify counts
SELECT 'quran_verses' as table_name, COUNT(*) as row_count FROM public.quran_verses;
SELECT 'hadiths' as table_name, COUNT(*) as row_count FROM public.hadiths;
""")

if __name__ == '__main__':
    main()
