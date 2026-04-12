import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/integrations/supabase/client';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';
import { applySupabaseSessionFromUrl } from '@/utils/supabaseAuthDeepLink';

export type GoogleSignInResult =
  | { ok: true; cancelled: boolean }
  | { ok: false; error: Error };

/**
 * Google OAuth via Supabase. Requires Google provider + redirect URLs configured in Supabase.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const redirectTo = getAuthEmailRedirectTo();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { ok: false, error: new Error(error.message) };
  }
  if (!data.url) {
    return { ok: false, error: new Error('No OAuth URL returned from Supabase') };
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.assign(data.url);
    }
    return { ok: true, cancelled: false };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return { ok: true, cancelled: true };
  }

  const applied = await applySupabaseSessionFromUrl(result.url);
  if (applied.error) {
    return { ok: false, error: new Error(applied.error.message) };
  }
  if (!applied.ok) {
    return { ok: false, error: new Error('Could not complete sign-in from the redirect URL') };
  }

  return { ok: true, cancelled: false };
}
