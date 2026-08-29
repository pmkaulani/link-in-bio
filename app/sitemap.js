import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_HOST ? `https://${process.env.NEXT_PUBLIC_APP_HOST}` : 'http://localhost:3000';

  const staticRoutes = ['', '/login', '/signup', '/terms', '/privacy'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  if (!isSupabaseConfigured) return staticRoutes;

  // Only index published, active profiles.
  // Draft, unlisted, and suspended profiles must NOT appear in the sitemap.
  // Cap to prevent unbounded sitemap files — switch to sitemap index past a few thousand.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at, publication_status, account_status')
    .eq('onboarded', true)
    .eq('publication_status', 'published')
    .in('account_status', ['active', 'warning'])
    .order('updated_at', { ascending: false })
    .limit(1000);

  const profileRoutes = (profiles || []).map((p) => ({
    url: `${base}/${p.username}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
  }));

  return [...staticRoutes, ...profileRoutes];
}
