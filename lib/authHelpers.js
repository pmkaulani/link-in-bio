import { supabase } from './supabase';

const KNOWN_ERRORS = {
  'Invalid login credentials': 'Incorrect email or password.',
  'User already registered': 'An account with this email already exists.',
  'Email not confirmed': 'Confirm your email before logging in — check your inbox.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
};

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
