# Quick Environment Setup

## Error: Missing Supabase Configuration

If you see this error:
```
Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
```

## Quick Fix (2 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token starting with `eyJ...`)

### Step 2: Create `.env` File

1. In your project root (same folder as `package.json`), create a file named `.env`
2. Copy the contents from `.env.example`:
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```
3. Open `.env` and replace the placeholder values:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Restart Dev Server

**Important:** After creating/updating `.env`, you MUST restart your dev server:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
# or
expo start
```

### Step 4: Verify It Works

Check your console logs. You should see:
```
🔧 Supabase Configuration:
  URL: ✅ Set
  Key: ✅ Set (eyJhbGciOiJIUzI1NiIs...)
  Using env vars: true
```

## Troubleshooting

### Issue: "Still seeing the error after creating .env"

**Solutions:**
1. ✅ Make sure `.env` is in the project root (same folder as `package.json`)
2. ✅ Use `EXPO_PUBLIC_` prefix (required for Expo)
3. ✅ Restart dev server after creating `.env`
4. ✅ Check for typos in variable names
5. ✅ Make sure there are no spaces around the `=` sign

### Issue: "Which key should I use?"

- ✅ **Use:** `anon public` key (safe for client code)
- ❌ **Never use:** `service_role` key (server-side only)

The anon key is designed to be public and is safe to use in client code because RLS (Row Level Security) protects your data.

### Issue: "Can't find my Supabase project"

1. Make sure you're logged into the correct Supabase account
2. Check if your project is paused (Settings → General)
3. Create a new project if needed: [New Project](https://supabase.com/dashboard/new)

## Security Reminder

- ✅ `.env` is already in `.gitignore` (won't be committed)
- ✅ Never commit your actual keys to git
- ✅ The anon key is safe to use in client code
- ✅ Never use service_role key in the app

## Need Help?

If you're still having issues:
1. Check `ENV_SETUP.md` for more detailed instructions
2. Verify your Supabase project is active
3. Make sure you copied the entire anon key (it's very long)
