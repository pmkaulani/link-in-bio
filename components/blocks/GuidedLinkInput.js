'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  PLATFORMS,
  COUNTRY_CODES,
  cleanUsername,
  detectPlatformFromUrl,
} from '../../lib/platformGuide';
import { HelpCircle, Sparkles, Check, ChevronDown } from 'lucide-react';

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
        className="flex h-full items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-zinc-50 px-2.5 py-2.5 text-xs font-bold text-black hover:border-black shadow-xs transition"
      >
        <span>{countryCode}</span>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? 'rotate-180 text-black' : ''}`} />
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

export default function GuidedLinkInput({
  platform = 'link',
  url = '',
  onChange,
  onPlatformChange,
  showContextualTip = true,
}) {
  const platConfig = PLATFORMS[platform] || PLATFORMS.link;

  // Local state for extracted username or phone or youtube mode
  const [usernameVal, setUsernameVal] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [ytMode, setYtMode] = useState('channel');
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [detectedFeedback, setDetectedFeedback] = useState(null);

  // Sync internal state when incoming url or platform changes
  useEffect(() => {
    if (!url) {
      setUsernameVal('');
      setPhoneVal('');
      return;
    }

    if (platConfig.mode === 'username') {
      const parsed = platConfig.parseUrl ? platConfig.parseUrl(url) : null;
      if (parsed) {
        setUsernameVal(parsed);
      } else if (!url.includes('://')) {
        setUsernameVal(cleanUsername(url));
      }
    } else if (platConfig.mode === 'phone') {
      const parsed = platConfig.parseUrl ? platConfig.parseUrl(url) : null;
      if (parsed) {
        setPhoneVal(parsed);
      } else {
        setPhoneVal(url.replace(/[^\d+]/g, ''));
      }
    } else if (platConfig.mode === 'youtube') {
      const parsed = platConfig.parseUrl ? platConfig.parseUrl(url) : null;
      if (parsed) {
        setYtMode(parsed.mode);
        setUsernameVal(parsed.value);
      }
    }
  }, [platform, url, platConfig]);

  // Handle Smart Paste & Input for Username
  function handleUsernameChange(rawVal) {
    const trimmed = rawVal.trim();

    // Check if user pasted a full URL
    const detected = detectPlatformFromUrl(trimmed);
    if (detected) {
      setDetectedFeedback(`Recognized ${PLATFORMS[detected.platformKey]?.label || detected.platformKey}!`);
      setTimeout(() => setDetectedFeedback(null), 3000);

      if (onPlatformChange && detected.platformKey !== platform) {
        onPlatformChange(detected.platformKey);
      }

      onChange({
        url: detected.cleanUrl,
        platform: detected.platformKey,
        icon: detected.icon,
        title: detected.title,
        subtitle: detected.subtitle,
      });
      return;
    }

    // Normal clean username input
    const clean = cleanUsername(rawVal);
    setUsernameVal(clean);
    const finalUrl = platConfig.buildUrl ? platConfig.buildUrl(clean) : clean;
    onChange({
      url: finalUrl,
      platform,
    });
  }

  // Handle Phone input for WhatsApp / Call
  function handlePhoneChange(val, customCode = countryCode) {
    // Check if user pasted a full wa.me or chat link
    const detected = detectPlatformFromUrl(val);
    if (detected && detected.platformKey === 'whatsapp') {
      setPhoneVal(detected.value);
      onChange({ url: detected.cleanUrl, platform: 'whatsapp' });
      return;
    }

    setPhoneVal(val);
    const finalUrl = platConfig.buildUrl ? platConfig.buildUrl(val, customCode) : val;
    onChange({
      url: finalUrl,
      platform,
    });
  }

  // Handle YouTube channel / video input
  function handleYoutubeChange(val, mode = ytMode) {
    const detected = detectPlatformFromUrl(val);
    if (detected && detected.platformKey === 'youtube') {
      setYtMode(detected.mode);
      setUsernameVal(detected.value);
      onChange({ url: detected.cleanUrl, platform: 'youtube' });
      return;
    }

    setUsernameVal(val);
    const finalUrl = platConfig.buildUrl ? platConfig.buildUrl(val, mode) : val;
    onChange({
      url: finalUrl,
      platform: 'youtube',
    });
  }

  // Handle full URL input (Spotify, Website, etc.)
  function handleUrlChange(rawVal) {
    const detected = detectPlatformFromUrl(rawVal);
    if (detected && onPlatformChange && detected.platformKey !== platform) {
      setDetectedFeedback(`Recognized ${PLATFORMS[detected.platformKey]?.label || detected.platformKey}!`);
      setTimeout(() => setDetectedFeedback(null), 3000);
      onPlatformChange(detected.platformKey);
      onChange({
        url: detected.cleanUrl,
        platform: detected.platformKey,
        icon: detected.icon,
        title: detected.title,
        subtitle: detected.subtitle,
      });
      return;
    }

    onChange({
      url: rawVal,
      platform,
    });
  }

  return (
    <div className="space-y-2.5">
      {/* Auto-detected notification banner */}
      {detectedFeedback && (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <Sparkles size={13} className="text-emerald-600" />
          <span>{detectedFeedback}</span>
        </div>
      )}

      {/* 1. USERNAME-BASED PLATFORMS (Instagram, X, TikTok, GitHub, LinkedIn, etc.) */}
      {platConfig.mode === 'username' && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            {platConfig.label} Username
          </label>
          <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <span className="flex items-center bg-zinc-100/80 px-3 text-xs font-medium text-zinc-500 border-r border-zinc-200 select-none">
              {platConfig.prefix}
            </span>
            <input
              type="text"
              value={usernameVal}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder={platConfig.placeholder || 'username'}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-500">
            <span>
              Example: <strong className="text-zinc-700 font-semibold">{platConfig.example}</strong>
            </span>
            {usernameVal && (
              <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[240px]">
                Link: {platConfig.prefix}{usernameVal}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. WHATSAPP & PHONE-BASED */}
      {platConfig.mode === 'phone' && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            {platConfig.label === 'WhatsApp' ? 'WhatsApp Phone Number' : 'Phone Number'}
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <CountryCodeDropdown
              countryCode={countryCode}
              onSelect={(code) => {
                setCountryCode(code);
                handlePhoneChange(phoneVal, code);
              }}
            />

            {/* Phone Number Field */}
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneVal}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={platConfig.placeholder || '712 345 678'}
                className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. YOUTUBE DUAL MODE (Channel vs Video) */}
      {platConfig.mode === 'youtube' && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            What are you sharing on YouTube?
          </label>
          <div className="mb-2.5 inline-flex rounded-lg bg-zinc-100 p-1 border border-zinc-200/80 text-xs">
            <button
              type="button"
              onClick={() => {
                setYtMode('channel');
                handleYoutubeChange(usernameVal, 'channel');
              }}
              className={`rounded-[6px] px-3 py-1 font-bold transition ${
                ytMode === 'channel' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
              }`}
            >
              Channel
            </button>
            <button
              type="button"
              onClick={() => {
                setYtMode('video');
                handleYoutubeChange(usernameVal, 'video');
              }}
              className={`rounded-[6px] px-3 py-1 font-bold transition ${
                ytMode === 'video' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
              }`}
            >
              Video / Short
            </button>
          </div>

          {ytMode === 'channel' ? (
            <div>
              <div className="flex rounded-[8px] border border-zinc-200 bg-white shadow-xs overflow-hidden focus-within:border-black">
                <span className="flex items-center bg-zinc-100/80 px-3 text-xs font-medium text-zinc-500 border-r border-zinc-200 select-none">
                  youtube.com/@
                </span>
                <input
                  type="text"
                  value={usernameVal}
                  onChange={(e) => handleYoutubeChange(e.target.value, 'channel')}
                  placeholder="channel_handle"
                  className="w-full bg-transparent px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">Example: <strong className="text-zinc-600">mkbhd</strong></p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={usernameVal}
                onChange={(e) => handleYoutubeChange(e.target.value, 'video')}
                placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. EMAIL DIRECT ACTION */}
      {platConfig.mode === 'email' && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={url.replace(/^mailto:/i, '')}
            onChange={(e) => onChange({ url: platConfig.buildUrl(e.target.value), platform: 'email' })}
            placeholder="hello@example.com"
            className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
          />
        </div>
      )}

      {/* 5. FULL-LINK / CONTENT (Spotify, Website, Custom Links, etc.) */}
      {platConfig.mode === 'url' && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            {platConfig.label === 'Spotify'
              ? 'Paste Spotify Link'
              : platConfig.label === 'Website'
              ? 'Website URL'
              : 'Destination Link'}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={platConfig.placeholder || 'https://...'}
            className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none shadow-xs"
          />

          {platConfig.guideSteps && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHowToGuide(!showHowToGuide)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 hover:text-black hover:underline"
              >
                <HelpCircle size={13} />
                <span>How do I find my {platConfig.label} link?</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showHowToGuide ? 'rotate-180' : ''}`} />
              </button>

              {showHowToGuide && (
                <div className="mt-2 rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-xs text-zinc-700 space-y-1.5 animate-fadeIn">
                  <p className="font-bold text-black">Quick steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-600 text-[11px]">
                    {platConfig.guideSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contextual Smart Helper Tip */}
      {showContextualTip && platConfig.tip && (
        <div className="flex items-start gap-1.5 rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/70 text-[11px] text-zinc-600">
          <Sparkles size={13} className="text-zinc-500 shrink-0 mt-0.5" />
          <span>{platConfig.tip}</span>
        </div>
      )}
    </div>
  );
}
