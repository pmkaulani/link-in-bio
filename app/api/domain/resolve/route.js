import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawDomain = searchParams.get('domain') || '';
    const domain = rawDomain.toLowerCase().trim().replace(/\.$/, '');

    if (!domain || domain.length > 253) {
      return NextResponse.json({ username: null });
    }

    const supabase = createAdminClient();

    // Call secure Postgres RPC function or join query via service role
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('resolve_custom_domain', {
      p_domain: domain,
    });

    if (!rpcErr && Array.isArray(rpcResult) && rpcResult.length > 0 && rpcResult[0]?.username) {
      return NextResponse.json({ username: rpcResult[0].username });
    }

    // Fallback: direct service-role check if RPC not registered in local mock
    const { data: customDomain } = await supabase
      .from('custom_domains')
      .select('username, verified, profile_id')
      .eq('domain', domain)
      .eq('verified', true)
      .maybeSingle();

    if (!customDomain?.username) {
      return NextResponse.json({ username: null });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, account_status, publication_status')
      .eq('id', customDomain.profile_id)
      .maybeSingle();

    if (
      profile &&
      profile.account_status !== 'suspended' &&
      profile.account_status !== 'banned' &&
      profile.publication_status !== 'draft' &&
      profile.publication_status !== 'suspended'
    ) {
      return NextResponse.json({ username: customDomain.username });
    }

    return NextResponse.json({ username: null });
  } catch (err) {
    console.error('Domain resolution error:', err);
    return NextResponse.json({ username: null });
  }
}
