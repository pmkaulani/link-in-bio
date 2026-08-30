export const QUEST_DEFS = [
  { id: 'first_link', title: 'Add your first link', description: 'Every page starts with one link.', href: '/dashboard' },
  { id: 'published', title: 'Publish it live', description: 'Your changes stay in draft until you post them.', href: '/dashboard' },
  { id: 'customize_style', title: 'Make it yours', description: 'Try a color, background, or atmosphere effect.', href: '/dashboard/theme' },
  { id: 'try_block_type', title: 'Add a different block', description: 'Links are just the start — try a heading, image, or grid.', href: '/dashboard' },
  { id: 'viewed_analytics', title: 'Check your analytics', description: 'See views and clicks once people visit your page.', href: '/dashboard/analytics' },
  { id: 'shared_page', title: 'Share your page', description: 'Copy your link or grab the QR code.', href: '/dashboard/profile' },
];

const DEFAULT_PRIMARY = '#000000';
const DEFAULT_BACKGROUND = '#FFFFFF';
const DEFAULT_BG_EFFECT = 'none';

export function getQuestStatus({ profile, blocks, flags = {}, hasUnpostedChanges = true }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const distinctTypes = new Set(safeBlocks.map((b) => b.type));

  const hasFirstLink = safeBlocks.some((b) => b.type === 'link' && (b.data?.url || b.data?.title));
  const hasPublished = Boolean(profile?.published_profile || profile?.published_at || (safeBlocks.length > 0 && !hasUnpostedChanges));
  const hasCustomized = Boolean(
    profile && (
      (profile.bg_effect && profile.bg_effect !== 'none') ||
      (profile.primary_color && profile.primary_color.toUpperCase() !== '#000000') ||
      (profile.background_value && profile.background_value.toUpperCase() !== '#FFFFFF') ||
      (profile.font_family && profile.font_family !== 'inter') ||
      (profile.theme && profile.theme !== 'growth' && profile.theme !== 'classic')
    )
  );
  const hasMultipleBlockTypes = distinctTypes.size >= 2;
  const hasViewedAnalytics = Boolean(flags.viewed_analytics || safeBlocks.length > 0);
  const hasSharedPage = Boolean(flags.shared_page || profile?.username);

  const done = {
    first_link: hasFirstLink,
    published: hasPublished,
    customize_style: hasCustomized,
    try_block_type: hasMultipleBlockTypes,
    viewed_analytics: hasViewedAnalytics,
    shared_page: hasSharedPage,
  };

  return QUEST_DEFS.map((q) => ({ ...q, done: Boolean(done[q.id]) }));
}

export function questProgress(quests) {
  const total = quests.length;
  const completed = quests.filter((q) => q.done).length;
  return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
