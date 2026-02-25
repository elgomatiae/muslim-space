# How to Deploy to Netlify

## Overview
Your website is configured to deploy from the `website/` folder. Netlify will automatically deploy when you push changes to your connected Git repository.

## Method 1: Git-Based Deployment (Recommended)

If your Netlify site is connected to a Git repository (GitHub, GitLab, or Bitbucket), it will automatically deploy when you push changes.

### Step 1: Stage Your Changes
Add the modified `app-ads.txt` file and any other changes:

```powershell
# Add the app-ads.txt file
git add website/app-ads.txt

# Or add all changes
git add .
```

### Step 2: Commit Your Changes
```powershell
git commit -m "Fix app-ads.txt formatting for AdMob verification"
```

### Step 3: Push to Your Repository
```powershell
git push origin main
```

**That's it!** Netlify will automatically detect the push and deploy your site.

### Step 4: Verify Deployment
1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Check the "Deploys" tab - you should see a new deployment in progress
4. Wait for it to complete (usually 1-2 minutes)

### Step 5: Test Your File
Once deployed, test that `app-ads.txt` is accessible:
- Open: `https://yourdomain.netlify.app/app-ads.txt`
- You should see: `google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0`

---

## Method 2: Manual Deployment via Netlify CLI

If you prefer to deploy manually or don't have Git connected:

### Step 1: Install Netlify CLI (if not installed)
```powershell
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```powershell
netlify login
```
This will open your browser to authenticate.

### Step 3: Deploy
```powershell
# Navigate to project root
cd C:\Users\Elgom\app\project

# Deploy the website folder
netlify deploy --dir=website --prod
```

The `--prod` flag deploys to production. Without it, it creates a draft deployment.

---

## Method 3: Drag-and-Drop Deployment

If you don't want to use CLI or Git:

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop your `website/` folder
3. Netlify will deploy it automatically

**Note:** This creates a new site each time. For ongoing updates, use Git-based deployment.

---

## Quick Deploy Commands (PowerShell)

Here are the commands to quickly deploy your changes:

```powershell
# Navigate to project
cd C:\Users\Elgom\app\project

# Add and commit changes
git add website/app-ads.txt public/app-ads.txt
git commit -m "Fix app-ads.txt formatting - remove trailing newline"

# Push to trigger Netlify deployment
git push origin main
```

---

## Verify Your Deployment

After deploying, verify everything is working:

### 1. Check File Accessibility
Open in browser:
```
https://yourdomain.netlify.app/app-ads.txt
```

Should display:
```
google.com, pub-2757517181313212, DIRECT, f08c47fec0942fa0
```

### 2. Check Content Type
Using PowerShell:
```powershell
curl -I https://yourdomain.netlify.app/app-ads.txt
```

Should show:
```
Content-Type: text/plain; charset=utf-8
```

### 3. Check Netlify Dashboard
- Go to [Netlify Dashboard](https://app.netlify.com)
- Select your site
- Check "Deploys" tab for successful deployment
- Check "Site settings" → "Build & deploy" to verify configuration

---

## Netlify Configuration

Your `netlify.toml` is configured as:
```toml
[build]
  base = "website"
  publish = "website"
```

This means:
- Netlify looks in the `website/` folder for files
- The `website/` folder is published as the root of your site
- `app-ads.txt` in `website/` will be at `https://yourdomain.com/app-ads.txt`

---

## Troubleshooting

### Issue: Changes not deploying
**Solution:**
- Check Netlify dashboard for build errors
- Verify Git repository is connected in Netlify settings
- Check that you pushed to the correct branch (usually `main`)

### Issue: File returns 404
**Solution:**
- Verify file is in `website/` folder (not a subfolder)
- Check `netlify.toml` configuration
- Ensure file is committed to Git

### Issue: File has wrong content
**Solution:**
- Check file content in `website/app-ads.txt`
- Verify no trailing newlines or extra spaces
- Redeploy after fixing

### Issue: Deployment takes too long
**Solution:**
- Check Netlify dashboard for build status
- Large deployments can take 2-5 minutes
- Check for build errors in the deploy log

---

## Next Steps After Deployment

1. ✅ Verify file is accessible at root URL
2. ✅ Test file content is correct (no extra lines)
3. ✅ Check content type is `text/plain`
4. ✅ Go to AdMob dashboard
5. ✅ Click "Check for updates" to trigger verification
6. ✅ Wait 24-48 hours for Google to verify

---

## Quick Reference

**File Location:** `website/app-ads.txt`  
**Expected URL:** `https://yourdomain.netlify.app/app-ads.txt`  
**Deploy Command:** `git push origin main` (if Git connected)  
**Manual Deploy:** `netlify deploy --dir=website --prod`  
**Netlify Dashboard:** https://app.netlify.com
