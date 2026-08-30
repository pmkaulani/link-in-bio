import { isLocalMode } from './supabase.js';
import { createRequestClient } from './supabaseServer.js';
import { createAdminClient } from './supabaseAdmin.js';

/**
 * Server-side Admin Authorization Check.
 *
 * Verifies the caller's identity via their Authorization header (request-scoped
 * client), then checks `platform_admins` via the service-role admin client
 * (which bypasses RLS).
 *
 * @param {Request} request - The incoming Next.js Request object
 * @returns {{ isAdmin: boolean, role: string|null, user: object|null }}
 */
export async function verifyAdminUser(request) {
  // In local demo mode:
  // - In development: grant superadmin for zero-config testing
  // - In production: STRICTLY DENY admin access (no silent fallback privilege grant)
  if (isLocalMode) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY FATAL] Admin access attempted in local mode on production build. Access denied.');
      return { isAdmin: false, role: null, user: null };
    }

    console.warn('[link-in-bio] LOCAL DEV MODE: auto-granting superadmin for local testing.');
    return {
      isAdmin: true,
      role: 'superadmin',
      user: { id: 'local-test-id', email: 'admin@linkinbio.local' },
    };
  }

  try {
    // 1. Extract the caller's JWT from the request
    const authHeader = request?.headers?.get?.('authorization') || '';
    if (!authHeader) {
      return { isAdmin: false, role: null, user: null };
    }

    // 2. Create a request-scoped client bound to this caller's token
    const userClient = createRequestClient(authHeader);
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) {
      return { isAdmin: false, role: null, user: null };
    }

    // 3. Check platform_admins via the service-role client (bypasses RLS)
    const adminClient = createAdminClient();
    const isSuperAdminEmail =
      user.email === 'pmkaulani@gmail.com' ||
      (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) ||
      (process.env.NEXT_PUBLIC_ADMIN_EMAIL && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

    const { data: adminRecord } = await adminClient
      .from('platform_admins')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminRecord) {
      return {
        isAdmin: true,
        role: adminRecord.role || 'superadmin',
        user,
      };
    }

    if (isSuperAdminEmail) {
      // Auto-sync into platform_admins so they are permanently stored
      try {
        await adminClient.from('platform_admins').upsert(
          { user_id: user.id, role: 'superadmin' },
          { onConflict: 'user_id' }
        );
      } catch (_) {}

      return {
        isAdmin: true,
        role: 'superadmin',
        user,
      };
    }

    return { isAdmin: false, role: null, user };
  } catch (err) {
    console.error('[adminAuth] Verification failed:', err);
    return { isAdmin: false, role: null, user: null };
  }
}

/**
 * Logs an administrative event to `admin_audit_logs`.
 * Uses the service-role client to bypass RLS on the audit table.
 */
export async function logAdminAction({ adminId, adminEmail, action, targetType, targetId, metadata = {} }) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from('admin_audit_logs').insert({
      admin_id: adminId || null,
      admin_email: adminEmail || 'system',
      action,
      target_type: targetType,
      target_id: String(targetId),
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

/**
 * Check if a username is in the reserved blacklist.
 * Uses the service-role client to bypass RLS on reserved_usernames.
 */
export async function isUsernameReserved(username) {
  if (!username) return false;
  const normalized = username.toLowerCase().trim().replace(/^@/, '');

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('reserved_usernames')
    .select('username')
    .eq('username', normalized)
    .maybeSingle();

  return Boolean(data);
}
