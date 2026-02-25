# Where to Find the Domain in App Store Connect

## For app-ads.txt Verification

Google uses the **"Developer Website"** or **"Support URL"** from your App Store Connect listing to verify the app-ads.txt file.

## Step-by-Step: Finding the Domain

### Method 1: App Information (Most Common)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"**
3. Select your app **"Muslim-Space"**
4. Click on **"App Information"** (in the left sidebar, under the App Store tab)
5. Look for one of these fields:
   - **"Developer Website"** (most common)
   - **"Support URL"** 
   - **"Marketing URL"**
   - **"Privacy Policy URL"** (sometimes used)

### Method 2: App Store Tab

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"**
3. Select your app **"Muslim-Space"**
4. Click on **"App Store"** tab (at the top)
5. Under **"App Information"** section, look for:
   - **"Developer Website"**
   - **"Support URL"**

## What Google Uses

Google AdMob uses the **domain** from whichever URL field is set in App Store Connect. It extracts the domain and looks for `app-ads.txt` at the root.

**Example:**
- If Support URL is: `https://muslimspace.netlify.app/support`
- Google extracts: `muslimspace.netlify.app`
- Google looks for: `https://muslimspace.netlify.app/app-ads.txt`

## What to Check

1. **Find the URL field** (Developer Website, Support URL, or Marketing URL)
2. **Extract the domain** (the part after `https://` and before the first `/`)
3. **Verify it matches:** `muslimspace.netlify.app`

## If the Domain is Different

If the domain in App Store Connect is different from `muslimspace.netlify.app`:

### Option 1: Update App Store Connect (Recommended)
1. Update the **Developer Website** or **Support URL** to: `https://muslimspace.netlify.app` (or `https://muslimspace.netlify.app/support`)
2. Save changes
3. Wait 24-48 hours for the change to propagate
4. Re-verify in AdMob

### Option 2: Host app-ads.txt on the Domain Listed
If you can't change the App Store Connect domain:
1. Find out what domain is listed
2. Host the `app-ads.txt` file on that domain's root
3. Ensure it's accessible at: `https://[that-domain]/app-ads.txt`

## Quick Check

To quickly see what domain Google is checking:

1. Look at the **Support URL** or **Developer Website** in App Store Connect
2. Extract the domain (remove `https://` and everything after the first `/`)
3. That's the domain Google will check for `app-ads.txt`

## Your Current Setup

- **File Location:** `https://muslimspace.netlify.app/app-ads.txt` ✅
- **File Content:** Correct ✅
- **Need to Verify:** What domain is listed in App Store Connect?

## Next Steps

1. **Find the domain** in App Store Connect (using steps above)
2. **Compare it** to `muslimspace.netlify.app`
3. **If different:** Either:
   - Update App Store Connect to use `muslimspace.netlify.app`, OR
   - Host `app-ads.txt` on the domain that's currently listed
4. **Wait 24-48 hours** after making changes
5. **Re-verify** in AdMob
