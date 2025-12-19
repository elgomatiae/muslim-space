
# Admin Video Import Guide

This guide explains how to efficiently add YouTube videos to your Muslim Lifestyle app using the improved admin panel.

## Features

### 1. **Single Video Import with Auto-Fetch**
Add individual videos with automatic metadata fetching from YouTube.

**How to use:**
1. Access the admin panel (tap your username 10 times, enter PIN: 2218)
2. Select "Add Lecture" or "Add Recitation"
3. Paste the YouTube video URL
4. Click the **"Fetch"** button
5. The system will automatically fill in:
   - Video title
   - Description
   - Thumbnail URL
   - Duration (in seconds)
   - Channel name (as Scholar/Reciter name)
6. Review and edit any fields if needed
7. Click "Add Video"

**Benefits:**
- No need to manually type video details
- Accurate duration and thumbnail
- Faster workflow

### 2. **Bulk Playlist Import**
Import entire YouTube playlists at once.

**How to use:**
1. Access the admin panel
2. Select "Import Playlist"
3. Paste the YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxxxxx`)
4. Click "Import Playlist"
5. Wait for the import to complete
6. You'll see a summary of:
   - Total videos in playlist
   - Successfully imported videos
   - Any errors

**Benefits:**
- Import dozens or hundreds of videos at once
- All metadata automatically fetched
- Videos are added to the lectures category by default

## YouTube API Setup

Your YouTube API key is already configured in the Supabase Edge Functions environment variables.

**API Key:** `YOUTUBE_API_KEY`

### API Quota Information
- YouTube Data API v3 has a daily quota limit
- Each video fetch uses approximately 3-5 quota units
- Playlist imports use more quota (depends on playlist size)
- Default quota: 10,000 units per day
- Monitor your usage at: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas

## Supported URL Formats

### Single Videos
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `VIDEO_ID` (just the 11-character ID)

### Playlists
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`

## Tips & Best Practices

### For Single Videos
1. **Always use the Fetch button** - It saves time and ensures accuracy
2. **Review auto-filled data** - Sometimes YouTube descriptions are very long
3. **Edit scholar/reciter names** - Channel names might not match the actual scholar
4. **Check duration** - Duration is in seconds (e.g., 3600 = 1 hour)

### For Playlist Imports
1. **Use for bulk content** - Perfect for importing lecture series
2. **Check playlist privacy** - Only public playlists can be imported
3. **Monitor import progress** - Large playlists may take a minute
4. **Review imported videos** - Check the videos table in Supabase after import

### Managing Videos
- Videos are stored in the `videos` table in Supabase
- Each video is linked to a category (lectures or recitations)
- You can edit videos directly in Supabase if needed
- To delete videos, use the Supabase dashboard

## Troubleshooting

### "Failed to fetch video details"
- **Cause:** Invalid YouTube URL or video is private/deleted
- **Solution:** Check the URL and ensure the video is public

### "YouTube API key not configured"
- **Cause:** API key missing from Edge Function environment
- **Solution:** Contact the developer to add the API key

### "Playlist import failed"
- **Cause:** Invalid playlist URL or playlist is private
- **Solution:** Ensure the playlist is public and the URL is correct

### "API quota exceeded"
- **Cause:** Too many API requests in one day
- **Solution:** Wait until the next day or request a quota increase from Google

## Database Structure

Videos are stored with the following fields:
- `title` - Video title
- `description` - Video description
- `video_url` - Full YouTube URL
- `thumbnail_url` - Thumbnail image URL
- `duration` - Duration in seconds
- `scholar_name` - For lectures
- `reciter_name` - For recitations
- `category_id` - Links to video_categories table
- `views` - View count (starts at 0)
- `order_index` - Display order

## Edge Functions

Two Supabase Edge Functions power the video import:

### 1. `fetch-youtube-metadata`
- Fetches metadata for a single video
- Called when you click "Fetch" button
- Returns: title, description, thumbnail, duration, channel name

### 2. `youtube-playlist-import`
- Imports all videos from a playlist
- Fetches metadata for each video
- Inserts videos into the database
- Returns: success count, error count, total videos

## Security

- Admin panel requires PIN authentication (2218)
- Edge Functions use service role key for database access
- YouTube API key is stored securely in environment variables
- RLS policies protect the videos table

## Future Enhancements

Potential improvements:
- Category selection during import
- Duplicate video detection
- Video editing interface
- Batch delete functionality
- Import history tracking
- Custom metadata override

---

**Need Help?**
If you encounter any issues or have questions, check the Supabase logs or contact support.
