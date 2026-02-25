# Fix app-ads.txt 404 Error

## Problem
The `app-ads.txt` file is returning 404 when accessed at `https://muslimspace.netlify.app/app-ads.txt`

## Solution

### Step 1: Verify File Exists
✅ The file `website/app-ads.txt` exists and contains:
```
google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
```

### Step 2: Commit and Push Changes
The file needs to be committed to your repository and pushed:

```bash
git add website/app-ads.txt
git add website/_headers
git commit -m "Add app-ads.txt for AdMob verification"
git push
```

### Step 3: Trigger Netlify Deployment
1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site (muslimspace)
3. Go to **Deploys** tab
4. Click **Trigger deploy** → **Deploy site**
5. Wait for deployment to complete

### Step 4: Verify File is Accessible
After deployment completes:
1. Open: `https://muslimspace.netlify.app/app-ads.txt`
2. You should see: `google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0`

### Step 5: Verify in App Store Connect
1. Go to App Store Connect
2. Select your app "Muslim-Space"
3. Go to **App Information**
4. Verify **Developer Website** is set to: `muslimspace.netlify.app`
5. If different, update it to match exactly

### Step 6: Re-verify in AdMob
1. Go to AdMob dashboard
2. Navigate to your app settings
3. Click **Check for updates** to trigger a new crawl
4. Wait 24-48 hours for verification

## Current Configuration

**File Location:** `website/app-ads.txt`
**Expected URL:** `https://muslimspace.netlify.app/app-ads.txt`
**Netlify Config:** Publishes from `website/` folder
**Content Type:** Configured via `website/_headers`

## Troubleshooting

### If file still returns 404 after deployment:
1. Check Netlify build logs for any errors
2. Verify the file is in the `website/` folder (not a subfolder)
3. Ensure the file is named exactly `app-ads.txt` (lowercase, with hyphen)
4. Try accessing: `https://muslimspace.netlify.app/app-ads.txt` in an incognito window
5. Clear browser cache and try again

### If Google still can't verify:
1. Verify the domain in App Store Connect matches `muslimspace.netlify.app` exactly
2. Ensure the file is accessible without authentication
3. Check that there are no redirects interfering
4. Wait 24-48 hours after deployment
5. Use "Check for updates" in AdMob dashboard

## Files Modified
- ✅ `website/app-ads.txt` - Contains AdMob information
- ✅ `website/_headers` - Sets correct content type
- ✅ `website/_redirects` - Netlify redirects (if needed)
