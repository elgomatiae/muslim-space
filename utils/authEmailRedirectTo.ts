import * as Linking from 'expo-linking';

/**
 * Redirect URL for Supabase (email recovery, OAuth, and optional email flows).
 *
 * Supabase only redirects to URLs on your **Redirect URLs** allow list. If the list
 * contains a dead host (e.g. https://natively.dev/email-confirmed), the browser shows 404.
 *
 * Priority:
 * 1. `EXPO_PUBLIC_AUTH_REDIRECT_URL` — use when you deploy web (e.g. https://yourdomain.com/email-confirmed)
 *    or a stable HTTPS callback you control.
 * 2. Otherwise `Linking.createURL('email-confirmed')` — e.g. natively://email-confirmed (see app.json scheme).
 *
 * Add the **exact** string returned at runtime to Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthEmailRedirectTo(): string {
  const explicit = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return Linking.createURL('email-confirmed');
}
