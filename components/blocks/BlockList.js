'use client';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Plus,
  Link,
  Type,
  AlignLeft,
  Image,
  Video,
  Minus,
  ArrowUpDown,
  LayoutGrid,
  Megaphone,
} from 'lucide-react';
import SortableBlock from './SortableBlock';
import SocialIconsManager from './SocialIconsManager';
import AddBlockModal from './AddBlockModal';
import { ICONS } from '../../lib/icons';
import { QUICK_SOCIALS } from '../../lib/presets';
import { useDashboard } from '../../app/dashboard/DashboardContext';

const BLOCK_TYPES = [
  { type: 'link', label: 'Link', icon: Link, description: 'URL, icon, and custom styling' },
  { type: 'heading', label: 'Heading', icon: Type, description: 'Section title' },
  { type: 'text', label: 'Text', icon: AlignLeft, description: 'Paragraph or bio note' },
  { type: 'callout', label: 'Announcement', icon: Megaphone, description: 'Highlighted notice or alert' },
  { type: 'image', label: 'Image', icon: Image, description: 'Photo or banner graphic' },
  { type: 'video', label: 'Video', icon: Video, description: 'YouTube or Vimeo embed' },
  { type: 'grid', label: 'Post Grid', icon: LayoutGrid, description: 'Multi-post thumbnail grid' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Visual line or dotted rule' },
  { type: 'spacer', label: 'Spacer', icon: ArrowUpDown, description: 'Adjustable empty space' },
];

const PLATFORM_DESCRIPTIONS = {
  instagram: [
    { title: 'Daily Stories & Photos', subtitle: 'Instagram' },
    { title: 'Creative Photography', subtitle: 'Instagram' },
    { title: 'Reels & Short Clips', subtitle: 'Instagram' },
    { title: 'Curated Lookbook', subtitle: 'Instagram Shop' },
  ],
  youtube: [
    { title: 'Watch My Latest Video', subtitle: 'YouTube' },
    { title: 'Weekly Tech & UI Tutorials', subtitle: 'YouTube Channel' },
    { title: 'Quick Tips & Breakdown', subtitle: 'YouTube Shorts' },
    { title: 'Live Stream & Community', subtitle: 'YouTube Live' },
  ],
  spotify: [
    { title: 'Stream Latest Single & EP', subtitle: 'Spotify' },
    { title: 'Curated Mood Playlist', subtitle: 'Spotify' },
    { title: 'Listen to New Podcast', subtitle: 'Spotify' },
  ],
  tiktok: [
    { title: 'Daily Trends & Quick Clips', subtitle: 'TikTok' },
    { title: 'Behind The Scenes', subtitle: 'TikTok' },
    { title: 'Viral Moments & Bloopers', subtitle: 'TikTok' },
  ],
  twitter: [
    { title: 'Tech Threads & Insights', subtitle: 'X (Twitter)' },
    { title: 'Join the Discussion', subtitle: 'X (Twitter)' },
  ],
  store: [
    { title: 'Shop Merch & Digital Goods', subtitle: 'Official Store' },
    { title: 'Limited Edition Collection', subtitle: 'Store' },
    { title: 'Exclusive Promo Offer', subtitle: 'Store' },
  ],
  discord: [
    { title: 'Join Creator Community', subtitle: 'Discord Server' },
    { title: 'VIP Lounge & Hangout', subtitle: 'Discord' },
  ],
  github: [
    { title: 'Open Source Repos & Code', subtitle: 'GitHub' },
    { title: 'Featured Developer Tools', subtitle: 'GitHub' },
  ],
  twitch: [
    { title: 'Watch Live Creative Streams', subtitle: 'Twitch' },
    { title: 'Live Gaming & Community', subtitle: 'Twitch' },
  ],
  telegram: [
    { title: 'Direct Broadcasts & Alerts', subtitle: 'Telegram Channel' },
  ],
  globe: [
    { title: 'Interactive Portfolio', subtitle: 'Official Website' },
    { title: 'Read Weekly Newsletter', subtitle: 'Substack / Blog' },
  ],
  email: [
    { title: 'Book Inquiries & Collabs', subtitle: 'Direct Email' },
  ],
};

export default function BlockList({ blocks, onAdd, onUpdate, onDelete, onToggleVisibility, onReorder }) {
  const { selectedBlockId, setSelectedBlockId } = useDashboard();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i }));
    onReorder(newBlocks);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Persistent Social Media Icons (Telegram, Facebook, Instagram, etc.) */}
      <SocialIconsManager />

      {/* Primary Add Block Action Trigger (Top Placed) */}
      <div className="rounded-none border-y border-zinc-200 bg-white p-3">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] py-3 text-xs font-bold transition shadow-xs bg-black text-white hover:bg-zinc-800 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add new block or link</span>
        </button>
      </div>

      {/* Guided Assistant Modal */}
      <AddBlockModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={onAdd}
      />

      {/* Quick-add socials & platforms */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Quick Add Link Cards</h2>
          <span className="text-[10px] text-zinc-400">Click to add formatted link</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {QUICK_SOCIALS.map((social) => {
            const meta = ICONS[social.icon] || { className: 'fa-solid fa-link', color: '#000000' };
            const existingCount = blocks.filter((b) => b.type === 'link' && b.data?.icon === social.icon).length;
            const presets = PLATFORM_DESCRIPTIONS[social.icon] || [{ title: social.title, subtitle: `Visit my ${social.title}` }];
            const preset = presets[existingCount % presets.length];

            return (
              <button
                key={social.icon}
                type="button"
                onClick={() =>
                  onAdd('link', {
                    title: preset.title,
                    subtitle: preset.subtitle,
                    icon: social.icon,
                    url: social.urlPrefix,
                  })
                }
                className="group flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs transition hover:border-black hover:bg-zinc-50 hover:text-black active:scale-95"
                title={`Click to add ${preset.title}: "${preset.subtitle}"`}
              >
                <i className={meta.className} style={{ color: meta.color }} />
                <span>{social.title}</span>
                {existingCount > 0 && (
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-black">
                    +{existingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Link list with drag-and-drop */}
      {blocks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onToggleVisibility={onToggleVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-none border-y border-dashed border-zinc-200 bg-zinc-50/80 py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-black">
            <Plus size={20} />
          </div>
          <p className="text-sm font-bold text-black">No links or content yet</p>
          <p className="text-xs text-zinc-500">Click &ldquo;Add new block or link&rdquo; above to start building your page.</p>
        </div>
      )}
    </div>
  );
}
