'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../DashboardContext';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { setQuestFlag } from '../../../lib/questFlags';
import {
  Globe,
  BarChart3,
  MousePointer,
} from 'lucide-react';

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const { profile, blocks, userId, loading: dashboardLoading } = useDashboard();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuestFlag('viewed_analytics');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) { setLoading(false); return; }
    supabase
      .from('analytics_events')
      .select('event_type, block_id, client_token, referrer, created_at')
      .eq('profile_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      }, () => setLoading(false));
  }, [userId]);

  const stats = useMemo(() => {
    const views = events.filter((e) => e.event_type === 'view').length;
    const clicks = events.filter((e) => e.event_type === 'click').length;
    const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

    // Unique visitors based on distinct client_token
    const uniqueVisitorTokens = new Set(
      events.filter((e) => e.event_type === 'view' && e.client_token).map((e) => e.client_token)
    );
    const uniqueVisitors = Math.max(uniqueVisitorTokens.size, views > 0 ? 1 : 0);

    // Clicks by link block
    const clicksByBlock = {};
    events.forEach((e) => {
      if (e.event_type === 'click' && e.block_id) {
        clicksByBlock[e.block_id] = (clicksByBlock[e.block_id] || 0) + 1;
      }
    });

    const linkStats = blocks
      .filter((b) => b.type === 'link')
      .map((b) => ({ id: b.id, title: b.data?.title || 'Untitled link', url: b.data?.url, clicks: clicksByBlock[b.id] || 0 }))
      .sort((a, b) => b.clicks - a.clicks);

    // Referrers / Traffic Sources breakdown
    const referrerCounts = {};
    events.forEach((e) => {
      const ref = e.referrer || 'direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });

    // 14-day trend
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push(dayKey(d));
    }
    const viewsByDay = {};
    events.forEach((e) => {
      if (e.event_type === 'view') {
        const key = e.created_at ? e.created_at.slice(0, 10) : dayKey(new Date());
        viewsByDay[key] = (viewsByDay[key] || 0) + 1;
      }
    });
    const trend = days.map((d) => ({ day: d, count: viewsByDay[d] || 0 }));
    const maxTrend = Math.max(1, ...trend.map((t) => t.count));

    return {
      views,
      clicks,
      ctr,
      uniqueVisitors,
      linkStats,
      referrerCounts,
      trend,
      maxTrend,
    };
  }, [events, blocks]);

  if (dashboardLoading || loading) {
    return (
      <div className="space-y-6 pb-16 text-black max-w-4xl animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-[4px] bg-zinc-200" />
          <div className="h-3 w-80 rounded-[4px] bg-zinc-100" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-[8px] border border-zinc-200 bg-white p-4 flex flex-col justify-between">
              <div className="h-3.5 w-20 rounded-[4px] bg-zinc-100" />
              <div className="h-7 w-16 rounded-[4px] bg-zinc-200" />
            </div>
          ))}
        </div>

        {/* Chart Area Skeleton */}
        <div className="h-64 rounded-[8px] border border-zinc-200 bg-white p-6 flex flex-col justify-between">
          <div className="h-4 w-36 rounded-[4px] bg-zinc-200" />
          <div className="h-40 w-full rounded-[4px] bg-zinc-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 text-black max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">Analytics & Insights</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
          Traffic, unique visitors, click performance, and referral breakdown for the last 30 days.
        </p>
      </div>

      {/* Unified Key Metrics Strip (Seamless single card with dividers) */}
      <div className="rounded-[12px] border border-zinc-200 bg-white p-2 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {/* Total Views */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Views</span>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">{stats.views.toLocaleString()}</p>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5 block">All page traffic</span>
            </div>
          </div>

          {/* Unique Visitors */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Unique Visitors</span>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">{stats.uniqueVisitors.toLocaleString()}</p>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5 block">Distinct devices</span>
            </div>
          </div>

          {/* Link Clicks */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Link Clicks</span>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">{stats.clicks.toLocaleString()}</p>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5 block">Outbound clicks</span>
            </div>
          </div>

          {/* Click Through Rate */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Click Rate (CTR)</span>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-black tracking-tight">{stats.ctr}%</p>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5 block">Conversion ratio</span>
            </div>
          </div>
        </div>
      </div>

      {/* 14-day trend (Continuous Editorial Chart) */}
      <div className="py-6 border-t border-b border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <BarChart3 size={14} className="text-black" />
            Page Views Trend (Last 14 Days)
          </h2>
          <span className="text-[10px] font-mono text-zinc-400">
            {stats.views} total views
          </span>
        </div>

        {stats.views === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-400">
            No views logged yet. Share your link to start tracking daily visitors.
          </div>
        ) : (
          <div className="flex h-36 items-end gap-1.5 sm:gap-2 pt-4 border-b border-zinc-100">
            {stats.trend.map((t) => (
              <div key={t.day} className="group relative flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-[2px] bg-black transition-all group-hover:bg-zinc-700"
                  style={{ height: `${Math.max(6, (t.count / stats.maxTrend) * 115)}px` }}
                  title={`${t.day}: ${t.count} view${t.count === 1 ? '' : 's'}`}
                />
                <span className="mt-2 text-[9px] text-zinc-400 font-mono hidden sm:block">
                  {t.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Traffic Sources & Per-Link Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
        {/* Traffic Sources */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Globe size={14} className="text-black" />
            Top Traffic Referrers
          </h2>
          <div className="flex flex-col divide-y divide-zinc-100 pt-1">
            {Object.keys(stats.referrerCounts).length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">Traffic sources will appear once visitors arrive.</p>
            ) : (
              Object.entries(stats.referrerCounts).map(([channel, count]) => {
                const total = events.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={channel} className="space-y-1.5 py-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="capitalize text-black">{channel}</span>
                      <span className="text-zinc-500 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-[2px] bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-[2px] bg-black" style={{ width: `${Math.max(3, pct)}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Per-link breakdown */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <MousePointer size={14} className="text-black" />
            Clicks by Link
          </h2>
          {stats.linkStats.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">Add a link block to start tracking individual clicks.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100 pt-1">
              {stats.linkStats.map((link) => {
                const maxClicks = stats.linkStats[0].clicks || 1;
                const pct = maxClicks > 0 ? (link.clicks / maxClicks) * 100 : 0;
                return (
                  <div key={link.id} className="space-y-1.5 py-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate text-black max-w-[70%]">{link.title}</span>
                      <span className="shrink-0 text-black font-mono text-[11px]">{link.clicks} clicks</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-zinc-100">
                      <div className="h-full rounded-[2px] bg-black" style={{ width: `${Math.max(2, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
