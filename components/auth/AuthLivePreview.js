'use client';
import { useState, useEffect } from 'react';
import { MoveUpRight, Radio, Play } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import { ICONS } from '../../lib/icons';
import { APP_DOMAIN } from '../../lib/constants';

const VIBE_CONFIGS = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    bg: '#000000',
    cardBg: '#121212',
    textColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    border: 'border-zinc-800',
    font: "'Inter', sans-serif",
    accent: '#FFFFFF',
    links: [
      { title: 'Interactive Portfolio', subtitle: 'Case studies & engineering', icon: 'globe' },
      { title: 'YouTube Tutorials', subtitle: 'Weekly UI breakdowns', icon: 'youtube' },
      { title: 'Open Source Repos', subtitle: 'GitHub projects & tooling', icon: 'github' },
      { title: 'Design System Tokens', subtitle: 'Figma specs & primitives', icon: 'zap' },
    ],
    socials: ['github', 'twitter', 'youtube', 'discord'],
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    bg: '#F5F5F0',
    cardBg: '#FFFFFF',
    textColor: '#111111',
    buttonTextColor: '#111111',
    border: 'border-zinc-300',
    font: "'Playfair Display', serif",
    accent: '#111111',
    links: [
      { title: 'Spring / Summer Lookbook', subtitle: 'Explore fashion catalog', icon: 'camera' },
      { title: 'Shop Online Boutique', subtitle: 'Complimentary shipping', icon: 'store' },
      { title: 'Book Private Fitting', subtitle: 'Milan & Paris studio', icon: 'email' },
      { title: 'Press & Editorial Features', subtitle: 'Vogue & Architectural Digest', icon: 'globe' },
    ],
    socials: ['instagram', 'tiktok', 'pinterest', 'facebook'],
  },
  dark: {
    id: 'dark',
    name: 'Studio Dark',
    bg: '#09090B',
    cardBg: '#18181B',
    textColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    border: 'border-zinc-800',
    font: "'Outfit', sans-serif",
    accent: '#FFFFFF',
    links: [
      { title: 'Design System Library', subtitle: 'Figma tokens & components', icon: 'globe' },
      { title: 'Read Technical Blog', subtitle: 'Architecture deep dives', icon: 'link' },
      { title: 'Subscribe to Newsletter', subtitle: '12,000+ weekly readers', icon: 'email' },
      { title: 'Mentorship & Advisory', subtitle: '1-on-1 strategy sessions', icon: 'zap' },
    ],
    socials: ['twitter', 'github', 'youtube', 'linkedin'],
  },
  glass: {
    id: 'glass',
    name: 'Aurora Glass',
    bg: 'linear-gradient(135deg, #090D16 0%, #1E1B4B 40%, #064E3B 100%)',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    textColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    border: 'border-white/20',
    font: "'Plus Jakarta Sans', sans-serif",
    accent: '#38BDF8',
    links: [
      { title: '2026 Photography Collection', subtitle: 'Limited fine-art print drop', icon: 'camera' },
      { title: 'Instagram Portfolio', subtitle: 'Behind-the-scenes shoots', icon: 'instagram' },
      { title: 'Commercial Inquiries', subtitle: 'Brand collaborations', icon: 'email' },
      { title: 'Cinematic Preset Pack', subtitle: 'Tone & color grading LUTs', icon: 'zap' },
    ],
    socials: ['instagram', 'tiktok', 'youtube', 'telegram'],
  },
  creator: {
    id: 'creator',
    name: 'Sunset Glow',
    bg: 'linear-gradient(135deg, #1C0A00 0%, #7C2D12 40%, #BE123C 100%)',
    cardBg: '#FFFFFF',
    textColor: '#FFFFFF',
    buttonTextColor: '#000000',
    border: 'border-white/20',
    font: "'Poppins', sans-serif",
    accent: '#F97316',
    links: [
      { title: 'Listen on Spotify', subtitle: 'Stream new single "Afterlight"', icon: 'spotify' },
      { title: '2026 World Tour Dates', subtitle: 'Tickets on sale now', icon: 'globe' },
      { title: 'Official Vinyl & Merch', subtitle: 'Limited physical release', icon: 'store' },
    ],
    socials: ['spotify', 'youtube', 'instagram', 'tiktok'],
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Pulse',
    bg: '#050709',
    cardBg: 'rgba(16, 185, 129, 0.08)',
    textColor: '#10B981',
    buttonTextColor: '#10B981',
    border: 'border-emerald-500/40',
    font: "'JetBrains Mono', monospace",
    accent: '#10B981',
    links: [
      { title: 'Read Research Papers', subtitle: 'Published on arXiv', icon: 'globe' },
      { title: 'Follow Technical Threads', subtitle: 'AI insights & benchmarks', icon: 'twitter' },
      { title: 'Early Access Beta', subtitle: 'Fast token deployment', icon: 'zap' },
      { title: 'Neural Model Benchmark', subtitle: 'Live inference latency', icon: 'link' },
    ],
    socials: ['twitter', 'github', 'discord', 'telegram'],
  },
};

export default function AuthLivePreview({
  mode = 'login', // 'login' | 'signup'
  username = 'amelie',
  displayName = 'Amélie Poulain',
  vibe = 'minimal',
}) {
  const [activeHoverIdx, setActiveHoverIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVibe = VIBE_CONFIGS[vibe] || VIBE_CONFIGS.minimal;

  // Auto-cycle kinetic hover demo in login mode
  useEffect(() => {
    if (mode !== 'login') return;
    const numLinks = currentVibe.links?.length || 3;
    const interval = setInterval(() => {
      setActiveHoverIdx((prev) => (prev + 1) % numLinks);
    }, 2800);
    return () => clearInterval(interval);
  }, [mode, currentVibe]);

  const rawInitials = (displayName || username || 'Creator').trim();
  const initials = rawInitials
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CR';

  const cleanHandle = (username || 'you').toLowerCase().replace(/[^a-z0-9._-]/g, '');

  return (
    <div className="relative flex flex-col items-center select-none py-2">
      {/* Phone Mockup Frame (Identical to in-app editor phone) */}
      <div className="relative w-[320px] sm:w-[340px] overflow-hidden rounded-[3rem] border-[9px] border-[#18181B] bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/10 transition-all duration-300">
        {/* Dynamic Island */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-30 flex h-4 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-black">
          <div className="h-1.5 w-1.5 rounded-full bg-[#111] ring-1 ring-white/10" />
        </div>

        {/* Screen Canvas */}
        <div
          className="relative min-h-[580px] max-h-[620px] overflow-y-auto px-4 pb-8 pt-6 transition-all duration-700 flex flex-col items-center justify-between"
          style={{
            background: currentVibe.bg,
            color: currentVibe.textColor,
            fontFamily: currentVibe.font,
          }}
        >
          {/* Top Section */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Header Branding */}
            <div className="relative z-20 flex w-full items-center justify-between mb-4 pt-4 px-0.5" style={{ color: currentVibe.textColor }}>
              <span className="flex items-center">
                <BrandLogo size="xs" variant="text" theme="current" />
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 border border-current/20 text-[10px] backdrop-blur-md shadow-xs">
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              </span>
            </div>

            {/* Avatar */}
            <div className="relative mb-3 group">
              <div
                className="h-[68px] w-[68px] rounded-full border-[3px] flex items-center justify-center font-black text-xl shadow-xl transition-all duration-300"
                style={{
                  borderColor: currentVibe.id === 'editorial' ? '#00000025' : 'rgba(255,255,255,0.3)',
                  background: currentVibe.id === 'editorial' ? '#0000000D' : 'rgba(255,255,255,0.15)',
                  color: currentVibe.textColor,
                }}
              >
                {initials}
              </div>
              <div
                className={`absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-md ${
                  currentVibe.id === 'editorial' ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                ✓
              </div>
            </div>

            {/* Identity */}
            <h2 className="text-base font-black tracking-tight text-center leading-tight truncate max-w-[240px]">
              {displayName || 'Your Name'}
            </h2>
            <div className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-[11px] font-mono shadow-2xs max-w-[240px]">
              <span className="opacity-60">{APP_DOMAIN}/</span>
              <span className="font-bold opacity-100 truncate">{cleanHandle}</span>
            </div>

            {/* Socials Bar */}
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              {currentVibe.socials.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full shadow-xs transition hover:scale-110"
                  style={{
                    background: currentVibe.id === 'editorial' ? '#000000' : 'rgba(0,0,0,0.85)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <i className={ICONS[s]?.className || 'fa-solid fa-link'} style={{ fontSize: 11 }} />
                </span>
              ))}
            </div>

            {/* Audio Player Widget if Creator Vibe */}
            {currentVibe.id === 'creator' && (
              <div className="mt-3 w-full rounded-2xl bg-white/15 p-2.5 backdrop-blur-md border border-white/20 flex items-center justify-between animate-profile-in">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black shrink-0 hover:scale-105 transition"
                  >
                    {isPlaying ? <Radio size={10} className="animate-pulse" /> : <Play size={10} className="ml-0.5" />}
                  </button>
                  <div className="text-left">
                    <span className="block text-[10px] font-black text-white leading-tight">Afterlight (Live EP)</span>
                    <span className="block text-[9px] text-white/70">Spotify</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 pr-1">
                  <span className={`h-2.5 w-0.5 bg-white ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span className={`h-3.5 w-0.5 bg-white ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }} />
                  <span className={`h-2 w-0.5 bg-white ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {/* Persona Link Cards */}
            <div className="mt-3.5 flex w-full flex-col gap-2">
              {currentVibe.links.map((link, idx) => {
                const isHovered = mode === 'login' ? activeHoverIdx === idx : false;
                const iconMeta = ICONS[link.icon] || { className: 'fa-solid fa-link' };

                return (
                  <div
                    key={idx}
                    className={`group relative w-full rounded-2xl p-3 text-left transition-all duration-300 border cursor-pointer select-none shadow-2xs overflow-hidden ${
                      currentVibe.border
                    } ${
                      isHovered ? '-translate-y-0.5 scale-[1.01] shadow-md' : ''
                    }`}
                    style={{
                      background:
                        isHovered && currentVibe.id !== 'editorial'
                          ? '#FFFFFF'
                          : currentVibe.cardBg,
                      color:
                        isHovered && currentVibe.id !== 'editorial'
                          ? '#000000'
                          : currentVibe.buttonTextColor,
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 text-xs"
                          style={{
                            background: currentVibe.id === 'editorial' ? '#00000010' : 'rgba(255,255,255,0.15)',
                          }}
                        >
                          <i className={iconMeta.className} />
                        </span>
                        <div className="min-w-0">
                          <span className="block font-black text-xs truncate leading-tight">{link.title}</span>
                          <span className="block text-[10px] opacity-70 truncate font-medium">{link.subtitle}</span>
                        </div>
                      </div>

                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 shrink-0 transition group-hover:translate-x-0.5">
                        <MoveUpRight size={11} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Join Pill */}
          <div className="mt-4 flex items-center gap-1 opacity-90 text-[10px] font-bold" style={{ color: currentVibe.textColor }}>
            <span className="opacity-70">Powered by</span>
            <BrandLogo size="xs" variant="text" theme="current" />
          </div>
        </div>
      </div>
    </div>
  );
}
