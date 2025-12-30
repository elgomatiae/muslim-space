
# Quran Recitations Categorization Guide

## Overview
This guide explains the improved categorization system for Quran recitations in the Muslim Lifestyle app.

## Problem
Previously, the "Complete Surahs" category contained 188 out of 308 recitations (61%), making it difficult for users to find specific types of recitations.

## Solution
We've created a more balanced categorization system with 12 distinct categories:

### New Categories

1. **Juz Recitations** (Order: 1)
   - Complete Juz (parts) of the Quran
   - Keywords: juz, juzz, para

2. **Surah Al-Baqarah** (Order: 2)
   - Recitations of Surah Al-Baqarah
   - Keywords: baqarah, al-baqarah, 002, surah 2

3. **Surah Al-Imran** (Order: 3)
   - Recitations of Surah Al-Imran
   - Keywords: imran, al-imran, 003, surah 3

4. **Surah Yusuf** (Order: 4)
   - Recitations of Surah Yusuf
   - Keywords: yusuf, 012, surah 12

5. **Surah Maryam** (Order: 5)
   - Recitations of Surah Maryam
   - Keywords: maryam, 019, surah 19

6. **Surah Ar-Rahman** (Order: 6)
   - Recitations of Surah Ar-Rahman
   - Keywords: rahman, ar-rahman, 055, surah 55

7. **Surah Al-Kahf** (Order: 7)
   - Recitations of Surah Al-Kahf
   - Keywords: kahf, al-kahf, 018, surah 18

8. **Surah Yasin** (Order: 8)
   - Recitations of Surah Yasin
   - Keywords: yasin, ya-sin, 036, surah 36

9. **Short Surahs (Juz Amma)** (Order: 9)
   - Short surahs from the 30th Juz (Surahs 78-114)
   - Keywords: juz amma, juz 30, naba, naziat, abasa, etc.

10. **Famous Reciters** (Order: 10)
    - Recitations by renowned Qaris
    - Keywords: minshawi, husary, ghamdi, sudais, shuraim, afasy, dosari, shatri, qatami, ajmi

11. **Maqamat Styles** (Order: 11)
    - Recitations in different Maqamat (melodic modes)
    - Keywords: maqam, ajam, jiharkah, nahawand, saba, hijaz, rast, bayati

12. **Live Recitations** (Order: 12)
    - Live recordings from mosques and events
    - Keywords: live, taraweeh, tahajjud, qiyam, hajj, arafat, ramadan, masjid, mosque

### Existing Categories (Preserved)
- **Tilawah & Tarteel**
- **Emotional Recitations**
- **Taraweeh Prayers**
- **Special Occasions**
- **Tajweed Lessons**

## How to Recategorize

### Option 1: Admin Panel (Recommended)
1. Go to the Admin Panel in the app
2. Scroll down and tap "Recategorize Recitations"
3. Confirm the action
4. Wait for the process to complete
5. View the distribution summary

### Option 2: Direct Edge Function Call
```typescript
const { data, error } = await supabase.functions.invoke('recategorize-recitations');

if (data && data.success) {
  console.log('Recategorized:', data.recategorized);
  console.log('Total videos:', data.totalVideos);
  console.log('Category stats:', data.categoryStats);
}
```

## Categorization Logic

The system uses a priority-based approach:

1. **Specific Surahs** (Highest Priority)
   - Checks for specific surah names and numbers
   - Examples: Baqarah, Imran, Yusuf, Maryam, Rahman, Kahf, Yasin

2. **Juz Recitations**
   - Identifies complete Juz recitations

3. **Short Surahs (Juz Amma)**
   - Identifies surahs 78-114 by number or name

4. **Maqamat Styles**
   - Identifies recitations with specific melodic modes

5. **Live Recitations**
   - Identifies live recordings from events

6. **Famous Reciters** (Lowest Priority)
   - Catches remaining videos by famous reciters

## Benefits

1. **Better Distribution**: Videos are more evenly distributed across categories
2. **Easier Discovery**: Users can find specific types of recitations quickly
3. **Thematic Organization**: Categories are organized by content type and purpose
4. **Scalability**: New videos will be automatically categorized correctly

## Database Schema

### video_categories Table
```sql
CREATE TABLE video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('lecture', 'recitation')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  category_id UUID REFERENCES video_categories(id),
  reciter_name TEXT,
  views INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Function

The `recategorize-recitations` Edge Function:
- Creates new categories if they don't exist
- Analyzes video titles using keyword matching
- Updates video category assignments
- Returns detailed statistics

## Future Enhancements

1. **AI-Powered Categorization**: Use OpenAI to analyze video titles and descriptions
2. **User Preferences**: Allow users to customize category visibility
3. **Auto-Categorization**: Automatically categorize new videos on import
4. **Category Analytics**: Track which categories are most popular

## Troubleshooting

### Videos Not Categorized
- Check if video titles contain recognizable keywords
- Manually assign categories through the database
- Update the Edge Function logic for new patterns

### Categories Not Showing
- Verify categories exist in `video_categories` table
- Check that `type = 'recitation'`
- Ensure videos are assigned to the categories

### Performance Issues
- The Edge Function processes videos in batches of 50
- Large datasets may take a few minutes
- Check Edge Function logs for errors

## Support

For issues or questions:
1. Check the Edge Function logs in Supabase Dashboard
2. Review the `video_categories` and `videos` tables
3. Test with a small subset of videos first
4. Contact support with specific error messages
