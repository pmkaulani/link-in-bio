'use client';
import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../DashboardContext';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { Copy, Check, Download, Globe, AlertTriangle, Loader2, RefreshCw, Link2, Upload, Trash2, Camera, X } from 'lucide-react';
import { APP_DOMAIN } from '../../../lib/constants';
import { compressAvatarImage } from '../../../lib/imageUtils';

const SOCIALS = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin', 'spotify', 'telegram', 'whatsapp'];

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function CustomDomainCard({ profile, userId }) {
  const [domainRow, setDomainRow] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setLoading(false);
      return;
    }
    supabase
      .from('custom_domains')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle()
      .then(
        ({ data }) => {
          setDomainRow(data || null);
          setInput(data?.domain || '');
          setLoading(false);
        },
        () => setLoading(false)
      );
  }, [userId]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    const clean = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!clean || !clean.includes('.')) {
      setError('Enter a valid domain, e.g. links.yoursite.com');
      return;
    }
    setSaving(true);
    const token = domainRow?.verification_token || randomToken();
    const { data, error: err } = await supabase
      .from('custom_domains')
      .upsert(
        { profile_id: userId, domain: clean, username: profile.username, verification_token: token, verified: false },
        { onConflict: 'profile_id' }
      )
      .select()
      .single();
    setSaving(false);
    if (err) {
      setError(err.message.includes('duplicate') ? 'That domain is already connected to another account.' : err.message);
      return;
    }
    setDomainRow(data);
  }

  async function handleVerify() {
    if (!domainRow) return;
    setVerifying(true);
    setVerifyMsg('');
    setError('');
    try {
      const lookupHost = `_linkinbio-verify.${domainRow.domain}`;
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${lookupHost}&type=TXT`, {
        headers: { Accept: 'application/dns-json' },
      });
      const json = await res.json();
      const records = (json.Answer || []).map((a) => (a.data || '').replace(/^"|"$/g, ''));
      const found = records.includes(domainRow.verification_token);

      if (!found) {
        setError("Couldn't find the TXT record yet. DNS changes can take a few minutes to propagate — try again shortly.");
        setVerifying(false);
        return;
      }

      const { data, error: err } = await supabase
        .from('custom_domains')
        .update({ verified: true })
        .eq('profile_id', userId)
        .select()
        .single();
      setVerifying(false);
      if (err) {
        setError(err.message);
        return;
      }
      setDomainRow(data);
      setVerifyMsg('Domain verified! Add it to your hosting provider settings to make it live.');
    } catch {
      setVerifying(false);
      setError('Verification check failed — try again in a moment.');
    }
  }

  async function handleRemove() {
    if (!domainRow) return;
    await supabase.from('custom_domains').delete().eq('profile_id', userId);
    setDomainRow(null);
    setInput('');
  }

  const inputClass = 'w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none';

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-[12px] bg-white p-6 border border-zinc-200">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-black" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Custom Domain</h2>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Connect a database to link a custom domain to your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[12px] bg-white p-6 border border-zinc-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-black" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Custom Domain</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">Use your own domain instead of {APP_DOMAIN}/{profile?.username}.</p>
        </div>
        {domainRow && (
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${domainRow.verified ? 'bg-zinc-100 text-black' : 'bg-zinc-100 text-zinc-600'}`}>
            {domainRow.verified ? <Check size={12} /> : <AlertTriangle size={12} />}
            {domainRow.verified ? 'Verified' : 'Not verified'}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Domain name
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="links.yourname.com"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-[8px] bg-black px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          {domainRow ? 'Update' : 'Connect'}
        </button>
      </form>
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 font-medium">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {domainRow && (
        <div className="mt-4 border-t border-zinc-200 pt-4 space-y-3">
          <span className="block text-xs font-bold text-black">DNS Setup Instructions</span>
          <div className="space-y-2 text-xs text-zinc-700">
            <div className="rounded-[4px] bg-zinc-100 p-2.5 font-mono text-[11px] grid grid-cols-1 sm:grid-cols-[70px_1fr] gap-1 text-black">
              <span className="font-bold text-zinc-400">TXT:</span>
              <span className="break-all">_linkinbio-verify.{domainRow.domain} → {domainRow.verification_token}</span>
              <span className="font-bold text-zinc-400">CNAME:</span>
              <span className="break-all">{domainRow.domain} → your-deployment.vercel.app</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || domainRow.verified}
                className="flex items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-black transition hover:bg-zinc-100 disabled:opacity-60"
              >
                {verifying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {domainRow.verified ? 'Verified' : verifying ? 'Checking...' : 'Check DNS'}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove domain
              </button>
            </div>
            {verifyMsg && <p className="text-xs font-semibold text-black">{verifyMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ShareCard({ username }) {
  const [copied, setCopied] = useState(false);
  if (!username) return null;

  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/${username}` : `/${username}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(pageUrl)}`;

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 24, 24, size - 48, size - 48);

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

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(badgeX + badgeSize * 0.4, badgeY + badgeSize * 0.5, 20, 0.75 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(badgeX + badgeSize * 0.6, badgeY + badgeSize * 0.5, 20, 1.75 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();

      const link = document.createElement('a');
      link.download = `${username}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrUrl;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 text-center border-t border-zinc-200">
      <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-black p-3 shadow-xl">
        <img src={qrUrl} alt={`QR code for ${pageUrl}`} className="h-36 w-36 rounded-xl object-contain bg-white p-1" />
        {/* Centered App Logo Badge */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-black border-2 border-white shadow-2xl">
          <Link2 size={18} className="text-white" strokeWidth={2.8} />
        </div>
      </div>
      <div className="max-w-md flex flex-col items-center">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Share your page</h2>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 shadow-2xs font-mono text-xs max-w-full">
          <Globe size={13} className="text-zinc-500 shrink-0" />
          <span className="text-zinc-500 font-semibold">{APP_DOMAIN}/</span>
          <span className="text-black font-black truncate">{username}</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Scan the badge code or copy the link to share your profile anywhere.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-100"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={downloadQrWithBadge}
            className="flex items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-800"
          >
            <Download size={13} />
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { profile, userId, updateProfile, loading, hasUnpostedChanges, publishChanges } = useDashboard();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  async function handlePost() {
    setPosting(true);
    await publishChanges();
    setTimeout(() => {
      setPosting(false);
      setPostedSuccess(true);
      setTimeout(() => setPostedSuccess(false), 5000);
    }, 400);
  }

  if (loading || !profile) {
    return (
      <div className="space-y-6 animate-pulse text-black">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-zinc-200" />
          <div className="h-3 w-56 rounded bg-zinc-100" />
        </div>

        {/* Profile Card Skeleton */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-zinc-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-zinc-200" />
              <div className="h-3 w-48 rounded bg-zinc-100" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-10 w-full rounded-xl bg-zinc-100" />
            <div className="h-10 w-full rounded-xl bg-zinc-100" />
            <div className="h-16 w-full rounded-xl bg-zinc-100" />
          </div>
        </div>
      </div>
    );
  }

  function handleField(field, value) {
    updateProfile({ [field]: value });
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setAvatarUploading(true);
    try {
      // 1. Fast client-side downscaling & compression to 320x320 WebP (<25KB)
      const { dataUrl, file: compressedBlob } = await compressAvatarImage(file, 320, 0.82);

      if (isSupabaseConfigured && userId) {
        const path = `avatars/${userId}.webp`;
        const { error } = await supabase.storage.from('avatars').upload(path, compressedBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

        if (!error) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          handleField('avatar_url', urlData.publicUrl + '?t=' + Date.now());
        } else {
          // If storage bucket is not configured, fall back to the lightweight compressed WebP data URL
          handleField('avatar_url', dataUrl);
        }
      } else {
        handleField('avatar_url', dataUrl);
      }
    } catch (err) {
      console.error('Avatar optimization error:', err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateSocial(name, value) {
    updateProfile({ socials: { ...(profile.socials || {}), [name]: value } });
  }

  const inputClass = 'mt-1.5 w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none';
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-zinc-500';

  return (
    <div className="flex flex-col gap-6 text-black">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-black">Profile</h1>
            {hasUnpostedChanges ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-300 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                Draft profile
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                <Check size={12} className="text-black" />
                Profile live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Changes update the preview instantly.</p>
        </div>

        {/* Post Button — ONLY shown when there are draft changes to post */}
        {(hasUnpostedChanges || posting || postedSuccess) && (
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex shrink-0 items-center justify-center gap-2 rounded-[6px] bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60 animate-profile-in"
            title="Publish your profile edits live"
          >
            {posting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </>
            ) : postedSuccess ? (
              <>
                <Check size={14} />
                Profile Posted Live!
              </>
            ) : (
              <>
                <Check size={14} />
                Post changes
              </>
            )}
          </button>
        )}
      </div>

      {postedSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold text-black animate-profile-in">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-black shrink-0" />
            <span>Profile details are posted live!</span>
          </div>
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-black underline"
            >
              View live page ↗
            </a>
          )}
        </div>
      )}

      <ShareCard username={profile.username} />

      {/* Avatar / Profile Photo Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 py-6 border-t border-zinc-200">
        <div className="relative shrink-0 group">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-20 w-20 rounded-full border-2 border-zinc-200 object-cover shadow-sm transition group-hover:opacity-90"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-xl font-black text-black shadow-xs">
              {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow-md transition hover:bg-zinc-800 hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Change photo"
            aria-label="Change profile photo"
          >
            <Camera size={13} />
          </button>
        </div>

        <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
          <div>
            <span className="block text-xs font-bold text-black">Profile Photo</span>
            <p className="mt-0.5 text-xs text-zinc-500">
              Upload a clear photo or logo. We automatically optimize and compress it for instant mobile loading.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="flex items-center justify-center gap-2 rounded-[8px] bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60 shadow-xs"
            >
              {avatarUploading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-white shrink-0" />
                  <span>Optimizing photo...</span>
                </>
              ) : (
                <>
                  <Upload size={13} className="shrink-0" />
                  <span>{profile.avatar_url ? 'Change photo' : 'Upload photo'}</span>
                </>
              )}
            </button>

            {profile.avatar_url && (
              <button
                type="button"
                onClick={() => setShowRemovePhotoModal(true)}
                disabled={avatarUploading}
                className="flex items-center gap-1.5 rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition shadow-2xs disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 border-t border-zinc-200">
        <label className={labelClass}>
          Display name
          <input
            type="text"
            value={profile.display_name || ''}
            onChange={(e) => handleField('display_name', e.target.value)}
            placeholder="e.g. Amélie Poulain"
            maxLength={60}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Bio <span className="ml-1 font-medium text-zinc-400">{(profile.bio || '').length}/280</span>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => handleField('bio', e.target.value)}
            placeholder="Photographer, filmmaker & collector of little moments."
            rows={3}
            maxLength={280}
            className={inputClass}
          />
        </label>
      </div>

      <div className="py-6 border-t border-zinc-200">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Social links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SOCIALS.map((name) => (
            <label key={name} className={`${labelClass} capitalize`}>
              {name}
              <input
                type="url"
                value={(profile.socials || {})[name] || ''}
                onChange={(e) => updateSocial(name, e.target.value)}
                placeholder={`https://${name}.com/...`}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Custom Domain Settings Card */}
      <CustomDomainCard profile={profile} userId={userId || profile?.id} />

      {/* Remove Photo Confirmation Modal */}
      {showRemovePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-profile-in">
          <div className="w-full max-w-sm rounded-[16px] border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Trash2 size={16} />
                </span>
                <h3 className="text-sm font-black text-black">Remove profile photo?</h3>
              </div>
              <button
                onClick={() => setShowRemovePhotoModal(false)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Your profile picture will be removed and replaced with your default name initials. You can upload a new photo at any time.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRemovePhotoModal(false)}
                className="rounded-[8px] border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleField('avatar_url', '');
                  setShowRemovePhotoModal(false);
                }}
                className="rounded-[8px] bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs"
              >
                Yes, Remove Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
