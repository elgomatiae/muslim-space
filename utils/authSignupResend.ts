import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getAuthEmailRedirectTo } from '@/utils/authEmailRedirectTo';

/**
 * True when signUp failed because the address is already known to Auth
 * (often an unconfirmed signup). In that case, resend signup confirmation.
 */
export function shouldAttemptSignupConfirmationResend(error: AuthError | null | undefined): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  const code = String((error as { code?: string }).code || '').toLowerCase();

  if (code === 'user_already_exists') return true;
  if (code === 'email_exists') return true;
  if (msg.includes('already registered')) return true;
  if (msg.includes('already been registered')) return true;
  if (msg.includes('user already exists')) return true;
  if (msg.includes('email address') && msg.includes('already')) return true;
  if (msg.includes('duplicate') && msg.includes('email')) return true;
  return false;
}

export async function resendSignupConfirmationEmail(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: getAuthEmailRedirectTo(),
    },
  });
}
