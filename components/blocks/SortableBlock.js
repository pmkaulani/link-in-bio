'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Link,
  Type,
  AlignLeft,
  Image,
  Video,
  Minus,
  ArrowUpDown,
  Clock,
  LayoutGrid,
  Megaphone,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import BlockEditor from './BlockEditor';

const TYPE_META = {
  link: { label: 'Link', icon: Link },
  heading: { label: 'Heading', icon: Type },
  text: { label: 'Text', icon: AlignLeft },
  callout: { label: 'Announcement', icon: Megaphone },
  image: { label: 'Image', icon: Image },
  video: { label: 'Video', icon: Video },
  divider: { label: 'Divider', icon: Minus },
  spacer: { label: 'Spacer', icon: ArrowUpDown },
  grid: { label: 'Post Grid', icon: LayoutGrid },
};

export default function SortableBlock({ block, isSelected, onSelect, onUpdate, onDelete, onToggleVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const blockRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const meta = TYPE_META[block.type] || { label: block.type, icon: Link };
  const TypeIcon = meta.icon;

  const { start_date, end_date } = block.data || {};
  const now = Date.now();
  const isScheduledFuture = start_date && now < new Date(start_date).getTime();
  const isScheduledPast = end_date && (
    end_date.includes('T')
      ? now > new Date(end_date).getTime()
      : now > new Date(end_date).getTime() + 86400000 - 1
  );

  const formatDateTime = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    if (val.includes('T')) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const scheduleLabel = isScheduledFuture
    ? `Starts ${formatDateTime(start_date)}`
    : isScheduledPast
      ? 'Schedule ended'
      : (start_date || end_date) ? 'Scheduled' : null;

  const isNewOrEmpty = block.type === 'link' ? !block.data?.url && !block.data?.title : (block.type === 'heading' || block.type === 'text') ? !block.data?.text : false;
  const [expanded, setExpanded] = useState(isNewOrEmpty || isSelected);

  // Sync expanded state when selected via 2-way visual preview
  useEffect(() => {
    if (isSelected) {
      setExpanded(true);
      if (blockRef.current) {
        blockRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isSelected]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        blockRef.current = node;
      }}
      style={style}
      className={`rounded-[12px] border bg-white transition-all ${
        isSelected
          ? 'border-black ring-2 ring-black/20 shadow-pop'
          : isDragging
          ? 'border-zinc-400 shadow-pop'
          : 'border-zinc-200'
      } ${block.is_visible === false ? 'opacity-60' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Reorder item"
          className="cursor-grab touch-none rounded-[6px] p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>

        {/* Title area */}
        <div
          onClick={() => {
            setExpanded(!expanded);
            if (onSelect) onSelect();
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[6px] py-1 hover:opacity-80"
          title="Click to edit block"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-zinc-100 text-black">
            <TypeIcon size={14} strokeWidth={2.25} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-black">
              {block.type === 'divider'
                ? meta.label
                : block.type === 'spacer'
                ? `Spacer · ${block.data?.height || 32}px`
                : block.type === 'grid'
                ? `Grid · ${(block.data?.items || []).length} posts`
                : (block.data?.title || block.data?.text || <span className="italic text-zinc-400">Untitled {meta.label}</span>)}
            </span>
            {block.type === 'link' && (
              <span className="block truncate text-[11px] text-zinc-400 font-medium">
                {block.data?.url ? block.data.url : block.data?.subtitle || 'Paste URL'}
              </span>
            )}
          </span>

          {scheduleLabel && (
            <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isScheduledPast ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-800'}`}>
              <Clock size={10} /> {scheduleLabel}
            </span>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={() => onToggleVisibility(block.id)}
          className={`rounded-full p-1.5 transition ${block.is_visible !== false ? 'text-zinc-400 hover:bg-zinc-100 hover:text-black' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
          title={block.is_visible !== false ? 'Visible (click to hide)' : 'Hidden (click to show)'}
        >
          {block.is_visible !== false ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>

        <button
          onClick={() => {
            setExpanded(!expanded);
            if (onSelect) onSelect();
          }}
          className={`flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-xs font-bold transition ${expanded ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}
        >
          <span>{expanded ? 'Done' : 'Edit'}</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <button
          onClick={() => onDelete(block.id)}
          className="rounded-full p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
          title="Delete block"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-zinc-200 px-4 py-4">
          <BlockEditor block={block} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}
