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
      // supabase-js auto-exchanges the ?code=... in the URL for a session
      // on load (detectSessionInUrl). Poll briefly for that to land.
      let session = null;
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) { session = data.session; break; }
        await new Promise((r) => setTimeout(r, 150));
      }

      if (cancelled) return;

      if (!session) {
        setError('Could not complete sign-in. Please try again.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      const user = session.user;
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, onboarded')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        router.push(existingProfile.onboarded ? '/dashboard' : '/onboarding');
        return;
      }

      // First time signing in with Google — create a starter profile.
      const base = slugify(user.email?.split('@')[0] || user.user_metadata?.full_name);
      let username = base;
      let insertError = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { error: err } = await supabase.from('profiles').insert({
          id: user.id,
          username,
          display_name: user.user_metadata?.full_name || base,
          avatar_url: user.user_metadata?.avatar_url || '',
          theme: 'growth',
          onboarded: false,
        });
        if (!err) { insertError = null; break; }
        insertError = err;
        username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (insertError) {
        setError('Could not finish setting up your account. Please try again.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      router.push('/onboarding');
    }

    run();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6FAF8] px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />
        <p className="text-sm text-brand-900/50">{error || 'Signing you in...'}</p>
      </div>
    </main>
  );
}
