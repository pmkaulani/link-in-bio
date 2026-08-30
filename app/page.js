'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Palette,
  MousePointer,
  BarChart3,
  Layers,
  Check,
  ChevronRight,
  ChevronDown,
  Globe,
  Share2,
  Play,
  LayoutGrid,
  Image as ImageIcon,
  Video as VideoIcon,
  Megaphone,
  Minus,
  MoveUpRight,
  ExternalLink,
  Code,
  Camera,
  Music,
  Briefcase,
  Store,
  Compass,
  Command,
  Eye,
  MousePointerClick,
  TrendingUp,
  Contrast,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { ICONS } from '../lib/icons';
import MagneticButton from '../components/landing/MagneticButton';
import TiltCard from '../components/landing/TiltCard';
import ScrambleText from '../components/landing/ScrambleText';
import AnimatedCounter from '../components/landing/AnimatedCounter';
import ScrollProgress from '../components/landing/ScrollProgress';
import HeroLiveProfile from '../components/landing/HeroLiveProfile';
import HeroTaglineCarousel from '../components/landing/HeroTaglineCarousel';
import { APP_DOMAIN } from '../lib/constants';

// ── Interactive Themes for Showcase ──────────────────────────────────────────
const SHOWCASE_THEMES = [
  {
    id: 'monochrome',
    name: 'Onyx Monochrome',
    bg: '#000000',
    cardBg: '#121212',
    textColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    border: 'border-zinc-800',
    font: "'Inter', sans-serif",
    handle: '@trinity',
    displayName: 'Trinity',
    bio: 'Systems architecture, neural interfaces & cryptography. Decentralizing nodes and building secure protocols.',
    avatarText: 'TR',
    links: [
      { title: 'Zero-Knowledge Kernel Code', subtitle: 'Open-source on GitHub (30k stars)', icon: 'github' },
      { title: 'Terminal Diagnostics Live', subtitle: 'Public network health monitor', icon: 'code' },
      { title: 'Whitepaper: Consensus in Chaos', subtitle: 'Distributed architecture paper', icon: 'document' },
      { title: 'Encrypted Matrix Channel', subtitle: 'Join 5,000+ protocol engineers', icon: 'discord' },
    ],
    socials: ['telegram', 'github', 'discord', 'twitter'],
  },
  {
    id: 'aurora',
    name: 'Aurora Glass',
    bg: 'linear-gradient(135deg, #090D16 0%, #1E1B4B 40%, #064E3B 100%)',
    cardBg: 'rgba(255, 255, 255, 0.10)',
    textColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    border: 'border-white/20',
    font: "'Plus Jakarta Sans', sans-serif",
    handle: '@amelie',
    displayName: 'Amélie Poulain',
    bio: 'Photographer, filmmaker & collector of little moments. Documenting quiet everyday poetry in Paris.',
    avatarText: 'AP',
    links: [
      { title: 'Selected Photography Portfolio', subtitle: 'Paris streets & analog 35mm prints', icon: 'camera' },
      { title: 'Substack: Notebook of Details', subtitle: 'Bi-weekly essays on observations', icon: 'globe' },
      { title: 'Short Film: Le Fabuleux Destin', subtitle: 'Watch the festival cut on Vimeo', icon: 'video' },
      { title: 'Exhibition & Print Inquiries', subtitle: 'Studio visits & collaborations', icon: 'email' },
    ],
    socials: ['instagram', 'youtube', 'telegram', 'facebook'],
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    bg: 'linear-gradient(135deg, #1C0A00 0%, #7C2D12 40%, #BE123C 100%)',
    cardBg: '#FFFFFF',
    textColor: '#FFFFFF',
    buttonTextColor: '#000000',
    border: 'border-white/20',
    font: "'Poppins', sans-serif",
    handle: '@marty',
    displayName: 'Marty McFly',
    bio: 'Lead guitarist, skateboarder & temporal explorer. High-voltage rock and roll from 1955 to 2015.',
    avatarText: 'MM',
    links: [
      { title: 'Johnny B. Goode (Live Demo)', subtitle: 'Guitar solo recorded in 1955', icon: 'spotify' },
      { title: 'The Pinheads Debut EP', subtitle: 'Stream high-voltage rock & roll', icon: 'music' },
      { title: 'Hoverboard Skate Clips', subtitle: 'Watch street tricks on YouTube', icon: 'youtube' },
      { title: 'Doc Brown Science Lab Updates', subtitle: 'Flux capacitor test runs', icon: 'zap' },
    ],
    socials: ['spotify', 'youtube', 'instagram', 'tiktok'],
  },
  {
    id: 'cyber',
    name: 'Cyber Pulse',
    bg: '#050709',
    cardBg: 'rgba(16, 185, 129, 0.08)',
    textColor: '#10B981',
    buttonTextColor: '#10B981',
    border: 'border-emerald-500/40',
    font: "'JetBrains Mono', monospace",
    handle: '@kusanagi',
    displayName: 'Motoko Kusanagi',
    bio: 'Autonomous network operations & cybernetics. Advanced threat intelligence and memory encryption.',
    avatarText: 'MK',
    links: [
      { title: 'Threat Intelligence Dispatch', subtitle: 'Autonomous network anomaly reports', icon: 'globe' },
      { title: 'Neural Encryption Library', subtitle: 'Rust crate for hardware crypto', icon: 'github' },
      { title: 'Section 9 Field Diagnostics', subtitle: 'Real-time telemetry stream', icon: 'zap' },
    ],
    socials: ['twitter', 'github', 'discord', 'telegram'],
  },
  {
    id: 'editorial',
    name: 'Editorial Chic',
    bg: '#F5F5F0',
    cardBg: '#FFFFFF',
    textColor: '#111111',
    buttonTextColor: '#111111',
    border: 'border-zinc-300',
    font: "'Playfair Display', serif",
    handle: '@cher',
    displayName: 'Cher Horowitz',
    bio: 'Wardrobe curator, debate captain & lifestyle editor. Totally matching yellow plaid since 1995.',
    avatarText: 'CH',
    links: [
      { title: 'Digital Closet Algorithm', subtitle: 'Browse curated seasonal outfit matches', icon: 'store' },
      { title: 'Debate Strategy & Makeover Guide', subtitle: 'Download my foolproof makeover manual', icon: 'camera' },
      { title: 'Beverly Hills Pismo Beach Relief', subtitle: 'Donate to community charity drives', icon: 'globe' },
    ],
    socials: ['instagram', 'tiktok', 'facebook', 'youtube'],
  },
];

// Dynamic "YOU" typography variations
const YOU_STYLES = [
  { label: 'YOU.', className: 'font-black tracking-tight text-white' },
  { label: 'YOU.', className: 'italic font-serif text-zinc-300' },
  { label: 'YOU.', className: 'font-mono uppercase text-white underline decoration-white/40' },
  { label: 'YOU.', className: 'font-black tracking-widest text-transparent [-webkit-text-stroke:1.5px_white]' },
  { label: 'YOU.', className: 'font-extrabold text-white animate-pulse' },
];

// 5 Rotating Hero Taglines requested by user
const HERO_TAGLINES = [
  {
    id: 0,
    tagline: 'One link. All of you.',
    line1: 'ONE LINK.',
    line2: 'ALL OF',
    highlight: 'YOU.',
    subtext: 'Create a link page that looks, moves, and feels exactly the way you want. Kinetic hover physics, rich modular blocks, circular social bars, and zero vendor bloat.',
  },
  {
    id: 1,
    tagline: 'All your links in one place.',
    line1: 'ALL YOUR LINKS',
    line2: 'IN ONE',
    highlight: 'PLACE.',
    subtext: 'Consolidate YouTube, socials, portfolio, music, and store products into a single high-performance canvas.',
  },
  {
    id: 2,
    tagline: 'One link. Everything you share.',
    line1: 'ONE LINK.',
    line2: 'EVERYTHING YOU',
    highlight: 'SHARE.',
    subtext: 'Turn your bio into an interactive physical experience with spring physics, 3D spatial tilt, and instant media expansion.',
  },
  {
    id: 3,
    tagline: 'Your online world, in one link.',
    line1: 'YOUR ONLINE WORLD,',
    line2: 'IN ONE',
    highlight: 'LINK.',
    subtext: 'The clean, minimal identity for creators, developers, artists, musicians, and modern brands.',
  },
  {
    id: 4,
    tagline: 'Share more with one simple link.',
    line1: 'SHARE MORE',
    line2: 'WITH ONE',
    highlight: 'SIMPLE LINK.',
    subtext: 'Claim your custom handle in 10 seconds. Free forever, no credit card required, zero cookies.',
  },
];

const AVAILABLE_BLOCKS = [
  { id: 'link', name: 'Smart Link', icon: MoveUpRight, desc: 'URL card with title, icon, and hover animation' },
  { id: 'socials', name: 'Social Icons Bar', icon: Share2, desc: 'Circular icons for Telegram, Facebook, Instagram' },
  { id: 'image', name: 'Image Banner', icon: ImageIcon, desc: 'High-res artwork, header, or promo photo' },
  { id: 'video', name: 'Video Embed', icon: VideoIcon, desc: 'Playable YouTube or Vimeo preview' },
  { id: 'callout', name: 'Drop Callout', icon: Megaphone, desc: 'Urgent highlight pill or launch announcement' },
  { id: 'grid', name: 'Post Grid', icon: LayoutGrid, desc: 'Multi-item thumbnail visual grid' },
  { id: 'divider', name: 'Divider Rule', icon: Minus, desc: 'Clean structural separator' },
];

export default function Home() {
  // Hero Live Profile & Theme State
  const [heroTheme, setHeroTheme] = useState('monochrome');
  const [youStyleIndex, setYouStyleIndex] = useState(0);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isTaglineFading, setIsTaglineFading] = useState(false);
  const [isInverted, setIsInverted] = useState(false);

  // "Make It Yours" Interactive Sandbox State
  const [sandboxFont, setSandboxFont] = useState('inter');
  const [sandboxTheme, setSandboxTheme] = useState('monochrome');
  const [sandboxRadius, setSandboxRadius] = useState('rounded-2xl');
  const [sandboxAnimation, setSandboxAnimation] = useState('spring');

  // Showcase Carousel State
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  // Block Builder Interactive Demo State
  const [builtBlocks, setBuiltBlocks] = useState(['socials', 'link', 'callout', 'image']);

  // Demo Generator State
  const [demoHandle, setDemoHandle] = useState('yourname');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Smooth dual-phase tagline rotation every 4.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTaglineFading(true);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % HERO_TAGLINES.length);
        setIsTaglineFading(false);
      }, 420);
    }, 4800);
    return () => clearInterval(timer);
  }, []);

  // Cycle "YOU" emphasis every 2.4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setYouStyleIndex((prev) => (prev + 1) % YOU_STYLES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Easter Egg: Press 'B' for temporary monochrome inverted mode
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'b' || e.key === 'B') {
        // Ignore if typing in input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        setIsInverted((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentHeroTheme = SHOWCASE_THEMES.find((t) => t.id === heroTheme) || SHOWCASE_THEMES[0];
  const currentShowcaseTheme = SHOWCASE_THEMES[activeShowcaseIndex];

  function toggleBlockInBuilder(blockId) {
    if (builtBlocks.includes(blockId)) {
      if (builtBlocks.length > 1) {
        setBuiltBlocks(builtBlocks.filter((b) => b !== blockId));
      }
    } else {
      setBuiltBlocks([...builtBlocks, blockId]);
    }
  }

  const FAQS = [
    {
      q: 'What is Link-in-Bio?',
      a: 'Link-in-Bio is a fast, minimal, high-craft link-in-bio platform. It replaces multiple cluttered links with a single beautiful page for all your socials, portfolio, videos, music, and digital products.',
    },
    {
      q: 'Is Link-in-Bio free to use?',
      a: 'Yes! You can claim your custom username, build a complete link page, add unlimited links and content blocks, and view real-time analytics with zero upfront cost.',
    },
    {
      q: 'Can I customize my page colors, fonts, and link animations?',
      a: 'Absolutely. While the Link-in-Bio brand is pure monochrome, your personal creator page is 100% yours. Choose from custom gradient or solid backgrounds, typography presets, glassmorphism styles, and animated physics.',
    },
    {
      q: 'How does Link-in-Bio compare to Linktree or Beacons?',
      a: 'Link-in-Bio focuses on design integrity, speed, and kinetic physics. We don’t force bloated vendor branding on your fan experience, and our responsive mobile design gives you a true iOS-level tactile app feel.',
    },
    {
      q: 'Does it work across Instagram, TikTok, WhatsApp, and YouTube?',
      a: `Yes. Your custom URL (${APP_DOMAIN}/yourname) works seamlessly in the bio field of any social platform, messaging app, email signature, or digital business card.`,
    },
    {
      q: 'How does Trust & Safety protect my audience?',
      a: 'We automatically verify destination links against known phishing and malicious databases, protect reserved system handles, and provide community reporting tools.',
    },
  ];

  return (
    <div
      className={`relative min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-sans transition-all duration-500 ${
        isInverted ? 'invert' : ''
      }`}
    >
      {/* Scroll Progress & Stage Navigator */}
      <ScrollProgress />

      {/* Subtle Ambient Background Spotlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.08),rgba(0,0,0,0))]" />

      {/* ── 1. Sticky Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 sm:h-20 w-full items-center justify-between border-b border-white/10 bg-black px-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80 group">
          <BrandLogo size="md" variant="full" theme="light" />
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400">
          <a href="#hero" className="transition hover:text-white">Live Demo</a>
          <a href="#customize" className="transition hover:text-white">Customization</a>
          <a href="#animations" className="transition hover:text-white">Physics</a>
          <a href="#themes" className="transition hover:text-white">Themes</a>
          <a href="#blocks" className="transition hover:text-white">Blocks</a>
          <a href="#audience" className="transition hover:text-white">Creators</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsInverted((prev) => !prev)}
            className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-zinc-900/80 px-2.5 text-[11px] font-bold text-zinc-300 transition hover:text-white hover:border-white/40 active:scale-95 shadow-xs"
            title="Toggle monochrome high-contrast inversion (or press 'B' on desktop)"
            aria-label="Toggle contrast mode"
          >
            <Contrast size={13} />
            <span className="hidden sm:inline">{isInverted ? 'Normal' : 'Invert'}</span>
          </button>

          <Link
            href="/login"
            className="rounded-[8px] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            Log in
          </Link>

          <MagneticButton
            href="/signup"
            strength={0.2}
            className="rounded-[8px] bg-white px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-black text-black transition hover:bg-zinc-200 hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] active:scale-95 shrink-0"
          >
            Create your link
          </MagneticButton>
        </div>
      </header>

      {/* ── 2. Hero Section: Split Screen With Kinetic Typography & Live Profile ───── */}
      <section
        id="hero"
        className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Animated Typography & Magnetic Claim Form */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:col-span-7">
            {/* Smooth Rolling Kinetic Headline Carousel */}
            <HeroTaglineCarousel />

            <p className="mt-4 max-w-xl text-sm sm:text-base lg:text-lg text-zinc-400 font-medium leading-relaxed">
              Create a link page that looks, moves, and feels exactly the way you want. Kinetic hover physics, modular smart blocks, circular socials, and zero vendor bloat.
            </p>

            {/* Instant Claim Handle Form */}
            <div className="mt-8 w-full max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const handle = e.currentTarget.elements.username.value.trim();
                  window.location.href = handle ? `/signup?username=${encodeURIComponent(handle)}` : '/signup';
                }}
                className="flex items-center rounded-[10px] border border-zinc-800 bg-zinc-950 p-1.5 transition focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 shadow-xl"
              >
                <span className="flex items-center gap-1.5 rounded-[7px] bg-zinc-900 border border-zinc-800/80 px-3 py-2 text-xs font-mono font-bold text-zinc-400 select-none shrink-0">
                  <Globe size={13} className="text-zinc-500" />
                  <span>{APP_DOMAIN}/</span>
                </span>
                <input
                  name="username"
                  type="text"
                  placeholder="yourname"
                  className="w-full bg-transparent px-2.5 text-xs sm:text-sm font-mono font-bold text-white outline-none placeholder:text-zinc-700"
                />
                <MagneticButton
                  as="button"
                  type="submit"
                  strength={0.15}
                  className="flex items-center gap-1.5 rounded-[8px] bg-white px-4 py-2.5 text-xs sm:text-sm font-black text-black transition hover:bg-zinc-200 active:scale-95 shrink-0"
                >
                  <span>Claim free</span>
                  <ArrowRight size={14} />
                </MagneticButton>
              </form>

              <div className="mt-3 flex items-center justify-center lg:justify-start gap-4 text-[11px] font-medium text-zinc-500">
                <span>✓ 30-second setup</span>
                <span>•</span>
                <span>✓ Free forever</span>
                <span>•</span>
                <span>✓ No credit card</span>
              </div>
            </div>

            {/* Theme switcher pill bar for the hero */}
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-4 border-t border-zinc-900 w-full max-w-md">
              <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Preview Theme:</span>
              {SHOWCASE_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setHeroTheme(t.id)}
                  className={`rounded-[8px] px-2.5 py-1 text-[11px] font-bold transition ${
                    heroTheme === t.id
                      ? 'bg-white text-black border border-zinc-200'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {t.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Cursor-Reactive Hero Live Profile */}
          <div className="flex justify-center lg:col-span-5">
            <HeroLiveProfile theme={currentHeroTheme} onThemeChange={setHeroTheme} />
          </div>
        </div>
      </section>

      {/* ── 3. Dual Infinite Marquee Bands ─────────────────────────────────── */}
      <div className="relative border-y border-white/10 bg-zinc-950 py-3 overflow-hidden select-none space-y-2">
        {/* Top Marquee (Moves Left) */}
        <div className="flex whitespace-nowrap animate-marquee-left">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-xs font-black tracking-widest uppercase text-zinc-500 px-4">
              <span>Links</span>
              <span>•</span>
              <span>Socials</span>
              <span>•</span>
              <span>Kinetic Physics</span>
              <span>•</span>
              <span>Themes</span>
              <span>•</span>
              <span>Videos</span>
              <span>•</span>
              <span>Music</span>
              <span>•</span>
              <span>Analytics</span>
              <span>•</span>
              <span>Monochrome Canvas</span>
              <span>•</span>
            </div>
          ))}
        </div>

        {/* Bottom Marquee (Moves Right) */}
        <div className="flex whitespace-nowrap animate-marquee-right">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-[10px] font-bold tracking-widest uppercase text-zinc-600 px-4">
              <span>MAKE</span>
              <span>·</span>
              <span>SHARE</span>
              <span>·</span>
              <span>CREATE</span>
              <span>·</span>
              <span>CUSTOMIZE</span>
              <span>·</span>
              <span>EXPRESS</span>
              <span>·</span>
              <span>CONNECT</span>
              <span>·</span>
              <span>ENGAGE</span>
              <span>·</span>
              <span>GROW</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. "Make It Yours" Interactive Studio Sandbox ──────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28" id="customize">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Live Studio Sandbox</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            <ScrambleText text="MAKE IT YOURS." /> <br />
            <span className="text-zinc-500">Change anything. See it instantly.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            Test the live customization engine below. Switch fonts, color palettes, button border radiuses, and spring animations in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-t border-b border-zinc-800 py-16 sm:py-24">
          {/* Controls Palette (Left) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Font Family */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                01. Typography Engine
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'inter', name: 'Inter Sans', font: "'Inter', sans-serif" },
                  { id: 'outfit', name: 'Outfit Modern', font: "'Outfit', sans-serif" },
                  { id: 'playfair', name: 'Editorial Serif', font: "'Playfair Display', serif" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSandboxFont(f.id)}
                    className={`rounded-[8px] border p-2.5 text-xs font-bold text-left transition ${
                      sandboxFont === f.id
                        ? 'border-white bg-white text-black shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span style={{ fontFamily: f.font }}>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Theme / Palette */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                02. Canvas Atmosphere
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SHOWCASE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSandboxTheme(t.id)}
                    className={`flex items-center gap-2 rounded-[8px] border p-2.5 text-xs font-bold text-left transition ${
                      sandboxTheme === t.id
                        ? 'border-white bg-white text-black shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ background: t.bg }}
                    />
                    <span className="truncate">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Button Border Radius */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                03. Corner Curvature
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rounded-none', label: 'Square (0px)' },
                  { id: 'rounded-[8px]', label: 'Soft (4px)' },
                  { id: 'rounded-full', label: 'Pill (Full)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSandboxRadius(r.id)}
                    className={`rounded-[8px] border p-2.5 text-xs font-bold transition ${
                      sandboxRadius === r.id
                        ? 'border-white bg-white text-black shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Link Animation Physics */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                04. Kinetic Physics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'spring', label: 'Spring Lift' },
                  { id: 'glow', label: 'Soft Glow' },
                  { id: 'tilt', label: '3D Tilt' },
                  { id: 'shine', label: 'Light Sweep' },
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSandboxAnimation(a.id)}
                    className={`rounded-[8px] border p-2.5 text-xs font-bold transition ${
                      sandboxAnimation === a.id
                        ? 'border-white bg-white text-black shadow-md'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Updating Phone Screen (Right) */}
          <div className="lg:col-span-6 flex justify-center">
            {(() => {
              const currentThemeData = SHOWCASE_THEMES.find((t) => t.id === sandboxTheme) || SHOWCASE_THEMES[0];
              const fontStyle =
                sandboxFont === 'inter'
                  ? "'Inter', sans-serif"
                  : sandboxFont === 'outfit'
                  ? "'Outfit', sans-serif"
                  : "'Playfair Display', serif";

              return (
                <div className="relative w-[300px] sm:w-[330px] overflow-hidden rounded-[16px] border-[8px] border-zinc-900 bg-black shadow-2xl transition-all duration-300">
                  <div
                    className="p-5 pt-10 pb-6 transition-all duration-500 flex flex-col items-center min-h-[460px]"
                    style={{ background: currentThemeData.bg, color: currentThemeData.textColor, fontFamily: fontStyle }}
                  >
                    <div className="h-14 w-14 rounded-full border-2 border-white/20 flex items-center justify-center font-black text-lg shadow-lg bg-white/10 mb-2.5">
                      {currentThemeData.avatarText}
                    </div>
                    <h3 className="text-base font-black tracking-tight">{currentThemeData.displayName}</h3>
                    <p className="text-[11px] opacity-75 font-semibold">{currentThemeData.handle}</p>

                    {/* Socials */}
                    <div className="mt-3 flex items-center gap-1.5">
                      {currentThemeData.socials.slice(0, 4).map((s) => (
                        <span key={s} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white border border-white/15 shadow-xs">
                          <i className={ICONS[s]?.className || 'fa-solid fa-link'} style={{ fontSize: 11 }} />
                        </span>
                      ))}
                    </div>

                    {/* Links with dynamic radius & animation effect */}
                    <div className="mt-4 flex w-full flex-col gap-2">
                      {currentThemeData.links.slice(0, 3).map((l, i) => (
                        <div
                          key={i}
                          className={`w-full p-3 text-left border ${currentThemeData.border} ${sandboxRadius} transition-all duration-200 cursor-pointer ${
                            sandboxAnimation === 'spring'
                              ? 'hover:-translate-y-1 hover:shadow-lg'
                              : sandboxAnimation === 'glow'
                              ? 'hover:ring-2 hover:ring-white/40'
                              : sandboxAnimation === 'tilt'
                              ? 'hover:rotate-1'
                              : 'hover:bg-white hover:text-black'
                          }`}
                          style={{ background: currentThemeData.cardBg, color: currentThemeData.buttonTextColor }}
                        >
                          <span className="block font-bold text-xs">{l.title}</span>
                          <span className="block text-[9px] opacity-65">{l.subtitle}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 opacity-90 text-[10px] font-bold" style={{ color: currentThemeData.textColor }}>
                      <span className="opacity-70">Powered by</span>
                      <BrandLogo size="xs" variant="text" theme="current" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ── 5. "Links Aren't Boring" Physics Playground with 3D Tilt ───────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28" id="animations">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Kinetic Physics</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            YOUR LINKS. <br />
            <span className="text-zinc-500">BUT MORE ALIVE.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            Static lists of buttons are boring. Turn your links into interactive physical objects that respond to touch, velocity, and scroll.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Spring Lift */}
          <TiltCard className="rounded-[12px]">
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">01 / Motion</span>
              <h3 className="mt-2 text-lg font-black text-white">Spring Lift</h3>
              <p className="mt-1 text-xs text-zinc-400">Jumps up dynamically with simulated natural spring mass.</p>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <span className="block font-bold text-xs text-white">Latest YouTube Drop</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Hover to feel the spring jump</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 2: Soft Glow */}
          <TiltCard className="rounded-[12px]">
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">02 / Ambient</span>
              <h3 className="mt-2 text-lg font-black text-white">Magnetic Glow</h3>
              <p className="mt-1 text-xs text-zinc-400">Radiates an ambient illuminated aura on hover focus.</p>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4 transition-all duration-300 group-hover:border-white group-hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
                <span className="block font-bold text-xs text-white">Digital Store Catalog</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Glow illumination effect</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 3: 3D Spatial Tilt */}
          <TiltCard className="rounded-[12px]" maxTilt={16}>
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">03 / Depth</span>
              <h3 className="mt-2 text-lg font-black text-white">3D Spatial Tilt</h3>
              <p className="mt-1 text-xs text-zinc-400">Tilts along X/Y axes to create tactile physical depth.</p>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4 transition-transform duration-300 group-hover:scale-105">
                <span className="block font-bold text-xs text-white">Interactive Portfolio</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Spatial rotation & depth</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 4: Light Sweep */}
          <TiltCard className="rounded-[12px]">
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">04 / Reflection</span>
              <h3 className="mt-2 text-lg font-black text-white">Light Sweep</h3>
              <p className="mt-1 text-xs text-zinc-400">Sweeps a reflective metallic sheen across the link surface.</p>

              <div className="relative overflow-hidden mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="block font-bold text-xs text-white">VIP Discord Lounge</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Reflective light sweep</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 5: Color Inversion */}
          <TiltCard className="rounded-[12px]">
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">05 / Inversion</span>
              <h3 className="mt-2 text-lg font-black text-white">Flash Inversion</h3>
              <p className="mt-1 text-xs text-zinc-400">Instant crisp high-contrast black-to-white toggle.</p>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4 transition-colors duration-200 group-hover:bg-white group-hover:text-black">
                <span className="block font-bold text-xs text-white group-hover:text-black">Book Commercial Shoot</span>
                <span className="block text-[10px] text-zinc-400 group-hover:text-zinc-700 mt-0.5">High contrast flash</span>
              </div>
            </div>
          </TiltCard>

          {/* Card 6: Expandable Media */}
          <TiltCard className="rounded-[12px]">
            <div className="group h-full rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 transition-all duration-300 hover:border-zinc-600">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">06 / Expansion</span>
              <h3 className="mt-2 text-lg font-black text-white">Media Previews</h3>
              <p className="mt-1 text-xs text-zinc-400">Inline playable music tracks, video embeds, and galleries.</p>

              <div className="mt-6 rounded-[12px] border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-xs text-white">Stream "Afterlight"</span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">Direct Spotify & Apple Music player</span>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                  <Play size={12} className="ml-0.5" />
                </span>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 6. "One Link. Infinite Styles." Theme Showcase ─────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28" id="themes">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Design Showcase</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            ONE LINK. <br />
            <span className="text-zinc-500">INFINITE STYLES.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            Explore curated design presets crafted for every aesthetic. From raw brutalist monochrome to smooth liquid gradients.
          </p>
        </div>

        {/* Carousel Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {SHOWCASE_THEMES.map((theme, idx) => (
            <button
              key={theme.id}
              onClick={() => setActiveShowcaseIndex(idx)}
              className={`rounded-[8px] px-4 py-2 text-xs font-bold transition ${
                activeShowcaseIndex === idx
                  ? 'bg-white text-black shadow-lg font-extrabold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>

        {/* Showcase Banner Card */}
        <div
          className="rounded-[14px] border border-zinc-800 p-8 sm:p-14 transition-all duration-700 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            background: currentShowcaseTheme.bg,
            color: currentShowcaseTheme.textColor,
            fontFamily: currentShowcaseTheme.font,
          }}
        >
          <div className="space-y-4 max-w-md text-center md:text-left">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-md"
              style={{
                background: currentShowcaseTheme.id === 'editorial' ? '#00000010' : 'rgba(255,255,255,0.15)',
                color: currentShowcaseTheme.textColor,
              }}
            >
              Preset #{activeShowcaseIndex + 1} • {currentShowcaseTheme.handle}
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{currentShowcaseTheme.name}</h3>
            <p className="text-xs sm:text-sm opacity-85 leading-relaxed font-medium">
              {currentShowcaseTheme.bio}
            </p>

            {/* Socials Bar */}
            <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
              {currentShowcaseTheme.socials.map((s) => (
                <span
                  key={s}
                  className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                  style={{
                    background: currentShowcaseTheme.id === 'editorial' ? '#000000' : 'rgba(0,0,0,0.8)',
                    color: '#FFFFFF',
                  }}
                >
                  <i className={ICONS[s]?.className || 'fa-solid fa-link'} style={{ fontSize: 13 }} />
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs space-y-2.5">
            {currentShowcaseTheme.links.map((l, i) => {
              const iconMeta = ICONS[l.icon] || { className: 'fa-solid fa-link' };
              return (
                <div
                  key={i}
                  className="w-full rounded-2xl p-4 text-left border shadow-md transition hover:scale-105 duration-200"
                  style={{
                    background: currentShowcaseTheme.cardBg,
                    color: currentShowcaseTheme.buttonTextColor,
                    borderColor: currentShowcaseTheme.id === 'editorial' ? '#00000015' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-xl text-xs shrink-0"
                      style={{
                        background: currentShowcaseTheme.id === 'editorial' ? '#00000010' : 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <i className={iconMeta.className} />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-bold text-xs truncate">{l.title}</span>
                      <span className="block text-[10px] opacity-65 truncate mt-0.5">{l.subtitle}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. "Build With Blocks" Interactive Block Stack ─────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28" id="blocks">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Modular Composition</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            BUILD WITH BLOCKS. <br />
            <span className="text-zinc-500">Not just a list of buttons.</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            Combine headings, text bios, video embeds, circular social bars, photo grids, and callouts to craft an expressive page.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Block Selector Tray (Left) */}
          <div className="lg:col-span-5 space-y-2.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Click to toggle blocks in live builder:
            </span>

            {AVAILABLE_BLOCKS.map((blk) => {
              const Icon = blk.icon;
              const isIncluded = builtBlocks.includes(blk.id);
              return (
                <button
                  key={blk.id}
                  onClick={() => toggleBlockInBuilder(blk.id)}
                  className={`flex w-full items-center justify-between rounded-[8px] border p-3.5 text-left transition ${
                    isIncluded
                      ? 'border-white bg-zinc-900 text-white shadow-md'
                      : 'border-zinc-850 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isIncluded ? 'bg-white text-black font-black' : 'bg-zinc-900 text-zinc-400'}`}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-white">{blk.name}</span>
                      <span className="block text-[10px] text-zinc-400">{blk.desc}</span>
                    </div>
                  </div>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isIncluded ? 'bg-white text-black' : 'border border-zinc-800 text-zinc-600'}`}>
                    {isIncluded ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mock Assembling Page (Right) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-sm rounded-[36px] border border-zinc-800 bg-zinc-950 p-6 space-y-3.5 animate-profile-in">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center font-black text-xs">
                    JD
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-white">@jordan.design</span>
                    <span className="block text-[10px] text-zinc-500">Live Builder Simulator</span>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                  {builtBlocks.length} blocks
                </span>
              </div>

              {/* Render Selected Dynamic Blocks */}
              {builtBlocks.includes('socials') && (
                <div className="flex items-center justify-center gap-2 py-1 animate-profile-in">
                  {['telegram', 'facebook', 'instagram', 'youtube', 'github'].map((s) => (
                    <span key={s} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white border border-zinc-800 shadow-xs">
                      <i className={ICONS[s]?.className || 'fa-solid fa-link'} style={{ fontSize: 12 }} />
                    </span>
                  ))}
                </div>
              )}

              {builtBlocks.includes('callout') && (
                <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-zinc-900 to-zinc-800 p-3.5 text-xs text-white flex items-center justify-between animate-profile-in shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black font-black text-[10px]">
                      🔥
                    </span>
                    <span className="font-black text-xs">Special Drop: 2026 Edition Live!</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Claim &rarr;</span>
                </div>
              )}

              {builtBlocks.includes('link') && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 text-left text-white animate-profile-in hover:border-zinc-500 hover:-translate-y-0.5 transition cursor-pointer shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-white text-xs">
                        <Globe size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-xs block leading-tight">Design Engineering Portfolio</span>
                        <span className="block text-[10px] text-zinc-400 mt-0.5">Selected creative cases & open-source</span>
                      </div>
                    </div>
                    <MoveUpRight size={12} className="text-zinc-400" />
                  </div>
                </div>
              )}

              {builtBlocks.includes('image') && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 h-32 flex flex-col justify-end p-3 animate-profile-in shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/60 via-purple-900/30 to-zinc-950" />
                  <div className="relative z-20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Exhibition Drop</span>
                      <span className="block text-xs font-black text-white">Fine-Art Studio Photography</span>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-black">New</span>
                  </div>
                </div>
              )}

              {builtBlocks.includes('video') && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 h-28 flex items-center justify-center animate-profile-in shadow-md group cursor-pointer">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/40 to-zinc-950" />
                  <div className="relative z-10 flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-110">
                      <Play size={16} className="ml-0.5 fill-white" />
                    </span>
                    <div className="text-left">
                      <span className="block text-xs font-black text-white leading-tight">Interactive UI Breakdown</span>
                      <span className="block text-[10px] text-zinc-400 mt-0.5">YouTube • 14:20 HD</span>
                    </div>
                  </div>
                </div>
              )}

              {builtBlocks.includes('grid') && (
                <div className="grid grid-cols-3 gap-2 animate-profile-in">
                  {[
                    { label: 'Lookbook', bg: 'from-amber-900/40 to-zinc-900' },
                    { label: 'Editorial', bg: 'from-emerald-900/40 to-zinc-900' },
                    { label: 'Backstage', bg: 'from-blue-900/40 to-zinc-900' },
                  ].map((g, idx) => (
                    <div
                      key={idx}
                      className={`h-16 rounded-xl border border-zinc-800 bg-gradient-to-br ${g.bg} flex flex-col justify-end p-1.5 text-left shadow-xs`}
                    >
                      <span className="text-[9px] font-bold text-zinc-300">{g.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {builtBlocks.includes('divider') && (
                <div className="py-2 animate-profile-in">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* ── 9. "Built for Everyone" Audience Grid ───────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tailored For Creators</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            BUILT FOR EVERYONE.
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
            Whether you create videos, produce music, write code, or run a local business — Link-in-Bio adapts to your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Creators */}
          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-black">
              <Camera size={18} />
            </span>
            <h3 className="text-base font-bold text-white">Creators & Artists</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Consolidate YouTube channels, TikTok reels, photography drops, and brand sponsors into one link.
            </p>
          </div>

          {/* Developers & Designers */}
          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-black">
              <Code size={18} />
            </span>
            <h3 className="text-base font-bold text-white">Developers & Coders</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Share GitHub repos, tech blogs, interactive demos, and curriculum vitae with a clean terminal aesthetic.
            </p>
          </div>

          {/* Musicians */}
          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-black">
              <Music size={18} />
            </span>
            <h3 className="text-base font-bold text-white">Musicians & DJs</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct fans to Spotify, Apple Music, SoundCloud, upcoming tour dates, and vinyl merchandise drops.
            </p>
          </div>

          {/* Businesses & Brands */}
          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-6 sm:p-7 space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black font-black">
              <Store size={18} />
            </span>
            <h3 className="text-base font-bold text-white">Businesses & Brands</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Showcase physical locations, menu links, WhatsApp ordering, customer support, and seasonal promotions.
            </p>
          </div>
        </div>
      </section>

      {/* ── 10. "How It Works" (01 → 02 → 03) ────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Simple 3-Step Setup</span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            CREATE. CUSTOMIZE. SHARE.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-7 space-y-3">
            <span className="font-mono text-xs font-bold text-zinc-500">01</span>
            <h3 className="text-lg font-black text-white">Claim Your Handle</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pick your unique personal username at <code className="text-white">{APP_DOMAIN}/yourname</code> in 10 seconds.
            </p>
          </div>

          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-7 space-y-3">
            <span className="font-mono text-xs font-bold text-zinc-500">02</span>
            <h3 className="text-lg font-black text-white">Customize & Add Blocks</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Add your links, Telegram/Facebook circular icons, videos, custom fonts, colors, and motion animations.
            </p>
          </div>

          <div className="rounded-[12px] border border-zinc-800 bg-zinc-950 p-7 space-y-3">
            <span className="font-mono text-xs font-bold text-zinc-500">03</span>
            <h3 className="text-lg font-black text-white">Share Everywhere</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Put your clean link on Instagram, TikTok, WhatsApp, X, and watch your visitor clicks grow in real-time analytics.
            </p>
          </div>
        </div>
      </section>

      {/* ── 11. Interactive Demo Generator CTA ──────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-none">
        <div className="border-t border-b border-zinc-800 bg-zinc-950 py-16 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Instant Preview</span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-black text-white tracking-tight">
            See what your link page looks like.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto font-medium">
            Enter your desired name or handle to instantly generate your profile preview:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/signup?username=${encodeURIComponent(demoHandle)}`;
            }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto px-4"
          >
            <div className="flex items-center rounded-[10px] border border-zinc-800 bg-zinc-900/90 p-1.5 w-full focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 transition shadow-lg">
              <span className="flex items-center gap-1.5 rounded-[7px] bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono font-bold text-zinc-400 select-none shrink-0">
                <Globe size={13} className="text-zinc-500" />
                <span>{APP_DOMAIN}/</span>
              </span>
              <input
                type="text"
                value={demoHandle}
                onChange={(e) => setDemoHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="yourname"
                className="w-full bg-transparent px-2.5 text-xs sm:text-sm font-mono font-bold text-white outline-none placeholder:text-zinc-600"
              />
            </div>
            <MagneticButton
              as="button"
              type="submit"
              strength={0.2}
              className="w-full sm:w-auto rounded-[8px] bg-white px-6 py-3.5 text-xs font-black text-black transition hover:bg-zinc-200 active:scale-95 shrink-0"
            >
              Build my page
            </MagneticButton>
          </form>
        </div>
      </section>

      {/* ── 12. FAQ Accordion Section ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-8 sm:py-28" id="faq">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Questions & Answers</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
            FREQUENTLY ASKED QUESTIONS.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-[8px] border border-zinc-850 bg-zinc-950 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-zinc-300"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 shrink-0 ml-2 ${openFaq === idx ? 'rotate-180 text-white' : 'text-zinc-500'}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-0 text-xs text-zinc-400 leading-relaxed font-medium border-t border-zinc-900">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 13. Giant Editorial Footer CTA ──────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24 text-center border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Launch Your Identity</span>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Make your link unforgettable.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 font-medium max-w-lg mx-auto">
            Join thousands of creators, musicians, and developers crafting modern links.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton
              href="/signup"
              strength={0.25}
              className="flex items-center gap-2 rounded-[8px] bg-white px-8 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200 active:scale-95 hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <span>Get started free</span>
              <ArrowRight size={16} />
            </MagneticButton>

            <Link
              href="/login"
              className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-6 py-3.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── 14. Comprehensive Editorial Monochrome Footer ───────────────────── */}
      <footer className="relative z-10 border-t border-zinc-900 bg-black py-16 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          {/* Giant Background Watermark Text */}
          <div className="pb-12 text-center select-none overflow-hidden opacity-10 font-black text-5xl sm:text-8xl lg:text-9xl tracking-tighter text-white">
            LINK·IN·BIO
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {/* Column 1: Brand */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-2 space-y-4">
              <BrandLogo size="md" variant="full" theme="light" />
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-medium">
                The next-generation link platform. Minimalist, fast, and completely customizable for modern creators.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                <Command size={12} />
                <span>Tip: Press <kbd className="font-mono bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-white">B</kbd> to toggle monochrome inversion</span>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-2.5">
              <span className="block font-bold text-white text-xs uppercase tracking-wider">Product</span>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#hero" className="hover:text-white transition">Live Demo</a></li>
                <li><a href="#customize" className="hover:text-white transition">Customization</a></li>
                <li><a href="#animations" className="hover:text-white transition">Kinetic Physics</a></li>
                <li><a href="#themes" className="hover:text-white transition">Themes</a></li>
                <li><a href="#blocks" className="hover:text-white transition">Blocks</a></li>
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div className="space-y-2.5">
              <span className="block font-bold text-white text-xs uppercase tracking-wider">Platform</span>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/dashboard" className="hover:text-white transition">Creator Dashboard</Link></li>
                <li><Link href="/dashboard/theme" className="hover:text-white transition">Appearance & Themes</Link></li>
                <li><Link href="/dashboard/analytics" className="hover:text-white transition">Analytics & Insights</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-white transition">Account & Security</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal & Safety */}
            <div className="space-y-2.5">
              <span className="block font-bold text-white text-xs uppercase tracking-wider">Legal & Trust</span>
              <ul className="space-y-2 text-zinc-400">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/terms#safety" className="hover:text-white transition">Trust & Safety Policy</Link></li>
                <li><a href="mailto:pmkaulani@gmail.com" className="hover:text-white transition">Report Content Abuse</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
            <p>© 2026 Link-in-Bio Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <span>•</span>
              <Link href="/dashboard/settings" className="hover:text-white transition">Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
