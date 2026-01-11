#!/usr/bin/env python3
"""
Generate SQL migration to import lectures and recitations from CSV files
"""

import csv
import sys
import os

# Configure output encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def escape_sql_string(value):
    """Escape a string for SQL"""
    if value is None:
        return 'NULL'
    # Replace single quotes with double single quotes
    return "'" + str(value).replace("'", "''") + "'"

def parse_duration(duration_str):
    """Parse duration string to seconds (handles formats like '1h 30m', '45m', '13:20')"""
    if not duration_str:
        return 'NULL'
    
    duration_str = str(duration_str).strip()
    
    # Handle MM:SS or HH:MM:SS format
    if ':' in duration_str:
        parts = duration_str.split(':')
        if len(parts) == 2:
            # MM:SS
            minutes = int(parts[0]) if parts[0].isdigit() else 0
            seconds = int(parts[1]) if parts[1].isdigit() else 0
            total_seconds = minutes * 60 + seconds
            return f"'{total_seconds // 60}:{total_seconds % 60}'"
        elif len(parts) == 3:
            # HH:MM:SS
            hours = int(parts[0]) if parts[0].isdigit() else 0
            minutes = int(parts[1]) if parts[1].isdigit() else 0
            seconds = int(parts[2]) if parts[2].isdigit() else 0
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return f"'{total_seconds // 60}:{total_seconds % 60}'"
    
    # Handle "1h 30m" format
    hours = 0
    minutes = 0
    
    if 'h' in duration_str.lower():
        hour_match = duration_str.lower().split('h')[0].strip()
        if hour_match.isdigit():
            hours = int(hour_match)
    
    if 'm' in duration_str.lower():
        minute_part = duration_str.lower().split('m')[0]
        if 'h' in minute_part:
            minute_part = minute_part.split('h')[-1].strip()
        if minute_part.isdigit():
            minutes = int(minute_part)
    
    if hours > 0 or minutes > 0:
        total_seconds = hours * 3600 + minutes * 60
        return f"'{total_seconds // 60}:{total_seconds % 60}'"
    
    # If it's just a number, assume it's minutes
    if duration_str.isdigit():
        return f"'{duration_str}:00'"
    
    # Return as-is if we can't parse
    return escape_sql_string(duration_str)

def generate_lectures_import(lectures_csv_path):
    """Generate SQL INSERT statements for lectures"""
    print("-- ============================================================================")
    print("-- IMPORT LECTURES FROM CSV")
    print("-- ============================================================================")
    print()
    print("-- Clear existing data (optional - comment out if you want to keep existing)")
    print("-- TRUNCATE TABLE public.lectures;")
    print()
    print("-- Insert lectures")
    print("INSERT INTO public.lectures (id, category_id, title, speaker, duration, video_url, thumbnail_url, order_index, created_at, updated_at)")
    print("VALUES")
    
    rows = []
    try:
        with open(lectures_csv_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                id_val = escape_sql_string(row.get('id', ''))
                category_id = escape_sql_string(row.get('category_id', ''))
                title = escape_sql_string(row.get('title', ''))
                speaker = escape_sql_string(row.get('speaker', '')) if row.get('speaker') else 'NULL'
                duration = parse_duration(row.get('duration', ''))
                video_url = escape_sql_string(row.get('video_url', ''))
                thumbnail_url = escape_sql_string(row.get('thumbnail_url', '')) if row.get('thumbnail_url') else 'NULL'
                order_index = row.get('order_index', '0')
                if not order_index.isdigit():
                    order_index = '0'
                created_at = escape_sql_string(row.get('created_at', '')) if row.get('created_at') else 'NOW()'
                updated_at = escape_sql_string(row.get('updated_at', '')) if row.get('updated_at') else 'NOW()'
                
                rows.append(f"({id_val}, {category_id}, {title}, {speaker}, {duration}, {video_url}, {thumbnail_url}, {order_index}, {created_at}, {updated_at})")
        
        # Print rows with proper formatting
        for i, row in enumerate(rows):
            if i < len(rows) - 1:
                print(f"  {row},")
            else:
                print(f"  {row}")
        
        print("ON CONFLICT (id) DO NOTHING;")
        print()
        print(f"-- Total: {len(rows)} lectures imported")
        
    except FileNotFoundError:
        print(f"-- ERROR: File not found: {lectures_csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"-- ERROR: {str(e)}")
        sys.exit(1)

def generate_recitations_import(recitations_csv_path):
    """Generate SQL INSERT statements for recitations"""
    print()
    print("-- ============================================================================")
    print("-- IMPORT RECITATIONS FROM CSV")
    print("-- ============================================================================")
    print()
    print("-- Clear existing data (optional - comment out if you want to keep existing)")
    print("-- TRUNCATE TABLE public.recitations;")
    print()
    print("-- Insert recitations")
    print("INSERT INTO public.recitations (id, category_id, title, reciter, duration, video_url, thumbnail_url, order_index, created_at, updated_at)")
    print("VALUES")
    
    rows = []
    try:
        with open(recitations_csv_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                id_val = escape_sql_string(row.get('id', ''))
                category_id = escape_sql_string(row.get('category_id', ''))
                title = escape_sql_string(row.get('title', ''))
                reciter = escape_sql_string(row.get('reciter', '')) if row.get('reciter') else 'NULL'
                duration = parse_duration(row.get('duration', ''))
                video_url = escape_sql_string(row.get('video_url', ''))
                thumbnail_url = escape_sql_string(row.get('thumbnail_url', '')) if row.get('thumbnail_url') else 'NULL'
                order_index = row.get('order_index', '0')
                if not order_index.isdigit():
                    order_index = '0'
                created_at = escape_sql_string(row.get('created_at', '')) if row.get('created_at') else 'NOW()'
                updated_at = escape_sql_string(row.get('updated_at', '')) if row.get('updated_at') else 'NOW()'
                
                rows.append(f"({id_val}, {category_id}, {title}, {reciter}, {duration}, {video_url}, {thumbnail_url}, {order_index}, {created_at}, {updated_at})")
        
        # Print rows with proper formatting
        for i, row in enumerate(rows):
            if i < len(rows) - 1:
                print(f"  {row},")
            else:
                print(f"  {row}")
        
        print("ON CONFLICT (id) DO NOTHING;")
        print()
        print(f"-- Total: {len(rows)} recitations imported")
        
    except FileNotFoundError:
        print(f"-- ERROR: File not found: {recitations_csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"-- ERROR: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    # Default paths (can be overridden)
    lectures_csv = r'c:\Users\Elgom\Downloads\lectures_rows (1).csv'
    recitations_csv = r'c:\Users\Elgom\Downloads\recitations_rows.csv'
    
    if len(sys.argv) > 1:
        lectures_csv = sys.argv[1]
    if len(sys.argv) > 2:
        recitations_csv = sys.argv[2]
    
    # Write to file with UTF-8 encoding
    output_file = 'supabase/migrations/009_import_lectures_recitations.sql'
    with open(output_file, 'w', encoding='utf-8', errors='replace') as f:
        original_stdout = sys.stdout
        sys.stdout = f
        try:
            generate_lectures_import(lectures_csv)
            generate_recitations_import(recitations_csv)
        finally:
            sys.stdout = original_stdout
    
    print(f"✅ SQL migration generated: {output_file}")
    
    print()
    print("-- ============================================================================")
    print("-- VERIFICATION QUERIES")
    print("-- ============================================================================")
    print()
    print("-- Check lectures count")
    print("SELECT COUNT(*) as total_lectures FROM public.lectures;")
    print()
    print("-- Check recitations count")
    print("SELECT COUNT(*) as total_recitations FROM public.recitations;")
    print()
    print("-- Check lectures by category")
    print("SELECT category_id, COUNT(*) as count FROM public.lectures GROUP BY category_id ORDER BY count DESC;")
    print()
    print("-- Check recitations by category")
    print("SELECT category_id, COUNT(*) as count FROM public.recitations GROUP BY category_id ORDER BY count DESC;")

if __name__ == '__main__':
    main()
