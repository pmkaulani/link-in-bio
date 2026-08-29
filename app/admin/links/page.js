'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Globe,
} from 'lucide-react';

export default function AdminLinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');

  async function loadLinks() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filter !== 'all') params.set('filter', filter);

      const res = await fetch(`/api/admin/links?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, [search, filter]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  async function handleToggleDisable(blockId, currentDisabled) {
    const reason = !currentDisabled ? prompt('Reason for disabling this link block:') : null;
    if (!currentDisabled && reason === null) return;

    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, is_disabled: !currentDisabled, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Link ${!currentDisabled ? 'disabled' : 'enabled'}.`);
        loadLinks();
      }
    } catch (err) {
      console.error('Failed to toggle block state:', err);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 text-xs font-black text-black shadow-elevated animate-profile-in max-w-[90vw]">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">Link & Content Moderation</h1>
        <p className="mt-0.5 text-xs text-zinc-400 font-medium">
          Inspect destination URLs, external domains, and disable malicious links.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 justify-between">
        <div className="relative w-full sm:w-80 lg:w-96">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL, domain, or title..."
            className="w-full rounded-[8px] border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Links' },
            { id: 'disabled', label: 'Disabled / Flagged' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                filter === f.id
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Links Table */}
      <div className="rounded-none border-y border-zinc-800 bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="border-b border-zinc-800 bg-transparent text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 sm:px-4">Link Title</th>
                <th className="py-3 px-3">Destination Domain</th>
                <th className="py-3 px-3">Creator</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-[8px] bg-zinc-850" />
                        <div className="h-3.5 w-32 rounded-[8px] bg-zinc-800" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-24 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-20 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-5 w-14 rounded-full bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-right">
                      <div className="h-7 w-16 rounded-[8px] bg-zinc-850 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No links matching search criteria.
                  </td>
                </tr>
              ) : (
                links.map((link) => {
                  const owner = link.owner || {};
                  const url = link.data?.url || '';
                  const isDisabled = link.is_disabled;

                  return (
                    <tr key={link.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3 sm:px-6">
                        <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
                          <span className="font-bold text-white block truncate">{link.data?.title || 'Untitled Link'}</span>
                          {link.data?.subtitle && (
                            <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate block">{link.data.subtitle}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[140px] sm:max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <Globe size={12} className="text-zinc-500 shrink-0" />
                          <span className="font-bold text-zinc-200 truncate">{link.domain || 'Direct link'}</span>
                        </div>
                        <span className="block font-mono text-[9px] sm:text-[10px] text-zinc-500 truncate mt-0.5">{url}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <Link
                          href={`/${owner.username}`}
                          target="_blank"
                          className="font-bold text-white hover:underline inline-flex items-center gap-1"
                        >
                          @{owner.username || 'unknown'}
                          <ExternalLink size={10} />
                        </Link>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isDisabled ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold">
                              Disabled
                            </span>
                            {link.moderation_reason && (
                              <span className="block mt-1 text-[9px] text-red-400 truncate max-w-[100px]">
                                {link.moderation_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white border border-zinc-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-2 sm:px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            Inspect
                          </a>

                          <button
                            onClick={() => handleToggleDisable(link.id, isDisabled)}
                            className={`rounded-[8px] border px-2 sm:px-2.5 py-1 text-[11px] font-bold transition ${
                              isDisabled
                                ? 'border-zinc-700 bg-white text-black'
                                : 'border-red-900/60 bg-red-950/40 text-red-400'
                            }`}
                          >
                            {isDisabled ? 'Re-enable' : 'Disable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
