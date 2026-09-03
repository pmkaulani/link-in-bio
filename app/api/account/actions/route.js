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

      // Enforce limit of 2 username changes every 2 weeks (14 days)
      const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      let rawTimestamps = Array.isArray(currentProfile?.socials?._handle_change_timestamps)
        ? currentProfile.socials._handle_change_timestamps
        : [];

      // Fallback: if array is empty but _handle_changed_at exists, seed it
      if (rawTimestamps.length === 0 && (currentProfile?.socials?._handle_changed_at || currentProfile?.username_changed_at)) {
        const singleChange = new Date(currentProfile?.socials?._handle_changed_at || currentProfile?.username_changed_at).getTime();
        if (!isNaN(singleChange)) {
          rawTimestamps = [singleChange];
        }
      }

      // Filter to changes made within the active 14-day rolling window
      const recentChanges = rawTimestamps
        .map((t) => (typeof t === 'string' ? new Date(t).getTime() : Number(t)))
        .filter((t) => !isNaN(t) && now - t < FOURTEEN_DAYS_MS)
        .sort((a, b) => a - b); // oldest first

      const MAX_CHANGES = 2;
      if (recentChanges.length >= MAX_CHANGES) {
        const oldestChange = recentChanges[0];
        const resetsAt = oldestChange + FOURTEEN_DAYS_MS;
        const msRemaining = Math.max(0, resetsAt - now);
        const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let timeStr = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
        if (daysRemaining === 0) {
          timeStr = `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`;
        } else if (hoursRemaining > 0) {
          timeStr = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} and ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`;
        }

        return NextResponse.json(
          {
            error: `Handle changes are limited to 2 times every 2 weeks to prevent broken links and impersonation. You have used your 2 changes and can change your handle again in ${timeStr}.`,
          },
          { status: 429 }
        );
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
        _handle_changed_at: new Date(now).toISOString(),
        _handle_change_timestamps: [...recentChanges, now],
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

    // 6. Record/Heartbeat Device Session
    if (action === 'record_session') {
      const { deviceId, device, browser, userAgent } = body;
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('socials')
        .eq('id', userId)
        .maybeSingle();

      const now = new Date().toISOString();
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'Current Network';

      let existingSessions = Array.isArray(currentProfile?.socials?._active_sessions)
        ? [...currentProfile.socials._active_sessions]
        : [];

      const targetId = deviceId || 'sess-' + Math.random().toString(36).slice(2, 10);
      const existingIdx = existingSessions.findIndex((s) => s.id === targetId);

      const sessionItem = {
        id: targetId,
        device: device || 'Unknown Device',
        browser: browser || 'Web Browser',
        lastActive: now,
        ip,
        userAgent: userAgent || '',
      };

      if (existingIdx >= 0) {
        existingSessions[existingIdx] = {
          ...existingSessions[existingIdx],
          ...sessionItem,
        };
      } else {
        existingSessions.unshift(sessionItem);
      }

      // Filter out sessions older than 30 days and keep top 10
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      existingSessions = existingSessions
        .filter((s) => !s.lastActive || new Date(s.lastActive).getTime() > thirtyDaysAgo)
        .slice(0, 10);

      const updatedSocials = {
        ...(currentProfile?.socials || {}),
        _active_sessions: existingSessions,
      };

      await supabase.from('profiles').update({ socials: updatedSocials }).eq('id', userId);
      return NextResponse.json({ success: true, sessions: existingSessions, currentDeviceId: targetId });
    }

    // 7. Get Active Sessions
    if (action === 'get_sessions') {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('socials')
        .eq('id', userId)
        .maybeSingle();

      const sessions = Array.isArray(currentProfile?.socials?._active_sessions)
        ? currentProfile.socials._active_sessions
        : [];

      return NextResponse.json({ success: true, sessions });
    }

    // 8. Revoke Active Session
    if (action === 'revoke_session') {
      const { sessionId } = body;
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('socials')
        .eq('id', userId)
        .maybeSingle();

      let existingSessions = Array.isArray(currentProfile?.socials?._active_sessions)
        ? [...currentProfile.socials._active_sessions]
        : [];

      existingSessions = existingSessions.filter((s) => s.id !== sessionId);

      const updatedSocials = {
        ...(currentProfile?.socials || {}),
        _active_sessions: existingSessions,
      };

      await supabase.from('profiles').update({ socials: updatedSocials }).eq('id', userId);
      return NextResponse.json({ success: true, sessions: existingSessions, message: 'Session revoked successfully.' });
    }

    // 9. Sign Out Everywhere
    if (action === 'sign_out_everywhere') {
      if (!isLocalMode) {
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (_) {}
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('socials')
        .eq('id', userId)
        .maybeSingle();

      const updatedSocials = {
        ...(currentProfile?.socials || {}),
        _active_sessions: [],
      };

      await supabase.from('profiles').update({ socials: updatedSocials }).eq('id', userId);
      return NextResponse.json({ success: true, message: 'All active sessions invalidated.' });
    }

    return NextResponse.json({ error: 'Unknown action requested.' }, { status: 400 });
  } catch (err) {
    console.error('Error handling account action:', err);
    return NextResponse.json({ error: err.message || 'Failed to perform account action.' }, { status: 500 });
  }
}
