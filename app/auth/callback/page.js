'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

function slugify(source) {
  return (source || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'user';
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.push('/login');
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;

        // 1. Check for URL error params from OAuth provider
        const oauthError = searchParams.get('error_description') || searchParams.get('error');
        if (oauthError) {
          setError(`Sign in failed: ${oauthError}`);
          setTimeout(() => router.push('/login'), 2500);
          return;
        }

        let session = null;

        // 2. If PKCE ?code= is present in URL query params, exchange it
        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.warn('[auth/callback] Code exchange warning:', exchangeErr.message);
          }
          if (exchangeData?.session) {
            session = exchangeData.session;
          }
        }

        // 3. Fallback to getSession()
        if (!session) {
          const { data: sessionData } = await supabase.auth.getSession();
          session = sessionData?.session;
        }

        // 4. Poll briefly for implicit hash token if needed
        if (!session) {
          for (let i = 0; i < 15; i++) {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              session = data.session;
              break;
            }
            await new Promise((r) => setTimeout(r, 150));
          }
        }

        if (cancelled) return;

        if (!session) {
          setError('Could not complete sign-in. Please try again.');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        const user = session.user;

        // 5. Check if existing profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          router.push(existingProfile.onboarded ? '/dashboard' : '/onboarding');
          return;
        }

        // 6. First time signing in with Google — create initial starter profile
        const base = slugify(user.email?.split('@')[0] || user.user_metadata?.full_name);
        let username = base;
        let profileCreated = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          const { error: err } = await supabase.from('profiles').insert({
            id: user.id,
            username,
            display_name: user.user_metadata?.full_name || base,
            avatar_url: user.user_metadata?.avatar_url || '',
            theme: 'growth',
            onboarded: true,
          });

          if (!err) {
            profileCreated = true;
            break;
          }
          username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Even if insert had a non-fatal warning, proceed to dashboard
        router.push('/dashboard');
      } catch (err) {
        console.error('[auth/callback] Unexpected error:', err);
        setError('Sign in encountered an issue. Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white px-6 text-center">
      <div className="flex flex-col items-center gap-4 animate-profile-in">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Authentication</p>
          <p className="text-xs font-semibold text-zinc-200">{error || 'Completing sign in...'}</p>
        </div>
      </div>
    </main>
  );
}
