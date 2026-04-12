import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/integrations/supabase/client';

export type SupabaseAuthUrlTokens = {
  code: string | null;
  access_token: string | null;
  refresh_token: string | null;
};

/**
 * Extracts Supabase auth callback parameters from a deep link or web URL.
 * Supports PKCE (?code=) and implicit grant (#access_token= / #refresh_token=).
 */
export function parseSupabaseAuthParamsFromUrl(url: string): SupabaseAuthUrlTokens {
  let code: string | null = null;
  let access_token: string | null = null;
  let refresh_token: string | null = null;

  try {
    const parsed = new URL(url);
    code = parsed.searchParams.get('code');
    const hash = parsed.hash?.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    if (hash) {
      const hp = new URLSearchParams(hash);
      access_token = hp.get('access_token');
      refresh_token = hp.get('refresh_token');
    }
  } catch {
    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hp = new URLSearchParams(url.slice(hashIdx + 1));
      access_token = hp.get('access_token');
      refresh_token = hp.get('refresh_token');
    }
    const qStart = url.indexOf('?');
    if (qStart >= 0) {
      const queryOnly = url.slice(qStart + 1).split('#')[0];
      const sp = new URLSearchParams(queryOnly);
      code = sp.get('code');
    }
  }

  return { code, access_token, refresh_token };
}

/**
 * Applies email confirmation / magic link / recovery tokens from a redirect URL.
 * Safe to call when the URL has no auth payload (returns ok: false).
 */
export async function applySupabaseSessionFromUrl(
  url: string
): Promise<{ ok: boolean; error?: AuthError }> {
  const { code, access_token, refresh_token } = parseSupabaseAuthParamsFromUrl(url);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  }

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      return { ok: false, error };
    }
    return { ok: true };
  }

  return { ok: false };
}
