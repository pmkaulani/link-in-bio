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
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[FATAL] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Admin operations require a service-role key in production. ' +
        'Add it to your environment variables (never prefix with NEXT_PUBLIC_).'
      );
    }
    console.warn(
      '[link-in-bio] SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Admin API routes that bypass RLS will fail. ' +
      'Get it from Supabase Dashboard → Settings → API → service_role (secret).'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
