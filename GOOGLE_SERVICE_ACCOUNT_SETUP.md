# Google Service Account Setup for Android Builds

## What is This?

A Google Service Account JSON key is required for:
- ✅ Uploading your app to Google Play Store
- ✅ Sending Android Notifications via FCM V1
- ✅ Android app submission automation

## Step-by-Step Setup

### Step 1: Create Google Service Account

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account (same one used for AdMob/Play Store)

2. **Select or Create a Project:**
   - If you have a project, select it
   - If not, click "Create Project"
   - Name it something like "Muslim-Space App" or "My App Project"
   - Click "Create"

3. **Enable Required APIs:**
   - In the left menu, go to **"APIs & Services"** → **"Library"**
   - Search for and enable:
     - **"Google Play Android Developer API"**
     - **"Firebase Cloud Messaging API"** (if using notifications)

4. **Create Service Account:**
   - Go to **"IAM & Admin"** → **"Service Accounts"**
   - Click **"Create Service Account"**
   - **Name:** `eas-submit` (or any name you prefer)
   - **Description:** `Service account for EAS Android builds`
   - Click **"Create and Continue"**

5. **Grant Permissions:**
   - **Role:** Select **"Editor"** or **"Owner"** (for full access)
   - Click **"Continue"**
   - Click **"Done"**

### Step 2: Create and Download JSON Key

1. **Create Key:**
   - Click on the service account you just created
   - Go to **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**
   - Select **"JSON"** format
   - Click **"Create"**
   - **The JSON file will download automatically**

2. **Save the File:**
   - The file will be named like: `your-project-xxxxx-xxxxx.json`
   - Save it in a secure location (e.g., `C:\Users\Elgom\app\project\`)
   - **Important:** Keep this file secure! Don't commit it to Git.

### Step 3: Grant Play Store Access

1. **Go to Google Play Console:**
   - Visit: https://play.google.com/console/
   - Sign in with your developer account

2. **Add Service Account:**
   - Go to **"Setup"** → **"API access"**
   - Scroll to **"Service accounts"** section
   - Click **"Link service account"**
   - Enter the service account email (found in the JSON file, looks like: `eas-submit@your-project.iam.gserviceaccount.com`)
   - Click **"Grant access"**

3. **Set Permissions:**
   - Check **"View app information and download bulk reports"**
   - Check **"Manage production releases"** (if you want auto-submit)
   - Check **"Manage testing track releases"** (for TestFlight-like testing)
   - Click **"Invite user"**

### Step 4: Use in EAS Build

**Option A: Reference the file path in build command:**

```powershell
cd C:\Users\Elgom\app\project
eas build --platform android --profile production --clear-cache --auto-submit
```

When prompted:
```
? Path to Google Service Account file: 
```

Enter the full path to your JSON file:
```
C:\Users\Elgom\app\project\your-project-xxxxx-xxxxx.json
```

**Option B: Set it once in EAS config (Recommended):**

```powershell
# Set the service account path (one time setup)
eas credentials
```

Then select:
- **"Android"**
- **"Google Service Account"**
- Enter the path to your JSON file

This way, you won't be prompted every time.

---

## Quick Setup Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google Play Android Developer API
- [ ] Created Service Account
- [ ] Downloaded JSON key file
- [ ] Saved JSON file in project directory
- [ ] Linked service account in Play Console
- [ ] Granted appropriate permissions
- [ ] Configured in EAS (via `eas credentials` or build command)

---

## File Location Recommendation

Save your JSON file in your project directory:

```
C:\Users\Elgom\app\project\
├── api-xxxxx-xxxxx.json  ← Save here
├── app.json
├── package.json
└── ...
```

**Important:** Add to `.gitignore` to prevent committing secrets:

```gitignore
# Google Service Account
*.json
!package.json
!tsconfig.json
```

---

## Troubleshooting

### "File does not exist"
- **Solution:** Use the full absolute path:
  ```
  C:\Users\Elgom\app\project\your-file-name.json
  ```
- Make sure the file is actually saved where you think it is

### "Permission denied"
- **Solution:** Check that you:
  1. Enabled the Google Play Android Developer API
  2. Linked the service account in Play Console
  3. Granted the correct permissions

### "Service account not found"
- **Solution:** Make sure you:
  1. Created the service account in the correct Google Cloud project
  2. Used the correct email when linking in Play Console

### "API not enabled"
- **Solution:** Go to Google Cloud Console → APIs & Services → Library
- Enable: "Google Play Android Developer API"

---

## Security Best Practices

1. **Don't commit JSON file to Git:**
   - Add `*.json` to `.gitignore` (except package.json, tsconfig.json, etc.)

2. **Store securely:**
   - Keep the JSON file in a secure location
   - Don't share it publicly

3. **Use EAS credentials:**
   - Once set via `eas credentials`, it's stored securely on EAS servers
   - You won't need to provide it every time

---

## Alternative: Skip Auto-Submit

If you don't want to set up the service account right now, you can:

1. **Build without auto-submit:**
   ```powershell
   eas build --platform android --profile production --clear-cache
   ```

2. **Manually upload later:**
   - Download the `.aab` file from EAS
   - Upload manually to Google Play Console

---

## Next Steps

After setting up the service account:

1. **Save the JSON file** in your project directory
2. **Run the build command:**
   ```powershell
   cd C:\Users\Elgom\app\project
   eas build --platform android --profile production --clear-cache --auto-submit
   ```
3. **When prompted**, enter the path to your JSON file
4. **Or set it once** using `eas credentials` to avoid future prompts

---

## Quick Reference

**Create Service Account:**
- Google Cloud Console → IAM & Admin → Service Accounts → Create

**Download JSON Key:**
- Service Account → Keys → Add Key → JSON → Create

**Link to Play Store:**
- Play Console → Setup → API access → Link service account

**Use in EAS:**
- Run `eas credentials` and configure, OR
- Provide path when prompted during build
