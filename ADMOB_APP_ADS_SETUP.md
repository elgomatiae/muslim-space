# AdMob app-ads.txt Setup Guide

## ✅ File Created

I've created the `app-ads.txt` file in your `public/` folder with the required content:
```
google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
```

## 📋 Next Steps: Publish to Your Developer Website

The `app-ads.txt` file **must** be published to the **root of your developer website** (the domain listed in Google Play or App Store).

### Step 1: Find Your Developer Website Domain

1. **For iOS (App Store):**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to your app "Muslim-Space"
   - Check the **App Information** section
   - Find your **Support URL** or **Marketing URL**
   - This is your developer website domain

2. **For Android (Google Play):**
   - Go to [Google Play Console](https://play.google.com/console)
   - Navigate to your app
   - Check **Store presence** → **Store listing**
   - Find your **Website** URL
   - This is your developer website domain

### Step 2: Publish app-ads.txt to Your Website

You need to upload the `app-ads.txt` file to the **root directory** of your website so it's accessible at:
```
https://yourdomain.com/app-ads.txt
```

#### Option A: If You Have a Website Hosting Service

1. Log in to your website hosting control panel (cPanel, FTP, etc.)
2. Navigate to the **root directory** (usually `public_html/`, `www/`, or `/`)
3. Upload the `public/app-ads.txt` file from this project
4. Make sure it's named exactly `app-ads.txt` (lowercase, no spaces)

#### Option B: If You're Using Expo Hosting

If your app is hosted on Expo, you can:
1. Build your web app: `npm run build:web`
2. The `app-ads.txt` file will be included in the build
3. Deploy to your hosting service

#### Option C: If You Don't Have a Website Yet

You need to create a simple website or landing page:

1. **Use a free hosting service:**
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting

2. **Create a simple index.html** (if needed)

3. **Upload app-ads.txt** to the root directory

### Step 3: Verify the File is Accessible

1. Open your browser
2. Navigate to: `https://yourdomain.com/app-ads.txt`
3. You should see:
   ```
   google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
   ```

**Important:** The file must be:
- ✅ Accessible via HTTPS (not HTTP)
- ✅ At the root domain (not in a subdirectory)
- ✅ Named exactly `app-ads.txt` (case-sensitive)
- ✅ Returning the correct content

### Step 4: Update AdMob with Your Domain

1. Go to [AdMob Console](https://apps.admob.com)
2. Navigate to **Apps** → Select your app
3. Go to **App settings** → **App stores**
4. Make sure your **Developer website** domain matches exactly what you published the file to
5. Click **Verify app** or **Check for updates**

### Step 5: Wait for Verification

- AdMob will crawl your website to find the `app-ads.txt` file
- This typically takes a few minutes, but can take up to 24 hours
- You'll receive a notification when verification is complete

## 🔍 Troubleshooting

### Issue: "We couldn't verify your app"

**Possible causes:**
1. File not accessible at the root domain
2. Domain mismatch (domain in AdMob doesn't match where file is published)
3. File not found (404 error)
4. HTTPS not enabled
5. File content doesn't match exactly

**Solutions:**
1. ✅ Verify the file is accessible: `https://yourdomain.com/app-ads.txt`
2. ✅ Check the domain in AdMob matches your website domain exactly
3. ✅ Ensure the file content matches exactly:
   ```
   google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
   ```
4. ✅ Make sure there are no extra spaces or characters
5. ✅ Wait 24 hours and try again (crawling can take time)

### Issue: "File not found (404)"

**Solutions:**
1. Check the file is in the root directory, not a subdirectory
2. Verify the filename is exactly `app-ads.txt` (lowercase)
3. Check your web server configuration allows `.txt` files
4. Try accessing it directly: `https://yourdomain.com/app-ads.txt`

### Issue: "Domain mismatch"

**Solutions:**
1. Make sure the domain in AdMob matches your website domain exactly
2. Include/exclude `www.` consistently (e.g., if your site is `www.example.com`, use that in AdMob)
3. Check both Google Play and App Store have the same domain listed

## 📝 File Location in Project

The `app-ads.txt` file is located at:
```
project/public/app-ads.txt
```

This file will be included when you build your web app, but you still need to publish it to your developer website root for AdMob verification.

## ✅ Verification Checklist

- [ ] File created with correct content
- [ ] File published to website root directory
- [ ] File accessible at `https://yourdomain.com/app-ads.txt`
- [ ] Domain in AdMob matches website domain exactly
- [ ] File content matches exactly (no extra spaces)
- [ ] HTTPS enabled on website
- [ ] Clicked "Verify app" or "Check for updates" in AdMob
- [ ] Waiting for AdMob to crawl and verify

## 📞 Need Help?

If you continue to have issues:
1. Double-check the domain matches exactly in AdMob and your website
2. Verify the file is accessible via direct URL
3. Wait 24 hours for AdMob to crawl your site
4. Check AdMob's troubleshooting guide: https://support.google.com/admob/answer/9363762
