# AdMob app-ads.txt Verification Guide

## Current Status
✅ Your `app-ads.txt` file is correctly formatted with the required AdMob information:
```
google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
```

## File Locations
- ✅ `website/app-ads.txt` - For Netlify deployment
- ✅ `public/app-ads.txt` - For web build

## Verification Steps

### 1. Verify File is Accessible
Your `app-ads.txt` file must be accessible at the root of your developer website:
- **Expected URL:** `https://muslimspace.netlify.app/app-ads.txt`

**To verify:**
1. Open your browser
2. Navigate to: `https://muslimspace.netlify.app/app-ads.txt`
3. You should see the content: `google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0`

### 2. Check Domain in App Store Connect
The domain in your App Store Connect listing must **exactly match** the domain where the file is hosted:
- **App Store Connect Domain:** Should be `muslimspace.netlify.app` (your actual developer website domain)
- **File Location:** `https://muslimspace.netlify.app/app-ads.txt`

**To check/update in App Store Connect:**
1. Go to App Store Connect
2. Select your app "Muslim-Space"
3. Go to App Information
4. Check the "Developer Website" field
5. Ensure it matches exactly: `muslim-space-146.created.app` (or your actual domain)

### 3. Verify File Format
The file must:
- ✅ Be named exactly `app-ads.txt` (lowercase, with hyphen)
- ✅ Be at the root of your website (not in a subdirectory)
- ✅ Contain exactly one line: `google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0`
- ✅ Have no extra spaces, blank lines, or special characters
- ✅ Be served with `text/plain` content type (configured via `_headers` file)

### 4. Deploy to Netlify
If you haven't deployed recently:
1. Push your changes to your repository
2. Netlify should auto-deploy, or trigger a manual deploy
3. Wait for deployment to complete
4. Verify the file is accessible at the URL above

### 5. Test File Accessibility
Use these tools to verify:
- **Browser:** Open `https://muslim-space-146.created.app/app-ads.txt` directly
- **curl command:** `curl https://muslim-space-146.created.app/app-ads.txt`
- **Google's Validator:** Use AdMob's app-ads.txt verification tool in the AdMob dashboard

### 6. Wait for Google to Crawl
After deploying:
- Google typically crawls within a few hours
- Sometimes it can take up to 24-48 hours
- Use the "Check for updates" button in AdMob to trigger a new crawl

## Troubleshooting

### Issue: File returns 404
**Solution:**
- Ensure the file is in the `website/` folder (for Netlify)
- Verify Netlify is deploying from the `website` folder
- Check that the file is committed to your repository

### Issue: File has wrong content type
**Solution:**
- The `_headers` file has been added to ensure correct content type
- Redeploy to Netlify

### Issue: Domain mismatch
**Solution:**
- Update the domain in App Store Connect to match your actual website domain
- Or update your website to match the domain in App Store Connect

### Issue: Google still can't verify
**Solution:**
1. Double-check the domain in App Store Connect matches exactly
2. Verify the file is accessible via browser
3. Wait 24-48 hours for Google to crawl
4. Use "Check for updates" in AdMob dashboard
5. Ensure there are no redirects or authentication required

## Current Configuration

**AdMob Publisher ID:** `pub-2757517181313212`
**Certification Authority ID:** `f08c47fec0942fa0`
**Developer Website:** `muslimspace.netlify.app` (verify this matches App Store Connect)

## Next Steps

1. ✅ Verify file is accessible at root URL
2. ✅ Confirm domain matches App Store Connect
3. ✅ Deploy to Netlify (if not already deployed)
4. ✅ Wait for Google to crawl (use "Check for updates" in AdMob)
5. ✅ Re-verify in AdMob dashboard after 24-48 hours

## Files Modified
- ✅ `website/app-ads.txt` - Contains correct AdMob information
- ✅ `website/_headers` - Ensures correct content type for app-ads.txt
- ✅ `public/app-ads.txt` - Backup copy for web builds
