import { supabase } from './supabase';

const KNOWN_ERRORS = {
  'Invalid login credentials': 'Incorrect email or password.',
  'User already registered': 'An account with this email already exists.',
  'Email not confirmed': 'Confirm your email before logging in — check your inbox.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  // Supabase returns this when the account exists but was created via OAuth (no password set)
  'invalid_grant': 'OAUTH_ACCOUNT',
};

/**
 * Returns true if the error indicates the account was created via OAuth (e.g. Google)
 * and has no password set yet — so signInWithPassword will always fail for them.
 */
export function isOAuthOnlyAccount(error) {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || '';
  const code = error?.code || error?.error_code || '';
  // Supabase 400 on password login for OAuth-only accounts often returns
  // "Invalid login credentials" but we can't distinguish it from wrong-password
  // reliably without a separate lookup. We surface a helpful prompt instead.
  return (
    code === 'invalid_grant' ||
    msg.includes('invalid_grant') ||
    msg.toLowerCase().includes('oauth') ||
    msg.toLowerCase().includes('provider')
  );
}

export function friendlyAuthError(error) {
  if (!error) return '';
  const message = typeof error === 'string' ? error : error.message || '';
  return KNOWN_ERRORS[message] || message || 'Something went wrong. Please try again.';
}

export function requestPasswordReset(email) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
}

export function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}

export function resendConfirmation(email) {
  return supabase.auth.resend({ type: 'signup', email });
}
