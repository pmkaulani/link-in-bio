'use client';
import { useEffect, useState } from 'react';
import PublicProfile from './themes/PublicProfile';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { supabase } from '../lib/supabase';

// In local demo mode, the server can't read localStorage, so the [username]
// page delegates to this client component which reads the local DB directly.
export default function LocalPublicPage({ username }) {
  const [profile, setProfile] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: found } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (!found) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Only render published state to public visitors
        const publishedProfile = found.published_profile || found;
        let publishedBlocks = found.published_blocks;

        if (publishedBlocks === undefined || publishedBlocks === null) {
          const { data: dbBlocks } = await supabase
            .from('blocks')
            .select('*')
            .eq('profile_id', found.id)
            .order('position');
          publishedBlocks = dbBlocks || [];
        }

        setProfile(publishedProfile);
        setBlocks(publishedBlocks);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setNotFound(true);
        setLoading(false);
      }
    }

    loadData();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-16 text-white">
        <div className="w-full max-w-[420px] flex flex-col items-center gap-6 animate-pulse">
          <div className="flex w-full items-center justify-between px-2 mb-2">
            <div className="h-5 w-24 rounded-md bg-zinc-800" />
            <div className="h-8 w-8 rounded-full bg-zinc-800" />
          </div>
          <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-xl" />
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="h-6 w-36 rounded-lg bg-zinc-800" />
            <div className="h-4 w-24 rounded-md bg-zinc-850" />
            <div className="h-3 w-64 rounded-md bg-zinc-900 mt-1" />
          </div>
          <div className="flex items-center gap-3 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full bg-zinc-850 border border-zinc-800" />
            ))}
          </div>
          <div className="flex w-full flex-col gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 w-full rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 rounded-sm bg-zinc-800" />
                    <div className="h-2 w-20 rounded-sm bg-zinc-850" />
                  </div>
                </div>
                <div className="h-4 w-4 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="h-8 w-44 rounded-full bg-zinc-900 border border-zinc-800 mt-4" />
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <Link href="/" className="mb-4">
          <BrandLogo size="md" variant="full" theme="light" />
        </Link>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 max-w-sm w-full shadow-2xl space-y-3">
          <h1 className="text-xl font-black tracking-tight text-white">Page not found</h1>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            There is no creator profile at <span className="font-mono text-zinc-300">/{username}</span>. The handle might be mistyped or does not exist yet.
          </p>
          <div className="pt-3 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full rounded-xl bg-white py-2.5 text-xs font-black text-black shadow-sm transition hover:bg-zinc-200 active:scale-95"
            >
              Go to homepage
            </Link>
            <Link
              href="/signup"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition"
            >
              Claim this handle
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <PublicProfile profile={profile} blocks={blocks} />;
}
