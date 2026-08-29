import { createClient } from '@supabase/supabase-js';
import { isLocalMode } from './supabase.js';
import { createLocalSupabaseClient } from './localDatabase.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a request-scoped Supabase client that is authenticated as the caller.
 *
 * This fixes the critical bug where the shared singleton client's `getUser()`
 * had no per-request identity. Each API route should call this with the
 * incoming request's Authorization header so that `getUser()` verifies the
 * actual caller's JWT.
 *
 * @param {string} authHeader - The raw `Authorization` header value, e.g. "Bearer eyJ..."
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createRequestClient(authHeader) {
  if (isLocalMode) {
    return createLocalSupabaseClient();
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
