import { createClient } from '@supabase/supabase-js';
import { isLocalMode } from './supabase.js';
import { createLocalSupabaseClient } from './localDatabase.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Server-only Supabase client that uses the service_role key to bypass RLS.
 *
 * NEVER import this in client components or expose the key via NEXT_PUBLIC_.
 * Used exclusively in:
 *   - app/api/admin/* routes (read/write admin tables)
 *   - app/api/account/delete (auth.admin.deleteUser)
 *   - lib/adminAuth.js (query platform_admins, write audit logs)
 */
export function createAdminClient() {
  if (isLocalMode) {
    return createLocalSupabaseClient();
  }

  const keyToUse =
    serviceRoleKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!serviceRoleKey) {
    console.warn(
      '[link-in-bio] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. ' +
      'Admin operations are using the fallback key. For full admin access and RLS bypass, ' +
      'add SUPABASE_SERVICE_ROLE_KEY to your Vercel Environment Variables.'
    );
  }

  return createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
