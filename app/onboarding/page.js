'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { THEME_PRESETS, QUICK_SOCIALS } from '../../lib/presets';
import { ICONS } from '../../lib/icons';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  PartyPopper,
  Globe,
  BarChart2,
  Clock,
  Layers,
  Smartphone,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { APP_DOMAIN } from '../../lib/constants';

const STEPS = [
  { label: 'You', desc: 'Identity & handle' },
  { label: 'Your Links', desc: 'Socials & content' },
  { label: 'Make it yours', desc: 'Pick a starter look' },
  { label: 'Go Live', desc: 'Launch your page' },
];

// Pre-bundled starter looks — each one is a single click that sets theme + bg_effect + hover_effect
const STARTER_LOOKS = [
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Clean white canvas, simple elevation',
    theme: THEME_PRESETS.find((t) => t.name === 'Classic Monochrome') || THEME_PRESETS[0],
    bgEffect: 'none',
    hoverEffect: 'lift',
  },
  {
    id: 'bold',
    name: 'Bold',
    desc: 'Pure black studio, spotlight cards',
    theme: THEME_PRESETS.find((t) => t.name === 'Studio Dark') || THEME_PRESETS[2],
    bgEffect: 'none',
    hoverEffect: 'spotlight',
  },
  {
    id: 'glow',
    name: 'Glow',
    desc: 'Aurora gradient with beam borders',
    theme: THEME_PRESETS.find((t) => t.name === 'Midnight Aurora') || THEME_PRESETS[1],
    bgEffect: 'aurora',
    hoverEffect: 'border_beam',
  },
  {
    id: 'retro',
    name: 'Retro',
    desc: 'Yellow pop with blueprint grid',
    theme: THEME_PRESETS.find((t) => t.name === 'Retro Pop') || THEME_PRESETS[13],
    bgEffect: 'grid_warp',
    hoverEffect: 'lift',
  },
];

const AVATAR_PRESETS = [
  { label: 'Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80' },
  { label: 'Creator', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&h=160&q=80' },
  { label: 'Minimal', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&h=160&q=80' },
];

function Stepper({ currentStep }) {
  return (
    <div className="mb-8 w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const active = i === currentStep;
          const completed = i < currentStep;
          return (
            <div key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    completed
                      ? 'bg-black text-white'
                      : active
                      ? 'bg-black text-white shadow-sm ring-4 ring-zinc-100'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {completed ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span
                  className={`mt-1.5 hidden text-[11px] font-bold tracking-tight sm:block ${
                    active ? 'text-black' : 'text-zinc-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-all ${
                    i < currentStep ? 'bg-black' : 'bg-zinc-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  // Profile data
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Theme & Effects data — defaults to Minimal starter look
  const [theme, setTheme] = useState(STARTER_LOOKS[0].theme);
  const [bgEffect, setBgEffect] = useState(STARTER_LOOKS[0].bgEffect);
  const [hoverEffect, setHoverEffect] = useState(STARTER_LOOKS[0].hoverEffect);
  const [selectedLook, setSelectedLook] = useState('minimal');

  // Links data
  const [selectedSocials, setSelectedSocials] = useState({
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/@',
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push('/login');
        return;
      }
      setUserId(data.session.user.id);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
      if (p) {
        if (p.onboarded) {
          router.push('/dashboard');
          return;
        }
        setUsername(p.username || '');
        setOriginalUsername(p.username || '');
        setDisplayName(p.display_name || p.username || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatar_url || '');
      }
      setLoading(false);
    });
  }, [router]);

  function toggleSocial(social) {
    setSelectedSocials((prev) => {
      const next = { ...prev };
      if (social.icon in next) delete next[social.icon];
      else next[social.icon] = social.urlPrefix;
      return next;
    });
  }

  function updateSocialUrl(icon, url) {
    setSelectedSocials((prev) => ({ ...prev, [icon]: url }));
  }

  function applyStarterLook(look) {
    setSelectedLook(look.id);
    setTheme(look.theme);
    setBgEffect(look.bgEffect);
    setHoverEffect(look.hoverEffect);
  }

  async function validateUsernameAndAdvance() {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameError('Pick a username using letters, numbers, or underscores.');
      return;
    }
    if (clean === originalUsername || !isSupabaseConfigured) {
      setUsername(clean);
      setStep(1);
      return;
    }
    setCheckingUsername(true);
    setUsernameError('');
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .neq('id', userId)
      .maybeSingle();
    setCheckingUsername(false);
    if (data) {
      setUsernameError('That username is already taken. Try another!');
      return;
    }
    setUsername(clean);
    setStep(1);
  }

  async function finish() {
    setSaving(true);

    if (isSupabaseConfigured && userId) {
      await supabase
        .from('profiles')
        .update({
          username,
          display_name: displayName || username,
          bio,
          avatar_url: avatarUrl,
          primary_color: theme.primary_color,
          text_color: theme.text_color,
          background_type: theme.background_type,
          background_value: theme.background_value,
          bg_effect: bgEffect,
          onboarded: true,
        })
        .eq('id', userId);

      await Promise.all(
        Object.entries(selectedSocials).map(([icon, url], i) => {
          const meta = QUICK_SOCIALS.find((s) => s.icon === icon);
          return supabase.from('blocks').insert({
            profile_id: userId,
            type: 'link',
            position: i,
            data: {
              title: meta?.title || icon,
              icon,
              url,
              animation: 'slideUp',
              hover_effect: hoverEffect,
              background_type: 'solid',
              background_value: '#000000',
              text_color: '#ffffff',
              is_featured: i === 0,
            },
          });
        })
      );
    }

    setSaving(false);
    router.push('/dashboard');
  }

  const inputClass =
    'w-full rounded-[8px] border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none';
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-zinc-500';

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] px-4 py-10 sm:px-6 text-black">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="mb-6 flex items-center justify-center">
          <BrandLogo size="md" variant="full" />
        </div>

        {/* Step Indicator */}
        <Stepper currentStep={step} />

        {/* Card Container */}
        <div className="py-6 sm:py-8">
          {/* ================= STEP 0: YOU — PROFILE BASICS ================= */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h1 className="text-2xl font-black tracking-tight text-black">Claim your handle</h1>
                <p className="mt-1 text-xs text-zinc-500">
                  Choose your personal link URL and profile identity.
                </p>
              </div>

              {/* Avatar Box with Presets */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-[8px] bg-zinc-50 p-4 border border-zinc-200">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-md" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-lg font-black text-white shadow-md">
                      {(displayName || username || '?').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-zinc-200 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex-1 w-full space-y-1 text-center sm:text-left">
                  <span className={labelClass}>Profile Photo</span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-black placeholder:text-zinc-400 focus:border-black focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Presets:</span>
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAvatarUrl(p.url)}
                        className="rounded-[8px] border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div>
                <span className={labelClass}>Username</span>
                <div className="mt-1.5 flex items-center overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-xs focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span className="flex items-center gap-1.5 bg-zinc-100/90 border-r border-zinc-200 px-3.5 py-3 text-xs font-mono font-bold text-zinc-500 select-none shrink-0">
                    <Globe size={13} className="text-zinc-400" />
                    <span>{APP_DOMAIN}/</span>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourname"
                    className="w-full py-3 px-3 text-xs font-bold text-black focus:outline-none"
                  />
                </div>
                {/* Live Preview pill */}
                <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-zinc-100/70 border border-zinc-200/80 text-[11px] text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your link:</span>
                  <span className="font-mono text-zinc-500">{APP_DOMAIN}/</span>
                  <span className="font-mono font-black text-black">{username || 'yourname'}</span>
                </div>
                {usernameError && <p className="mt-1.5 text-xs font-bold text-red-600">{usernameError}</p>}
              </div>

              {/* Display Name */}
              <div>
                <span className={labelClass}>Display Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={username || 'Your Name / Brand'}
                  className={`${inputClass} mt-1.5`}
                />
              </div>

              {/* Bio */}
              <div>
                <span className={labelClass}>Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Creative designer, musician, founder..."
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 1: YOUR LINKS ================= */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h1 className="text-2xl font-black tracking-tight text-black">Add your starter links</h1>
                <p className="mt-1 text-xs text-zinc-500">
                  Select your active platforms to generate initial link cards.
                </p>
              </div>

              {/* Social platform chips */}
              <div className="flex flex-wrap gap-2">
                {QUICK_SOCIALS.map((social) => {
                  const meta = ICONS[social.icon];
                  const active = social.icon in selectedSocials;
                  return (
                    <button
                      key={social.icon}
                      onClick={() => toggleSocial(social)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-black hover:text-black'
                      }`}
                    >
                      <i className={meta.className} style={{ color: active ? '#ffffff' : meta.color }} />
                      {social.title}
                      {active ? <Check size={12} className="text-white" /> : <span className="text-zinc-400">+</span>}
                    </button>
                  );
                })}
              </div>

              {/* Selected URL inputs */}
              {Object.keys(selectedSocials).length > 0 ? (
                <div className="flex flex-col gap-3 pt-1">
                  {Object.entries(selectedSocials).map(([icon, url]) => {
                    const meta = ICONS[icon] || ICONS.link || { className: 'fa-solid fa-link', color: '#000000' };
                    const social = QUICK_SOCIALS.find((s) => s.icon === icon);
                    return (
                      <div key={icon}>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          <i className={meta.className} style={{ color: meta.color }} /> {social?.title || icon} URL
                        </span>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateSocialUrl(icon, e.target.value)}
                          className={`${inputClass} mt-1`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[8px] border-2 border-dashed border-zinc-200 bg-zinc-50/80 p-6 text-center">
                  <p className="text-xs font-semibold text-zinc-500">
                    No links selected yet — click any platform above to add your first link!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: MAKE IT YOURS — STARTER LOOKS ================= */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h1 className="text-2xl font-black tracking-tight text-black">Make it yours</h1>
                <p className="mt-1 text-xs text-zinc-500">
                  Pick a starter look — you can customize everything in the dashboard later.
                </p>
              </div>

              {/* Starter Look Cards */}
              <div className="grid grid-cols-2 gap-3">
                {STARTER_LOOKS.map((look) => {
                  const active = selectedLook === look.id;
                  return (
                    <button
                      key={look.id}
                      onClick={() => applyStarterLook(look)}
                      className={`group relative flex flex-col justify-between rounded-[14px] p-4 text-left transition-all hover:-translate-y-0.5 ${
                        active ? 'ring-2 ring-black ring-offset-2' : 'ring-1 ring-zinc-200'
                      }`}
                      style={{
                        background: look.theme.background_value,
                        color: look.theme.text_color || '#FFFFFF',
                        minHeight: '110px',
                      }}
                    >
                      <div>
                        <span className="text-sm font-black block drop-shadow-sm">{look.name}</span>
                        <span className="block text-[11px] opacity-75 mt-0.5 leading-snug">{look.desc}</span>
                      </div>
                      {active && (
                        <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow-md">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Skip / Use Default — prominent, not buried */}
              <button
                type="button"
                onClick={() => {
                  applyStarterLook(STARTER_LOOKS[0]);
                  setStep(3);
                }}
                className="w-full rounded-[8px] border border-zinc-300 bg-white py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-black transition shadow-xs"
              >
                Skip, use default
              </button>
            </div>
          )}

          {/* ================= STEP 3: GO LIVE — LAUNCH & FEATURE TOUR ================= */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
                <PartyPopper size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">Your canvas is ready</h1>
                <div className="mt-2.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 shadow-2xs">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-zinc-400 font-semibold">{APP_DOMAIN}/</span>
                  <span className="text-xs font-mono font-black text-black">{username || 'you'}</span>
                </div>
              </div>

              {/* Quick Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
                {[
                  { icon: Smartphone, title: 'Visual 2-Way Builder', desc: 'Click phone elements to edit instantly' },
                  { icon: Layers, title: 'Rich Content Blocks', desc: 'Videos, images, callouts & post grids' },
                  { icon: Sparkles, title: 'Theme Studio', desc: 'Full custom palettes, fonts & motion' },
                  { icon: Globe, title: 'Custom Domains', desc: 'Connect your own domain' },
                  { icon: BarChart2, title: 'Traffic Analytics', desc: 'Track referrers and visitor devices' },
                  { icon: Clock, title: 'Link Scheduling', desc: 'Timed drops and automated promo windows' },
                ].map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.title}
                      className="flex items-start gap-2.5 rounded-[8px] border border-zinc-200 bg-zinc-50/60 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-black shadow-xs border border-zinc-200">
                        <Icon size={16} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-black">{feat.title}</span>
                        <span className="block text-[11px] text-zinc-500">{feat.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= NAVIGATION FOOTER ================= */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-200 pt-5">
            {step > 0 && step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 rounded-[8px] px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-black"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <span />
            )}

            {step === 0 && (
              <button
                type="button"
                onClick={validateUsernameAndAdvance}
                disabled={checkingUsername}
                className="flex items-center gap-1.5 rounded-[8px] bg-black px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {checkingUsername ? 'Checking...' : 'Continue'} <ArrowRight size={14} />
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 rounded-[8px] bg-black px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 rounded-[8px] bg-black px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800"
              >
                <Sparkles size={14} /> Preview My Page
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="ml-auto flex items-center gap-2 rounded-[8px] bg-black px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Setting up...' : 'Launch Dashboard'} <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Skip Button */}
        {step < 3 && (
          <button
            type="button"
            onClick={finish}
            className="mt-4 block w-full text-center text-xs font-semibold text-zinc-400 hover:text-black"
          >
            Skip walkthrough & open dashboard
          </button>
        )}
      </div>
    </main>
  );
}
