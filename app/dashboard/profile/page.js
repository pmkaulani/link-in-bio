'use client';
import { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { Copy, Check, Download, Globe, AlertTriangle, Loader2, RefreshCw, Link2 } from 'lucide-react';
import { APP_DOMAIN } from '../../../lib/constants';

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
  const { profile, userId, updateProfile, loading } = useDashboard();

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

  function updateSocial(name, value) {
    updateProfile({ socials: { ...(profile.socials || {}), [name]: value } });
  }

  const inputClass = 'mt-1.5 w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none';
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-zinc-500';

  return (
    <div className="flex flex-col gap-6 text-black">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-black">Profile</h1>
        <p className="mt-1 text-xs text-zinc-500">Changes update the preview instantly.</p>
      </div>

      <ShareCard username={profile.username} />

      {/* Avatar Box */}
      <div className="flex flex-col sm:flex-row items-center gap-4 py-6 border-t border-zinc-200">
        <div className="relative shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full border-2 border-zinc-200 object-cover shadow-sm" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-lg font-bold text-black shadow-xs">
              {(profile.display_name || profile.username || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          {profile.avatar_url && (
            <button
              onClick={() => handleField('avatar_url', '')}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-zinc-200 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
              title="Remove avatar"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-1 w-full space-y-1 text-center sm:text-left">
          <label className={labelClass}>
            Avatar Image URL
            <input
              type="url"
              value={profile.avatar_url || ''}
              onChange={(e) => handleField('avatar_url', e.target.value)}
              placeholder="https://images.unsplash.com/... or paste image URL"
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Try:</span>
            <button
              type="button"
              onClick={() => handleField('avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80')}
              className="flex items-center gap-1 rounded-[8px] border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              <span>Portrait</span>
            </button>
            <button
              type="button"
              onClick={() => handleField('avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&h=160&q=80')}
              className="flex items-center gap-1 rounded-[8px] border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              <span>Minimal</span>
            </button>
            {profile.avatar_url && (
              <button
                type="button"
                onClick={() => handleField('avatar_url', '')}
                className="rounded-[8px] border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
              >
                Reset
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
            maxLength={60}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Bio <span className="ml-1 font-medium text-zinc-400">{(profile.bio || '').length}/280</span>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => handleField('bio', e.target.value)}
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
    </div>
  );
}
