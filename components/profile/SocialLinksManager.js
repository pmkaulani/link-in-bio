'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  PLATFORMS,
  COUNTRY_CODES,
  cleanUsername,
  detectPlatformFromUrl,
} from '../../lib/platformGuide';
import SocialIcon from '../ui/SocialIcon';
import {
  Plus,
  Trash2,
  ExternalLink,
  Search,
  X,
  Sparkles,
  Check,
  Share2,
  ChevronDown,
} from 'lucide-react';

/**
 * Country Code dropdown without native OS select or emojis
 */
function CountryCodeDropdown({ countryCode, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full items-center gap-1 rounded-l-[8px] border-r border-zinc-200 bg-zinc-100/90 px-2.5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition select-none"
      >
        <span>{countryCode}</span>
        <ChevronDown size={11} className={`text-zinc-500 transition-transform ${open ? 'rotate-180 text-black' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-56 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl animate-fadeIn">
          {COUNTRY_CODES.map((c) => {
            const isSelected = c.code === countryCode;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelect(c.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                  isSelected ? 'bg-zinc-100 font-bold text-black' : 'text-zinc-700 hover:bg-zinc-50 hover:text-black font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-black">{c.code}</span>
                  <span className="text-zinc-500 text-[11px] truncate">{c.country}</span>
                </div>
                {isSelected && <Check size={12} className="text-black shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Active Social Link Row with Guided Input
 */
function ActiveSocialRow({ platformKey, urlValue, onUpdate, onRemove }) {
  const platConfig = PLATFORMS[platformKey] || {
    key: platformKey,
    label: platformKey,
    icon: platformKey,
    mode: 'url',
    placeholder: 'https://...',
  };

  const initialUsername = useMemo(() => {
    if (!urlValue) return '';
    if (platConfig.parseUrl) {
      const parsed = platConfig.parseUrl(urlValue);
      if (typeof parsed === 'string') return parsed;
      if (typeof parsed === 'object' && parsed?.value) return parsed.value;
    }
    return urlValue.replace(/^https?:\/\/[^/]+\/?/i, '').replace(/^@/, '');
  }, [urlValue, platConfig]);

  const [usernameInput, setUsernameInput] = useState(initialUsername);

  useEffect(() => {
    if (platConfig.parseUrl) {
      const parsed = platConfig.parseUrl(urlValue || '');
      const clean = typeof parsed === 'string' ? parsed : typeof parsed === 'object' && parsed?.value ? parsed.value : urlValue || '';
      setUsernameInput(clean);
    } else {
      setUsernameInput(urlValue || '');
    }
  }, [urlValue, platConfig]);

  const [countryCode, setCountryCode] = useState('+1');
  const [phoneVal, setPhoneVal] = useState(() => {
    if (!urlValue) return '';
    if (platConfig.mode === 'phone') {
      const match = urlValue.match(/(?:wa\.me\/|tel:)(\d+)/i);
      return match ? match[1] : urlValue;
    }
    return '';
  });

  function handleUsernameChange(val) {
    setUsernameInput(val);
    if (!val.trim()) {
      onUpdate('');
      return;
    }

    if (/^https?:\/\//i.test(val) || val.includes('.com') || val.includes('.net') || val.includes('.me')) {
      if (platConfig.parseUrl) {
        const parsed = platConfig.parseUrl(val);
        if (parsed) {
          const clean = typeof parsed === 'string' ? parsed : parsed.value;
          setUsernameInput(clean);
          onUpdate(platConfig.buildUrl ? platConfig.buildUrl(clean) : val);
          return;
        }
      }
    }

    const clean = cleanUsername(val);
    const finalUrl = platConfig.buildUrl ? platConfig.buildUrl(clean) : clean;
    onUpdate(finalUrl);
  }

  function handlePhoneChange(val, code = countryCode) {
    setPhoneVal(val);
    if (!val.trim()) {
      onUpdate('');
      return;
    }
    const finalUrl = platConfig.buildUrl ? platConfig.buildUrl(val, code) : val;
    onUpdate(finalUrl);
  }

  function handleRawUrlChange(val) {
    setUsernameInput(val);
    onUpdate(val.trim());
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs hover:border-zinc-300 transition animate-profile-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black border border-zinc-200/80 shadow-xs">
            <SocialIcon name={platConfig.icon || platformKey} className="text-[15px]" />
          </div>
          <span className="text-xs font-bold text-black truncate">{platConfig.label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {urlValue && (
            <a
              href={urlValue.startsWith('http') || urlValue.startsWith('mailto:') || urlValue.startsWith('tel:') ? urlValue : `https://${urlValue}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
              title="Test link in new tab"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
            title={`Remove ${platConfig.label}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div>
        {platConfig.mode === 'username' ? (
          <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <span className="flex items-center bg-zinc-100/90 px-2.5 text-[11px] font-medium text-zinc-500 border-r border-zinc-200 select-none shrink-0">
              {platConfig.prefix}
            </span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder={platConfig.placeholder || 'username'}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        ) : platConfig.mode === 'phone' ? (
          <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <CountryCodeDropdown
              countryCode={countryCode}
              onSelect={(code) => {
                setCountryCode(code);
                handlePhoneChange(phoneVal, code);
              }}
            />
            <input
              type="tel"
              value={phoneVal}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={platConfig.placeholder || '712 345 678'}
              className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        ) : (
          <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <input
              type={platConfig.mode === 'email' ? 'email' : 'url'}
              value={usernameInput}
              onChange={(e) => handleRawUrlChange(e.target.value)}
              placeholder={platConfig.placeholder || 'https://...'}
              className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        )}

        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 px-0.5">
          <span>Example: {platConfig.example || 'yourhandle'}</span>
          {urlValue && (
            <span className="truncate max-w-[200px] font-mono text-zinc-400">{urlValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddSocialModal({ isOpen, onClose, currentSocials, onAddPlatform, onQuickPaste }) {
  const [query, setQuery] = useState('');
  const [pasteVal, setPasteVal] = useState('');
  const [detectedToast, setDetectedToast] = useState(null);

  if (!isOpen) return null;

  const socialKeys = [
    'instagram', 'tiktok', 'whatsapp', 'youtube', 'twitter', 'spotify',
    'linkedin', 'github', 'snapchat', 'threads', 'facebook', 'pinterest',
    'reddit', 'discord', 'telegram', 'applemusic', 'soundcloud', 'twitch',
    'kick', 'patreon', 'substack', 'medium', 'paypal', 'cashapp', 'venmo',
    'email', 'phone',
  ];

  const filtered = socialKeys.filter((k) => {
    const p = PLATFORMS[k];
    if (!p) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.label.toLowerCase().includes(q) || k.toLowerCase().includes(q);
  });

  function handlePasteSubmit(e) {
    if (e) e.preventDefault();
    if (!pasteVal.trim()) return;

    const detected = detectPlatformFromUrl(pasteVal);
    if (detected && detected.platformKey && PLATFORMS[detected.platformKey]) {
      onQuickPaste(detected.platformKey, detected.cleanUrl);
      setDetectedToast(`Added ${PLATFORMS[detected.platformKey]?.label || detected.platformKey}`);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      onQuickPaste('instagram', pasteVal.trim());
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-profile-in">
      <div className="w-full max-w-md rounded-[20px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-black" />
            <h3 className="text-sm font-black text-black">Add Social Link</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Smart Paste (Autofills Platform & Handle)
          </label>
          <form onSubmit={handlePasteSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={pasteVal}
                onChange={(e) => {
                  setPasteVal(e.target.value);
                  const detected = detectPlatformFromUrl(e.target.value);
                  if (detected && PLATFORMS[detected.platformKey]) {
                    setDetectedToast(`Detected ${PLATFORMS[detected.platformKey]?.label}!`);
                  } else {
                    setDetectedToast(null);
                  }
                }}
                placeholder="Paste any link, e.g. instagram.com/cristiano"
                className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={!pasteVal.trim()}
              className="flex items-center gap-1 rounded-[8px] bg-black px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 disabled:opacity-40"
            >
              <Sparkles size={12} />
              <span>Add</span>
            </button>
          </form>
          {detectedToast && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <Check size={12} /> {detectedToast}
            </p>
          )}
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search platforms (TikTok, Spotify, WhatsApp...)"
              className="w-full rounded-[8px] border border-zinc-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {filtered.map((k) => {
              const p = PLATFORMS[k];
              const isAdded = Boolean(currentSocials[k]);
              return (
                <button
                  key={k}
                  type="button"
                  disabled={isAdded}
                  onClick={() => {
                    onAddPlatform(k);
                    onClose();
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition ${
                    isAdded
                      ? 'border-zinc-200/80 bg-zinc-50 opacity-60 cursor-not-allowed'
                      : 'border-zinc-200 bg-white hover:border-black hover:bg-zinc-50 shadow-xs active:scale-98'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black border border-zinc-200/60">
                      <SocialIcon name={p.icon || k} className="text-[13px]" />
                    </div>
                    <span className="text-xs font-bold text-black truncate">{p.label}</span>
                  </div>

                  {isAdded ? (
                    <span className="text-[10px] font-bold text-zinc-400">Added</span>
                  ) : (
                    <Plus size={13} className="text-zinc-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching platforms found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialLinksManager({ profile, updateProfile }) {
  const [modalOpen, setModalOpen] = useState(false);

  const currentSocials = useMemo(() => {
    return profile?.socials && typeof profile.socials === 'object' ? profile.socials : {};
  }, [profile?.socials]);

  const activeEntries = useMemo(() => {
    return Object.entries(currentSocials).filter(
      ([k, v]) => Boolean(!k.startsWith('_') && typeof v === 'string')
    );
  }, [currentSocials]);

  function handleUpdateSocial(key, val) {
    const next = { ...currentSocials };
    if (!val) {
      delete next[key];
    } else {
      next[key] = val;
    }
    updateProfile({ socials: next });
  }

  function handleRemoveSocial(key) {
    const next = { ...currentSocials };
    delete next[key];
    updateProfile({ socials: next });
  }

  function handleAddPlatform(key) {
    const next = { ...currentSocials };
    if (!next[key]) {
      next[key] = '';
    }
    updateProfile({ socials: next });
  }

  function handleQuickPaste(key, cleanUrl) {
    const next = { ...currentSocials };
    next[key] = cleanUrl;
    updateProfile({ socials: next });
  }

  return (
    <div className="py-6 border-t border-zinc-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Social Links</h2>
            <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
              {activeEntries.length} added
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Icons appear directly under your bio on your public page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-[8px] bg-black px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95 shrink-0"
        >
          <Plus size={13} />
          <span>Add social link</span>
        </button>
      </div>

      {activeEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeEntries.map(([platformKey, urlValue]) => (
            <ActiveSocialRow
              key={platformKey}
              platformKey={platformKey}
              urlValue={urlValue}
              onUpdate={(val) => handleUpdateSocial(platformKey, val)}
              onRemove={() => handleRemoveSocial(platformKey)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-xs mb-2.5 text-zinc-400">
            <Share2 size={18} />
          </div>
          <h3 className="text-xs font-bold text-black">No social links added yet</h3>
          <p className="mt-1 max-w-xs text-xs text-zinc-400">
            Connect your Instagram, TikTok, WhatsApp, X, or other profiles to display them as icons on your page.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-3.5 flex items-center gap-1.5 rounded-[8px] bg-black px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-95"
          >
            <Plus size={13} />
            <span>Add your first social link</span>
          </button>
        </div>
      )}

      <AddSocialModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentSocials={currentSocials}
        onAddPlatform={handleAddPlatform}
        onQuickPaste={handleQuickPaste}
      />
    </div>
  );
}
