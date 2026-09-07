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

  if (!serviceRoleKey) {
    throw new Error(
      '[SECURITY ERROR] SUPABASE_SERVICE_ROLE_KEY is required for createAdminClient in connected mode. ' +
      'Refusing to silently fall back to the public anon key.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
