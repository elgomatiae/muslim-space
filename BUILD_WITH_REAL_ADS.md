# Build Commands for Production with Real Ads

## Prerequisites

1. **EAS CLI installed and configured**
   ```powershell
   npm install -g eas-cli
   eas login
   ```

2. **EAS project configured** (already done - project ID: `ea7602b5-852b-4c20-8cbd-e714a459435c`)

## Build Commands

### For iOS (Production Build)

```powershell
# Navigate to project directory
cd C:\Users\Elgom\app\project

# Build for iOS production with real ads
eas build --platform ios --profile production --clear-cache
```

**What this does:**
- Builds a production iOS app
- Uses your production AdMob App ID: `ca-app-pub-2757517181313212~3571222456`
- Uses your production Ad Unit ID: `ca-app-pub-2757517181313212/8725693825`
- Clears cache to ensure fresh build
- Creates an `.ipa` file ready for App Store submission

### For Android (Production Build)

```powershell
# Navigate to project directory
cd C:\Users\Elgom\app\project

# Build for Android production with real ads
eas build --platform android --profile production --clear-cache
```

**What this does:**
- Builds a production Android app
- Uses your production AdMob configuration
- Creates an `.aab` file ready for Google Play Store submission

### Build Both Platforms

```powershell
# Build for both iOS and Android
eas build --platform all --profile production --clear-cache
```

## Important Notes

### Ad Unit IDs

- **Development/Test**: Uses test ad unit ID `ca-app-pub-3940256099942544/6978759866`
- **Production**: Uses your real ad unit ID `ca-app-pub-2757517181313212/8725693825`

The app automatically switches between test and production ad units based on the build environment.

### Testing Before Production

1. **Test with development build first:**
   ```powershell
   eas build --platform ios --profile development
   ```

2. **Install on device and test the access gate:**
   - Navigate to Learning tab
   - Click "Islamic Lectures"
   - Verify the access gate modal appears
   - Watch the test ad
   - Verify access is granted for 24 hours

3. **Verify ad integration:**
   - Check console logs for "✅ AdMob initialized successfully"
   - Check console logs for "✅ Access Gate ad loaded"
   - Verify ad shows correctly

### After Building

1. **Download the build:**
   ```powershell
   eas build:list
   eas build:download [BUILD_ID]
   ```

2. **Submit to App Store (iOS):**
   ```powershell
   eas submit --platform ios
   ```

3. **Submit to Play Store (Android):**
   ```powershell
   eas submit --platform android
   ```

## Build Profiles

Your `eas.json` should have a production profile configured. If not, create one:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "release"
      }
    }
  }
}
```

## Verification Checklist

Before submitting to stores:

- [ ] Access gate appears when clicking "Islamic Lectures"
- [ ] Test ad loads in development build
- [ ] Access is granted after watching ad
- [ ] Access expires after 24 hours (test by clearing AsyncStorage)
- [ ] Production build uses real ad unit ID
- [ ] No console errors related to AdMob
- [ ] App doesn't crash when ad fails to load

## Troubleshooting

### Ad Not Loading

1. Check internet connection
2. Verify AdMob App ID in `app.json`
3. Check AdMob dashboard for ad unit status
4. Ensure app is verified in AdMob (✅ Already done)

### Build Fails

1. Clear cache: `eas build --clear-cache`
2. Check EAS status: `eas build:list`
3. Review build logs in EAS dashboard

### Access Gate Not Appearing

1. Check console for errors
2. Verify `useAccessGate` hook is imported correctly
3. Verify `AccessGate` component is rendered
4. Check AsyncStorage permissions

## Support

If you encounter issues:
1. Check EAS build logs
2. Review AdMob dashboard for ad serving status
3. Test with development build first
4. Check console logs for detailed error messages
