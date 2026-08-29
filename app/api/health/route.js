import { NextResponse } from 'next/server';
import { isLocalMode, isSupabaseConfigured } from '../../../lib/supabase';

/**
 * Public health probe — returns operational status without leaking secrets,
 * connection strings, or internal infrastructure details.
 * Suitable for uptime monitoring services and load balancer probes.
 */
export async function GET() {
  const status = {
    status: 'ok',
    mode: isLocalMode ? 'demo' : 'connected',
    supabase: isSupabaseConfigured ? 'configured' : 'unconfigured',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(status, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
