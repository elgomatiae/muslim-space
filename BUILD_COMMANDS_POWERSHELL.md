# PowerShell Commands for Build and Submit

## Quick Commands (Copy & Paste)

### Option 1: Build and Submit in One Go (Recommended)
```powershell
cd project
eas build --platform ios --profile production --clear-cache --non-interactive
if ($?) { eas submit --platform ios --profile production --non-interactive }
```

### Option 2: Build Only
```powershell
cd project
eas build --platform ios --profile production --clear-cache
```

### Option 3: Submit Existing Build
```powershell
cd project
eas submit --platform ios --profile production
```

---

## Step-by-Step Commands

### Step 1: Navigate to Project Directory
```powershell
cd project
```

### Step 2: Build for iOS Production
```powershell
eas build --platform ios --profile production --clear-cache
```

**What this does:**
- Builds iOS app for App Store
- Uses production profile from `eas.json`
- Clears cache to ensure fresh build
- Auto-increments build number
- Takes 15-30 minutes

### Step 3: Submit to App Store
```powershell
eas submit --platform ios --profile production
```

**What this does:**
- Submits the latest build to App Store Connect
- Uses production submit profile from `eas.json`
- Automatically finds the latest build
- Requires App Store Connect credentials

---

## Prerequisites

### 1. Install EAS CLI (if not installed)
```powershell
npm install -g eas-cli
```

### 2. Login to EAS
```powershell
eas login
```

### 3. Verify Login
```powershell
eas whoami
```

### 4. Set Up App Store Connect Credentials
First time only - EAS will prompt you:
- App Store Connect API Key (recommended)
- Or Apple ID credentials

---

## Using the Script

### Run the Full Script
```powershell
.\BUILD_AND_SUBMIT.ps1
```

This script:
- ✅ Checks if you're in the right directory
- ✅ Verifies EAS CLI is installed
- ✅ Checks if you're logged in
- ✅ Builds the app
- ✅ Submits to App Store
- ✅ Shows next steps

---

## Command Options Explained

### Build Options
- `--platform ios` - Build for iOS
- `--profile production` - Use production profile from `eas.json`
- `--clear-cache` - Clear build cache (ensures fresh build)
- `--non-interactive` - Don't prompt for input (useful for scripts)

### Submit Options
- `--platform ios` - Submit iOS build
- `--profile production` - Use production submit profile
- `--non-interactive` - Don't prompt for input

---

## Troubleshooting

### Build Fails
```powershell
# Check EAS status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

### Submit Fails
```powershell
# Check if build exists
eas build:list --platform ios

# Try submitting specific build
eas submit --platform ios --latest
```

### Not Logged In
```powershell
eas login
```

### Missing Credentials
```powershell
# Set up App Store Connect credentials
eas credentials
```

---

## Expected Output

### Build Success
```
✅ Build finished
Build ID: abc123
Build URL: https://expo.dev/...
```

### Submit Success
```
✅ Successfully submitted build to App Store Connect
```

---

## After Submission

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Navigate to**: Your App → TestFlight
3. **Wait for Processing**: Usually 5-15 minutes
4. **Test in TestFlight**: Install and test the build
5. **Submit for Review**: When ready, submit for App Store review

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build only | `eas build --platform ios --profile production --clear-cache` |
| Submit only | `eas submit --platform ios --profile production` |
| Build + Submit | `eas build --platform ios --profile production --clear-cache; if ($?) { eas submit --platform ios --profile production }` |
| Check builds | `eas build:list --platform ios` |
| View logs | `eas build:view [BUILD_ID]` |
