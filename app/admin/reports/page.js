'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '../../../lib/adminApi';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ban,
  Slash,
  RefreshCw,
  Check,
  Flame,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  async function loadReports() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const res = await adminFetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [statusFilter, priorityFilter]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  async function handleTakeAction(reportId, nextStatus, sideAction = null) {
    const note = prompt('Optional resolution note:') || '';

    setActionLoading(true);
    try {
      const res = await adminFetch('/api/admin/reports', {
        method: 'POST',
        body: JSON.stringify({
          reportId,
          status: nextStatus,
          resolutionNote: note,
          action: sideAction,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Report #${reportId} updated to ${nextStatus}.`);
        loadReports();
      }
    } catch (err) {
      console.error('Failed to process report:', err);
    } finally {
      setActionLoading(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">Trust & Safety Reports</h1>
          <p className="mt-0.5 text-xs text-zinc-400 font-medium">
            Visitor reports queue. Review flagged accounts, phishing links, and violations.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="self-start sm:self-auto flex items-center gap-2 rounded-[8px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white active:scale-95"
        >
          <RefreshCw size={13} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'investigating', label: 'Investigating' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'dismissed', label: 'Dismissed' },
            { id: 'all', label: 'All' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                statusFilter === s.id
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
          <span className="text-zinc-500 font-bold uppercase text-[9px] sm:text-[10px] mr-1">Priority:</span>
          {['all', 'urgent', 'high', 'normal'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-[8px] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold capitalize transition shrink-0 ${
                priorityFilter === p ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3.5 sm:space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 rounded-[8px] bg-zinc-850" />
                  <div className="h-4 w-16 rounded-[8px] bg-zinc-800" />
                </div>
                <div className="h-5 w-48 rounded-[8px] bg-zinc-800" />
                <div className="h-3 w-80 rounded-[8px] bg-zinc-850" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-[12px] border border-zinc-850 bg-zinc-950 p-8 sm:p-12 text-center text-zinc-400">
            <CheckCircle2 size={32} className="mx-auto text-zinc-400 mb-2" />
            <h3 className="text-sm font-bold text-white">No Reports in this Queue</h3>
            <p className="mt-1 text-xs text-zinc-500">All submitted reports have been addressed by the Trust & Safety team.</p>
          </div>
        ) : (
          reports.map((rep) => {
            const reportedProfile = rep.reported_profile || {};
            const reportedBlock = rep.reported_block || {};
            const isPending = rep.status === 'pending';
            const isUrgent = rep.priority === 'urgent';

            return (
              <div
                key={rep.id}
                className={`rounded-[12px] border p-4 sm:p-6 transition-all ${
                  isUrgent && isPending
                    ? 'border-red-800/80 bg-red-950/25'
                    : 'border-zinc-850 bg-zinc-950'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Report Info */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-400">#{rep.id.slice(0, 8)}</span>
                      <span
                        className={`rounded-[8px] px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                          rep.status === 'pending'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : rep.status === 'resolved'
                            ? 'bg-zinc-900 text-white border border-zinc-700'
                            : 'bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {rep.status}
                      </span>
                      {isUrgent && (
                        <span className="flex items-center gap-1 rounded-[8px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase">
                          <Flame size={10} /> Urgent
                        </span>
                      )}
                      <span className="text-[10px] sm:text-[11px] text-zinc-500">
                        {new Date(rep.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 flex-wrap">
                        <span>Reported:</span>
                        <Link
                          href={`/${reportedProfile.username}`}
                          target="_blank"
                          className="text-white hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          @{reportedProfile.username || 'unknown'}
                          <ExternalLink size={12} />
                        </Link>
                      </h3>
                      <p className="mt-1 text-xs font-bold text-red-400">
                        Category: <span className="text-white font-medium">{rep.reason}</span>
                      </p>
                    </div>

                    {/* Target Item Details */}
                    {rep.reported_block_id && (
                      <div className="rounded-[8px] bg-zinc-900/90 p-3 sm:p-3.5 border border-zinc-800 text-xs">
                        <span className="font-bold text-zinc-400 block mb-1">Targeted Link Block:</span>
                        <p className="font-bold text-white truncate">{reportedBlock.data?.title || 'Untitled link'}</p>
                        <p className="font-mono text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5">{reportedBlock.data?.url || 'No URL'}</p>
                        {reportedBlock.is_disabled && (
                          <span className="inline-block mt-2 rounded-[8px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 text-[9px] font-bold">
                            Currently Disabled
                          </span>
                        )}
                      </div>
                    )}

                    {/* Details from Reporter */}
                    {rep.details && (
                      <div className="rounded-[8px] bg-zinc-900/60 p-3 border border-zinc-800 text-xs text-zinc-300 font-medium break-words">
                        <span className="font-bold text-zinc-400 block mb-0.5">Reporter Statement:</span>
                        &ldquo;{rep.details}&rdquo;
                      </div>
                    )}

                    {rep.reporter_email && (
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium truncate">
                        Reporter Contact: <span className="text-zinc-300 font-semibold">{rep.reporter_email}</span>
                      </p>
                    )}

                    {rep.resolution_note && (
                      <div className="rounded-[8px] bg-zinc-900 p-3 border border-zinc-800 text-xs text-white font-medium break-words">
                        <span className="font-bold block mb-0.5 text-zinc-400">Resolution Note:</span>
                        {rep.resolution_note}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 w-full sm:w-auto">
                    {isPending && (
                      <>
                        {rep.reported_block_id && !reportedBlock.is_disabled && (
                          <button
                            onClick={() => handleTakeAction(rep.id, 'resolved', 'disable_reported_block')}
                            disabled={actionLoading}
                            className="flex items-center justify-center gap-1.5 rounded-[8px] bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-500 transition active:scale-95"
                          >
                            <Slash size={13} />
                            <span>Disable Link & Resolve</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleTakeAction(rep.id, 'resolved', 'suspend_reported_user')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 rounded-[8px] bg-amber-950/60 border border-amber-800/80 px-3.5 py-2 text-xs font-black text-amber-300 hover:bg-amber-900/60 transition active:scale-95"
                        >
                          <Ban size={13} />
                          <span>Suspend & Resolve</span>
                        </button>

                        <button
                          onClick={() => handleTakeAction(rep.id, 'resolved')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 rounded-[8px] bg-white px-3.5 py-2 text-xs font-black text-black hover:bg-zinc-200 transition active:scale-95"
                        >
                          <Check size={13} />
                          <span>Mark Resolved</span>
                        </button>

                        <button
                          onClick={() => handleTakeAction(rep.id, 'dismissed')}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-1.5 rounded-[8px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                        >
                          <XCircle size={13} />
                          <span>Dismiss</span>
                        </button>
                      </>
                    )}

                    {!isPending && (
                      <button
                        onClick={() => handleTakeAction(rep.id, 'pending')}
                        disabled={actionLoading}
                        className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        Reopen Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
