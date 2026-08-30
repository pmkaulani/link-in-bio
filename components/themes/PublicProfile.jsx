'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ICONS } from '../../lib/icons';
import { logPageView, logLinkClick } from '../../lib/analytics';
import { safeHref, safeColor, isWithinSchedule, resolvePageTextColor } from '../../lib/publicProfileUtils';
import BackgroundEffects from './BackgroundEffects';
import BrandLogo from '../BrandLogo';
import SocialIcon from '../ui/SocialIcon';
import {
  MoreVertical,
  Copy,
  Check,
  X,
  QrCode,
  Calendar,
  ShieldCheck,
  Flag,
  ArrowRight,
  AlertOctagon,
  CheckCircle2,
  Flame,
  ShieldAlert,
  UserX,
  FileWarning,
  HelpCircle,
  Megaphone,
  Link2,
  Contrast,
  Download,
  Share2,
  Globe,
  Play,
} from 'lucide-react';
import { APP_DOMAIN } from '../../lib/constants';

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

const GOOGLE_FONT_URLS = {
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap',
  outfit: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap',
  plus_jakarta: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap',
  playfair: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap',
  lora: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
  syne: 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&display=swap',
  quicksand: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap',
  montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap',
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
  spotlight: 'link-hover-spotlight',
  border_beam: 'link-hover-border-beam',
  lift: 'link-hover-lift',
  glow: 'link-hover-glow',
  scale: 'link-hover-scale',
  shine: 'link-hover-shine',
  tilt: 'link-hover-tilt',
};

function getBackground(profile) {
  const type = profile?.background_type || 'solid';
  const value = profile?.background_value || '#FFFFFF';
  if (type === 'image' && value) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.28)), url("${value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  if (type === 'solid') return { background: safeColor(value, '#FFFFFF') };
  if (type === 'gradient')
    return { background: value || 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #7c3aed 100%)' };
  return { background: '#FFFFFF' };
}

// ── 1. About Account Modal (Truthful metadata) ───────────────────────────────

function AboutAccountModal({ profile, isOpen, onClose }) {
  if (!isOpen) return null;

  const joinDate = profile.created_at ? new Date(profile.created_at) : new Date();
  const formattedMonthYear = joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const socialsList = profile.socials && typeof profile.socials === 'object'
    ? Object.keys(profile.socials).filter((k) => !k.startsWith('_') && typeof profile.socials[k] === 'string' && profile.socials[k].trim())
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl border border-zinc-200 text-black">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-black hover:bg-zinc-200"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-black tracking-tight">About this account</h3>
          <div className="mt-4 flex flex-col items-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-zinc-200 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-black text-white shadow-md">
                {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-1.5">
              <h4 className="text-base font-black text-black">
                {profile.display_name || profile.username}
              </h4>
              {profile.is_verified && (
                <ShieldCheck size={16} className="text-black shrink-0" title="Verified Creator" />
              )}
            </div>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 leading-relaxed">
              Public account metadata and authenticity overview on Linkinbio.
            </p>
          </div>
        </div>

        <div className="my-5 h-px w-full bg-zinc-200" />

        <div className="space-y-4 text-xs text-zinc-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black">
              <Calendar size={14} />
            </div>
            <div>
              <p className="font-bold text-black">Joined {formattedMonthYear}</p>
              <p className="mt-0.5 text-zinc-500">
                @{profile.username} created this profile on Linkinbio in {formattedMonthYear}.
              </p>
            </div>
          </div>

          {socialsList.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <ShieldCheck size={14} />
              </div>
              <div>
                <p className="font-bold text-black">Connected Links</p>
                <p className="mt-0.5 text-zinc-500">
                  Profile links listed by @{profile.username}:{' '}
                  <span className="font-semibold text-black capitalize">
                    {socialsList.join(', ')}
                  </span>.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-zinc-100 p-3.5 text-[11px] text-zinc-600">
            Linkinbio actively maintains Trust & Safety tools to protect community members against malicious links and scams.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Claim / Viral Join Modal ──────────────────────────────────────────────

function ClaimUsernameModal({ profile, isOpen, onClose }) {
  const router = useRouter();
  const [claimHandle, setClaimHandle] = useState('');

  if (!isOpen) return null;

  function handleClaim(e) {
    e.preventDefault();
    const handle = claimHandle.trim().replace(/^@/, '');
    if (handle) {
      router.push(`/signup?username=${encodeURIComponent(handle)}`);
    } else {
      router.push('/signup');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[36px] bg-black p-7 sm:p-9 shadow-2xl text-white border border-zinc-800">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white hover:bg-zinc-700"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-4">
          <BrandLogo size="lg" variant="full" theme="light" />
        </div>

        <div className="grid grid-cols-1 gap-6 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white">
              One link. <br />
              <span className="text-zinc-400">Completely you.</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-zinc-400 leading-relaxed">
              Share everything you create, curate, and sell across Instagram, TikTok, YouTube, and more with one clean link.
            </p>

            <form onSubmit={handleClaim} className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center rounded-2xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-inner focus-within:border-zinc-600 transition">
                <span className="flex items-center gap-1.5 rounded-xl bg-black border border-zinc-800 px-3 py-2 text-xs font-mono font-bold text-zinc-400 select-none shrink-0">
                  <Globe size={12} className="text-zinc-500" />
                  <span>{APP_DOMAIN}/</span>
                </span>
                <input
                  type="text"
                  value={claimHandle}
                  onChange={(e) => setClaimHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2.5 text-xs sm:text-sm font-mono font-bold text-white outline-none placeholder:text-zinc-600"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-xs sm:text-sm font-black text-black shadow-xl transition hover:bg-zinc-200 active:scale-95"
              >
                <span>Claim your Link-in-Bio</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-zinc-500">
              <Link href="/signup" className="underline hover:text-white">
                Sign up free
              </Link>
              <span>•</span>
              <button onClick={onClose} className="hover:text-white">
                Back to @{profile?.username || 'profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Individual Link & Profile Share Sheet (Linktree Grade) ─────────────────

function LinkShareModal({ linkData, profile, isOpen, onClose, onOpenReport }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !linkData) return null;

  const url = linkData.url || (typeof window !== 'undefined' ? window.location.href : '');
  let domain = '';
  if (url) {
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      domain = url;
    }
  }
  const icon = ICONS[linkData.icon] || ICONS.link;
  const creatorName = profile?.display_name || `@${profile?.username || 'creator'}`;
  const shareTitle = `${linkData.title || 'Check out this link'} — ${creatorName}`;

  function copyLink() {
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  function handleShareChannel(type) {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareTitle);

    let targetUrl = '';
    switch (type) {
      case 'x':
        targetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'linkedin':
        targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'messenger':
        targetUrl = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`;
        break;
      case 'snapchat':
        targetUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`;
        break;
      case 'email':
        targetUrl = `mailto:?subject=${encodedText}&body=${encodedUrl}`;
        break;
      default:
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-7 shadow-2xl border border-zinc-200 text-black max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 transition"
          title="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <h3 className="text-center text-base font-black tracking-tight text-black">Share link</h3>

        {/* Elevated Preview Card */}
        <div className="mt-4 rounded-3xl bg-zinc-50/80 p-6 text-center border border-zinc-200/80 shadow-md flex flex-col items-center">
          {/* Avatar / Icon */}
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            {linkData.thumbnail_url ? (
              <img src={linkData.thumbnail_url} alt="" className="h-full w-full object-cover rounded-2xl" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <span className="text-xl font-black">
                {(linkData.title || profile?.username || 'L').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {profile?.display_name || `@${profile?.username || 'creator'}`}
          </span>

          <h4 className="mt-2 text-base sm:text-lg font-black text-black leading-tight">
            {linkData.title || 'Featured Link'}
          </h4>

          <p className="mt-1 text-xs font-mono font-bold text-zinc-400 truncate max-w-full">
            {domain || url}
          </p>

          {linkData.subtitle && (
            <p className="mt-2.5 max-w-xs text-xs text-zinc-600 leading-relaxed font-medium">
              {linkData.subtitle}
            </p>
          )}
        </div>

        {/* Horizontal Social Channels Row */}
        <div className="mt-6 flex items-start justify-between gap-1 overflow-x-auto pb-2 scrollbar-none text-center">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full transition duration-200 ${
                copied ? 'bg-emerald-600 text-white' : 'bg-zinc-100 group-hover:bg-zinc-200 text-black'
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">
              {copied ? 'Copied!' : 'Copy link'}
            </span>
          </button>

          {/* X (Twitter) */}
          <button
            onClick={() => handleShareChannel('x')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="twitter" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">X</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleShareChannel('facebook')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="facebook" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">Facebook</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => handleShareChannel('whatsapp')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="whatsapp" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">WhatsApp</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleShareChannel('linkedin')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="linkedin" className="text-[19px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">LinkedIn</span>
          </button>

          {/* Snapchat */}
          <button
            onClick={() => handleShareChannel('snapchat')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFC00] text-black transition hover:scale-105 shadow-xs">
              <SocialIcon name="snapchat" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">Snapchat</span>
          </button>
        </div>

        {/* Promotion Banner */}
        <div className="mt-5 border-t border-zinc-200 pt-5 text-left">
          <h5 className="text-xs font-black text-black">
            Join {creatorName} on Link-in-Bio
          </h5>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Get your own free Link-in-Bio. The fast, minimal link platform trusted by modern creators.
          </p>

          <div className="mt-3.5 flex items-center gap-2">
            <Link
              href="/signup"
              className="flex-1 text-center rounded-full bg-black py-2.5 text-xs font-black text-white transition hover:bg-zinc-800 active:scale-95 shadow-sm"
            >
              Sign up free
            </Link>
            <Link
              href="/"
              className="flex-1 text-center rounded-full border border-zinc-300 bg-white py-2.5 text-xs font-bold text-black transition hover:bg-zinc-50 active:scale-95"
            >
              Find out more
            </Link>
          </div>
        </div>

        {/* Report Link */}
        <div className="mt-4 pt-3 flex justify-center text-center">
          <button
            onClick={() => {
              onClose();
              onOpenReport(linkData.title || url, linkData.id);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-600 transition"
          >
            <Flag size={13} />
            <span>Report link</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 4. Profile Share Modal (Linktree Grade with QR Code) ─────────────────────

function ProfileShareModal({ profile, isOpen, onClose, onOpenReport }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const creatorName = profile?.display_name || `@${profile?.username || 'creator'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(pageUrl)}`;
  const shareTitle = `Check out ${creatorName}'s profile on Link-in-Bio`;

  function copyLink() {
    if (pageUrl && navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  function downloadQrWithBadge() {
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Background and QR code
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 24, 24, size - 48, size - 48);

      // Centered dark badge with rounded corners
      const badgeSize = 130;
      const badgeX = (size - badgeSize) / 2;
      const badgeY = (size - badgeSize) / 2;
      const radius = 28;

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Draw interlocking link chains
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';

      // Left link loop
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize * 0.4, badgeY + badgeSize * 0.5, 20, 0.75 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();

      // Right link loop
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize * 0.6, badgeY + badgeSize * 0.5, 20, 1.75 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();

      const link = document.createElement('a');
      link.download = `${profile?.username || 'link-in-bio'}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrUrl;
  }

  function handleShareChannel(type) {
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedText = encodeURIComponent(shareTitle);

    let targetUrl = '';
    switch (type) {
      case 'x':
        targetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'linkedin':
        targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'snapchat':
        targetUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`;
        break;
      default:
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-7 shadow-2xl border border-zinc-200 text-black max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 transition"
          title="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <h3 className="text-center text-base font-black tracking-tight text-black">Share profile</h3>

        {/* Elevated Preview Card */}
        <div className="mt-4 rounded-3xl bg-zinc-50/80 p-6 text-center border border-zinc-200/80 shadow-md flex flex-col items-center">
          {showQr ? (
            <div className="flex flex-col items-center">
              {/* QR Code Container with Centered App Icon Badge */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-black bg-black p-3.5 shadow-2xl">
                <img src={qrUrl} alt="QR code" className="h-44 w-44 rounded-2xl object-contain bg-white p-1.5" />
                
                {/* Apps Interlocking Link Icon in the Middle */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-2xl bg-black border-2 border-white shadow-2xl">
                  <Link2 size={20} className="text-white" strokeWidth={2.8} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={downloadQrWithBadge}
                  className="flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95"
                >
                  <Download size={13} />
                  <span>Save QR image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="text-xs font-bold text-zinc-500 hover:text-black underline"
                >
                  Show card preview
                </button>
              </div>
            </div>
          ) : (
            <>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={creatorName}
                  className="mb-3 h-16 w-16 rounded-full border-2 border-zinc-200 object-cover shadow-sm"
                />
              ) : (
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-black text-white shadow-sm">
                  {(profile?.display_name || profile?.username || '?').slice(0, 2).toUpperCase()}
                </div>
              )}

              <h4 className="text-lg font-black text-black leading-tight">
                {profile?.display_name || `@${profile?.username}`}
              </h4>

              <p className="mt-0.5 text-xs font-mono font-bold text-zinc-400">
                {APP_DOMAIN}/{profile?.username}
              </p>

              {profile?.bio && (
                <p className="mt-2 max-w-xs text-xs text-zinc-600 leading-relaxed font-medium">
                  {profile.bio}
                </p>
              )}

              <button
                onClick={() => setShowQr(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 shadow-xs"
              >
                <QrCode size={13} />
                <span>Show QR badge</span>
              </button>
            </>
          )}
        </div>

        {/* Horizontal Social Channels Row */}
        <div className="mt-6 flex items-start justify-between gap-1 overflow-x-auto pb-2 scrollbar-none text-center">
          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full transition duration-200 ${
                copied ? 'bg-emerald-600 text-white' : 'bg-zinc-100 group-hover:bg-zinc-200 text-black'
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">
              {copied ? 'Copied!' : 'Copy link'}
            </span>
          </button>

          {/* X (Twitter) */}
          <button
            onClick={() => handleShareChannel('x')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="twitter" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">X</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleShareChannel('facebook')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="facebook" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">Facebook</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => handleShareChannel('whatsapp')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="whatsapp" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">WhatsApp</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => handleShareChannel('linkedin')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white transition hover:scale-105 shadow-xs">
              <SocialIcon name="linkedin" className="text-[19px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">LinkedIn</span>
          </button>

          {/* Snapchat */}
          <button
            onClick={() => handleShareChannel('snapchat')}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none min-w-[54px]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFC00] text-black transition hover:scale-105 shadow-xs">
              <SocialIcon name="snapchat" className="text-[20px]" />
            </span>
            <span className="text-[11px] font-bold text-zinc-600 group-hover:text-black">Snapchat</span>
          </button>
        </div>

        {/* Promotion Banner */}
        <div className="mt-5 border-t border-zinc-200 pt-5 text-left">
          <h5 className="text-xs font-black text-black">
            Join {creatorName} on Link-in-Bio
          </h5>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Get your own free Link-in-Bio. The fast, minimal link platform trusted by modern creators.
          </p>

          <div className="mt-3.5 flex items-center gap-2">
            <Link
              href="/signup"
              className="flex-1 text-center rounded-full bg-black py-2.5 text-xs font-black text-white transition hover:bg-zinc-800 active:scale-95 shadow-sm"
            >
              Sign up free
            </Link>
            <Link
              href="/"
              className="flex-1 text-center rounded-full border border-zinc-300 bg-white py-2.5 text-xs font-bold text-black transition hover:bg-zinc-50 active:scale-95"
            >
              Find out more
            </Link>
          </div>
        </div>

        {/* Report Link */}
        <div className="mt-4 pt-3 flex justify-center text-center">
          <button
            onClick={() => {
              onClose();
              if (onOpenReport) onOpenReport('Account profile');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-600 transition"
          >
            <Flag size={13} />
            <span>Report this profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 5. Report Modal Connected to API ─────────────────────────────────────────

function ReportModal({ profile, initialTarget, targetBlockId, isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('Spam, Phishing, or Scam');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const CATEGORIES = [
    { id: 'spam', label: 'Spam, Phishing, or Scam', desc: 'Misleading links or fraud attempts', icon: ShieldAlert },
    { id: 'harmful', label: 'Harmful or Dangerous', desc: 'Violent or dangerous material', icon: Flame },
    { id: 'harassment', label: 'Harassment or Hate', desc: 'Bullying, threats, or hate speech', icon: AlertOctagon },
    { id: 'copyright', label: 'Copyright or IP', desc: 'Infringing intellectual property', icon: FileWarning },
    { id: 'impersonation', label: 'Impersonation', desc: 'Posing as another creator or brand', icon: UserX },
    { id: 'other', label: 'Other Policy Violation', desc: 'Other safety concern', icon: HelpCircle },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_profile_id: profile.id,
          reported_block_id: targetBlockId || null,
          reporter_email: email,
          reason: selectedCategory,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        setEmail('');
        onClose();
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-profile-in">
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-7 shadow-2xl border border-zinc-200 text-black max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-black hover:bg-zinc-200"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertOctagon size={20} />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">Report Account or Link</h3>
            <p className="text-xs text-zinc-500">@{profile?.username || 'user'}</p>
          </div>
        </div>

        {submitted ? (
          <div className="mt-6 flex flex-col items-center gap-2.5 rounded-2xl bg-zinc-100 p-6 text-center text-black">
            <CheckCircle2 size={32} className="text-black" />
            <h4 className="text-sm font-black">Report Logged</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Thank you for keeping our community safe. Our Trust & Safety team has received your report for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {initialTarget && (
              <div className="rounded-xl bg-zinc-100 p-2.5 text-[11px] text-zinc-700 border border-zinc-200">
                <span className="font-bold">Targeted Item:</span> {initialTarget}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Select reason for report
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.label;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`flex items-start gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                        isSelected
                          ? 'border-black bg-zinc-100 text-black shadow-xs'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-black text-white' : 'bg-zinc-100 text-black'
                        }`}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight">{cat.label}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight line-clamp-1">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Additional context (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what is misleading, deceptive, or violating policies..."
                rows={2}
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs font-semibold text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Your email (optional, for case updates)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-600 font-bold">{errorMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── 6. Block Renderers ───────────────────────────────────────────────────────

function LinkBlock({ data, profile, index, blockId, onOpenShareLink }) {
  const primary = safeColor(profile?.primary_color, '#000000');
  const pageText = safeColor(profile?.text_color, '#000000');
  const buttonRadius = Number.isInteger(profile?.button_radius) ? profile.button_radius : 24;
  const buttonStyle = profile?.button_style || 'fill';
  const icon = ICONS[data.icon] || ICONS.link;
  const animation = ANIMATIONS[data.animation || 'slideUp'] || '';
  const hover = HOVERS[data.hover_effect || 'lift'] || '';
  const delay = Math.min(index * 80, 700);

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
    extraClass =
      'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5';
  } else {
    linkBg =
      data.background_type === 'solid'
        ? safeColor(data.background_value, primary)
        : data.background_type === 'gradient'
        ? data.background_value || `linear-gradient(135deg, ${primary}, #000000)`
        : primary;

    const isLightButton =
      !data.background_type ||
      (data.background_type === 'solid' &&
        (!data.background_value ||
          data.background_value.toLowerCase() === '#ffffff' ||
          data.background_value.toLowerCase().startsWith('#f')));
    buttonText = data.is_featured
      ? '#ffffff'
      : data.text_color
      ? safeColor(data.text_color, isLightButton ? '#000000' : '#ffffff')
      : isLightButton
      ? '#000000'
      : '#ffffff';
    extraClass = 'shadow-lg hover:shadow-xl';
  }

  function handleOptionsClick(e) {
    e.preventDefault();
    e.stopPropagation();
    onOpenShareLink(data);
  }

  return (
    <div className="group relative w-full">
      <a
        href={safeHref(data.url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logLinkClick(profile.id, blockId)}
        className={`relative flex w-full items-center gap-3.5 overflow-hidden px-4 py-3.5 transition-all duration-300 ${extraClass} ${animation} ${hover}`}
        style={{
          animationDelay: `${delay}ms`,
          borderRadius: `${buttonRadius}px`,
          background: linkBg,
          color: buttonText,
        }}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/5"
          style={{ color: data.is_featured ? '#ffffff' : icon.color }}
        >
          {data.thumbnail_url ? (
            <img src={data.thumbnail_url} alt="" className="h-full w-full object-cover rounded-full" />
          ) : (
            <SocialIcon name={icon.className} className="text-lg transition-transform duration-300 group-hover:scale-110" />
          )}
        </span>
        <span className="min-w-0 flex-1 pr-8 text-left">
          <span className="block truncate font-bold text-[15px]">{data.title || 'Untitled link'}</span>
          {data.subtitle && <span className="mt-0.5 block truncate text-xs opacity-65">{data.subtitle}</span>}
        </span>
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      </a>

      <button
        type="button"
        onClick={handleOptionsClick}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 transition"
        style={{ color: buttonText }}
        title="Share link"
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );
}

function HeadingBlock({ data, profile }) {
  const text = resolvePageTextColor(profile);
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' };
  return (
    <h2
      className={`font-extrabold ${sizes[data.size] || 'text-lg'} text-center animate-profile-in tracking-tight my-1`}
      style={{ color: text }}
    >
      {data.text || 'Heading'}
    </h2>
  );
}

function TextBlock({ data, profile }) {
  const text = resolvePageTextColor(profile);
  return (
    <p
      className="text-sm font-medium leading-relaxed text-center opacity-85 animate-profile-in my-1"
      style={{ color: text }}
    >
      {data.text || ''}
    </p>
  );
}

function CalloutBlock({ data, profile }) {
  const primary = safeColor(profile?.primary_color, '#000000');
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-bold shadow-md my-1 border animate-profile-in w-full"
      style={{
        backgroundColor: `${primary}12`,
        borderColor: `${primary}30`,
        color: resolvePageTextColor(profile),
      }}
    >
      <Megaphone size={18} className="shrink-0 opacity-80" />
      <span className="leading-relaxed">{data.text || ''}</span>
    </div>
  );
}

function ImageBlock({ data }) {
  if (!data.url) return null;
  return (
    <div className="overflow-hidden rounded-2xl animate-profile-in shadow-md my-1 w-full">
      <img
        src={data.url}
        alt={data.alt || ''}
        loading="lazy"
        decoding="async"
        className="w-full object-cover"
        style={{ maxHeight: 320 }}
      />
      {data.caption && <p className="mt-2 text-center text-xs opacity-75">{data.caption}</p>}
    </div>
  );
}

function VideoBlock({ data }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const url = data.url || '';
  let embedUrl = '';
  let posterUrl = null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1`;
    posterUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  if (!embedUrl) return null;

  if (!isPlaying && posterUrl) {
    return (
      <div
        onClick={() => setIsPlaying(true)}
        className="group relative overflow-hidden rounded-2xl animate-profile-in shadow-md my-1 w-full cursor-pointer bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        <img
          src={posterUrl}
          alt="Video thumbnail"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform group-hover:scale-110">
            <Play size={22} className="ml-1 fill-black text-black" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl animate-profile-in shadow-md my-1 w-full" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={embedUrl}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function DividerBlock({ data, profile }) {
  const text = resolvePageTextColor(profile);
  const styles = {
    line: { borderTop: `1px solid ${text}33` },
    dots: { borderTop: `2px dotted ${text}33` },
    dashed: { borderTop: `2px dashed ${text}33` },
    fade: { background: `linear-gradient(90deg, transparent, ${text}33, transparent)`, height: 1 },
  };
  return <div className="my-3 w-full" style={styles[data.style] || styles.line} />;
}

function SpacerBlock({ data }) {
  return <div style={{ height: data.height || 32 }} />;
}

function GridBlock({ data }) {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i?.thumbnail_url) : [];
  if (items.length === 0) return null;
  return (
    <div className="grid animate-profile-in grid-cols-3 gap-1.5 overflow-hidden rounded-2xl my-1 w-full">
      {items.slice(0, 12).map((item, i) => (
        <a
          key={i}
          href={safeHref(item.link_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-xl bg-black/10 shadow-xs"
        >
          <img
            src={item.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}

const RENDERERS = {
  link: LinkBlock,
  heading: HeadingBlock,
  text: TextBlock,
  callout: CalloutBlock,
  image: ImageBlock,
  video: VideoBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  grid: GridBlock,
};

// ── 7. Main PublicProfile Component ──────────────────────────────────────────

export default function PublicProfile({ profile, blocks }) {
  const [cursor, setCursor] = useState({ x: 50, y: 45 });
  const [shareOpen, setShareOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState('');
  const [reportTargetBlockId, setReportTargetBlockId] = useState(null);
  const [activeShareLink, setActiveShareLink] = useState(null);

  const primary = safeColor(profile?.primary_color, '#000000');
  const text = resolvePageTextColor(profile || {});
  // theme editor saves as font_family; legacy DB column is font — support both
  const fontKey = profile?.font_family || profile?.font || 'inter';
  const font = FONT_MAP[fontKey] || FONT_MAP.inter;

  // Filter out disabled blocks (Trust & Safety moderation) and scheduled blocks
  const visibleBlocks = (blocks || []).filter((b) => b.is_visible !== false && !b.is_disabled && isWithinSchedule(b.data));

  // Check if account is suspended
  const isSuspended = profile?.account_status === 'suspended' || profile?.account_status === 'banned';

  useEffect(() => {
    if (profile?.id && !isSuspended) {
      logPageView(profile.id);
    }
  }, [profile?.id, isSuspended]);

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  function handleOpenSpecificReport(target, blockId = null) {
    setReportTarget(target || '');
    setReportTargetBlockId(blockId);
    setReportOpen(true);
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-black">Profile Unavailable</h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            This Link-in-Bio profile is currently suspended by Trust & Safety for review.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200">
            Return to Link-in-Bio
          </Link>
        </div>
      </div>
    );
  }

  const customFontUrl = GOOGLE_FONT_URLS[fontKey];

  return (
    <>
      {customFontUrl && (
        <link rel="stylesheet" href={customFontUrl} />
      )}
      <div className="min-h-screen w-full bg-[#18181B] flex items-center justify-center p-0 sm:p-6 md:p-10">
        <main
          className="link-page relative w-full sm:max-w-[580px] min-h-screen sm:min-h-[850px] sm:rounded-[36px] overflow-hidden px-5 py-8 sm:px-8 sm:py-10 flex flex-col items-center justify-between shadow-2xl transition-all duration-300"
          style={{
            ...getBackground(profile || {}),
            color: text,
            fontFamily: font,
          }}
          onMouseMove={profile?.cursor_glow !== 'none' ? handleMove : undefined}
        >
        <BackgroundEffects effect={profile?.bg_effect || 'none'} primary={primary} />

        {profile?.cursor_glow !== 'none' && (
          <div
            className="pointer-events-none absolute inset-0 opacity-80 transition-all duration-700 ease-out"
            style={{
              background:
                profile?.cursor_glow === 'subtle'
                  ? `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, ${primary}25 0%, transparent 22%)`
                  : profile?.cursor_glow === 'white'
                  ? `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, rgba(255,255,255,0.2) 0%, transparent 25%)`
                  : `radial-gradient(circle at ${cursor.x}% ${cursor.y}%, ${primary}55 0%, transparent 28%)`,
            }}
          />
        )}

        {/* Content Viewport */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Top Header Bar */}
          <div className="flex w-full items-center justify-between mb-8 px-1">
            <button
              onClick={() => setClaimOpen(true)}
              className="flex items-center transition hover:opacity-80 active:scale-95"
              style={{ color: text }}
              title="Create your Link-in-Bio"
            >
              <BrandLogo size="sm" variant="text" theme="current" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-current/20 bg-white/20 backdrop-blur-md transition hover:scale-110 shadow-sm"
                style={{ color: text }}
                title="Share profile"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Profile Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="mb-4 h-24 w-24 rounded-full border-[3px] border-current/20 object-cover shadow-2xl animate-profile-in"
            />
          ) : (
            <div
              className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-current/20 bg-current/10 text-2xl font-black shadow-2xl animate-profile-in"
              style={{ color: text }}
            >
              {(profile?.display_name || profile?.username || '?').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Identity & Verified Badge */}
          <div className="flex items-center gap-1.5 animate-profile-in">
            <h1
              className="text-center text-2xl font-black tracking-tight sm:text-3xl"
              style={{ color: text }}
            >
              @{profile?.username || 'username'}
            </h1>
            {profile?.is_verified && (
              <ShieldCheck size={20} style={{ color: text }} className="shrink-0" title="Verified Creator" />
            )}
          </div>

          {profile?.display_name && profile.display_name !== profile.username && (
            <p className="animate-profile-in mt-0.5 text-sm font-semibold opacity-75" style={{ color: text }}>
              {profile.display_name}
            </p>
          )}

          {profile?.bio && (
            <p
              className="animate-profile-in mt-3 max-w-[420px] text-center text-xs sm:text-sm leading-relaxed opacity-85 font-medium"
              style={{ color: text }}
            >
              {profile.bio}
            </p>
          )}

          {/* Persistent Social Media Icons (Linktree style circular buttons) */}
          {profile?.socials && typeof profile.socials === 'object' && (
            <div className="animate-profile-in mt-4 flex flex-wrap justify-center gap-3">
              {Object.entries(profile.socials)
                .filter(([name, url]) => Boolean(!name.startsWith('_') && typeof url === 'string' && url.trim()))
                .map(([name, url]) => {
                  const icon = ICONS[name] || ICONS.link;
                  return (
                    <a
                      key={name}
                      href={safeHref(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-11 w-11 items-center justify-center rounded-full bg-black/90 text-white shadow-md transition-all duration-200 hover:scale-115 hover:bg-black hover:shadow-lg active:scale-95 border border-white/10"
                      aria-label={icon.label || name}
                      title={icon.label || name}
                    >
                      <SocialIcon name={icon.className} className="text-[20px] transition-transform duration-200 group-hover:scale-105" />
                    </a>
                  );
                })}
            </div>
          )}

          {/* Blocks */}
          <nav className="mt-7 flex w-full flex-col gap-3">
            {visibleBlocks.map((block, index) => {
              const Renderer = RENDERERS[block.type];
              if (!Renderer) return null;
              return (
                <Renderer
                  key={block.id}
                  data={block.data || {}}
                  profile={profile}
                  index={index}
                  blockId={block.id}
                  onOpenShareLink={(data) => setActiveShareLink(data)}
                />
              );
            })}
          </nav>

          {/* Viral Conversion Join Button */}
          <div className="mt-10 flex w-full justify-center">
            <button
              onClick={() => setClaimOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-current/15 bg-white/90 px-6 py-2.5 text-xs font-black text-black shadow-xl backdrop-blur-md transition hover:scale-105 active:scale-95"
            >
              <span>Join {profile?.display_name || `@${profile?.username || 'creator'}`} on</span>
              <BrandLogo size="xs" variant="text" theme="current" />
            </button>
          </div>

          {/* Footer Legal & Modal Links */}
          <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] opacity-60 font-medium">
            <button onClick={() => handleOpenSpecificReport('Account profile')} className="hover:underline">
              Report
            </button>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>•</span>
            <button onClick={() => setAboutOpen(true)} className="hover:underline font-semibold">
              About this account
            </button>
          </footer>
        </div>

        {/* Interactive Modals */}
        <ProfileShareModal
          profile={profile || {}}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          onOpenReport={(target) => handleOpenSpecificReport(target)}
        />
        <AboutAccountModal profile={profile || {}} isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
        <ClaimUsernameModal profile={profile || {}} isOpen={claimOpen} onClose={() => setClaimOpen(false)} />
        <ReportModal
          profile={profile || {}}
          initialTarget={reportTarget}
          targetBlockId={reportTargetBlockId}
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
        />
        <LinkShareModal
          linkData={activeShareLink}
          profile={profile || {}}
          isOpen={Boolean(activeShareLink)}
          onClose={() => setActiveShareLink(null)}
          onOpenReport={(target, blockId) => handleOpenSpecificReport(target, blockId)}
        />
      </main>
    </div>
    </>
  );
}
