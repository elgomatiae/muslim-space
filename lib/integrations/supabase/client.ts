import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Use environment variables with EXPO_PUBLIC_ prefix for Expo/React Native
// SECURITY: Never hardcode keys in production - always use environment variables
// For EAS builds, set these as secrets: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || (__DEV__ ? undefined : 'https://teemloiwfnwrogwnoxsa.supabase.co');
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (__DEV__ ? undefined : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZW1sb2l3Zm53cm9nd25veHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTYzODMsImV4cCI6MjA4MDAzMjM4M30.CXCl1-nnRT0GB6Qg89daWxT8kWxx91gEDaUWk9jX4CQ');

// Track if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
};

// Validate configuration - log warning but don't throw to prevent immediate crash
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const isProduction = !__DEV__;
  const errorMsg = isProduction 
    ? `Missing Supabase configuration in production build. 

For EAS builds (TestFlight/App Store), you need to set environment variables as EAS secrets.

Fix this by running:
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_SUPABASE_URL
  eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY

Then rebuild your app:
  eas build --platform ios --profile production

Get your credentials from: https://supabase.com/dashboard → Settings → API`
    : `Missing Supabase configuration. 

Please create a .env file in your project root with:
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Quick setup:
1. Copy .env.example to .env
2. Get your credentials from: https://supabase.com/dashboard → Settings → API
3. Restart your dev server

See docs/ENV_SETUP_QUICK.md for detailed instructions.`;
  
  if (__DEV__) {
    console.error('❌', errorMsg);
    console.error('');
    console.error('📝 To fix this:');
    console.error('   1. Create .env file in project root');
    console.error('   2. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    console.error('   3. Restart dev server (npm start)');
    console.error('');
    // In dev, throw to make it obvious
    throw new Error(errorMsg);
  } else {
    // In production, log the error but DON'T throw - let the app show an error screen instead
    console.error('❌ CRITICAL: Missing Supabase configuration in production build');
    console.error('The app will show an error screen. Set EAS secrets and rebuild.');
    console.error('Fix: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_URL');
    console.error('Fix: eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_KEY');
  }
}

// Debug: Log configuration status (sanitized - no actual keys)
if (__DEV__) {
  console.log('🔧 Supabase Configuration:');
  console.log('  URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  Key:', SUPABASE_PUBLISHABLE_KEY ? `✅ Set (${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...)` : '❌ Missing');
  console.log('  Using env vars:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
} else {
  // In production, warn if using fallback values instead of env vars
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Using fallback Supabase credentials. For production builds, set EAS secrets:');
    console.warn('   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_URL');
    console.warn('   eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_KEY');
  }
}

// Security check: Ensure we're using anon key, not service_role
if (SUPABASE_PUBLISHABLE_KEY && SUPABASE_PUBLISHABLE_KEY.includes('service_role')) {
  console.error('SECURITY ERROR: Service role key detected. Never use service_role key in client code. Use anon key only.');
}

// Create Supabase client - use fallback values if env vars not set (for production resilience)
// In production, if EAS secrets aren't set, we'll use fallback values to prevent immediate crash
// The app will show an error screen instead of crashing
const finalUrl = SUPABASE_URL || 'https://teemloiwfnwrogwnoxsa.supabase.co';
const finalKey = SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZW1sb2l3Zm53cm9nd25veHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTYzODMsImV4cCI6MjA4MDAzMjM4M30.CXCl1-nnRT0GB6Qg89daWxT8kWxx91gEDaUWk9jX4CQ';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Schema-agnostic client: full `Database` types are not generated yet; typed `.from()` would reject valid tables.
let supabaseInstance: SupabaseClient | null = null;

// Safely get AsyncStorage - it might not be ready at module load time
let safeAsyncStorage: typeof AsyncStorage | null = null;
try {
  // Check if AsyncStorage is available
  if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
    safeAsyncStorage = AsyncStorage;
  }
} catch (storageError) {
  console.warn('AsyncStorage not available at module load:', storageError);
  // Will create client without storage
}

try {
  supabaseInstance = createClient(finalUrl, finalKey, {
    auth: {
      storage: safeAsyncStorage || undefined, // Only use storage if available
      autoRefreshToken: !!safeAsyncStorage, // Only auto-refresh if storage available
      persistSession: !!safeAsyncStorage, // Only persist if storage available
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Create a minimal client that won't crash
  // This should never happen, but safety first
  try {
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        storage: undefined, // Don't use storage if initial creation failed
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (fallbackError) {
    console.error('Fallback Supabase client creation also failed:', fallbackError);
    // If even fallback fails, we'll handle this in the contexts
  }
}

// Export with null check safety - create a safe wrapper if instance is null
export const supabase = supabaseInstance || (() => {
  // This should never be called, but provides a safe fallback
  console.error('Supabase client is null - this should not happen');
  // Return a minimal client that won't crash - don't use AsyncStorage in fallback
  try {
    return createClient(finalUrl, finalKey, {
      auth: {
        storage: undefined, // Don't use storage in fallback
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error('Even fallback client creation failed:', error);
    // Return a minimal client without auth config
    return createClient(finalUrl, finalKey);
  }
})();
