'use client';

import { useMemo, useState } from 'react';
import { ICONS } from '../../lib/icons';

const FONT_MAP = {
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  rounded: 'ui-rounded, "Trebuchet MS", Arial, sans-serif',
};

const ANIMATIONS = {
  none: '',
  fade: 'link-anim-fade',
  slideUp: 'link-anim-slide-up',
  slideLeft: 'link-anim-slide-left',
  zoom: 'link-anim-zoom',
  blur: 'link-anim-blur',
  bounce: 'link-anim-bounce',
};

const HOVERS = {
  none: '',
  lift: 'link-hover-lift',
  glow: 'link-hover-glow',
  scale: 'link-hover-scale',
  shine: 'link-hover-shine',
  tilt: 'link-hover-tilt',
};

function safeColor(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function getBackground(profile, activeLink) {
  const type = activeLink?.background_type || profile.background_type || 'gradient';
  const value = activeLink?.background_value || profile.background_value || '';

  if (type === 'image' && value) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url("${value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (type === 'solid') return { background: safeColor(value, '#0f172a') };
  if (type === 'gradient') {
    return {
      background: value || 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #7c3aed 100%)',
    };
  }

  return { background: 'linear-gradient(135deg, #111827, #312e81, #701a75)' };
}

export default function InteractiveTheme({ profile, links }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [cursor, setCursor] = useState({ x: 50, y: 45 });

  const visibleLinks = useMemo(
    () => (links || []).filter((link) => link.is_visible !== false),
    [links]
  );

  const activeLink = visibleLinks.find((link) => link.id === hoveredId) || null;
  const primary = safeColor(profile.primary_color, '#7c3aed');
  const text = safeColor(profile.text_color, '#ffffff');
  const font = FONT_MAP[profile.font_family] || FONT_MAP.inter;
  const buttonRadius = Number.isInteger(profile.button_radius) ? profile.button_radius : 18;

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <main
      className="link-page relative min-h-screen overflow-hidden px-5 py-10 sm:px-6 sm:py-14"
      style={{ ...getBackground(profile, activeLink), color: text, fontFamily: font }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, ${primary}55 0%, transparent 28%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-col items-center">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            className="mb-4 h-24 w-24 rounded-full border-4 border-white/80 object-cover shadow-2xl animate-profile-in"
          />
        ) : (
          <div
            className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-white/15 text-2xl font-bold shadow-2xl backdrop-blur"
          >
            {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
          </div>
        )}

        <h1 className="animate-profile-in text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          {profile.display_name || profile.username}
        </h1>
        <p className="animate-profile-in mt-1 text-sm opacity-75">@{profile.username}</p>

        {profile.bio && (
          <p className="animate-profile-in mt-4 max-w-[340px] text-center text-sm leading-6 opacity-85">
            {profile.bio}
          </p>
        )}

        {profile.socials && typeof profile.socials === 'object' && (
          <div className="animate-profile-in mt-5 flex flex-wrap justify-center gap-2">
            {Object.entries(profile.socials)
              .filter(([, url]) => Boolean(url))
              .map(([name, url]) => {
                const icon = ICONS[name] || ICONS.link;
                return (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:scale-110"
                    aria-label={name}
                  >
                    <i className={icon.className} style={{ color: icon.color }} />
                  </a>
                );
              })}
          </div>
        )}

        <nav className="mt-8 flex w-full flex-col gap-3">
          {visibleLinks.map((link, index) => {
            const icon = ICONS[link.icon] || ICONS.link;
            const animation = ANIMATIONS[link.animation || 'slideUp'] || '';
            const hover = HOVERS[link.hover_effect || 'lift'] || '';
            const delay = Math.min(index * 80, 700);
            const linkBg = link.background_type === 'solid'
              ? safeColor(link.background_value, primary)
              : link.background_type === 'gradient'
                ? link.background_value || `linear-gradient(135deg, ${primary}, #111827)`
                : `rgba(255,255,255,${link.is_featured ? 0.2 : 0.12})`;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex w-full items-center gap-3 overflow-hidden border border-white/15 px-4 py-4 shadow-xl backdrop-blur-xl transition-all duration-500 ${animation} ${hover}`}
                style={{
                  animationDelay: `${delay}ms`,
                  borderRadius: `${buttonRadius}px`,
                  background: linkBg,
                  color: link.is_featured ? '#ffffff' : text,
                }}
                onMouseEnter={() => setHoveredId(link.id)}
                onFocus={() => setHoveredId(link.id)}
                onMouseLeave={() => setHoveredId(null)}
                onBlur={() => setHoveredId(null)}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/10"
                  style={{ color: link.is_featured ? '#ffffff' : icon.color }}
                >
                  <i className={`${icon.className} text-lg transition-transform duration-300 group-hover:scale-110`} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[15px]">{link.title}</span>
                  {link.subtitle && (
                    <span className="mt-0.5 block truncate text-xs opacity-70">{link.subtitle}</span>
                  )}
                </span>

                <span className="relative z-10 shrink-0 text-sm opacity-70 transition-transform duration-300 group-hover:translate-x-1">
                  <i className="fa-solid fa-arrow-right" />
                </span>

                <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              </a>
            );
          })}
        </nav>

        <p className="mt-9 text-xs opacity-50">Made with Link-in-Bio</p>
      </div>
    </main>
  );
}
