/**
 * Default redirect after Supabase email confirm, password reset, and OAuth.
 * This URL must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
 *
 * Hosted static page (GitHub Pages for `elgomatiae/muslim-space`) forwards tokens into the app.
 * Override with EXPO_PUBLIC_AUTH_REDIRECT_URL (e.g. another production domain or Expo web dev).
 */
const DEFAULT_AUTH_REDIRECT =
  'https://elgomatiae.github.io/muslim-space/email-confirmation/';

/**
 * Redirect URL for Supabase (email recovery, OAuth, email confirmation).
 *
 * Priority:
 * 1. `EXPO_PUBLIC_AUTH_REDIRECT_URL` — full control when set.
 * 2. Otherwise `DEFAULT_AUTH_REDIRECT` — stable HTTPS URL (must stay on Supabase allow list).
 */
export function getAuthEmailRedirectTo(): string {
  const explicit = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return DEFAULT_AUTH_REDIRECT;
}
