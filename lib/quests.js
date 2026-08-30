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

  const done = {
    first_link: safeBlocks.some((b) => b.type === 'link' && b.data?.url),
    // A fresh onboarding account auto-publishes on its first dashboard load,
    // so this shouldn't require a redundant manual "Post changes" click.
    published: Boolean(flags.published) || (safeBlocks.length > 0 && hasUnpostedChanges === false),
    customize_style: Boolean(
      profile &&
      (profile.bg_effect && profile.bg_effect !== DEFAULT_BG_EFFECT ||
        profile.primary_color && profile.primary_color.toUpperCase() !== DEFAULT_PRIMARY ||
        profile.background_value && profile.background_value.toUpperCase() !== DEFAULT_BACKGROUND)
    ),
    try_block_type: distinctTypes.size >= 2,
    viewed_analytics: Boolean(flags.viewed_analytics),
    shared_page: Boolean(flags.shared_page),
  };

  return QUEST_DEFS.map((q) => ({ ...q, done: Boolean(done[q.id]) }));
}

export function questProgress(quests) {
  const total = quests.length;
  const completed = quests.filter((q) => q.done).length;
  return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
