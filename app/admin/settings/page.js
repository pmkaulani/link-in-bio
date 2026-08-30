'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '../../../lib/adminApi';
import {
  Flag,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState([]);
  const [settings, setSettings] = useState([]);
  const [reservedUsernames, setReservedUsernames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newReason, setNewReason] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  async function loadData() {
    try {
      const res = await adminFetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setFlags(data.flags || []);
        setSettings(data.settings || []);
        setReservedUsernames(data.reserved_usernames || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  async function handleToggleFlag(flagName, currentVal) {
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggle_flag', flagName, enabled: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Feature flag '${flagName}' ${!currentVal ? 'enabled' : 'disabled'}.`);
        loadData();
      }
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  }

  async function handleAddReserved(e) {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          action: 'add_reserved_username',
          username: newUsername.trim(),
          reason: newReason.trim() || 'Reserved by administrator',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Username '${newUsername}' reserved.`);
        setNewUsername('');
        setNewReason('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to add reserved username:', err);
    }
  }

  async function handleRemoveReserved(username) {
    if (!confirm(`Allow registration of username '${username}'?`)) return;

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove_reserved_username', username }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Username '${username}' unreserved.`);
        loadData();
      }
    } catch (err) {
      console.error('Failed to remove reserved username:', err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-white">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded-[8px] bg-zinc-850" />
          <div className="h-3.5 w-80 rounded-[8px] bg-zinc-900" />
        </div>
        <div className="rounded-[8px] border border-zinc-850 bg-zinc-950 p-6 space-y-4">
          <div className="h-5 w-44 rounded-[8px] bg-zinc-850" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-[8px] bg-zinc-900 border border-zinc-850 p-4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 text-xs font-black text-black shadow-elevated animate-profile-in max-w-[90vw]">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">Platform Settings & Flags</h1>
        <p className="mt-0.5 text-xs text-zinc-400 font-medium">
          Configure feature flags and protect reserved system handles.
        </p>
      </div>

      {/* Section 1: Feature Flags */}
      <section className="py-6 border-t border-zinc-800 first:border-t-0 space-y-4">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Flag size={14} className="text-white shrink-0" />
            Live Feature Flags
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400 font-medium">
            Toggle platform features without redeploying code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 pt-1">
          {flags.map((flag) => (
            <div
              key={flag.name}
              className="flex items-center justify-between rounded-[12px] border border-zinc-850 bg-zinc-950 p-3.5 sm:p-4 gap-3"
            >
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-white block truncate">{flag.name}</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 block mt-0.5 line-clamp-1">{flag.description || 'Feature flag'}</span>
              </div>

              <button
                onClick={() => handleToggleFlag(flag.name, flag.enabled)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] font-bold transition shrink-0 ${
                  flag.enabled
                    ? 'bg-white text-black font-extrabold'
                    : 'bg-zinc-850 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {flag.enabled ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    <span>Off</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Reserved Usernames Blacklist */}
      <section className="py-6 border-t border-zinc-800 space-y-4">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Lock size={14} className="text-white shrink-0" />
            Reserved Usernames Blacklist
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-400 font-medium">
            Prevent impersonation of staff and system URLs.
          </p>
        </div>

        {/* Add Username Form */}
        <form onSubmit={handleAddReserved} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            placeholder="Username (e.g. billing, executive)"
            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none flex-1"
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason / Notes (optional)"
            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none flex-1"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-[8px] bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition active:scale-95 shrink-0"
          >
            <Plus size={14} />
            <span>Reserve</span>
          </button>
        </form>

        {/* Reserved Handles Badges */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
          {reservedUsernames.map((item) => (
            <div
              key={item.username}
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200"
            >
              <span className="font-bold text-white">@{item.username}</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">({item.reason})</span>
              <button
                onClick={() => handleRemoveReserved(item.username)}
                className="text-zinc-500 hover:text-red-400 transition"
                title="Unreserve handle"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
