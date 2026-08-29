import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin.js';
import { isLocalMode } from '../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

// In-memory sliding-window rate limiter: IP / token -> [timestamps]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 40;

function isRateLimited(identifier) {
  if (!identifier) return false;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(identifier) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_EVENTS_PER_WINDOW) {
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(identifier, timestamps);

  // Periodic cleanup of stale rate-limit keys
  if (rateLimitMap.size > 10000) {
    for (const [key, list] of rateLimitMap.entries()) {
      if (list.length === 0 || list[list.length - 1] < windowStart) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

export async function POST(req) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const body = await req.json().catch(() => ({}));
    const { profile_id, block_id, event_type, client_token, referrer, device_type } = body;

    // 1. Validate required fields
    if (!profile_id || typeof profile_id !== 'string') {
      return NextResponse.json({ error: 'Valid profile_id is required.' }, { status: 400 });
    }

    if (event_type !== 'view' && event_type !== 'click') {
      return NextResponse.json({ error: 'event_type must be "view" or "click".' }, { status: 400 });
    }

    // 2. Enforce rate limits (by IP and client_token)
    const rateLimitKey = `${clientIp}:${client_token || 'notoken'}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Too many analytics events.' }, { status: 429 });
    }

    const supabase = createAdminClient();

    // 3. Verify target profile exists and is active
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, account_status, publication_status')
      .eq('id', profile_id)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Target profile not found.' }, { status: 404 });
    }

    if (profile.account_status === 'suspended' || profile.account_status === 'banned') {
      return NextResponse.json({ error: 'Profile is not active.' }, { status: 403 });
    }

    // 4. If block_id is provided, verify it belongs to this profile and is not disabled
    if (block_id) {
      if (typeof block_id !== 'string') {
        return NextResponse.json({ error: 'Invalid block_id format.' }, { status: 400 });
      }

      const { data: block, error: blockErr } = await supabase
        .from('blocks')
        .select('id, profile_id, is_disabled')
        .eq('id', block_id)
        .maybeSingle();

      if (blockErr || !block) {
        return NextResponse.json({ error: 'Target block not found.' }, { status: 404 });
      }

      if (block.profile_id !== profile_id) {
        return NextResponse.json({ error: 'Integrity error: block_id does not belong to profile_id.' }, { status: 400 });
      }

      if (block.is_disabled) {
        return NextResponse.json({ error: 'Block is moderated/disabled.' }, { status: 403 });
      }
    }

    // 5. Sanitize metadata
    const cleanReferrer = typeof referrer === 'string' ? referrer.slice(0, 100).trim() : 'direct';
    const cleanDevice = ['mobile', 'desktop', 'tablet'].includes(device_type) ? device_type : 'desktop';
    const cleanToken = typeof client_token === 'string' ? client_token.slice(0, 100) : null;

    // 6. Record analytics event using service role client
    const { error: insertErr } = await supabase.from('analytics_events').insert({
      profile_id,
      block_id: block_id || null,
      event_type,
      client_token: cleanToken,
      referrer: cleanReferrer,
      device_type: cleanDevice,
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('Analytics insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to record event.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Analytics endpoint error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
