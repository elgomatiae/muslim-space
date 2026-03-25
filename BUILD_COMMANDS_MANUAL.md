# Manual Build Commands (Run in Your Terminal)

## ⚠️ Important Notes

1. **Android Build**: Requires Android App ID (we only have iOS App ID)
2. **Interactive Prompts**: These commands need to run in your terminal (not through AI)
3. **Apple Authentication**: iOS build will prompt for Apple account login

---

## ✅ iOS Build (Ready to Run)

Run this in your PowerShell terminal:

```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile production --clear-cache --auto-submit
```

**What will happen:**
1. Build will start
2. You'll be prompted: "Do you want to log in to your Apple account?" → Type `y` and press Enter
3. Follow authentication prompts
4. Build will continue (15-30 minutes)
5. After build completes, it will automatically submit to TestFlight

---

## ⚠️ Android Build (Needs Android App ID)

**Before running Android build, you need:**

1. **Get Android App ID from AdMob:**
   - Go to [AdMob Dashboard](https://admob.google.com/)
   - Apps → Create/Select Android App
   - Copy the Android App ID (format: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`)

2. **Add Android App ID to `app.json`:**
   ```json
   [
     "react-native-google-mobile-ads",
     {
       "iosAppId": "ca-app-pub-2757517181313212~3571222456",
       "androidAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"  // Add this
     }
   ]
   ```

3. **Then run:**
   ```powershell
   cd C:\Users\Elgom\app\project
   eas build --platform android --profile production --clear-cache --auto-submit
   ```

---

## 🎯 Recommended: Build iOS First

Since you have everything for iOS, start with iOS:

```powershell
# Navigate to project
cd C:\Users\Elgom\app\project

# Build and submit iOS
eas build --platform ios --profile production --clear-cache --auto-submit
```

**Follow the prompts:**
- When asked about Apple account: Type `y` and press Enter
- Enter your Apple ID credentials when prompted
- Build will proceed automatically

---

## 📋 Step-by-Step for iOS

### Step 1: Open PowerShell
Open PowerShell on your Windows machine

### Step 2: Navigate to Project
```powershell
cd C:\Users\Elgom\app\project
```

### Step 3: Run Build Command
```powershell
eas build --platform ios --profile production --clear-cache --auto-submit
```

### Step 4: Follow Prompts
- **"Do you want to log in to your Apple account?"** → Type `y` and press Enter
- Enter your Apple ID email
- Enter your Apple ID password
- If 2FA is enabled, enter the code

### Step 5: Wait
- Build takes 15-30 minutes
- Submission takes 10-30 minutes
- Total: ~30-60 minutes

### Step 6: Check Status
```powershell
# Check build status
eas build:list --platform ios

# Check submission status
eas submit:list
```

---

## 🔍 Alternative: Build Without Auto-Submit

If you want to submit manually:

```powershell
# Build only
eas build --platform ios --profile production --clear-cache

# Wait for build to complete, then submit
eas submit --platform ios
```

---

## ❌ If Android Build Fails

If you try Android build without Android App ID, you'll see:
```
No 'androidAppId' was provided. The native Google Mobile Ads SDK will crash on Android without it.
```

**Solution:** Add Android App ID to `app.json` first (see above).

---

## ✅ Quick Reference

### iOS (Ready Now)
```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile production --clear-cache --auto-submit
```

### Android (Need App ID First)
1. Get Android App ID from AdMob
2. Add to `app.json`
3. Then run:
```powershell
cd C:\Users\Elgom\app\project
eas build --platform android --profile production --clear-cache --auto-submit
```

---

## 📱 After Build Completes

1. **Check TestFlight:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - My Apps → Muslim-Space → TestFlight
   - Your build will appear there

2. **Test the Access Gate:**
   - Install app from TestFlight
   - Navigate to Learning → Islamic Lectures
   - Verify access gate works

---

## 🆘 Troubleshooting

### "Input is required, but stdin is not readable"
- **Solution:** Run the command in your own terminal (not through AI)

### "No 'androidAppId' was provided"
- **Solution:** Add Android App ID to `app.json` or skip Android build

### Build fails
- **Solution:** Check `eas build:list` for error details
- Run with `--clear-cache` flag

### Authentication fails
- **Solution:** Make sure you're logged into EAS: `eas login`
- Check Apple Developer account access
