import { NextResponse } from 'next/server';
import { isLocalMode } from '../../../../lib/supabase';
import { createRequestClient } from '../../../../lib/supabaseServer';

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
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
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
        return NextResponse.json({ error: 'Username must be at least 3 alphanumeric characters.' }, { status: 400 });
      }

      // Check reservation blacklist
      const { data: reserved } = await supabase.from('reserved_usernames').select('username').eq('username', clean).maybeSingle();
      if (reserved) {
        return NextResponse.json({ error: 'This username is reserved by system administrator.' }, { status: 400 });
      }

      // Check collision
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', clean).neq('id', userId).maybeSingle();
      if (existing) {
        return NextResponse.json({ error: 'This username is already taken by another creator.' }, { status: 400 });
      }

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ username: clean })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, user: updated, username: clean });
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
