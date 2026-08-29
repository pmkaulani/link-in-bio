'use client';
import { useState } from 'react';
import { ICONS, ICON_KEYS } from '../../lib/icons';
import { ENTRANCE_ANIMATIONS as ANIMATIONS, HOVER_EFFECTS as HOVERS } from '../../lib/presets';
import { Image as ImageIcon, Clock, Plus, X } from 'lucide-react';
import CustomSelect from '../CustomSelect';

function Field({ label, children }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', maxLength }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
    />
  );
}

function Select({ value, onChange, options }) {
  return <CustomSelect value={value} onChange={onChange} options={options} />;
}

const COLOR_SWATCHES = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
  { label: 'Zinc', value: '#18181b' },
  { label: 'Slate', value: '#334155' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
];

const GRADIENT_SWATCHES = [
  { label: 'Midnight', value: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #7C3AED 100%)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 45%, #BE123C 100%)' },
  { label: 'Emerald', value: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #15803d 100%)' },
  { label: 'Purple', value: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)' },
  { label: 'Matcha', value: 'linear-gradient(135deg, #D8F3DC 0%, #B7E4C7 50%, #95D5B2 100%)' },
  { label: 'Dark Carbon', value: 'linear-gradient(135deg, #09090B 0%, #18181B 50%, #27272A 100%)' },
];

function ColorField({ value, onChange, defaultColor = '#000000' }) {
  const current = value || defaultColor;
  const hexValue = /^#[0-9A-Fa-f]{6}$/.test(current)
    ? current
    : current === '#000' || current === '#000000'
    ? '#000000'
    : current === '#fff' || current === '#ffffff'
    ? '#ffffff'
    : '#000000';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 shadow-xs overflow-hidden"
          title="Click to open color picker"
        >
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 h-12 w-12 cursor-pointer opacity-0"
          />
          <span className="h-full w-full" style={{ backgroundColor: current }} />
        </label>
        <input
          type="text"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-mono font-bold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            onClick={() => onChange(swatch.value)}
            title={swatch.label}
            className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 shrink-0 ${
              current.toLowerCase() === swatch.value.toLowerCase()
                ? 'ring-2 ring-black ring-offset-1 border-transparent scale-105'
                : 'border-zinc-300 hover:border-zinc-400'
            }`}
            style={{ backgroundColor: swatch.value }}
          />
        ))}
      </div>
    </div>
  );
}

// --- Per-type editors ---

function LinkEditor({ data, onUpdate }) {
  const TITLE_SUGGESTIONS = [
    'Watch Latest Video',
    'Photography Portfolio',
    'Stream New Music',
    'Shop Merch & Gear',
    'Open Source Projects',
    'Book a Strategy Call',
    'Read Weekly Newsletter',
    'Join VIP Community',
  ];

  const PLATFORM_SUGGESTIONS = [
    'Instagram',
    'YouTube',
    'Spotify',
    'TikTok',
    'GitHub',
    'X (Twitter)',
    'Discord',
    'Official Store',
    'Website',
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Field label="Link Title (Primary Content / Action)">
          <Input
            value={data.title}
            onChange={(v) => onUpdate({ title: v })}
            placeholder="e.g. Watch Latest Video or Photography Portfolio"
            maxLength={80}
          />
        </Field>
        <div className="mt-1 flex flex-wrap gap-1">
          {TITLE_SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate({ title: s })}
              className="rounded-[6px] bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 hover:bg-zinc-200"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Field label="Destination URL">
          <Input value={data.url} onChange={(v) => onUpdate({ url: v })} placeholder="https://..." type="url" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Platform / Subtitle (Secondary Label)">
          <Input
            value={data.subtitle}
            onChange={(v) => onUpdate({ subtitle: v })}
            placeholder="e.g. YouTube, Instagram, Spotify, or short note"
            maxLength={120}
          />
        </Field>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Quick platform / tags:</span>
          {PLATFORM_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onUpdate({ subtitle: s })}
              className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 shadow-xs hover:border-black hover:text-black"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <Field label="Icon">
        <Select
          value={data.icon || 'link'}
          onChange={(v) => onUpdate({ icon: v })}
          options={ICON_KEYS.map((k) => [k, ICONS[k].label])}
        />
      </Field>

      <Field label="Entrance animation">
        <Select value={data.animation || 'slideUp'} onChange={(v) => onUpdate({ animation: v })} options={ANIMATIONS} />
      </Field>

      <Field label="Hover effect">
        <Select value={data.hover_effect || 'lift'} onChange={(v) => onUpdate({ hover_effect: v })} options={HOVERS} />
      </Field>

      <Field label="Link Card Background">
        <Select
          value={data.background_type || 'solid'}
          onChange={(v) => onUpdate({ background_type: v })}
          options={[['solid', 'Solid Color'], ['gradient', 'Gradient'], ['transparent', 'Transparent'], ['image', 'Custom Image']]}
        />
      </Field>

      {data.background_type === 'solid' && (
        <Field label="Card Background Color">
          <ColorField
            value={data.background_value || '#000000'}
            onChange={(v) => onUpdate({ background_value: v })}
            defaultColor="#000000"
          />
        </Field>
      )}

      {data.background_type === 'gradient' && (
        <div className="space-y-2">
          <Field label="Card Gradient Style">
            <Input
              value={data.background_value || GRADIENT_SWATCHES[0].value}
              onChange={(v) => onUpdate({ background_value: v })}
              placeholder="linear-gradient(...)"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {GRADIENT_SWATCHES.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => onUpdate({ background_value: g.value })}
                title={g.label}
                className="h-6 px-2.5 rounded-[6px] text-[10px] font-bold text-white shadow-2xs hover:opacity-90 transition border border-white/20"
                style={{ background: g.value }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.background_type === 'image' && (
        <Field label="Card Background Image URL">
          <Input
            value={data.background_value || ''}
            onChange={(v) => onUpdate({ background_value: v })}
            placeholder="https://images.unsplash.com/..."
            type="url"
          />
        </Field>
      )}

      <Field label="Text & Icon Color">
        <ColorField
          value={data.text_color || '#ffffff'}
          onChange={(v) => onUpdate({ text_color: v })}
          defaultColor="#ffffff"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Thumbnail image (replaces icon)">
          <div className="flex items-center gap-3">
            {data.thumbnail_url ? (
              <img src={data.thumbnail_url} alt="" className="h-11 w-11 shrink-0 rounded-[6px] object-cover" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] bg-zinc-100 text-zinc-400">
                <ImageIcon size={16} />
              </div>
            )}
            <Input value={data.thumbnail_url} onChange={(v) => onUpdate({ thumbnail_url: v })} placeholder="https://... image URL" type="url" />
          </div>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-800 cursor-pointer">
          <input
            type="checkbox"
            checked={data.is_featured || false}
            onChange={(e) => onUpdate({ is_featured: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 accent-black focus:ring-black cursor-pointer"
          />
          Featured link (highlighted on public page)
        </label>
      </div>
    </div>
  );
}

function HeadingEditor({ data, onUpdate }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Heading text">
        <Input value={data.text} onChange={(v) => onUpdate({ text: v })} placeholder="Section title" />
      </Field>
      <Field label="Size">
        <Select
          value={data.size || 'lg'}
          onChange={(v) => onUpdate({ size: v })}
          options={[['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra Large']]}
        />
      </Field>
    </div>
  );
}

function TextEditor({ data, onUpdate }) {
  return (
    <Field label="Text content">
      <textarea
        value={data.text || ''}
        onChange={(e) => onUpdate({ text: e.target.value })}
        rows={3}
        className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
        placeholder="Write something..."
      />
    </Field>
  );
}

function CalloutEditor({ data, onUpdate }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <Field label="Announcement / Callout Message">
        <textarea
          value={data.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
          placeholder="e.g. 🔥 New merch drop live this Friday at 6 PM!"
        />
      </Field>
    </div>
  );
}

function ImageEditor({ data, onUpdate }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <Field label="Image URL">
        <Input value={data.url} onChange={(v) => onUpdate({ url: v })} placeholder="https://..." type="url" />
      </Field>
      <Field label="Alt text">
        <Input value={data.alt} onChange={(v) => onUpdate({ alt: v })} placeholder="Description" />
      </Field>
      <Field label="Caption (optional)">
        <Input value={data.caption} onChange={(v) => onUpdate({ caption: v })} placeholder="Photo caption" />
      </Field>
    </div>
  );
}

function VideoEditor({ data, onUpdate }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Video URL">
        <Input value={data.url} onChange={(v) => onUpdate({ url: v })} placeholder="https://youtube.com/watch?v=..." type="url" />
      </Field>
      <Field label="Provider">
        <Select
          value={data.provider || 'youtube'}
          onChange={(v) => onUpdate({ provider: v })}
          options={[['youtube', 'YouTube'], ['vimeo', 'Vimeo'], ['other', 'Other']]}
        />
      </Field>
    </div>
  );
}

function DividerEditor({ data, onUpdate }) {
  return (
    <Field label="Style">
      <Select
        value={data.style || 'line'}
        onChange={(v) => onUpdate({ style: v })}
        options={[['line', 'Line'], ['dots', 'Dots'], ['dashed', 'Dashed'], ['fade', 'Fade']]}
      />
    </Field>
  );
}

function SpacerEditor({ data, onUpdate }) {
  return (
    <Field label={`Height: ${data.height || 32}px`}>
      <input
        type="range"
        min="8"
        max="96"
        value={data.height || 32}
        onChange={(e) => onUpdate({ height: Number(e.target.value) })}
        className="brand-range w-full"
        style={{ '--range-fill': `${((data.height || 32) - 8) / (96 - 8) * 100}%` }}
      />
    </Field>
  );
}

function GridEditor({ data, onUpdate }) {
  const items = data.items || [];

  function updateItem(i, patch) {
    const next = items.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
    onUpdate({ items: next });
  }

  function addItem() {
    onUpdate({ items: [...items, { thumbnail_url: '', link_url: '' }] });
  }

  function removeItem(i) {
    onUpdate({ items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Post Grid Items</span>
          <span className="text-[11px] text-zinc-400">Paste thumbnails & destination post links</span>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="" className="h-9 w-9 shrink-0 rounded-[6px] object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-zinc-100 text-zinc-400">
                  <ImageIcon size={14} />
                </div>
              )}
              <input
                value={item.thumbnail_url || ''}
                onChange={(e) => updateItem(i, { thumbnail_url: e.target.value })}
                placeholder="Thumbnail image URL"
                className="min-w-0 flex-1 rounded-[8px] border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
              <input
                value={item.link_url || ''}
                onChange={(e) => updateItem(i, { link_url: e.target.value })}
                placeholder="Post destination link"
                className="min-w-0 flex-1 rounded-[8px] border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-black focus:border-black focus:outline-none"
              />
              <button type="button" onClick={() => removeItem(i)} className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
        >
          <Plus size={13} /> Add post
        </button>
      </div>
    </div>
  );
}

function ScheduleFields({ data, onUpdate }) {
  const hasSchedule = Boolean(data.start_date || data.end_date);
  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        <Clock size={13} />
        Schedule (optional)
      </label>
      <p className="mt-1 text-[11px] text-zinc-400">Automatically show or hide this link at specific times.</p>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Show from (date & time)">
          <Input type="datetime-local" value={data.start_date} onChange={(v) => onUpdate({ start_date: v })} />
        </Field>
        <Field label="Show until (date & time)">
          <Input type="datetime-local" value={data.end_date} onChange={(v) => onUpdate({ end_date: v })} />
        </Field>
      </div>
      {hasSchedule && (
        <button
          type="button"
          onClick={() => onUpdate({ start_date: '', end_date: '' })}
          className="mt-2 text-[11px] font-bold text-black hover:underline"
        >
          Clear schedule
        </button>
      )}
    </div>
  );
}

// --- Main BlockEditor ---

const EDITORS = {
  link: LinkEditor,
  heading: HeadingEditor,
  text: TextEditor,
  callout: CalloutEditor,
  image: ImageEditor,
  video: VideoEditor,
  divider: DividerEditor,
  spacer: SpacerEditor,
  grid: GridEditor,
};

export default function BlockEditor({ block, onUpdate }) {
  const Editor = EDITORS[block.type];
  const data = block.data || {};
  const update = (patch) => onUpdate(block.id, patch);

  if (!Editor) {
    return <p className="text-xs text-zinc-400">No editor for block type "{block.type}"</p>;
  }

  return (
    <div>
      <Editor data={data} onUpdate={update} />
      {block.type !== 'divider' && block.type !== 'spacer' && (
        <ScheduleFields data={data} onUpdate={update} />
      )}
    </div>
  );
}
