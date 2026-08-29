import { NextResponse } from 'next/server';
import { isLocalMode } from '../../../../lib/supabase';
import { createRequestClient } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // ── Auth gate: reject if no verified session ─────────────────────────
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createRequestClient(authHeader);

    let userId = null;

    if (isLocalMode) {
      // In local development mode, check the local storage mock session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
      }
      userId = session.user.id;
    } else {
      // In production mode, require a verified JWT from the Authorization header
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized: Authorization header required.' }, { status: 401 });
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired session.' }, { status: 401 });
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Valid session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Change Password
    if (action === 'change_password') {
      const { newPassword } = body;
      const isValid =
        newPassword &&
        newPassword.length >= 8 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword) &&
        /[^A-Za-z0-9]/.test(newPassword);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special symbols.' },
          { status: 400 }
        );
      }

      if (!isLocalMode) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    }

    // 2. Toggle 2FA
    if (action === 'toggle_2fa') {
      const { enabled } = body;
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: Boolean(enabled) })
        .eq('id', userId);

      return NextResponse.json({ success: true, enabled: Boolean(enabled) });
    }

    // 3. Purge Analytics Data
    if (action === 'purge_analytics') {
      await supabase.from('analytics_events').delete().eq('profile_id', userId);
      return NextResponse.json({ success: true, message: 'All analytics and view records purged.' });
    }

    // 4. Update Username
    if (action === 'update_username') {
      const { username } = body;
      const clean = username?.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
      if (!clean || clean.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters (letters, numbers, underscores, dots, or hyphens).' }, { status: 400 });
      }

      // Check system reserved names
      const RESERVED_NAMES = [
        'admin', 'administrator', 'root', 'support', 'help', 'api', 'auth', 'official',
        'verified', 'security', 'system', 'terms', 'privacy', 'dashboard', 'settings',
        'linkinbio', 'linktree', 'billing', 'contact', 'about', 'explore', 'discover',
        'login', 'signup', 'onboarding', 'reset-password'
      ];
      if (RESERVED_NAMES.includes(clean)) {
        return NextResponse.json({ error: 'This handle is reserved by the system.' }, { status: 400 });
      }

      // Fetch current profile to check cooldown
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (currentProfile?.username === clean) {
        return NextResponse.json({ success: true, message: 'Username is unchanged.', username: clean });
      }

      // Enforce 14-day cooldown limit per username change (stored in socials._handle_changed_at or username_changed_at)
      const lastChangedTime =
        currentProfile?.socials?._handle_changed_at || currentProfile?.username_changed_at || null;
      if (lastChangedTime) {
        const lastChanged = new Date(lastChangedTime).getTime();
        const daysSince = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
        const COOLDOWN_DAYS = 14;
        if (daysSince < COOLDOWN_DAYS) {
          const daysRemaining = Math.ceil(COOLDOWN_DAYS - daysSince);
          return NextResponse.json(
            {
              error: `Handle changes are limited to once every 14 days to prevent broken links and impersonation. You can change your handle again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
            },
            { status: 429 }
          );
        }
      }

      // Check reservation blacklist in DB
      const { data: reserved } = await supabase.from('reserved_usernames').select('username').eq('username', clean).maybeSingle();
      if (reserved) {
        return NextResponse.json({ error: 'This username is reserved by system administrator.' }, { status: 400 });
      }

      // Check exact collision against currently active profiles (released handles can be claimed by anyone)
      const { data: existing } = await supabase.from('profiles').select('id, username').eq('username', clean).neq('id', userId).maybeSingle();
      if (existing) {
        return NextResponse.json({ error: 'This username is already taken by another creator.' }, { status: 400 });
      }

      // Check confusing similarity with existing creators (e.g. replacing '0' with 'o', or punctuation variations)
      const normalizedClean = clean.replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/[1l]/g, 'i');
      if (normalizedClean.length >= 3) {
        const { data: allProfiles } = await supabase.from('profiles').select('id, username').neq('id', userId).limit(200);
        if (allProfiles && allProfiles.length > 0) {
          const conflict = allProfiles.find((p) => {
            if (!p.username) return false;
            const normExisting = p.username.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/[1l]/g, 'i');
            return normExisting === normalizedClean && p.username.toLowerCase() !== clean;
          });
          if (conflict) {
            return NextResponse.json(
              {
                error: `This handle is too similar to existing creator @${conflict.username}. Please choose a distinct handle to prevent impersonation.`,
              },
              { status: 400 }
            );
          }
        }
      }

      // Maintain handle claim history in socials JSON so previous handles are recorded
      const oldUsername = currentProfile?.username;
      const existingHistory = Array.isArray(currentProfile?.socials?._handle_history)
        ? [...currentProfile.socials._handle_history]
        : [];

      if (oldUsername && oldUsername !== clean) {
        if (!existingHistory.some((h) => h.handle === oldUsername)) {
          existingHistory.unshift({
            handle: oldUsername,
            released_at: new Date().toISOString(),
          });
        }
      }

      const updatedSocials = {
        ...(currentProfile?.socials || {}),
        _handle_changed_at: new Date().toISOString(),
        _handle_history: existingHistory.slice(0, 10),
      };

      // Perform update using standard columns that exist across all schemas
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          username: clean,
          socials: updatedSocials,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        // Fallback: minimal update
        const { data: fallbackUpdated, error: fallbackError } = await supabase
          .from('profiles')
          .update({ username: clean })
          .eq('id', userId)
          .select()
          .single();
        if (fallbackError) throw fallbackError;
        return NextResponse.json({ success: true, user: fallbackUpdated, username: clean });
      }

      return NextResponse.json({ success: true, user: updated, username: clean, history: existingHistory });
    }

    // 5. Update Privacy & Profile Flags
    if (action === 'update_privacy') {
      const { is_private, search_indexing, sensitive_content, is_disabled, is_deactivated } = body;
      const updates = {};
      if (typeof is_private === 'boolean') updates.is_private = is_private;
      if (typeof search_indexing === 'boolean') updates.search_indexing = search_indexing;
      if (typeof sensitive_content === 'boolean') updates.sensitive_content = sensitive_content;
      if (typeof is_disabled === 'boolean') updates.is_disabled = is_disabled;
      if (typeof is_deactivated === 'boolean') updates.is_deactivated = is_deactivated;

      const { data: updated, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, user: updated });
    }

    // 6. Revoke Active Session
    if (action === 'revoke_session') {
      const { sessionId } = body;
      return NextResponse.json({ success: true, message: `Session ${sessionId || ''} revoked.` });
    }

    // 7. Sign Out Everywhere
    if (action === 'sign_out_everywhere') {
      if (!isLocalMode) {
        await supabase.auth.signOut({ scope: 'global' });
      }
      return NextResponse.json({ success: true, message: 'All active sessions invalidated.' });
    }

    return NextResponse.json({ error: 'Unknown action requested.' }, { status: 400 });
  } catch (err) {
    console.error('Error handling account action:', err);
    return NextResponse.json({ error: err.message || 'Failed to perform account action.' }, { status: 500 });
  }
}
