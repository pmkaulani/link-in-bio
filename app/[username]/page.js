import { supabase, isLocalMode } from '../../lib/supabase';
import PublicProfile from '../../components/themes/PublicProfile';
import LocalPublicPage from '../../components/LocalPublicPage';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeUsernameParam(username) {
  const value = Array.isArray(username) ? username[0] : username;
  const raw = String(value || '').trim();
  try {
    return decodeURIComponent(raw).replace(/^@/, '').toLowerCase();
  } catch (_) {
    return raw.replace(/^@/, '').toLowerCase();
  }
}

async function getProfile(username) {
  const cleanUsername = normalizeUsernameParam(username);
  if (!cleanUsername) return null;
  if (isLocalMode) return null;

  // 1. Primary exact match with select('*')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (data) return data;

  // 2. Case-insensitive fallback
  const { data: ilikeData, error: ilikeError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (ilikeData) return ilikeData;

  if (error || ilikeError) {
    console.error('[PublicPage] getProfile error:', error?.message || ilikeError?.message);
  }
  return null;
}

export async function generateMetadata({ params }) {
  if (isLocalMode) return { title: 'LinkBio' };

  const profile = await getProfile(params.username);
  if (!profile) return { title: 'Page not found — LinkBio' };

  // Gate: only truly suspended or banned profiles return a generic 'not found' metadata
  const acctStatus = profile.account_status || 'active';
  const pubStatus = profile.publication_status || 'published';
  if (pubStatus === 'suspended' || acctStatus === 'suspended' || acctStatus === 'banned') {
    return { title: 'Page not found — LinkBio' };
  }

  const name = profile.display_name || profile.username;
  const description = profile.bio?.slice(0, 160) || `Check out @${profile.username} on LinkBio. All links, socials, and content in one place.`;
  const images = profile.avatar_url ? [{ url: profile.avatar_url, width: 400, height: 400, alt: name }] : [];

  // Unlisted profiles should not be indexed by search engines
  const shouldIndex = status === 'published';

  return {
    title: `${name} (@${profile.username})`,
    description,
    alternates: {
      canonical: `/${profile.username}`,
    },
    openGraph: {
      title: `${name} (@${profile.username})`,
      description,
      images,
      type: 'profile',
      username: profile.username,
      siteName: 'LinkBio',
    },
    twitter: {
      card: 'summary',
      title: `${name} (@${profile.username})`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
      googleBot: {
        index: shouldIndex,
        follow: shouldIndex,
        'max-image-preview': shouldIndex ? 'large' : 'none',
      },
    },
  };
}

export default async function PublicPage({ params }) {
  // In local demo mode, delegate to a client component that reads localStorage
  if (isLocalMode) {
    return <LocalPublicPage username={params.username} />;
  }

  const profile = await getProfile(params.username);
  if (!profile) return notFound();

  // Gate: Suspended/banned profiles return 404 to prevent public access.
  const pubStatus = profile.publication_status || 'published';
  const acctStatus = profile.account_status || 'active';
  if (pubStatus === 'suspended' || acctStatus === 'suspended' || acctStatus === 'banned') {
    return notFound();
  }

  // Use published snapshot for public visitors, or fallback to live profile/blocks
  const effectiveProfile = profile.published_profile || profile;
  let finalBlocks = [];

  if (Array.isArray(profile.published_blocks) && profile.published_blocks.length > 0) {
    finalBlocks = profile.published_blocks;
  } else {
    const { data: dbBlocks } = await supabase
      .from('blocks')
      .select('id, profile_id, type, data, position, is_visible, is_disabled')
      .eq('profile_id', profile.id)
      .order('position');
    finalBlocks = dbBlocks || [];
  }

  // Server-side filtering: only show visible, non-disabled blocks to public visitors.
  finalBlocks = finalBlocks.filter((b) => b.is_visible !== false && b.is_disabled !== true);

  // Legacy fallback: only hit the old `links` table if this account predates the
  // block system and has never gained any blocks.
  if (finalBlocks.length === 0) {
    const { data: links } = await supabase.from('links').select('*').eq('profile_id', profile.id).order('position');
    if (links && links.length > 0) {
      finalBlocks = links.map((link) => ({
        id: link.id,
        type: 'link',
        position: link.position,
        is_visible: link.is_visible !== false,
        data: {
          title: link.title,
          subtitle: link.subtitle,
          url: link.url,
          icon: link.icon,
          animation: link.animation,
          hover_effect: link.hover_effect,
          background_type: link.background_type,
          background_value: link.background_value,
          is_featured: link.is_featured,
        },
      }));
    }
  }

  // Build structured data with safely serialised user-controlled strings.
  // JSON.stringify handles escaping for the JSON-LD context; we avoid embedding
  // raw HTML.  All values are plain strings from the DB, not user-supplied markup.
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: (profile.display_name || profile.username || '').slice(0, 200),
      alternateName: `@${(profile.username || '').slice(0, 30)}`,
      description: (profile.bio || '').slice(0, 300) || undefined,
      image: profile.avatar_url || undefined,
      url: `https://${process.env.NEXT_PUBLIC_APP_HOST || 'localhost:3000'}/${profile.username}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <PublicProfile
        profile={{
          ...effectiveProfile,
          // Always use live row values for trust & safety fields — never the stale snapshot
          account_status: profile.account_status || 'active',
          publication_status: profile.publication_status || 'published',
          is_verified: profile.is_verified ?? effectiveProfile.is_verified,
          socials: profile.socials ?? effectiveProfile.socials,
        }}
        blocks={finalBlocks}
      />
    </>
  );
}
