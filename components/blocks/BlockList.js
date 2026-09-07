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
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="group flex flex-col items-center gap-2.5 w-full rounded-none border-y border-dashed border-zinc-200 bg-zinc-50/80 py-12 px-4 text-center transition hover:bg-zinc-100/90 hover:border-zinc-300 active:scale-[0.99] cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-zinc-200 text-black shadow-sm group-hover:bg-black group-hover:text-white group-hover:border-black group-hover:scale-105 transition duration-200">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-black group-hover:underline">No links or content yet</p>
            <p className="mt-0.5 text-xs text-zinc-500">Tap here or &ldquo;Add new block or link&rdquo; above to start building your page.</p>
          </div>
        </button>
      )}
    </div>
  );
}
