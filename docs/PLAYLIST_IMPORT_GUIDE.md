
# YouTube Playlist Import Guide

## Overview

The admin panel now supports importing entire YouTube playlists with the ability to:
- Choose whether to import videos as **Lectures** or **Quran Recitations**
- Select which category the videos should be assigned to
- Automatically fetch video metadata (title, description, thumbnail, duration, channel name)

## How to Use

### Step 1: Access the Admin Panel

1. Go to the Profile tab
2. Tap on your username 10 times
3. Enter the PIN: **2218**
4. The Admin Panel will open

### Step 2: Select Import Playlist

1. In the Admin Panel, tap on **"Import Playlist"**
2. You'll see a form with the following options:

### Step 3: Enter Playlist URL

Paste your YouTube playlist URL in the first field. The URL should look like:
```
https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxx
```

### Step 4: Choose Import Type

Select where you want to import the videos:
- **Lectures**: For Islamic lectures, talks, and educational content
- **Recitations**: For Quran recitations

### Step 5: Select Category

Choose which category the videos should be assigned to:
- The categories shown will match your selected import type
- If no categories exist, a default category will be created automatically
- Each category shows its name and description

### Step 6: Import

1. Tap the **"Import Playlist"** button
2. Wait for the import to complete (this may take a few moments)
3. You'll see a success message showing:
   - Total videos in the playlist
   - Successfully imported videos
   - Any errors that occurred

## Features

### Automatic Metadata Fetching

For each video in the playlist, the system automatically fetches:
- Video title
- Description
- Thumbnail image (high quality)
- Duration
- Channel name (used as scholar/reciter name)

### Category Management

- Videos are organized by categories
- Categories are type-specific (lectures or recitations)
- The system validates that the selected category matches the import type
- If no categories exist, a default one is created

### Error Handling

- Invalid playlist URLs are detected and rejected
- Category type mismatches are prevented
- Individual video import errors don't stop the entire process
- Detailed error reporting shows which videos succeeded/failed

## Database Structure

### Videos Table

All videos (both lectures and recitations) are stored in the `videos` table with:
- `title`: Video title
- `description`: Video description
- `video_url`: YouTube video URL
- `thumbnail_url`: Video thumbnail
- `category_id`: Reference to the category
- `duration`: Video duration in seconds
- `scholar_name`: For lectures (from channel name)
- `reciter_name`: For recitations (from channel name)
- `views`: View count (starts at 0)
- `order_index`: Position in the playlist

### Video Categories Table

Categories are stored in the `video_categories` table with:
- `name`: Category name
- `description`: Category description
- `type`: Either 'lecture' or 'recitation'
- `order_index`: Display order

## Technical Details

### Edge Function

The `youtube-playlist-import` Edge Function:
- Accepts `playlistUrl`, `categoryId`, and `targetType` parameters
- Validates the category exists and matches the target type
- Fetches all videos from the YouTube playlist (handles pagination)
- Retrieves video durations using the YouTube Data API
- Inserts videos into the database with appropriate fields
- Returns detailed success/error information

### API Requirements

- YouTube Data API key must be configured in Supabase secrets
- The API key is used to fetch playlist items and video details

## Troubleshooting

### "YouTube API key not configured"
Contact the administrator to set up the YouTube Data API key in Supabase.

### "Invalid YouTube playlist URL"
Make sure your URL contains the `list=` parameter and is a valid YouTube playlist URL.

### "Category type mismatch"
You selected a category for lectures but are trying to import recitations (or vice versa). Choose the correct import type or select a different category.

### "No videos found in playlist"
The playlist might be empty, private, or the URL might be incorrect.

## Best Practices

1. **Test with small playlists first**: Start with a playlist containing a few videos to ensure everything works correctly.

2. **Create categories beforehand**: Set up your categories before importing to have better organization.

3. **Use descriptive category names**: This helps users find content more easily.

4. **Check the results**: After importing, verify that the videos appear correctly in the app.

5. **Monitor for errors**: If some videos fail to import, check the error count and try importing them individually.

## Example Workflow

1. Create a category called "Tafsir Series" for lectures
2. Find a YouTube playlist with tafsir lectures
3. Copy the playlist URL
4. Open the Admin Panel
5. Select "Import Playlist"
6. Paste the URL
7. Choose "Lectures" as the import type
8. Select "Tafsir Series" category
9. Tap "Import Playlist"
10. Wait for confirmation
11. Check the Learning tab to see the imported videos

## Notes

- The import process may take longer for large playlists (50+ videos)
- Videos are imported in the order they appear in the playlist
- The channel name is automatically used as the scholar/reciter name
- All videos start with 0 views
- Videos can be edited or deleted individually after import if needed
