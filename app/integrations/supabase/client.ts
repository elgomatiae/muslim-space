import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

// Use environment variables with EXPO_PUBLIC_ prefix for Expo/React Native
// SECURITY: Never hardcode keys in production - always use environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate configuration - fail fast if missing
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const errorMsg = `Missing Supabase configuration. 

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
  }
  throw new Error(errorMsg);
}

// Security check: Ensure we're using anon key, not service_role
if (SUPABASE_PUBLISHABLE_KEY.includes('service_role')) {
  throw new Error('SECURITY ERROR: Service role key detected. Never use service_role key in client code. Use anon key only.');
}

// Debug: Log configuration status (sanitized - no actual keys)
if (__DEV__) {
  console.log('🔧 Supabase Configuration:');
  console.log('  URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  Key:', SUPABASE_PUBLISHABLE_KEY ? `✅ Set (${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...)` : '❌ Missing');
  console.log('  Using env vars:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
