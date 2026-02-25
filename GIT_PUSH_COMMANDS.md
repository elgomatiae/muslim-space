# Git Commands to Push app-ads.txt File

## Quick Check: Is the file already pushed?

Run this to see if the file is already in the repository:
```bash
git ls-files website/app-ads.txt
```

If it shows `website/app-ads.txt`, the file is tracked.

## Commands to Push the File

### Step 1: Check Current Status
```bash
git status
```

### Step 2: Add the File(s)
If the file is not tracked or has changes:
```bash
# Add the app-ads.txt file
git add website/app-ads.txt

# Add the _headers file (for proper content type)
git add website/_headers

# Add the _redirects file (if you created it)
git add website/_redirects
```

Or add all website files at once:
```bash
git add website/
```

### Step 3: Commit the Changes
```bash
git commit -m "Add app-ads.txt for AdMob verification"
```

### Step 4: Push to Remote
```bash
git push origin main
```

(Replace `main` with your branch name if different, e.g., `master`)

## Complete Command Sequence

```bash
# 1. Check status
git status

# 2. Add files
git add website/app-ads.txt website/_headers website/_redirects

# 3. Commit
git commit -m "Add app-ads.txt for AdMob verification"

# 4. Push
git push origin main
```

## Verify It's Pushed

After pushing, verify the file is on the remote:
```bash
git ls-remote --heads origin
```

Or check in your GitHub/GitLab web interface to confirm the file is there.

## For Netlify Auto-Deploy

Once pushed:
1. Netlify should automatically detect the push
2. It will trigger a new deployment
3. Wait for deployment to complete (check Netlify dashboard)
4. Verify file is accessible at: `https://muslimspace.netlify.app/app-ads.txt`

## If Netlify Doesn't Auto-Deploy

1. Go to Netlify dashboard
2. Click "Trigger deploy" → "Deploy site"
3. Wait for deployment to complete
