#!/usr/bin/env python3
"""
Generate SQL migration to import quiz questions from CSV
"""
import csv
import json
import sys
import os

# Paths
CSV_PATH = r'c:\Users\Elgom\Downloads\quiz_questions_rows.csv'
OUTPUT_PATH = r'supabase\migrations\006_import_quiz_data.sql'

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def generate_sql():
    """Generate SQL INSERT statements from CSV"""
    
    # Read CSV
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        questions = list(reader)
    
    print(f"Processing {len(questions)} questions...")
    
    # Generate SQL
    sql_parts = [
        "-- ============================================================================",
        "-- IMPORT QUIZ DATA FROM CSV",
        "-- ============================================================================",
        "-- This migration imports quiz categories and questions from the CSV files",
        "-- Run this after 005_create_quizzes_and_questions.sql",
        "",
        "-- ============================================================================",
        "-- 1. IMPORT QUIZZES (from quizzes_rows.csv)",
        "-- ============================================================================",
        "INSERT INTO public.quizzes (id, quiz_id, title, description, difficulty, color, order_index, created_at, updated_at)",
        "VALUES",
        "  ('20cc2291-d010-4e10-a73f-e581fd11d22a', 'prophets', 'Prophets in Islam', 'Learn about the prophets mentioned in the Quran', 'Medium', '#00BCD4', 6, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00'),",
        "  ('2de648e5-9bb7-418e-9c4a-c06cc0ab1536', 'quran', 'Quran Knowledge', 'Test your knowledge of the Holy Quran', 'Medium', '#4CAF50', 1, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00'),",
        "  ('52edaf20-d2f8-49e5-9f91-3acdb2ed13af', 'fiqh', 'Fiqh Basics', 'Understanding Islamic jurisprudence', 'Medium', '#9C27B0', 4, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00'),",
        "  ('6ce41cf8-dc75-4270-b794-fefceed6211c', 'pillars', 'Pillars of Islam', 'Test your knowledge of the five pillars', 'Easy', '#F44336', 5, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00'),",
        "  ('7d4da52c-2975-4b97-b3db-e6f81e74f850', 'seerah', 'Seerah Quiz', 'Learn about the life of Prophet Muhammad ﷺ', 'Easy', '#2196F3', 2, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00'),",
        "  ('d86f2d60-c8af-4f96-9fed-8332d1f30b19', 'history', 'Islamic History', 'Explore the rich history of Islam', 'Hard', '#FF9800', 3, '2025-12-01 04:40:59.478776+00', '2025-12-01 04:40:59.478776+00')",
        "ON CONFLICT (quiz_id) DO UPDATE SET",
        "  title = EXCLUDED.title,",
        "  description = EXCLUDED.description,",
        "  difficulty = EXCLUDED.difficulty,",
        "  color = EXCLUDED.color,",
        "  order_index = EXCLUDED.order_index,",
        "  updated_at = NOW();",
        "",
        "-- ============================================================================",
        "-- 2. IMPORT QUIZ QUESTIONS (from quiz_questions_rows.csv)",
        "-- ============================================================================",
        "-- First, delete existing questions to allow clean re-import",
        "DELETE FROM public.quiz_questions;",
        "",
        "INSERT INTO public.quiz_questions (id, quiz_id, question_id, question, options, correct_answer, explanation, order_index, created_at)",
        "VALUES",
    ]
    
    # Generate question inserts
    question_values = []
    for i, q in enumerate(questions):
        question_id = q['id']
        quiz_id = q['quiz_id']
        q_id = q['question_id'] or 'NULL'
        question = escape_sql_string(q['question'])
        options = q['options']  # Already JSON string
        correct_answer = int(q['correct_answer'])
        explanation = escape_sql_string(q['explanation'])
        order_index = int(q['order_index'])
        created_at = q['created_at']
        
        # Build value string
        q_id_sql = f"'{q_id}'" if q_id != 'NULL' else 'NULL'
        value = f"  ('{question_id}', '{quiz_id}', {q_id_sql}, '{question}', '{options}'::jsonb, {correct_answer}, '{explanation}', {order_index}, '{created_at}')"
        
        # Add comma except for last one
        if i < len(questions) - 1:
            value += ","
        question_values.append(value)
    
    sql_parts.extend(question_values)
    sql_parts.extend([
        "ON CONFLICT (id) DO UPDATE SET",
        "  quiz_id = EXCLUDED.quiz_id,",
        "  question = EXCLUDED.question,",
        "  options = EXCLUDED.options,",
        "  correct_answer = EXCLUDED.correct_answer,",
        "  explanation = EXCLUDED.explanation,",
        "  order_index = EXCLUDED.order_index;",
        "",
        "-- ============================================================================",
        "-- VERIFICATION",
        "-- ============================================================================",
        "DO $$",
        "DECLARE",
        "  quiz_count INTEGER;",
        "  question_count INTEGER;",
        "BEGIN",
        "  SELECT COUNT(*) INTO quiz_count FROM public.quizzes;",
        "  SELECT COUNT(*) INTO question_count FROM public.quiz_questions;",
        "  ",
        "  RAISE NOTICE 'Imported % quiz categories', quiz_count;",
        "  RAISE NOTICE 'Imported % quiz questions', question_count;",
        "END $$;",
    ])
    
    # Write to file
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8', errors='replace') as f:
        f.write('\n'.join(sql_parts))
    
    print(f"Generated SQL migration with {len(questions)} questions")
    print(f"Output: {OUTPUT_PATH}")

if __name__ == '__main__':
    try:
        generate_sql()
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
