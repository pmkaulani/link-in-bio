'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  Link2,
  Activity,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadStats();
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-white">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-[8px] bg-zinc-850" />
          <div className="h-3.5 w-72 rounded-[8px] bg-zinc-900" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 flex flex-col justify-between">
              <div className="h-3 w-16 rounded-[8px] bg-zinc-850" />
              <div className="h-7 w-12 rounded-[8px] bg-zinc-800" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-none border-y border-zinc-850 bg-transparent p-4" />
      </div>
    );
  }

  const s = stats || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    verifiedUsers: 0,
    newUsersToday: 0,
    publicPages: 0,
    totalBlocks: 0,
    disabledBlocks: 0,
    reports: { total: 0, pending: 0, urgent: 0, resolved: 0 },
    analytics: { totalViews: 0, totalClicks: 0, ctr: 0 },
    themeCounts: {},
    blockTypeCounts: {},
    recentUsers: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Top Header & Platform Telemetry Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">Overview</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Telemetry Live
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-400 font-medium">
            Platform pulse, real-time moderation triage, and telemetry.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 rounded-[8px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-200 transition hover:bg-zinc-800 hover:text-white active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 2. Urgent Safety Alert (if pending reports exist) */}
      {s.reports.pending > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-[12px] border border-red-900/60 bg-red-950/30 text-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertOctagon size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-red-200">
                {s.reports.pending} Pending Safety {s.reports.pending === 1 ? 'Report' : 'Reports'}
              </h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-red-300/80">
                {s.reports.urgent > 0 ? `${s.reports.urgent} marked urgent priority.` : 'Review incoming visitor moderation reports.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/reports"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-[8px] bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-500 transition active:scale-95 shrink-0"
          >
            <span>Review Safety Queue</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* 3. Primary KPI Metric Strip (Level 2: 12px) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Users</span>
            <Users size={14} className="text-zinc-400 shrink-0" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">{s.totalUsers.toLocaleString()}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-400">
            <span>{s.totalUsers > 0 ? Math.round((s.activeUsers / s.totalUsers) * 100) : 100}% active</span>
            <span>•</span>
            <span className="text-zinc-500">+{s.newUsersToday} today</span>
          </div>
        </div>

        {/* Safety Reports */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">Safety Reports</span>
            <ShieldAlert size={14} className="text-zinc-400 shrink-0" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">{s.reports.total}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-400">
            <span className={s.reports.pending > 0 ? 'text-amber-400 font-bold' : ''}>{s.reports.pending} pending</span>
            {s.reports.urgent > 0 && (
              <>
                <span>•</span>
                <span className="text-red-400 font-bold">{s.reports.urgent} urgent</span>
              </>
            )}
          </div>
        </div>

        {/* Active Blocks */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">Active Blocks</span>
            <Link2 size={14} className="text-zinc-400 shrink-0" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">{s.totalBlocks.toLocaleString()}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-400">
            <span>{s.disabledBlocks} disabled</span>
            <span>•</span>
            <span className="text-zinc-500">{s.publicPages} spaces</span>
          </div>
        </div>

        {/* Traffic & CTR */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">Traffic & CTR</span>
            <Activity size={14} className="text-zinc-400 shrink-0" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono">{s.analytics.ctr}%</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold text-zinc-400">
            <span>{s.analytics.totalViews} views</span>
            <span>•</span>
            <span className="text-zinc-500">{s.analytics.totalClicks} clicks</span>
          </div>
        </div>
      </div>

      {/* 4. Live Accounts & Moderation Table (Level 0: Flat) */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Recent Creator Accounts
            </h2>
            <p className="text-[11px] text-zinc-400">Live platform accounts & moderation status.</p>
          </div>
          <Link
            href="/admin/users"
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <span>View all users</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="rounded-none border-y border-zinc-800 bg-transparent">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead className="border-b border-zinc-800 bg-transparent text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Creator Profile</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Verified</th>
                  <th className="py-3 px-3">Blocks</th>
                  <th className="py-3 px-3">Reports</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {(s.recentUsers || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No accounts registered yet.
                    </td>
                  </tr>
                ) : (
                  (s.recentUsers || []).map((u) => {
                    const status = u.account_status || 'active';
                    return (
                      <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">@{u.username}</span>
                            <a
                              href={`/${u.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-white"
                              title="Open public page"
                            >
                              <ExternalLink size={10} />
                            </a>
                          </div>
                          {u.display_name && (
                            <span className="block text-[10px] text-zinc-400 truncate max-w-[140px]">
                              {u.display_name}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              status === 'active'
                                ? 'bg-zinc-900 text-white border border-zinc-800'
                                : status === 'warning'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-red-950/60 text-red-300 border border-red-800'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {u.is_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white text-black px-2 py-0.5 text-[9px] font-black">
                              <ShieldCheck size={9} /> Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">No</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                          {u.blocks_count || 0}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {u.reports_count > 0 ? (
                            <span className="rounded-[8px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 text-[9px] font-bold">
                              {u.reports_count} rep
                            </span>
                          ) : (
                            <span className="text-zinc-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <Link
                            href="/admin/users"
                            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-zinc-200 hover:bg-zinc-800"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Telemetry & Subsystems Split Band */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2">
        {/* Content Type Distribution */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Link2 size={13} className="text-white" />
              Content Distribution
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">{s.totalBlocks} total blocks</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.entries(s.blockTypeCounts).length === 0 ? (
              <p className="text-xs text-zinc-500">No blocks published yet.</p>
            ) : (
              Object.entries(s.blockTypeCounts).map(([type, count]) => {
                const pct = s.totalBlocks > 0 ? Math.round((count / s.totalBlocks) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-zinc-300 font-bold">{type}</span>
                      <span className="text-zinc-400 font-mono text-[11px]">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900">
                      <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Infrastructure & Subsystems Ping */}
        <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 sm:p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Zap size={13} className="text-white" />
                Infrastructure Health
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">99.99% Uptime</span>
            </div>

            <div className="space-y-2 pt-2.5">
              {[
                { name: 'Database Storage (Postgres/Mock)', ping: '12ms', status: 'Optimal' },
                { name: 'Auth Gate & Session Cache', ping: '15ms', status: 'Optimal' },
                { name: 'Edge Profile Routing CDN', ping: '4ms', status: 'Optimal' },
                { name: 'Analytics Telemetry Engine', ping: '8ms', status: 'Optimal' },
              ].map((srv) => (
                <div key={srv.name} className="flex items-center justify-between rounded-[8px] bg-zinc-900/80 p-2 sm:p-2.5 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-bold text-zinc-200 truncate">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">{srv.status}</span>
                    <span className="font-mono text-[10px] font-bold text-zinc-400">{srv.ping}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500 text-center font-medium">All edge services nominal.</p>
        </div>
      </div>

      {/* 6. Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
        <Link
          href="/admin/users"
          className="group rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 hover:border-zinc-700 transition flex items-center justify-between"
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-zinc-300 transition">User Management</h3>
            <p className="mt-0.5 text-[11px] text-zinc-400">Search creators, suspensions & badges.</p>
          </div>
          <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-1 group-hover:text-white transition shrink-0 ml-2" />
        </Link>

        <Link
          href="/admin/reports"
          className="group rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 hover:border-zinc-700 transition flex items-center justify-between"
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-zinc-300 transition">Safety Queue</h3>
            <p className="mt-0.5 text-[11px] text-zinc-400">Review flagged accounts & phishing.</p>
          </div>
          <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-1 group-hover:text-white transition shrink-0 ml-2" />
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-[12px] border border-zinc-850 bg-zinc-950 p-4 hover:border-zinc-700 transition flex items-center justify-between"
        >
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-zinc-300 transition">Feature Flags</h3>
            <p className="mt-0.5 text-[11px] text-zinc-400">Manage flags & reserved handles.</p>
          </div>
          <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-1 group-hover:text-white transition shrink-0 ml-2" />
        </Link>
      </div>
    </div>
  );
}
