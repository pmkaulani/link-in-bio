'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured, isLocalMode } from '../../lib/supabase';
import { THEME_PRESETS, QUICK_SOCIALS } from '../../lib/presets';
import { ICONS } from '../../lib/icons';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import LivePreview from '../../components/editor/LivePreview';
import { APP_DOMAIN } from '../../lib/constants';
import { compressAvatarImage } from '../../lib/imageUtils';

const STEPS = [
  { label: 'Profile', desc: 'Handle & Identity' },
  { label: 'Links', desc: 'Socials & Drops' },
  { label: 'Style', desc: 'Starter Look' },
  { label: 'Launch', desc: 'Ready to Share' },
];

const STARTER_LOOKS = [
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Clean white studio',
    theme: THEME_PRESETS.find((t) => t.name === 'Classic Monochrome') || THEME_PRESETS[0],
    bgEffect: 'none',
    hoverEffect: 'lift',
    pillBg: '#18181B',
    pillColor: '#FFFFFF',
  },
  {
    id: 'bold',
    name: 'Studio Dark',
    desc: 'Deep obsidian stealth',
    theme: THEME_PRESETS.find((t) => t.name === 'Studio Dark') || THEME_PRESETS[2],
    bgEffect: 'none',
    hoverEffect: 'spotlight',
    pillBg: '#27272A',
    pillColor: '#FFFFFF',
  },
  {
    id: 'glow',
    name: 'Aurora Glow',
    desc: 'Midnight cosmic vibe',
    theme: THEME_PRESETS.find((t) => t.name === 'Midnight Aurora') || THEME_PRESETS[1],
    bgEffect: 'aurora',
    hoverEffect: 'border_beam',
    pillBg: 'rgba(255,255,255,0.15)',
    pillColor: '#FFFFFF',
  },
  {
    id: 'retro',
    name: 'Retro Pop',
    desc: 'Sun yellow neo-brutalist',
    theme: THEME_PRESETS.find((t) => t.name === 'Retro Pop') || THEME_PRESETS[13] || THEME_PRESETS[0],
    bgEffect: 'grid_warp',
    hoverEffect: 'lift',
    pillBg: '#000000',
    pillColor: '#FEF08A',
  },
];

// Popular priority platforms for the mobile quick-select
const POPULAR_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'spotify', 'whatsapp', 'github', 'store'];

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Theme data
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
      // Local demo mode: seed initial values if available
      try {
        const localDb = localStorage.getItem('local_supabase_db');
        if (localDb) {
          const parsed = JSON.parse(localDb);
          const p = parsed.profiles?.[0];
          if (p) {
            setUserId(p.id || 'local-test-id');
            setUsername(p.username || '');
            setOriginalUsername(p.username || '');
            setDisplayName(p.display_name || p.username || '');
            setBio(p.bio || '');
            setAvatarUrl(p.avatar_url || '');
          }
        }
      } catch (_) {}
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data?.session) {
        router.push('/login');
        return;
      }
      setUserId(data.session.user.id);
      const uMeta = data.session.user.user_metadata || {};
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle();
      if (p) {
        if (p.onboarded) {
          router.push('/dashboard');
          return;
        }
        setUsername(p.username || '');
        setOriginalUsername(p.username || '');
        setDisplayName(p.display_name || uMeta.full_name || uMeta.name || p.username || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatar_url || uMeta.avatar_url || uMeta.picture || '');
      } else {
        setDisplayName(uMeta.full_name || uMeta.name || '');
        setAvatarUrl(uMeta.avatar_url || uMeta.picture || '');
      }
      setLoading(false);
    });
  }, [router]);

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setAvatarUploading(true);
    try {
      const { dataUrl, file: compressedBlob } = await compressAvatarImage(file, 320, 0.82);
      setAvatarUrl(dataUrl);
      setAvatarUploading(false);

      if (isSupabaseConfigured && userId) {
        const path = `avatars/${userId}.webp`;
        supabase.storage
          .from('avatars')
          .upload(path, compressedBlob, {
            contentType: 'image/webp',
            upsert: true,
          })
          .then(({ error }) => {
            if (!error) {
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
              setAvatarUrl(urlData.publicUrl + '?t=' + Date.now());
            }
          })
          .catch(() => {});
      }
    } catch {
      setAvatarUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function toggleSocial(social) {
    setSelectedSocials((prev) => {
      const next = { ...prev };
      if (social.icon in next) {
        delete next[social.icon];
      } else {
        next[social.icon] = social.urlPrefix;
      }
      return next;
    });
  }

  function updateSocialUrl(icon, url) {
    setSelectedSocials((prev) => ({ ...prev, [icon]: url }));
  }

  function removeSocial(icon) {
    setSelectedSocials((prev) => {
      const next = { ...prev };
      delete next[icon];
      return next;
    });
  }

  function applyStarterLook(look) {
    setSelectedLook(look.id);
    setTheme(look.theme);
    setBgEffect(look.bgEffect);
    setHoverEffect(look.hoverEffect);
  }

  async function validateUsernameAndAdvance() {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      setUsernameError('Please enter a username.');
      return;
    }
    if (clean.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    if (clean === originalUsername || !isSupabaseConfigured) {
      setUsername(clean);
      setStep(1);
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const [{ data: taken }, { data: reserved }] = await Promise.all([
        supabase.from('profiles').select('id').eq('username', clean).neq('id', userId).maybeSingle(),
        supabase.from('reserved_usernames').select('username').eq('username', clean).maybeSingle(),
      ]);

      if (reserved) {
        setUsernameError('This handle is reserved by the platform.');
        return;
      }
      if (taken) {
        setUsernameError('This handle is already taken. Try another!');
        return;
      }

      setUsername(clean);
      setStep(1);
    } catch {
      setStep(1);
    } finally {
      setCheckingUsername(false);
    }
  }

  async function finish() {
    setSaving(true);
    const activeUserId = userId || (isLocalMode ? 'local-test-id' : null);

    if (activeUserId) {
      try {
        if (isSupabaseConfigured) {
          await supabase
            .from('profiles')
            .update({
              username: username || 'user',
              display_name: displayName || username || 'Creator',
              bio,
              avatar_url: avatarUrl,
              primary_color: theme.primary_color,
              text_color: theme.text_color,
              background_type: theme.background_type,
              background_value: theme.background_value,
              bg_effect: bgEffect,
              button_style: theme.button_style || (selectedLook === 'retro' ? 'hard_shadow' : 'fill'),
              button_radius: theme.button_radius ?? (selectedLook === 'retro' ? 8 : 24),
              font_family: theme.font_family || 'inter',
              font: theme.font || theme.font_family || 'inter',
              onboarded: true,
            })
            .eq('id', activeUserId);

          if (Object.keys(selectedSocials).length > 0) {
            await Promise.all(
              Object.entries(selectedSocials).map(([icon, url], i) => {
                const meta = QUICK_SOCIALS.find((s) => s.icon === icon);
                return supabase.from('blocks').insert({
                  profile_id: activeUserId,
                  type: 'link',
                  position: i,
                  data: {
                    title: meta?.title || icon,
                    icon,
                    url,
                    animation: 'slideUp',
                    hover_effect: hoverEffect,
                    background_type: 'solid',
                    background_value: selectedLook === 'retro' ? '#ffffff' : (theme.primary_color || '#000000'),
                    text_color: selectedLook === 'retro' ? '#000000' : '#ffffff',
                    is_featured: i === 0,
                  },
                });
              })
            );
          }
        } else {
          // Local demo mode save
          const localDb = localStorage.getItem('local_supabase_db');
          if (localDb) {
            const parsed = JSON.parse(localDb);
            if (parsed.profiles?.[0]) {
              parsed.profiles[0] = {
                ...parsed.profiles[0],
                username: username || parsed.profiles[0].username,
                display_name: displayName || username || parsed.profiles[0].display_name,
                bio,
                avatar_url: avatarUrl,
                primary_color: theme.primary_color,
                text_color: theme.text_color,
                background_type: theme.background_type,
                background_value: theme.background_value,
                bg_effect: bgEffect,
                button_style: theme.button_style || (selectedLook === 'retro' ? 'hard_shadow' : 'fill'),
                button_radius: theme.button_radius ?? (selectedLook === 'retro' ? 8 : 24),
                font_family: theme.font_family || 'inter',
                font: theme.font || theme.font_family || 'inter',
                onboarded: true,
              };
              localStorage.setItem('local_supabase_db', JSON.stringify(parsed));
            }
          }
        }
      } catch (err) {
        console.error('Error saving onboarding data:', err);
      }
    }

    setSaving(false);
    router.push('/dashboard');
  }

  const previewProfile = useMemo(() => ({
    username: username || 'you',
    display_name: displayName || username || 'Creator',
    bio,
    avatar_url: avatarUrl,
    primary_color: theme.primary_color || '#000000',
    text_color: theme.text_color || '#111827',
    background_type: theme.background_type || 'solid',
    background_value: theme.background_value || '#FFFFFF',
    bg_effect: bgEffect || 'none',
    button_style: theme.button_style || (selectedLook === 'retro' ? 'hard_shadow' : 'fill'),
    button_radius: theme.button_radius ?? (selectedLook === 'retro' ? 8 : 24),
    font_family: theme.font_family || 'inter',
    font: theme.font || 'inter',
    socials: {
      _visible: false,
    },
  }), [username, displayName, bio, avatarUrl, theme, bgEffect, selectedLook]);

  const previewBlocks = useMemo(() => {
    return Object.entries(selectedSocials).map(([icon, url], i) => {
      const meta = QUICK_SOCIALS.find((s) => s.icon === icon);
      return {
        id: `onboarding-block-${icon}`,
        type: 'link',
        position: i,
        is_visible: true,
        data: {
          title: meta?.title || icon,
          icon,
          url,
          animation: 'slideUp',
          hover_effect: hoverEffect,
          background_type: 'solid',
          background_value: selectedLook === 'retro' ? '#ffffff' : (theme.primary_color || '#000000'),
          text_color: selectedLook === 'retro' ? '#000000' : '#ffffff',
          is_featured: i === 0,
        },
      };
    });
  }, [selectedSocials, hoverEffect, theme, selectedLook]);


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#FAFAFA] text-black">
      {/* ── STICKY TOP HEADER & SEGMENTED PROGRESS ────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:px-6">
          {/* Left: Back button or Exit */}
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl text-zinc-700 hover:bg-zinc-100 hover:text-black transition"
                aria-label="Previous step"
              >
                <ArrowLeft size={16} />
                <span className="text-xs font-bold">Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg text-zinc-400 hover:text-black transition"
                title="Exit to login"
              >
                <ArrowLeft size={14} />
                <BrandLogo size="sm" variant="mark" />
              </button>
            )}
          </div>

          {/* Center: Segmented Progress Bar (clickable to jump back) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, idx) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    if (idx < step) setStep(idx);
                  }}
                  disabled={idx >= step}
                  className={`h-1.5 w-7 sm:w-10 rounded-full transition-all duration-300 ${
                    idx <= step ? 'bg-black' : 'bg-zinc-200'
                  } ${idx < step ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                  title={idx < step ? `Back to ${s.label}` : s.label}
                  aria-label={`Step ${idx + 1}: ${s.label}`}
                />
              ))}
            </div>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Step {step + 1} of {STEPS.length} • {STEPS[step].label}
            </span>
          </div>

          {/* Right: Quick Skip action */}
          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={finish}
                className="text-[11px] font-bold text-zinc-400 hover:text-black transition px-2 py-1 rounded"
              >
                Skip
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE BODY CONTENT (PADDING-BOTTOM FOR MOBILE ACTION BAR) ── */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6 pb-28 sm:px-6 sm:pb-12">
        {/* ================= STEP 0: PROFILE BASICS ================= */}
        {step === 0 && (
          <div className="flex flex-col gap-6 animate-profile-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">Claim your handle</h1>
              <p className="mt-1 text-xs text-zinc-500">Pick your link URL and personal creator identity.</p>
            </div>

            {/* Compact Mobile Avatar Picker */}
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full overflow-hidden border-2 border-zinc-100 bg-zinc-100 transition focus:outline-none focus:ring-2 focus:ring-black"
                title="Tap to upload profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-zinc-400 group-hover:text-black">
                    {(displayName || username || '?').slice(0, 2).toUpperCase()}
                  </span>
                )}
                {/* Camera Badge Overlay */}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </span>
                {avatarUploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-black">Profile Photo</span>
                <span className="block text-[11px] text-zinc-500 truncate mt-0.5">
                  {avatarUrl ? 'Photo added • Tap to replace' : 'Tap to choose from camera roll'}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-black hover:underline"
                  >
                    <Upload size={12} /> {avatarUrl ? 'Change' : 'Upload photo'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Handle / Username Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Your Link URL
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
                <span className="flex items-center gap-1 border-r border-zinc-200 bg-zinc-50 px-3 py-3 font-mono text-xs font-bold text-zinc-500 select-none shrink-0">
                  <Globe size={13} className="text-zinc-400" />
                  <span>{APP_DOMAIN}/</span>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setUsernameError('');
                  }}
                  placeholder="yourname"
                  className="min-h-[46px] w-full px-3 py-2.5 font-mono text-sm font-bold text-black placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              {usernameError ? (
                <p className="text-[11px] font-bold text-red-600 animate-pulse">{usernameError}</p>
              ) : (
                <p className="text-[10px] text-zinc-400">Letters, numbers, and underscores only.</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Amélie Poulain"
                className="min-h-[46px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-bold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm"
              />
            </div>

            {/* Short Bio */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Bio Note
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Photographer, filmmaker & collector of little moments."
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs font-medium text-black placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 1: STARTER LINKS ================= */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-profile-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">Add your starter links</h1>
              <p className="mt-1 text-xs text-zinc-500">Tap platforms to add them to your page.</p>
            </div>

            {/* Quick Platform Selector Grid (Responsive 4-column mobile chips) */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Popular Platforms
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POPULAR_PLATFORMS.map((icon) => {
                  const social = QUICK_SOCIALS.find((s) => s.icon === icon);
                  if (!social) return null;
                  const meta = ICONS[social.icon] || { className: 'fa-solid fa-link', color: '#18181B' };
                  const isSelected = social.icon in selectedSocials;
                  return (
                    <button
                      key={social.icon}
                      type="button"
                      onClick={() => toggleSocial(social)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition active:scale-95 text-left ${
                        isSelected
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      <i className={meta.className} style={{ color: isSelected ? '#FFFFFF' : meta.color }} />
                      <span className="truncate flex-1">{social.title}</span>
                      {isSelected ? <Check size={12} className="text-white shrink-0" /> : <span className="text-zinc-400">+</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link Edit Rows */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Configured Links ({Object.keys(selectedSocials).length})
                </span>
              </div>

              {Object.keys(selectedSocials).length > 0 ? (
                Object.entries(selectedSocials).map(([icon, url]) => {
                  const meta = ICONS[icon] || ICONS.link || { className: 'fa-solid fa-link', color: '#18181B' };
                  const social = QUICK_SOCIALS.find((s) => s.icon === icon);
                  return (
                    <div
                      key={icon}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100">
                        <i className={meta.className} style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                          {social?.title || icon}
                        </span>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateSocialUrl(icon, e.target.value)}
                          className="w-full font-mono text-xs font-semibold text-black focus:outline-none"
                          placeholder="https://"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSocial(icon)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-600 transition shrink-0"
                        title="Remove link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                  <p className="text-xs font-semibold text-zinc-500">
                    No links selected yet. Tap any platform above to add your first card!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: STARTER LOOKS ================= */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-profile-in">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">Pick a starter look</h1>
              <p className="mt-1 text-xs text-zinc-500">
                Tap a style preset. You can fine-tune colors, fonts, and card animations anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {STARTER_LOOKS.map((look) => {
                const active = selectedLook === look.id;
                return (
                  <button
                    key={look.id}
                    type="button"
                    onClick={() => applyStarterLook(look)}
                    className={`group relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${
                      active
                        ? 'ring-2 ring-black ring-offset-2 shadow-md'
                        : 'border border-zinc-200 hover:border-zinc-400 shadow-sm'
                    }`}
                    style={{
                      background: look.theme.background_value,
                      color: look.theme.text_color || '#FFFFFF',
                      minHeight: '130px',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black drop-shadow-sm">{look.name}</span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block text-[11px] opacity-80 leading-snug">{look.desc}</span>
                    </div>

                    {/* Miniature simulated link pill */}
                    <div
                      className="mt-3 flex items-center justify-center rounded-lg py-1.5 px-3 text-[10px] font-bold shadow-sm"
                      style={{ background: look.pillBg, color: look.pillColor }}
                    >
                      <span>Preview Link</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
              <span className="font-bold text-black">Note:</span> Your starter look configures page atmosphere and card interactions. You get access to all 14+ themes, gradients, and custom CSS in your studio dashboard.
            </div>
          </div>
        )}

        {/* ================= STEP 3: GO LIVE ================= */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-4 text-center animate-profile-in">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
              <Check size={22} strokeWidth={2.5} />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black">Your page is ready!</h1>
              <p className="mt-1 text-xs text-zinc-500">Here is how visitors will see your public bio link.</p>
            </div>

            <div className="w-full flex justify-center pt-2">
              <LivePreview
                profile={previewProfile}
                blocks={previewBlocks}
                readOnly={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY THUMB-FRIENDLY BOTTOM ACTION BAR ──────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-md p-3.5 sm:static sm:bg-transparent sm:border-0 sm:p-0 sm:pb-8">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2.5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] shrink-0"
              aria-label="Previous step"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {step === 0 && (
            <button
              type="button"
              onClick={validateUsernameAndAdvance}
              disabled={checkingUsername}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
            >
              {checkingUsername ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Checking availability...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              <span>Continue to Styling</span>
              <ArrowRight size={15} />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              <span>Preview My Live Page</span>
              <ArrowRight size={15} />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Preparing workspace...</span>
                </>
              ) : (
                <>
                  <span>Enter Studio Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

