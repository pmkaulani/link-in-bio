'use client';
import { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadLogs() {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.admin_email?.toLowerCase().includes(s) ||
      l.target_type?.toLowerCase().includes(s) ||
      l.target_id?.toLowerCase().includes(s) ||
      JSON.stringify(l.metadata || {}).toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">Platform Audit Trail</h1>
          <p className="mt-0.5 text-xs text-zinc-400 font-medium">
            Immutable log of all administrative actions and security modifications.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="self-start sm:self-auto flex items-center gap-2 rounded-[8px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white active:scale-95"
        >
          <RefreshCw size={13} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80 lg:w-96">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit log..."
          className="w-full rounded-[8px] border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="rounded-none border-y border-zinc-800 bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="border-b border-zinc-800 bg-transparent text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 sm:px-4">Timestamp</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-3 sm:px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3 sm:px-6">
                      <div className="h-3 w-28 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-24 rounded-[8px] bg-zinc-800" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-5 w-20 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-24 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3 sm:px-6">
                      <div className="h-3 w-40 rounded-[8px] bg-zinc-900" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No audit records matching search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/50 transition font-mono text-[10px] sm:text-[11px]">
                    <td className="py-3 px-3 sm:px-6 text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      {log.admin_email || 'admin'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="rounded-[8px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-300 whitespace-nowrap">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 mr-1">{log.target_type}:</span>
                      <span>{log.target_id}</span>
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-zinc-400 font-sans text-xs max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
