
# Quran Recitations Categorization Summary

## Overview
I have analyzed all 309 videos in the `quran_recitations` table and categorized them into 9 meaningful categories based on their titles, content, and characteristics.

## Categories Created

### 1. **Specific Surah Recitations** (181 videos)
Videos focused on complete or partial recitation of specific Surahs from the Quran.
- Examples:
  - "Surah Al-Baqarah 1-25 - Moutasem Al-Hameedi"
  - "Surah Yasin(full)-shaikh Mishary Rashid Al Afasy"
  - "سورة النساء بصوت الشيخ ياسر الدوسري"

### 2. **Emotional & Heart-Touching** (53 videos)
Recitations specifically noted for their emotional impact and ability to touch hearts.
- Examples:
  - "(Extremely Emotional) Nasser Al-Qatami - Heart Touching Recitation"
  - "Beautiful Quran Recitation | Heart Soothing Voice"
  - "BEAUTIFUL QURAN RECITATION (POWERFUL VERSES)"

### 3. **General Recitations** (33 videos)
High-quality recitations that don't fit into other specific categories.
- Examples:
  - "Beautiful Quran | Heart Soothing Voice - Qari Fatih Seferagic"
  - "Amazing Quran Recitation Qari Ismail Al Nouri"

### 4. **Taraweeh & Ramadan** (14 videos)
Recordings from Taraweeh prayers and special Ramadan performances.
- Examples:
  - "Qari Fatih Seferagic - ELM Taraweeh 2016"
  - "Islam Sobhi LIVE Ramadan Tarawi"
  - "صلاة التراويح القارئ ابوبكر الشاطري"

### 5. **Quranic Stories** (9 videos)
Recitations focusing on specific stories from the Quran (Prophets, historical events).
- Examples:
  - "Story of Prophet Hud in Quran by reciter Raad Muhammad Alkurdi"
  - "Prophet Ya'qub loses his second son | Story of Prophet Yusuf"
  - "Best Quran recitation to Noah's Story"

### 6. **Compilations & Best Of** (8 videos)
Collections and compilations of multiple recitations or "best of" selections.
- Examples:
  - "5 Hours of Salman Al-Utaybi"
  - "TOP 5 QARIS IN THE WORLD - QURAN"
  - "Compilation of Best Recitation Syaikh Mishari Alafasy"

### 7. **Historical & Rare** (4 videos)
Old, vintage, or rare recordings from famous reciters.
- Examples:
  - "*RARE* LIVE VIDEO RECITATION :: Sheikh Muhammad Siddiq Al - Minshawi"
  - "RARE!! - MAHIR AL-MUAIQLY - AL-BAQARAH (v. 40-61)"
  - "Rare and beautiful Quran recitation by Shaikh Minshawi"

### 8. **Maqam Styles** (3 videos)
Recitations in specific melodic modes (Maqam Nahawand, Ajam, Jiharkah, etc.).
- Examples:
  - "Maqam Jiharkah / Ajam 43 - Surah Yusuf"
  - "Beautiful Minshawi Nahawand - surat ar-R'ad"
  - "Sheikh Husary - Maqam Nahawand - sura Ahzab"

### 9. **Live Performances** (2 videos)
Live recitations from mosques and special events.
- Examples:
  - "Sheikh Maahir in South Africa: Isha Prayers led by Sheikh Maher Al Muayqali"
  - "Imaam Yaasir al-Dosary || Masjid Tawheed || May 2010"

### 10. **Thematic Recitations** (2 videos)
Videos with specific themes or messages.
- Examples:
  - "Allah wants to forgive you - Sheikh Mansour Al Salimi"
  - "Conversation Between Jesus And Allah | Surah Al-Ma'idah"

## Categorization Logic

The categorization was done using SQL pattern matching on video titles:

1. **Specific Surah Recitations**: Titles containing "Surah", "Surat", "Sourate", or "سورة"
2. **Emotional & Heart-Touching**: Titles with "emotional", "heart", "touching", "beautiful", "amazing", "cry", "tears", "خاشع", "مبك", "باك"
3. **Taraweeh & Ramadan**: Titles with "taraweeh", "ramadan", "التراويح", "رمضان", "tahajjud", "qiyam"
4. **Maqam Styles**: Titles with "maqam", "nahawand", "ajam", "jiharkah", "bayati", "hijaz", "rast", "مقام", "نهاوند"
5. **Quranic Stories**: Titles with "story", "yusuf", "musa", "ibrahim", "noah", "prophet", "pharaoh", "قصة"
6. **Historical & Rare**: Titles with "rare", "old", "vintage", "classic", year references (1411, 1420, etc.), "نادر", "قديم"
7. **Live Performances**: Titles with "live", "makkah", "madinah", "masjid", "mosque", "مكة", "المدينة", "الحرم", "مسجد"
8. **Compilations & Best Of**: Titles with "compilation", "best", "top", "hours", "collection"
9. **Thematic Recitations**: Titles with "forgive", "mercy", "patience", "guidance", "conversation", "jesus", "believing man"
10. **General Recitations**: All remaining videos that don't fit into specific categories

## Database Changes

- Added a `category` column to the `quran_recitations` table
- Updated all 309 videos with appropriate categories
- Categories are now stored directly in the table for easy filtering and display

## App Integration

The app has been updated to:
- Fetch recitations from the `quran_recitations` table
- Display videos organized by category
- Support search across all fields including categories
- Track recitation views properly
- Integrate with the Iman Tracker for ʿIlm (Knowledge) goals

## Distribution Summary

The categorization provides a balanced distribution:
- **Specific Surah Recitations** (58.6%): The largest category, as expected for Quran recitations
- **Emotional & Heart-Touching** (17.2%): A significant portion emphasizing spiritual impact
- **General Recitations** (10.7%): Quality recitations without specific categorization
- **Taraweeh & Ramadan** (4.5%): Special prayer recordings
- **Quranic Stories** (2.9%): Narrative-focused recitations
- **Compilations & Best Of** (2.6%): Collections and highlights
- **Historical & Rare** (1.3%): Precious historical recordings
- **Maqam Styles** (1.0%): Technical melodic styles
- **Live Performances** (0.6%): Live event recordings
- **Thematic Recitations** (0.6%): Message-focused recitations

This distribution ensures users can easily find recitations based on their preferences, whether they're looking for specific Surahs, emotional experiences, or historical recordings.
