/*
  =============================================================================
  AUTH EMAIL / REDIRECT URLS — READ THIS FIRST
  =============================================================================

  Wrong links in Supabase confirmation or reset emails are NOT fixed by
  updating normal Postgres tables. They come from:

    1) Authentication → URL Configuration
         - Site URL
         - Redirect URLs (allow list)

    2) What your app sends in signUp / resetPassword / OAuth:
         - emailRedirectTo / redirectTo  (see getAuthEmailRedirectTo() in the app)

    3) Authentication → Email Templates
         - Variables like {{ .ConfirmationURL }} are built from the above.
         - If a template hard-codes https://natively.dev/... it will always be wrong
           until you edit the template in the Dashboard.

  To change Site URL / redirect allow list on HOSTED Supabase you must use:
    - Dashboard (Authentication → URL Configuration), OR
    - Supabase Management API:
        PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
      with a personal access token (scopes: auth_config_write).
      There is no supported "UPDATE ... SET site_url" SQL in your database.

  This file only contains optional diagnostics (read-only) on auth.users.
  =============================================================================
*/

-- Optional: recent signups and whether email is confirmed (RLS: run as postgres / dashboard SQL editor)
select
  id,
  email,
  email_confirmed_at is not null as email_confirmed,
  created_at
from auth.users
order by created_at desc
limit 20;

/*
  =============================================================================
  DASHBOARD CHECKLIST (do this to fix wrong URLs in emails)
  =============================================================================

  A) Authentication → URL Configuration
     - Site URL: set to your real primary web origin if you have one, e.g.
         https://elgomatiae.github.io/muslim-space/email-confirmation/
       or your production app web URL. Avoid dead hosts like natively.dev unless
       you actually host a page there.

     - Redirect URLs: add EVERY URL your app may pass as redirectTo / emailRedirectTo, e.g.
         https://elgomatiae.github.io/muslim-space/email-confirmation/
         natively://email-confirmed
         (and Expo dev URLs if needed)

  B) App / EAS
     - EXPO_PUBLIC_AUTH_REDIRECT_URL must match one of the Redirect URLs exactly.
     - Rebuild the mobile app after changing env vars.

  C) Authentication → Email Templates
     - Open "Confirm signup" and "Reset password" (and any custom templates).
     - Ensure links use Supabase variables (e.g. {{ .ConfirmationURL }}) and do NOT
       hard-code old domains.
     - Docs: if you pass redirectTo from the client, some setups use {{ .RedirectTo }}
       in templates; see Supabase "Redirect URLs" guide.

  =============================================================================
*/
