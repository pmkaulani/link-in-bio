import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

export const dynamic = 'force-dynamic';

// In-memory sliding-window rate limiter: IP -> [timestamps]
const reportRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REPORTS_PER_WINDOW = 5;

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (reportRateLimitMap.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    return true;
  }

  timestamps.push(now);
  reportRateLimitMap.set(ip, timestamps);
  return false;
}

export async function POST(req) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many report submissions. Please wait a minute before submitting again.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      reported_profile_id,
      reported_block_id,
      reporter_email,
      reason,
      details,
    } = body;

    if (!reported_profile_id || typeof reported_profile_id !== 'string' || !reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: reported_profile_id and reason are required.' },
        { status: 400 }
      );
    }

    // Determine priority based on reason
    let priority = 'normal';
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('phishing') || lowerReason.includes('scam') || lowerReason.includes('dangerous') || lowerReason.includes('malware')) {
      priority = 'urgent';
    } else if (lowerReason.includes('harassment') || lowerReason.includes('impersonation') || lowerReason.includes('copyright')) {
      priority = 'high';
    }

    const cleanReason = reason.slice(0, 100).trim();
    const cleanDetails = typeof details === 'string' ? details.slice(0, 2000).trim() : '';
    const cleanEmail = typeof reporter_email === 'string' && reporter_email.includes('@') ? reporter_email.slice(0, 150).trim() : null;

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reported_profile_id,
        reported_block_id: reported_block_id || null,
        reporter_email: cleanEmail,
        reason: cleanReason,
        details: cleanDetails,
        status: 'pending',
        priority,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Failed to record report.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (err) {
    console.error('Report submission error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
