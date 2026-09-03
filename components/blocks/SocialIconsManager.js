'use client';
import { useState } from 'react';
import { useDashboard } from '../../app/dashboard/DashboardContext';
import { ICONS } from '../../lib/icons';
import SocialIcon from '../ui/SocialIcon';
import { Check, X, Edit2, Share2 } from 'lucide-react';

const SUPPORTED_SOCIALS = [
  { id: 'snapchat', name: 'Snapchat', prefix: 'https://snapchat.com/add/' },
  { id: 'instagram', name: 'Instagram', prefix: 'https://instagram.com/' },
  { id: 'tiktok', name: 'TikTok', prefix: 'https://tiktok.com/@' },
  { id: 'youtube', name: 'YouTube', prefix: 'https://youtube.com/@' },
  { id: 'twitter', name: 'X / Twitter', prefix: 'https://x.com/' },
  { id: 'whatsapp', name: 'WhatsApp', prefix: 'https://wa.me/' },
  { id: 'threads', name: 'Threads', prefix: 'https://threads.net/@' },
  { id: 'facebook', name: 'Facebook', prefix: 'https://facebook.com/' },
  { id: 'pinterest', name: 'Pinterest', prefix: 'https://pinterest.com/' },
  { id: 'reddit', name: 'Reddit', prefix: 'https://reddit.com/user/' },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'https://linkedin.com/in/' },
  { id: 'telegram', name: 'Telegram', prefix: 'https://t.me/' },
  { id: 'discord', name: 'Discord', prefix: 'https://discord.gg/' },
  { id: 'spotify', name: 'Spotify', prefix: 'https://open.spotify.com/artist/' },
  { id: 'applemusic', name: 'Apple Music', prefix: 'https://music.apple.com/' },
  { id: 'soundcloud', name: 'SoundCloud', prefix: 'https://soundcloud.com/' },
  { id: 'twitch', name: 'Twitch', prefix: 'https://twitch.tv/' },
  { id: 'kick', name: 'Kick', prefix: 'https://kick.com/' },
  { id: 'patreon', name: 'Patreon', prefix: 'https://patreon.com/' },
  { id: 'substack', name: 'Substack', prefix: 'https://substack.com/@' },
  { id: 'medium', name: 'Medium', prefix: 'https://medium.com/@' },
  { id: 'github', name: 'GitHub', prefix: 'https://github.com/' },
  { id: 'paypal', name: 'PayPal', prefix: 'https://paypal.me/' },
  { id: 'cashapp', name: 'Cash App', prefix: 'https://cash.app/$' },
  { id: 'venmo', name: 'Venmo', prefix: 'https://venmo.com/' },
  { id: 'phone', name: 'Phone', prefix: 'tel:' },
  { id: 'email', name: 'Email', prefix: 'mailto:' },
];

export default function SocialIconsManager() {
  const { profile, updateProfile } = useDashboard();
  const [editingSocial, setEditingSocial] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const currentSocials = profile?.socials && typeof profile.socials === 'object' ? profile.socials : {};
  const activeEntries = Object.entries(currentSocials).filter(
    ([name, url]) => Boolean(!name.startsWith('_') && typeof url === 'string' && url.trim())
  );

  function handleOpenEdit(socialId) {
    const existing = currentSocials[socialId] || '';
    const def = SUPPORTED_SOCIALS.find((s) => s.id === socialId);
    setIsOpen(true);
    setEditingSocial(socialId);
    if (socialId === 'whatsapp') {
      setUrlInput(existing || '');
    } else {
      setUrlInput(existing || def?.prefix || 'https://');
    }
  }

  function handleSave(socialId) {
    let clean = urlInput.trim();
    if (socialId === 'whatsapp' && clean) {
      if (!/^https?:\/\//i.test(clean)) {
        if (/^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/i.test(clean)) {
          clean = `https://${clean}`;
        } else {
          const digits = clean.replace(/[^0-9]/g, '');
          if (digits) clean = `https://wa.me/${digits}`;
        }
      }
    }
    const updated = { ...currentSocials };
    if (!clean) {
      delete updated[socialId];
    } else {
      updated[socialId] = clean;
    }
    updateProfile({ socials: updated });
    setEditingSocial(null);
    setUrlInput('');
  }

  function handleRemove(socialId, e) {
    if (e) e.stopPropagation();
    const updated = { ...currentSocials };
    delete updated[socialId];
    updateProfile({ socials: updated });
    if (editingSocial === socialId) {
      setEditingSocial(null);
      setUrlInput('');
    }
  }

  return (
    <div className="rounded-none border-y border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-black">Social Media Icons</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
              {activeEntries.length} active
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Persistent circular icon buttons shown directly below your bio (Telegram, Facebook, Instagram, etc.).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-zinc-100"
        >
          {isOpen ? 'Done' : 'Edit Icons'}
        </button>
      </div>

      {/* Active Social Chips Bar */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100">
        {activeEntries.length === 0 ? (
          <p className="text-xs text-zinc-400 py-1">No social icons added yet. Click &ldquo;Edit Icons&rdquo; to add Telegram, Facebook, Instagram, and more.</p>
        ) : (
          activeEntries.map(([socialId, url]) => {
            const meta = ICONS[socialId] || { label: socialId, className: 'fa-solid fa-link', color: '#000000' };
            const isEditingThis = editingSocial === socialId;
            return (
              <div
                key={socialId}
                className={`group flex items-center gap-2 rounded-full border pl-2.5 pr-2 py-1 text-xs font-bold shadow-xs transition cursor-pointer select-none ${
                  isEditingThis
                    ? 'border-black bg-black text-white'
                    : 'border-zinc-200 bg-zinc-50 text-black hover:border-black'
                }`}
                onClick={() => handleOpenEdit(socialId)}
              >
                <SocialIcon name={meta.className} style={{ color: isEditingThis ? '#ffffff' : meta.color }} className="text-[14px]" />
                <span>{meta.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(socialId);
                  }}
                  className={`transition ${isEditingThis ? 'text-zinc-300 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
                  title={`Edit ${meta.label} URL`}
                >
                  <Edit2 size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemove(socialId, e)}
                  className={`transition ${isEditingThis ? 'text-zinc-300 hover:text-red-400' : 'text-zinc-400 hover:text-red-600'}`}
                  title={`Remove ${meta.label}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Expandable Platform Selector & Editor */}
      {isOpen && (
        <div className="mt-4 pt-3 border-t border-zinc-200">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Click any platform to add or edit URL:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SUPPORTED_SOCIALS.map((social) => {
              const meta = ICONS[social.id] || { className: 'fa-solid fa-link', color: '#000000' };
              const isAdded = Boolean(currentSocials[social.id]);
              const isSelected = editingSocial === social.id;

              return (
                <button
                  key={social.id}
                  type="button"
                  onClick={() => handleOpenEdit(social.id)}
                  className={`flex items-center justify-between rounded-[12px] border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-xs'
                      : isAdded
                      ? 'border-zinc-300 bg-zinc-100 text-black font-bold'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SocialIcon name={meta.className} style={{ color: isSelected ? '#ffffff' : isAdded ? meta.color : '#71717A' }} className="text-[15px]" />
                    <span className="text-xs font-semibold truncate">{social.name}</span>
                  </div>
                  {isAdded && !isSelected && <Check size={13} className="text-black shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quick Edit Drawer */}
          {editingSocial && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(editingSocial);
              }}
              className="mt-3 flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-[12px] border border-black bg-zinc-50 p-2.5 animate-profile-in"
            >
              <span className="text-xs font-bold capitalize text-black shrink-0">
                {SUPPORTED_SOCIALS.find((s) => s.id === editingSocial)?.name || editingSocial}:
              </span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={
                  editingSocial === 'whatsapp'
                    ? 'Enter phone with country code (+1 555 123 4567) or link...'
                    : editingSocial === 'phone'
                    ? 'Enter phone number (+1 555 123 4567)...'
                    : 'Enter profile link or username...'
                }
                autoFocus
                className="flex-1 min-w-[140px] rounded-[8px] border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="submit"
                  className="rounded-[8px] bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSocial(null);
                    setUrlInput('');
                  }}
                  className="rounded-[8px] border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-500 hover:text-black"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
