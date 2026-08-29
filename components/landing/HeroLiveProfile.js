'use client';
import { useState, useRef } from 'react';
import {
  MoveUpRight,
  Play,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Radio,
} from 'lucide-react';
import BrandLogo from '../BrandLogo';
import { ICONS } from '../../lib/icons';

export default function HeroLiveProfile({ theme, onThemeChange }) {
  const containerRef = useRef(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  function handleMouseMove(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({ x: rotateX, y: rotateY });
    setMousePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHoveredLink(null);
  }

  // Get active persona links from current theme
  const links = theme?.links || [];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[370px] select-none py-4"
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Cursor Spotlight Behind Phone */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-[60px] transition-all duration-300 opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
        }}
      />



      {/* Phone Frame Mockup with 3D Spatial Tilt */}
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
        className="relative overflow-hidden rounded-[44px] border-[10px] border-zinc-900 bg-black shadow-[0_30px_90px_-20px_rgba(255,255,255,0.15)] transition-shadow duration-300"
      >
        {/* Dynamic Island Notch */}
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex h-4 w-28 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2.5">
          <div className="h-2 w-2 rounded-full bg-zinc-900 ring-1 ring-white/10" />
          <div className="h-2 w-2 rounded-full bg-zinc-800" />
        </div>

        {/* Inner Live Screen */}
        <div
          className="p-5 pt-12 pb-8 transition-all duration-700 flex flex-col items-center min-h-[540px]"
          style={{
            background: theme.bg,
            color: theme.textColor,
            fontFamily: theme.font,
          }}
        >
          {/* Avatar with Theme Specific Accent */}
          <div className="relative mb-3 group">
            <div
              className="h-16 w-16 rounded-full border-2 flex items-center justify-center font-black text-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
              style={{
                borderColor: theme.id === 'editorial' ? '#00000020' : 'rgba(255,255,255,0.25)',
                background: theme.id === 'editorial' ? '#0000000D' : 'rgba(255,255,255,0.12)',
                color: theme.textColor,
              }}
            >
              {theme.avatarText || 'PK'}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-md ${
                theme.id === 'editorial' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              ✓
            </div>
          </div>

          {/* Creator Identity */}
          <h2 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-center">
            {theme.displayName || 'Creator'}
          </h2>
          <span className="text-[11px] font-semibold opacity-75">{theme.handle}</span>

          <p className="mt-2 text-center text-xs leading-relaxed opacity-85 px-2 font-medium">
            {theme.bio}
          </p>

          {/* Circular Social Media Icons Bar */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {(theme.socials || ['instagram', 'youtube', 'github']).map((social) => {
              const meta = ICONS[social] || { className: 'fa-solid fa-link' };
              return (
                <span
                  key={social}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white border border-white/15 shadow-sm transition hover:scale-115"
                  title={social}
                >
                  <i className={meta.className} style={{ fontSize: 13 }} />
                </span>
              );
            })}
          </div>

          {/* Theme-Specific Interactive Content Widget */}
          {theme.id === 'sunset' && (
            <div className="mt-3 w-full rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/15 flex items-center justify-between animate-profile-in">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio((p) => !p)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shrink-0 hover:scale-105 transition"
                >
                  {isPlayingAudio ? <Radio size={12} className="animate-pulse" /> : <Play size={12} className="ml-0.5" />}
                </button>
                <div className="text-left">
                  <span className="block text-[10px] font-black text-white leading-tight">Neon Skyline (Live EP)</span>
                  <span className="block text-[9px] text-white/70">Spotify • 3:42</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 pr-1">
                <span className={`h-2.5 w-0.5 bg-white ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                <span className={`h-4 w-0.5 bg-white ${isPlayingAudio ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }} />
                <span className={`h-1.5 w-0.5 bg-white ${isPlayingAudio ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.4s' }} />
                <span className={`h-3 w-0.5 bg-white ${isPlayingAudio ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.1s' }} />
              </div>
            </div>
          )}

          {theme.id === 'cyber' && (
            <div className="mt-3 w-full rounded-xl bg-emerald-950/40 p-2 border border-emerald-500/30 flex items-center justify-between text-[10px] font-mono text-emerald-400 animate-profile-in">
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-emerald-400" />
                <span>v3.4-alpha deployed</span>
              </span>
              <span className="text-[9px] text-emerald-500 font-bold">100% Uptime</span>
            </div>
          )}

          {theme.id === 'editorial' && (
            <div className="mt-3 w-full rounded-2xl bg-black/5 p-2.5 border border-black/10 flex items-center justify-between animate-profile-in">
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-wider text-black">Spring / Summer Lookbook</span>
                <span className="block text-[9px] text-zinc-600">Edition 2026 • Milan & Paris</span>
              </div>
              <span className="text-[10px] font-bold text-black border-b border-black">View</span>
            </div>
          )}

          {/* Persona-Specific Link Cards with Motion Physics */}
          <div className="mt-4 flex w-full flex-col gap-2">
            {links.map((link, idx) => {
              const isHovered = hoveredLink === idx;
              const iconMeta = ICONS[link.icon] || { className: 'fa-solid fa-link' };

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredLink(idx)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className={`group relative w-full rounded-2xl p-3 text-left transition-all duration-200 border cursor-pointer select-none shadow-sm overflow-hidden ${
                    theme.border
                  } ${
                    isHovered
                      ? '-translate-y-0.5 scale-[1.02] shadow-lg'
                      : ''
                  }`}
                  style={{
                    background: isHovered && theme.id !== 'editorial' ? '#FFFFFF' : theme.cardBg,
                    color: isHovered && theme.id !== 'editorial' ? '#000000' : theme.buttonTextColor,
                  }}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-xl shrink-0 text-xs shadow-xs"
                        style={{
                          background: theme.id === 'editorial' ? '#00000010' : 'rgba(255,255,255,0.15)',
                        }}
                      >
                        <i className={iconMeta.className} />
                      </span>
                      <div className="min-w-0">
                        <span className="block font-black text-xs truncate">{link.title}</span>
                        <span className="block text-[10px] opacity-70 truncate font-medium">{link.subtitle}</span>
                      </div>
                    </div>

                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <MoveUpRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-1.5 opacity-90 text-[10px] font-bold" style={{ color: theme.textColor }}>
            <span className="opacity-70">Powered by</span>
            <BrandLogo size="xs" variant="text" theme="current" />
          </div>
        </div>
      </div>
    </div>
  );
}
