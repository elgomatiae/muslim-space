# TestFlight Submission Commands

## Step-by-Step Commands

### Step 1: Navigate to Project Directory
```powershell
cd C:\Users\Elgom\app\project
```

### Step 2: Build for iOS Production
```powershell
eas build --platform ios --profile production --clear-cache
```

**What this does:**
- Builds a production iOS app with AdMob integration
- Uses your production AdMob App ID and Ad Unit ID
- Clears cache for a fresh build
- Creates an `.ipa` file ready for TestFlight

**Expected time:** 15-30 minutes

**You'll see:**
- Build progress in terminal
- Build ID when complete
- Download link for the `.ipa` file

---

### Step 3: Submit to TestFlight

**Option A: Automatic Submission (Recommended)**
```powershell
eas submit --platform ios
```

**Option B: Submit Specific Build**
```powershell
eas submit --platform ios --latest
```

**What this does:**
- Automatically finds your latest iOS build
- Uploads to App Store Connect
- Processes for TestFlight
- No manual upload needed!

**Expected time:** 10-30 minutes for processing

---

## Complete Command Sequence (Copy & Paste)

```powershell
# Navigate to project
cd C:\Users\Elgom\app\project

# Build for iOS
eas build --platform ios --profile production --clear-cache

# Wait for build to complete, then submit
eas submit --platform ios
```

---

## Alternative: Build and Submit in One Go

If you want to build and submit automatically:

```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile production --clear-cache --auto-submit
```

**Note:** `--auto-submit` will automatically submit after build completes.

---

## After Submission

### 1. Check Build Status
```powershell
eas build:list --platform ios
```

### 2. Monitor Submission
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Navigate to: **My Apps** → **Muslim-Space** → **TestFlight**
- You'll see the build processing

### 3. Processing Time
- **Build:** 15-30 minutes
- **App Store Processing:** 10-30 minutes
- **Total:** ~30-60 minutes

### 4. Add to TestFlight
Once processing completes:
1. Go to TestFlight tab in App Store Connect
2. The build will appear automatically
3. Add internal testers (yourself) or external testers
4. Testers receive email invitation

---

## Troubleshooting

### Build Fails
```powershell
# Check build logs
eas build:view [BUILD_ID]

# Retry with fresh cache
eas build --platform ios --profile production --clear-cache
```

### Submission Fails
```powershell
# Check submission status
eas submit:list

# Retry submission
eas submit --platform ios --latest
```

### Check EAS Status
```powershell
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

---

## Verification Checklist

Before submitting, ensure:
- [x] AdMob App ID configured: `ca-app-pub-2757517181313212~3571222456`
- [x] Ad Unit ID configured: `ca-app-pub-2757517181313212/8725693825`
- [x] App version: `1.02` (in `app.json`)
- [x] Bundle ID: `com.createinc.70b3026932584f00a21b8830ccd84bfa`
- [x] App name: `Muslim-Space`

---

## Quick Reference

### Build Only
```powershell
eas build --platform ios --profile production --clear-cache
```

### Submit Only (if build already exists)
```powershell
eas submit --platform ios
```

### Build + Submit
```powershell
eas build --platform ios --profile production --clear-cache --auto-submit
```

### Check Status
```powershell
eas build:list --platform ios
eas submit:list
```

---

## Important Notes

1. **First Time:** You may need to authenticate with Apple:
   ```powershell
   eas submit --platform ios
   # Follow prompts to authenticate
   ```

2. **App Store Connect:** Make sure your app exists in App Store Connect with:
   - Bundle ID: `com.createinc.70b3026932584f00a21b8830ccd84bfa`
   - App name: `Muslim-Space`

3. **Certificates:** EAS handles certificates automatically, but ensure:
   - You're logged into EAS: `eas login`
   - Your Apple Developer account is linked

---

## Expected Output

### Build Success:
```
✅ Build finished!
📦 Build ID: abc123...
📱 Download: https://expo.dev/artifacts/...
```

### Submit Success:
```
✅ Successfully submitted to App Store Connect!
📱 Build will be available in TestFlight shortly
```

---

## Next Steps After TestFlight

1. **Test the Access Gate:**
   - Install app from TestFlight
   - Navigate to Learning → Islamic Lectures
   - Verify access gate appears
   - Watch test ad
   - Verify access is granted

2. **Monitor AdMob:**
   - Check AdMob dashboard for ad requests
   - Verify ad unit is serving ads
   - Check revenue (if real ads are enabled)

3. **Prepare for App Store:**
   - Test thoroughly in TestFlight
   - Fix any issues
   - Submit for App Store review when ready
