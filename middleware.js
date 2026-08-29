import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const rawAppHost = (process.env.NEXT_PUBLIC_APP_HOST || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
const APP_HOSTS = new Set(
  [
    'localhost:3000',
    '127.0.0.1:3000',
    rawAppHost,
    process.env.VERCEL_URL?.toLowerCase(),
  ].filter(Boolean)
);

export async function middleware(request) {
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.toLowerCase().trim().replace(/\.$/, '');

  // In local/demo mode, or when the host is a known app host, skip custom domain lookup entirely.
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    APP_HOSTS.has(host) ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.vercel.app')
  ) {
    return NextResponse.next();
  }

  // Only bother looking this up for requests to the root of the custom
  // domain — a request to a real path (or a Next.js asset) should pass through.
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next();
  }

  try {
    // Call the secure RPC function resolve_custom_domain which returns only { username }
    // without exposing verification tokens or private columns.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/resolve_custom_domain`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_domain: host }),
      }
    );

    const rows = await res.json().catch(() => []);
    const username = rows?.[0]?.username;

    if (username) {
      return NextResponse.rewrite(new URL(`/${username}`, request.url));
    }
  } catch {
    // If the lookup fails, fall through to the normal 404 rather than breaking the request
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next's internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
