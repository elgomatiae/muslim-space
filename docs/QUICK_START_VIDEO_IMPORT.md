
# Quick Start: Video Import

Get started with importing YouTube videos to your Muslim Lifestyle app in minutes!

## Step 1: Access Admin Panel

1. Open the app and go to the **Profile** tab
2. Tap your username **10 times** quickly
3. Enter PIN: **2218**
4. Admin panel opens

## Step 2: Choose Import Method

### Method A: Single Video (Recommended for testing)

1. Click **"Add Lecture"** or **"Add Recitation"**
2. Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Click **"Fetch"** button
4. Review auto-filled details
5. Click **"Add Video"**

**Time:** ~30 seconds per video

### Method B: Playlist Import (Recommended for bulk)

1. Click **"Import Playlist"**
2. Paste a YouTube playlist URL
3. Click **"Import Playlist"**
4. Wait for completion (shows progress)

**Time:** ~1-2 minutes for 50 videos

## Step 3: Verify Import

1. Go to the **Learning** tab
2. Navigate to **Lectures** or **Recitations**
3. Your videos should appear!

## Common Issues

**Problem:** Fetch button doesn't work
- **Solution:** Check your internet connection and ensure the YouTube URL is valid

**Problem:** Videos don't appear in the app
- **Solution:** Pull down to refresh the Learning tab

**Problem:** "API key not configured" error
- **Solution:** The YouTube API key needs to be added to Supabase Edge Functions

## Example URLs to Try

### Single Videos
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
```

### Playlists
```
https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

## Next Steps

- Read the full [Admin Video Import Guide](./ADMIN_VIDEO_IMPORT_GUIDE.md)
- Learn about [YouTube API quotas](https://developers.google.com/youtube/v3/getting-started#quota)
- Explore [video management in Supabase](https://supabase.com/dashboard)

---

**Pro Tip:** Use the playlist import feature to quickly populate your app with content from your favorite Islamic scholars!
