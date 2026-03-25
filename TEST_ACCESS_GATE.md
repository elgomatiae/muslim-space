# How to Test the Access Gate

## ❌ Don't Use: Expo Go

**Expo Go will NOT work** because:
- AdMob requires native modules (`react-native-google-mobile-ads`)
- Expo Go doesn't support custom native modules
- You'll get errors or the app won't load

## ✅ Option 1: Development Build (Recommended - Fastest)

This is the **best option for testing** because it's faster than TestFlight and includes all native modules.

### Step 1: Build Development Version

```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile development
```

**Note:** If you don't have a `development` profile, use `preview` instead:
```powershell
eas build --platform ios --profile preview
```

### Step 2: Install on Device

After the build completes:
1. EAS will provide a download link
2. Download the `.ipa` file
3. Install on your iPhone using:
   - **macOS**: Drag to Finder or use Xcode
   - **Windows**: Use a tool like 3uTools or AltStore
   - Or use the EAS build URL directly on your device

### Step 3: Test the Access Gate

1. Open the app on your device
2. Navigate to **Learning** tab
3. Click **"Islamic Lectures"**
4. You should see the access gate modal
5. Click **"Watch Ad to Unlock"**
6. A test ad should appear (Google test ads)
7. After watching, access should be granted
8. Lectures screen should load

### Advantages:
- ✅ Fastest way to test
- ✅ Includes all native modules
- ✅ Can test on physical device
- ✅ Uses test ads (safe for testing)
- ✅ Can rebuild quickly if needed

---

## ✅ Option 2: TestFlight (Production-like Testing)

Use this if you want to test in a **production-like environment** before releasing.

### Step 1: Build Production Version

```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile production --clear-cache
```

### Step 2: Submit to TestFlight

```powershell
eas submit --platform ios
```

Or manually:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Upload the `.ipa` file
3. Wait for processing (10-30 minutes)
4. Add to TestFlight

### Step 3: Test on TestFlight

1. Install TestFlight app on your device
2. Accept the TestFlight invitation
3. Install the app
4. Test the access gate (same steps as above)

### Advantages:
- ✅ Production-like environment
- ✅ Can test with real ads (if configured)
- ✅ Can share with beta testers
- ✅ Tests the full submission process

### Disadvantages:
- ❌ Slower (requires App Store processing)
- ❌ Takes 10-30 minutes to process
- ❌ More steps involved

---

## 🎯 Recommended Testing Flow

### Phase 1: Quick Development Testing
```powershell
# Build development version
eas build --platform ios --profile development

# Test on device
# - Verify access gate appears
# - Verify test ads load
# - Verify access is granted
# - Verify lectures load after access
```

### Phase 2: TestFlight Validation
```powershell
# Build production version
eas build --platform ios --profile production --clear-cache

# Submit to TestFlight
eas submit --platform ios

# Test in TestFlight
# - Verify everything works in production build
# - Test with real ads (if you want)
# - Share with beta testers
```

---

## 🔍 What to Test

### Access Gate Functionality:
- [ ] Access gate modal appears when clicking "Islamic Lectures"
- [ ] Modal shows correct title: "Unlock Islamic Lectures"
- [ ] Modal shows correct description
- [ ] "Watch Ad to Unlock" button appears
- [ ] Ad loads successfully
- [ ] Ad plays correctly
- [ ] Access is granted after watching ad
- [ ] Lectures screen loads after access is granted
- [ ] Access persists for 24 hours (test by closing/reopening app)

### Error Handling:
- [ ] If ad fails to load, error message appears
- [ ] Retry button works
- [ ] Cancel button closes modal
- [ ] App doesn't crash if ad service is unavailable

### Navigation:
- [ ] Access gate works from Learning tab
- [ ] Access gate works from Iman Tracker → Ilm Section
- [ ] Direct navigation to lectures also checks access

---

## 🐛 Troubleshooting

### "AdMob not initialized" error
- **Solution**: Wait a few seconds after app launch, AdMob initializes with a 2-second delay

### Ad not loading
- **Check**: Internet connection
- **Check**: AdMob App ID in `app.json`
- **Check**: Console logs for error messages
- **Note**: In development, test ads should always load

### Access gate not appearing
- **Check**: Console logs for errors
- **Check**: `useAccessGate` hook is imported
- **Check**: `AccessGate` component is rendered
- **Verify**: Navigation is triggering the check

### Build fails
- **Solution**: Run `eas build --clear-cache`
- **Check**: EAS build logs for specific errors
- **Verify**: All dependencies are in `package.json`

---

## 📱 Quick Test Commands

### Development Build (Recommended)
```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile development
```

### Production Build (TestFlight)
```powershell
cd C:\Users\Elgom\app\project
eas build --platform ios --profile production --clear-cache
eas submit --platform ios
```

---

## 💡 Pro Tip

**Start with a development build** to quickly test and fix issues, then move to TestFlight for final validation before App Store release.
