
# Quran Recitations Categorization Summary

## Overview
I have analyzed all 309 videos in the `quran_recitations` table and categorized them into 10 well-balanced categories based on their titles, content, and characteristics. This new categorization ensures a more even distribution of videos across categories.

## Categories Created

### 1. **Emotional & Heart-Touching** (53 videos - 17.2%)
Recitations specifically noted for their emotional impact and ability to touch hearts.
- Examples:
  - "(Extremely Emotional) Nasser Al-Qatami - Heart Touching Recitation"
  - "Beautiful Quran Recitation | Heart Soothing Voice"
  - "BEAUTIFUL QURAN RECITATION (POWERFUL VERSES)"
  - "Try not to cry because of Idris Abkar's reading"

### 2. **General Recitations** (47 videos - 15.2%)
High-quality recitations that don't fit into other specific categories, including live performances and thematic recitations.
- Examples:
  - "Beautiful Quran | Heart Soothing Voice - Qari Fatih Seferagic"
  - "Amazing Quran Recitation Qari Ismail Al Nouri"
  - "Allah wants to forgive you - Sheikh Mansour Al Salimi"
  - "The Believing Man's Speech | Powerful Quran Recitation"

### 3. **Story Surahs (Yusuf, Maryam, Kahf)** (40 videos - 12.9%)
Recitations focusing on Surahs with prominent stories and narratives, including specific story-focused recitations.
- Examples:
  - "Surah Yusuf - Moutasem Al-Hameedi"
  - "Surah Maryam | Moutasem Al-Hameedi"
  - "Surah Kahf | Ahmed al Ajmi"
  - "Story of Prophet Hud in Quran by reciter Raad Muhammad Alkurdi"
  - "Prophet Ya'qub loses his second son | Story of Prophet Yusuf"

### 4. **Shorter Surahs (Luqman to Hadid)** (37 videos - 12.0%)
Recitations of shorter to medium-length Surahs from Surah Luqman (31) to Surah Hadid (57).
- Examples:
  - "Surah Az-Zumar (39) - Emotional - Mishary Al Afasy"
  - "Surah Ghafir Yahya Raaby Recitation"
  - "Surah Hashr - Sheikh Muhammad Siddiq Al - Minshawi"
  - "Surah Qaf - Calming Recitation"

### 5. **Medium Surahs (Yunus to Ankabut)** (36 videos - 11.7%)
Recitations of medium-length Surahs from Surah Yunus (10) to Surah Ankabut (29).
- Examples:
  - "Surah Yunus - Mishary Rashid Al Afasy"
  - "Surah Hud - Sheikh Abdul Aziz Az Zahrani"
  - "Surah Ibrahim - Mishary Rashid Alafasy"
  - "Surah Isra [17] full Mesmerizing Recitation - Yasser Al Dosari"
  - "Surah Al Furqan (The Criterion) | Saad Al Ghamdi"

### 6. **Long Surahs (Al-Baqarah to At-Tawbah)** (34 videos - 11.0%)
Recitations of the longest Surahs in the Quran, from Al-Baqarah (2) to At-Tawbah (9).
- Examples:
  - "Surah Al-Baqarah 1-25 - Moutasem Al-Hameedi"
  - "Surah Ali Imran Wonderful Recitation By Sheikh Maher Al Muaiqly"
  - "Surah An-Nisa - Yasser Al-Dosari"
  - "Surah Al-Ma'ida - Mishary Rashid Alafasy"

### 7. **Popular Surahs (Yasin, Mulk, Rahman)** (18 videos - 5.8%)
Recitations of the most commonly recited and beloved Surahs.
- Examples:
  - "Surah Yasin(full)-shaikh Mishary Rashid Al Afasy"
  - "Surah Mulk - Calming Recitation"
  - "Surah Ar-Rahman (Complete) | Maqam Ajam | Sheikh Yasser al-Dosari"
  - "Surah Al-Waqi'ah (10-26) | Sheikh Mansour As-Salimi"

### 8. **Compilations & Special Styles** (15 videos - 4.9%)
Collections, compilations, historical recordings, and recitations in specific Maqam styles.
- Examples:
  - "5 Hours of Salman Al-Utaybi"
  - "TOP 5 QARIS IN THE WORLD - QURAN"
  - "*RARE* LIVE VIDEO RECITATION :: Sheikh Muhammad Siddiq Al - Minshawi"
  - "Sheikh Husary - Maqam Nahawand - sura Ahzab"
  - "Mustafa ismail-The Best voice in the world- Recorded 1958"

### 9. **Juz Amma Surahs** (15 videos - 4.9%)
Recitations of shorter Surahs from the last Juz (30th part) of the Quran.
- Examples:
  - "Surah Al-Insan | Sheikh Yasser Dossary"
  - "Surah An-Nazi'at | Qari Fatih Seferagic"
  - "Surah Abasa with English Translation | Fatih Seferagic"
  - "Surah Nuh - Calming Recitation"

### 10. **Taraweeh & Ramadan** (14 videos - 4.5%)
Recordings from Taraweeh prayers and special Ramadan performances.
- Examples:
  - "Qari Fatih Seferagic - ELM Taraweeh 2016"
  - "Islam Sobhi LIVE Ramadan Tarawi"
  - "صلاة التراويح القارئ ابوبكر الشاطري"
  - "Taraweeh 2013 Recitation | Sheikh Yasser Dossary"

## Categorization Logic

The categorization was done using SQL pattern matching on video titles:

1. **Long Surahs**: Titles containing "Baqarah", "Imran", "Nisa", "Maidah", "An'am", "A'raf", "Anfal", "Tawbah" and their Arabic equivalents
2. **Medium Surahs**: Titles containing "Yunus", "Hud", "Ibrahim", "Hijr", "Nahl", "Isra", "Naml", "Ankabut", "Furqan", "Hajj", "Anbiya", "Muminun" and their Arabic equivalents
3. **Shorter Surahs**: Titles containing "Luqman", "Sajdah", "Ahzab", "Saba", "Fatir", "Saad", "Zumar", "Ghafir", "Fussilat", "Shura", "Zukhruf", "Dukhan", "Jathiyah", "Ahqaf", "Muhammad", "Fath", "Hujurat", "Qaf", "Dhariyat", "Tur", "Najm", "Qamar", "Hadid" and their Arabic equivalents
4. **Story Surahs**: Titles containing "Yusuf", "Maryam", "Taha", "Qasas", "Kahf", "story", "prophet" and their Arabic equivalents
5. **Popular Surahs**: Titles containing "Yasin", "Mulk", "Rahman", "Waqiah" and their Arabic equivalents
6. **Juz Amma Surahs**: Titles containing names of Surahs from Mujadilah (58) onwards, including "Nuh", "Insan", "Naziat", "Abasa", "Qiyama", "Rum", "Fatiha" and their Arabic equivalents
7. **Emotional & Heart-Touching**: Titles with "emotional", "heart", "touching", "beautiful", "amazing", "cry", "tears", "خاشع", "مبك", "باك"
8. **Taraweeh & Ramadan**: Titles with "taraweeh", "ramadan", "التراويح", "رمضان", "tahajjud", "qiyam"
9. **Compilations & Special Styles**: Titles with "compilation", "best", "top", "hours", "collection", "rare", "old", "vintage", "maqam", "nahawand", "ajam", "jiharkah"
10. **General Recitations**: All remaining videos that don't fit into specific categories, including live performances and thematic recitations

## Distribution Summary

The new categorization provides a much more balanced distribution:

- **Emotional & Heart-Touching** (17.2%): Recitations emphasizing spiritual impact
- **General Recitations** (15.2%): Quality recitations without specific categorization
- **Story Surahs** (12.9%): Narrative-focused Surahs and story recitations
- **Shorter Surahs** (12.0%): Medium-short Surahs (Luqman to Hadid)
- **Medium Surahs** (11.7%): Medium-length Surahs (Yunus to Ankabut)
- **Long Surahs** (11.0%): The longest Surahs (Baqarah to Tawbah)
- **Popular Surahs** (5.8%): Most commonly recited Surahs
- **Compilations & Special Styles** (4.9%): Collections, historical recordings, and Maqam styles
- **Juz Amma Surahs** (4.9%): Short Surahs from the last Juz
- **Taraweeh & Ramadan** (4.5%): Special prayer recordings

This distribution ensures users can easily find recitations based on their preferences, whether they're looking for specific Surahs, emotional experiences, or special occasions. The categories are now much more balanced, with no single category dominating the collection.

## Database Changes

- Added a `category` column to the `quran_recitations` table
- Updated all 309 videos with appropriate categories
- Categories are now stored directly in the table for easy filtering and display
- Merged smaller categories to ensure all categories have a substantial number of videos

## App Integration

The app has been updated to:
- Fetch recitations from the `quran_recitations` table
- Display videos organized by category
- Support search across all fields including categories
- Track recitation views properly
- Integrate with the Iman Tracker for ʿIlm (Knowledge) goals

## Benefits of New Categorization

1. **Better Balance**: No category has an overwhelming number of videos
2. **Easier Navigation**: Users can find specific types of recitations more easily
3. **Logical Grouping**: Surahs are grouped by length and theme
4. **Comprehensive Coverage**: All recitations are properly categorized
5. **User-Friendly**: Categories are intuitive and easy to understand
