'use client';
import { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  ShieldCheck,
  AlertCircle,
  Megaphone,
} from 'lucide-react';
import { ICONS } from '../../lib/icons';
import { safeColor, resolvePageTextColor } from '../../lib/publicProfileUtils';
import BackgroundEffects from '../themes/BackgroundEffects';
import BrandLogo from '../BrandLogo';
import { useDashboard } from '../../app/dashboard/DashboardContext';

const FONT_MAP = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  poppins: "'Poppins', sans-serif",
  outfit: "'Outfit', sans-serif",
  plus_jakarta: "'Plus Jakarta Sans', sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  lora: "'Lora', serif",
  syne: "'Syne', sans-serif",
  quicksand: "'Quicksand', sans-serif",
  jetbrains: "'JetBrains Mono', monospace",
  montserrat: "'Montserrat', sans-serif",
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  rounded: 'ui-rounded, "Trebuchet MS", Arial, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const ANIM_CLASSES = {
  none: '', fade: 'link-anim-fade', slideUp: 'link-anim-slide-up',
  slideLeft: 'link-anim-slide-left', zoom: 'link-anim-zoom',
  blur: 'link-anim-blur', bounce: 'link-anim-bounce',
};

const HOVER_CLASSES = {
  none: '', spotlight: 'link-hover-spotlight', border_beam: 'link-hover-border-beam',
  lift: 'link-hover-lift', glow: 'link-hover-glow', scale: 'link-hover-scale',
  shine: 'link-hover-shine', tilt: 'link-hover-tilt',
};

function getBackground(profile) {
  const type = profile?.background_type || 'solid';
  const value = profile?.background_value || '#FFFFFF';
  if (type === 'image' && value) {
    return { backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url("${value}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  if (type === 'solid') return { background: safeColor(value, '#FFFFFF') };
  if (type === 'gradient') return { background: value || 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #7c3aed 100%)' };
  return { background: '#FFFFFF' };
}

// --- Preview Block Renderers ---

function PreviewLink({ data, profile, isSelected }) {
  const primary = safeColor(profile?.primary_color, '#000000');
  const pageText = safeColor(profile?.text_color, '#000000');
  const buttonRadius = Number.isInteger(profile?.button_radius) ? profile.button_radius : 24;
  const buttonStyle = profile?.button_style || 'fill';
  const icon = ICONS[data.icon] || ICONS.link;
  const animation = ANIM_CLASSES[data.animation || 'none'] || '';
  const hover = HOVER_CLASSES[data.hover_effect || 'none'] || '';

  let linkBg = '#000000';
  let buttonText = '#ffffff';
  let extraClass = 'shadow-md border border-black/5';

  if (buttonStyle === 'outline') {
    linkBg = 'transparent';
    buttonText = pageText;
    extraClass = `border-2 border-current hover:bg-white/10`;
  } else if (buttonStyle === 'glass') {
    linkBg = 'rgba(255, 255, 255, 0.15)';
    buttonText = pageText;
    extraClass = 'border border-white/30 backdrop-blur-md shadow-lg hover:bg-white/25';
  } else if (buttonStyle === 'hard_shadow') {
    linkBg = '#ffffff';
    buttonText = '#000000';
    extraClass = 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5';
  } else {
    linkBg = data.background_type === 'solid'
      ? safeColor(data.background_value, primary)
      : data.background_type === 'gradient'
        ? data.background_value || `linear-gradient(135deg, ${primary}, #000000)`
        : primary;

    const isLightButton = !data.background_type || (data.background_type === 'solid' && (data.background_value?.toLowerCase() === '#ffffff' || data.background_value?.toLowerCase().startsWith('#f')));
    buttonText = data.is_featured
      ? '#ffffff'
      : data.text_color
        ? safeColor(data.text_color, isLightButton ? '#000000' : '#ffffff')
        : (isLightButton ? '#000000' : '#ffffff');
    extraClass = 'shadow-lg hover:shadow-xl';
  }

  return (
    <div
      className={`group relative flex w-full items-center gap-3 overflow-hidden px-4 py-3.5 transition-all duration-200 ${extraClass} ${animation} ${hover}`}
      style={{ borderRadius: `${buttonRadius}px`, background: linkBg, color: buttonText }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5" style={{ color: data.is_featured ? '#ffffff' : icon.color }}>
        {data.thumbnail_url ? (
          <img src={data.thumbnail_url} alt="" className="h-full w-full object-cover rounded-full" />
        ) : (
          <i className={`${icon.className} text-lg`} />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-bold text-[14px]">{data.title || 'Untitled link'}</span>
        {data.subtitle && <span className="mt-0.5 block truncate text-[11px] opacity-65">{data.subtitle}</span>}
      </span>
      <span className="shrink-0 text-xs opacity-50">
        <i className="fa-solid fa-arrow-up-right-from-square" />
      </span>
    </div>
  );
}

function PreviewHeading({ data, profile }) {
  const text = resolvePageTextColor(profile);
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' };
  return (
    <h2 className={`font-extrabold ${sizes[data.size] || 'text-lg'} text-center tracking-tight my-0.5`} style={{ color: text }}>
      {data.text || 'Section Heading'}
    </h2>
  );
}

function PreviewText({ data, profile }) {
  const text = resolvePageTextColor(profile);
  return (
    <p className="text-xs font-medium leading-relaxed text-center opacity-85 my-0.5" style={{ color: text }}>
      {data.text || 'Text block content'}
    </p>
  );
}

function PreviewImage({ data, profile }) {
  const isLight = profile?.background_type === 'solid' || profile?.text_color === '#111827' || profile?.text_color === '#000000';
  if (!data.url) {
    return (
      <div
        className={`flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed transition ${
          isLight ? 'border-zinc-300 bg-zinc-100 text-zinc-600' : 'border-white/20 bg-white/10 text-white/70'
        }`}
      >
        <ImageIcon size={18} className="opacity-60" />
        <span className="text-[11px] font-semibold">Image placeholder</span>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl shadow-sm my-0.5">
      <img src={data.url} alt={data.alt || ''} className="w-full object-cover" style={{ maxHeight: 200 }} />
      {data.caption && <p className="mt-1 text-center text-[10px] opacity-70">{data.caption}</p>}
    </div>
  );
}

function PreviewVideo({ data, profile }) {
  const isLight = profile?.background_type === 'solid' || profile?.text_color === '#111827' || profile?.text_color === '#000000';
  const url = data.url || '';
  let embedUrl = '';
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  if (!embedUrl) {
    return (
      <div
        className={`flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed transition ${
          isLight ? 'border-zinc-300 bg-zinc-100 text-zinc-600' : 'border-white/20 bg-white/10 text-white/70'
        }`}
      >
        <VideoIcon size={18} className="opacity-60" />
        <span className="text-[11px] font-semibold">Video placeholder</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm my-0.5" style={{ aspectRatio: '16/9' }}>
      <iframe src={embedUrl} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );
}

function PreviewDivider({ data, profile }) {
  const text = resolvePageTextColor(profile || {});
  const styles = {
    line: { borderTop: `1px solid ${text}33` },
    dots: { borderTop: `2px dotted ${text}33` },
    dashed: { borderTop: `2px dashed ${text}33` },
    fade: { background: `linear-gradient(90deg, transparent, ${text}33, transparent)`, height: 1 },
  };
  return <div className="my-1.5 w-full" style={styles[data.style] || styles.line} />;
}

function PreviewSpacer({ data }) {
  return <div style={{ height: (data.height || 32) * 0.7 }} />;
}

function PreviewGrid({ data }) {
  const items = data.items || [];
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl my-0.5">
      {items.slice(0, 9).map((item, i) => (
        <div key={i} className="aspect-square bg-black/10 rounded-lg overflow-hidden">
          {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />}
        </div>
      ))}
    </div>
  );
}

function PreviewCallout({ data, profile }) {
  const primary = safeColor(profile?.primary_color, '#000000');
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold shadow-sm my-0.5 border"
      style={{
        backgroundColor: `${primary}12`,
        borderColor: `${primary}30`,
        color: resolvePageTextColor(profile),
      }}
    >
      <Megaphone size={16} className="shrink-0 opacity-80" />
      <span className="leading-snug">{data.text || 'Important notice or announcement'}</span>
    </div>
  );
}

function PreviewSocialsBar({ profile }) {
  if (!profile?.socials || typeof profile.socials !== 'object') return null;
  const list = Object.entries(profile.socials).filter(
    ([name, url]) => Boolean(!name.startsWith('_') && typeof url === 'string' && url.trim())
  );
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 my-1">
      {list.map(([name, url]) => {
        const icon = ICONS[name] || ICONS.link;
        return (
          <span
            key={name}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 border border-current/15 text-xs backdrop-blur-md shadow-xs"
          >
            <i className={icon.className} style={{ color: icon.color }} />
          </span>
        );
      })}
    </div>
  );
}

const RENDERERS = {
  link: PreviewLink,
  heading: PreviewHeading,
  text: PreviewText,
  image: PreviewImage,
  video: PreviewVideo,
  divider: PreviewDivider,
  spacer: PreviewSpacer,
  grid: PreviewGrid,
  callout: PreviewCallout,
  socials_bar: PreviewSocialsBar,
};

export default function LivePreview({ profile, blocks }) {
  const { selectedBlockId, setSelectedBlockId, saveStatus, saveErrorMsg } = useDashboard();
  const [copied, setCopied] = useState(false);

  const primary = safeColor(profile?.primary_color, '#000000');
  const text = resolvePageTextColor(profile);
  const font = FONT_MAP[profile?.font_family] || FONT_MAP.inter;
  const visibleBlocks = (blocks || []).filter((b) => b.is_visible !== false);

  const username = profile?.username || 'creator';
  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/${username}` : `/${username}`;

  function handleCopy() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(pageUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Top Monochrome Action Bar */}
      <div className="flex w-full max-w-[340px] items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div>
            <span className="block truncate text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              Live Preview
            </span>
            <span className="block truncate text-xs font-bold text-black">/{username}</span>
          </div>
          {/* Save Status Dot */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800">
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
              Saving
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-900">
              <Check size={11} className="text-black" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700" title={saveErrorMsg}>
              <AlertCircle size={11} />
              Reverted
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            title="Copy page link"
            className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-bold text-zinc-800 transition hover:bg-zinc-100"
          >
            {copied ? <Check size={13} className="text-black" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="flex h-8 items-center gap-1 rounded-xl bg-black px-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
          >
            <span>Open</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Visual Editor Hint */}
      <p className="text-[11px] font-medium text-zinc-400 select-none">
        Click any element on the preview to edit it directly
      </p>

      {/* Phone Frame */}
      <div className="relative w-[320px] sm:w-[340px] overflow-hidden rounded-[3rem] border-[9px] border-[#18181B] bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/10 transition-all duration-300">
        {/* Dynamic Island */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-30 flex h-4 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black">
          <div className="h-1.5 w-1.5 rounded-full bg-[#111] ring-1 ring-white/10" />
        </div>

        {/* Screen */}
        <div
          className="relative min-h-[580px] max-h-[620px] overflow-y-auto px-4 pb-8 pt-6 transition-colors"
          style={{ ...getBackground(profile || {}), color: text, fontFamily: font }}
        >
          <BackgroundEffects effect={profile?.bg_effect || 'none'} primary={primary} />

          {/* Header inside phone */}
          <div className="relative z-20 flex w-full items-center justify-between mb-4 pt-4 px-0.5">
            <span className="flex items-center" style={{ color: text }}>
              <BrandLogo size="xs" variant="text" theme="current" />
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 border border-current/20 text-[10px] backdrop-blur-md shadow-xs" style={{ color: text }}>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
            </span>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[300px] flex-col items-center">
            {/* Avatar */}
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="mb-3 h-[68px] w-[68px] rounded-full border-[3px] border-current/20 object-cover shadow-xl"
              />
            ) : (
              <div
                className="mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-current/20 bg-current/10 text-lg font-extrabold shadow-xl"
                style={{ color: text }}
              >
                {(profile?.display_name || profile?.username || '?').slice(0, 2).toUpperCase()}
              </div>
            )}

            {/* Name with Verified Badge */}
            <div className="flex items-center gap-1.5">
              <h1 className="text-center text-lg font-extrabold tracking-tight" style={{ color: text }}>
                @{profile?.username || 'username'}
              </h1>
              {profile?.is_verified && (
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" title="Verified Creator" />
              )}
            </div>

            {profile?.display_name && profile.display_name !== profile.username && (
              <p className="mt-0.5 text-xs opacity-75" style={{ color: text }}>{profile.display_name}</p>
            )}
            {profile?.bio && (
              <p className="mt-2 max-w-[280px] text-center text-xs leading-5 opacity-85 font-medium" style={{ color: text }}>
                {profile.bio}
              </p>
            )}

            {/* Persistent Social Media Icons (Linktree style circular buttons) */}
            {profile?.socials && typeof profile.socials === 'object' && (
              <div className="mt-3.5 flex flex-wrap justify-center gap-2.5">
                {Object.entries(profile.socials)
                  .filter(([name, url]) => Boolean(!name.startsWith('_') && typeof url === 'string' && url.trim()))
                  .map(([name, url]) => {
                    const icon = ICONS[name] || ICONS.link;
                    return (
                      <span
                        key={name}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-sm border border-white/10"
                        title={icon.label || name}
                      >
                        <i className={icon.className} style={{ fontSize: 14 }} />
                      </span>
                    );
                  })}
              </div>
            )}

            {/* Interactive Blocks in Phone Viewport */}
            <div className="mt-5 flex w-full flex-col gap-2.5">
              {visibleBlocks.map((block) => {
                const Renderer = RENDERERS[block.type];
                if (!Renderer) return null;
                const isSelected = selectedBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`cursor-pointer transition-all duration-200 rounded-2xl relative ${
                      isSelected
                        ? 'ring-2 ring-black ring-offset-2 ring-offset-black/20 scale-[1.02] shadow-pop'
                        : 'hover:scale-[1.01]'
                    }`}
                  >
                    <Renderer
                      data={block.data || {}}
                      profile={profile}
                      isSelected={isSelected}
                    />
                    {block.is_disabled && (
                      <div className="absolute inset-0 bg-red-950/70 rounded-2xl flex items-center justify-center backdrop-blur-xs text-[10px] font-bold text-red-300">
                        Disabled by Trust & Safety
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Join Pill */}
            <div className="mt-6 flex w-full justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-current/15 bg-white/90 px-3.5 py-1 text-[10px] font-bold text-black shadow-md backdrop-blur">
                <span>Join @{profile?.username || 'you'} on</span>
                <BrandLogo size="xs" variant="text" theme="current" />
              </span>
            </div>

            {/* Home indicator */}
            <div className="mt-6 flex flex-col items-center">
              <p className="text-[9px] opacity-40">Made with LinkInBio</p>
              <div className="mt-2.5 h-1 w-20 rounded-full bg-current/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
