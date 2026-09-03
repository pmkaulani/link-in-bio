'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  PLATFORMS,
  COUNTRY_CODES,
  cleanUsername,
  detectPlatformFromUrl,
} from '../../lib/platformGuide';
import { createAccountId } from '../../lib/socialAccounts';
import SocialIcon from '../ui/SocialIcon';
import {
  X,
  Search,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronDown,
  Star,
  ExternalLink,
} from 'lucide-react';

const LABEL_SUGGESTIONS = [
  'Personal',
  'Business',
  'Creator',
  'Photography',
  'Music',
  'Work',
  'Vlog',
  'Community',
];

const SUPPORTED_PLATFORMS = [
  'instagram', 'tiktok', 'youtube', 'whatsapp', 'twitter', 'spotify',
  'linkedin', 'github', 'snapchat', 'threads', 'facebook', 'pinterest',
  'reddit', 'discord', 'telegram', 'applemusic', 'soundcloud', 'twitch',
  'kick', 'patreon', 'substack', 'medium', 'paypal', 'cashapp', 'venmo',
  'email', 'phone',
];

function CountryCodeDropdown({ countryCode, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filtered = COUNTRY_CODES.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-black hover:border-black shadow-xs transition"
      >
        <span>{countryCode}</span>
        <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-150 ${open ? 'rotate-180 text-black' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 max-h-60 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-2xl animate-fadeIn flex flex-col">
          <div className="p-1 border-b border-zinc-100 mb-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              autoFocus
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-44 space-y-0.5">
            {filtered.map((c) => {
              const isSelected = c.code === countryCode;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onSelect(c.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                    isSelected ? 'bg-zinc-100 font-bold text-black' : 'text-zinc-700 hover:bg-zinc-50 hover:text-black font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-black w-10 shrink-0">{c.code}</span>
                    <span className="text-zinc-600 text-[11px] truncate">{c.country}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-black shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialAccountModal({
  isOpen,
  onClose,
  accountToEdit = null,
  existingAccounts = [],
  onSave,
}) {
  const isEditing = Boolean(accountToEdit);

  // Step 1: select platform, Step 2: configure account details
  const [step, setStep] = useState(isEditing ? 2 : 1);
  const [selectedPlatform, setSelectedPlatform] = useState(accountToEdit?.platform || 'instagram');
  const [label, setLabel] = useState(accountToEdit?.label || '');
  const [username, setUsername] = useState(accountToEdit?.username || '');
  const [displayName, setDisplayName] = useState(accountToEdit?.display_name || '');
  const [isPrimary, setIsPrimary] = useState(accountToEdit?.is_primary ?? true);
  const [countryCode, setCountryCode] = useState('+1');
  const [searchQuery, setSearchQuery] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState(null);

  // Sync state whenever accountToEdit changes
  useEffect(() => {
    if (accountToEdit) {
      setStep(2);
      setSelectedPlatform(accountToEdit.platform);
      setLabel(accountToEdit.label || '');
      setDisplayName(accountToEdit.display_name || '');
      setIsPrimary(Boolean(accountToEdit.is_primary));

      // For phone/whatsapp, extract country code if present
      if (accountToEdit.platform === 'whatsapp' || accountToEdit.platform === 'phone') {
        const raw = accountToEdit.username || accountToEdit.url || '';
        const digits = raw.replace(/[^0-9]/g, '');
        const matched = COUNTRY_CODES.find((c) => digits.startsWith(c.code.replace('+', '')));
        if (matched) {
          setCountryCode(matched.code);
          const rest = digits.slice(matched.code.replace('+', '').length);
          setUsername(rest || raw);
        } else {
          setUsername(accountToEdit.username || '');
        }
      } else {
        setUsername(accountToEdit.username || '');
      }
    } else {
      setStep(1);
      setSelectedPlatform('instagram');
      setLabel('');
      setUsername('');
      setDisplayName('');
      setCountryCode('+1');
      setIsPrimary(true);
      setPasteFeedback(null);
    }
  }, [accountToEdit, isOpen]);

  const platConfig = PLATFORMS[selectedPlatform] || PLATFORMS.link;

  // Count existing accounts on selected platform
  const existingCountForPlatform = useMemo(() => {
    return existingAccounts.filter((a) => a.platform === selectedPlatform).length;
  }, [existingAccounts, selectedPlatform]);

  // Handle smart paste: user pastes full link or phone number into username input
  function handleUsernameChange(val) {
    if (platConfig.mode === 'phone') {
      const trimmed = val.trim();
      if (trimmed.startsWith('+')) {
        const matched = COUNTRY_CODES.find((c) => trimmed.startsWith(c.code));
        if (matched) {
          setCountryCode(matched.code);
          const rest = trimmed.slice(matched.code.length).trim();
          setUsername(rest);
          setPasteFeedback(`Selected ${matched.country} (${matched.code})`);
          return;
        }
      }
    }

    setUsername(val);

    if (/^https?:\/\//i.test(val) || val.includes('.com') || val.includes('.me') || val.includes('.net')) {
      const detected = detectPlatformFromUrl(val);
      if (detected) {
        if (!isEditing && detected.platformKey !== selectedPlatform && PLATFORMS[detected.platformKey]) {
          setSelectedPlatform(detected.platformKey);
        }
        setUsername(detected.value);
        setPasteFeedback(`Extracted handle: @${detected.value}`);
        return;
      }

      if (platConfig.parseUrl) {
        const parsed = platConfig.parseUrl(val);
        if (parsed) {
          const clean = typeof parsed === 'string' ? parsed : parsed.value;
          setUsername(clean);
          setPasteFeedback(`Extracted handle: @${clean}`);
          return;
        }
      }
    }
    setPasteFeedback(null);
  }

  function handleSaveSubmit(e) {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    let clean = username.trim();
    let finalUrl = '';

    if (platConfig.prefix) {
      clean = cleanUsername(clean);
    }

    if (platConfig.mode === 'phone') {
      finalUrl = platConfig.buildUrl ? platConfig.buildUrl(clean, countryCode) : clean;
    } else if (platConfig.buildUrl) {
      finalUrl = platConfig.buildUrl(clean);
    } else if (platConfig.prefix) {
      finalUrl = `https://${platConfig.prefix}${clean}`;
    } else {
      finalUrl = ensureHttps(clean);
    }

    const accountData = {
      id: accountToEdit?.id || createAccountId(),
      platform: selectedPlatform,
      username: clean,
      label: label.trim(),
      display_name: displayName.trim(),
      url: finalUrl,
      is_primary: isPrimary || existingCountForPlatform === 0,
      is_visible: accountToEdit?.is_visible !== false,
      order: accountToEdit?.order ?? existingAccounts.length,
    };

    onSave(accountData);
    onClose();
  }

  if (!isOpen) return null;

  // Filter platforms for Step 1
  const filteredPlatforms = SUPPORTED_PLATFORMS.filter((k) => {
    const p = PLATFORMS[k];
    if (!p) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.label.toLowerCase().includes(q) || k.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-profile-in">
      <div className="w-full max-w-lg rounded-[24px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {step === 2 && !isEditing && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
                title="Back to platforms"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <h3 className="text-sm font-black text-black">
                {isEditing
                  ? `Edit ${platConfig.label} Account`
                  : step === 1
                  ? 'Add Social Account'
                  : `Add ${platConfig.label} Account`}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {step === 1 ? 'Choose the platform for this account' : 'Configure handle, label, and display settings'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* STEP 1: Platform Picker */}
        {step === 1 && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search platforms (Instagram, TikTok, YouTube, WhatsApp...)"
                autoFocus
                className="w-full rounded-[10px] border border-zinc-200 bg-white pl-9 pr-4 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {filteredPlatforms.map((k) => {
                const p = PLATFORMS[k];
                const count = existingAccounts.filter((a) => a.platform === k).length;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(k);
                      setStep(2);
                    }}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:border-black hover:bg-zinc-50 shadow-xs active:scale-98 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black border border-zinc-200/80 group-hover:scale-105 transition-transform">
                        <SocialIcon name={p.icon || k} className="text-[14px]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-black truncate">{p.label}</span>
                        {count > 0 && (
                          <span className="block text-[10px] font-semibold text-zinc-400">
                            {count} {count === 1 ? 'account' : 'accounts'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Configure Account Details */}
        {step === 2 && (
          <form onSubmit={handleSaveSubmit} noValidate className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Platform Identifier Banner */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200/80 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-zinc-200 text-black shadow-xs">
                  <SocialIcon name={platConfig.icon || selectedPlatform} className="text-[15px]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-black">{platConfig.label}</span>
                  {existingCountForPlatform > 0 && (
                    <span className="ml-2 text-[10px] text-zinc-400 font-medium">
                      ({existingCountForPlatform} existing)
                    </span>
                  )}
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-zinc-500 hover:text-black underline"
                >
                  Change
                </button>
              )}
            </div>

            {/* Account Label (e.g. Personal, Business, Photography) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Account Label <span className="font-normal text-zinc-400 lowercase">(optional)</span>
                </label>
                <span className="text-[10px] text-zinc-400">Distinguishes multiple accounts</span>
              </div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Personal, Business, Photography, Creator..."
                maxLength={30}
                className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />

              {/* Quick Label Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {LABEL_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setLabel(label === sug ? '' : sug)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition ${
                      label === sug
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Guided Username / Handle Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                {platConfig.label} Handle or Number
              </label>

              {platConfig.prefix ? (
                <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span className="flex items-center bg-zinc-100/90 px-3 text-xs font-medium text-zinc-500 border-r border-zinc-200 select-none shrink-0">
                    {platConfig.prefix}
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder={platConfig.placeholder || 'username'}
                    autoFocus={!isEditing}
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
              ) : platConfig.mode === 'phone' ? (
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    countryCode={countryCode}
                    onSelect={(code) => setCountryCode(code)}
                  />
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder={platConfig.placeholder || '712 345 678'}
                      autoFocus={!isEditing}
                      className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <input
                    type="text"
                    inputMode={platConfig.mode === 'email' ? 'email' : 'url'}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder={platConfig.placeholder || 'https://...'}
                    autoFocus={!isEditing}
                    className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>
              )}

              {pasteFeedback && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Check size={12} /> {pasteFeedback}
                </p>
              )}

              <p className="mt-1 text-[10px] text-zinc-400">
                {platConfig.tip || `Example: ${platConfig.example}`}
              </p>
            </div>

            {/* Display Name (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Display Name <span className="font-normal text-zinc-400 lowercase">(optional)</span>
                </label>
                <span className="text-[10px] text-zinc-400">e.g. Channel or creator name</span>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Amélie Films, Personal Channel..."
                className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />
            </div>

            {/* Primary Account Checkbox */}
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3 flex items-start gap-2.5 cursor-pointer" onClick={() => setIsPrimary(!isPrimary)}>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
              />
              <div className="select-none">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                  <Star size={13} className={isPrimary ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'} />
                  <span>Primary account for {platConfig.label}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Used as the main profile shortcut and featured sharing link.
                </p>
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Live Preview
              </span>
              <div className="flex items-center justify-between rounded-lg bg-white border border-zinc-200 p-2.5 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-black border border-zinc-200">
                    <SocialIcon name={platConfig.icon || selectedPlatform} className="text-[14px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-black">{platConfig.label}</span>
                      {label && (
                        <span className="rounded-full bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 text-[9px] font-bold text-zinc-600">
                          {label}
                        </span>
                      )}
                      {isPrimary && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                          <Star size={9} className="fill-amber-500 text-amber-500" />
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] font-medium text-zinc-500 truncate">
                      {displayName
                        ? `${displayName} (@${(username || 'handle').trim().replace(/^@+/, '')})`
                        : `@${(username || 'handle').trim().replace(/^@+/, '')}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[8px] border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!username.trim()}
                className="flex items-center gap-1.5 rounded-[8px] bg-black px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 disabled:opacity-40"
              >
                <Check size={13} />
                <span>{isEditing ? 'Save Changes' : 'Add Account'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
