'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  Trash2,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  async function loadUsers() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  async function handleStatusChange(userId, nextStatus) {
    const reason = nextStatus === 'suspended' || nextStatus === 'banned'
      ? prompt('Enter reason for account suspension/action:')
      : null;

    if ((nextStatus === 'suspended' || nextStatus === 'banned') && reason === null) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', userId, status: nextStatus, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User status updated to ${nextStatus}.`);
        loadUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, account_status: nextStatus, suspension_reason: reason });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleVerify(userId, currentVal) {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_verified', userId, is_verified: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Verification status updated.`);
        loadUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, is_verified: !currentVal });
        }
      }
    } catch (err) {
      console.error('Failed to toggle verification:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteUser(userId, username) {
    if (!confirm(`Are you sure you want to permanently delete @${username}? All links and data will be erased.`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', userId, reason: 'Admin deletion' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User @${username} deleted.`);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 rounded-[8px] bg-white px-4 py-3 text-xs font-black text-black shadow-elevated animate-profile-in max-w-[90vw]">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">User Accounts</h1>
        <p className="mt-0.5 text-xs text-zinc-400 font-medium">
          Search, moderate, verify, or suspend creator profiles across the platform.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full rounded-[8px] border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'warning', label: 'Warning' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'verified', label: 'Verified' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                statusFilter === f.id
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table Container */}
      <div className="rounded-none border-y border-zinc-800 bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead className="border-b border-zinc-800 bg-transparent text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 sm:px-4">Creator Profile</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Badges</th>
                <th className="py-3 px-3">Blocks / Reports</th>
                <th className="py-3 px-3">Joined</th>
                <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-850 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 rounded-[8px] bg-zinc-800" />
                          <div className="h-2.5 w-16 rounded-[8px] bg-zinc-850" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-5 w-16 rounded-full bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-5 w-12 rounded bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-20 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3 w-16 rounded-[8px] bg-zinc-850" />
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-right">
                      <div className="h-7 w-14 rounded-[8px] bg-zinc-850 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No accounts matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const status = u.account_status || 'active';
                  const joinDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : '—';
                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3 sm:px-6">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-zinc-800 shrink-0" />
                          ) : (
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-black text-white border border-zinc-800 shrink-0">
                              {(u.display_name || u.username || '?').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">@{u.username}</span>
                              <a
                                href={`/${u.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-500 hover:text-white"
                                title="Open public page"
                              >
                                <ExternalLink size={11} />
                              </a>
                            </div>
                            <span className="block text-[10px] sm:text-[11px] text-zinc-400 truncate max-w-[120px] sm:max-w-[160px]">
                              {u.display_name || 'No display name'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
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

                      {/* Badges */}
                      <td className="py-3 px-3">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white text-black px-2 py-0.5 text-[9px] sm:text-[10px] font-black whitespace-nowrap">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-[11px] text-zinc-500">Unverified</span>
                        )}
                      </td>

                      {/* Blocks / Reports */}
                      <td className="py-3 px-3 text-zinc-300 whitespace-nowrap">
                        <span className="font-semibold">{u.blocks_count || 0} blk</span>
                        {u.reports_count > 0 && (
                          <span className="ml-1.5 rounded-[8px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 text-[9px] font-bold">
                            {u.reports_count} rep
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[10px] sm:text-[11px] whitespace-nowrap">{joinDate}</td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-2 sm:px-2.5 py-1 text-[11px] font-bold text-zinc-200 hover:bg-zinc-800"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleToggleVerify(u.id, u.is_verified)}
                            className={`rounded-[8px] border px-2 sm:px-2.5 py-1 text-[11px] font-bold transition ${
                              u.is_verified
                                ? 'border-zinc-700 text-white bg-zinc-800'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {u.is_verified ? '✓' : 'Verify'}
                          </button>

                          <button
                            onClick={() => handleStatusChange(u.id, status === 'suspended' ? 'active' : 'suspended')}
                            className={`rounded-[8px] border px-2 sm:px-2.5 py-1 text-[11px] font-bold transition ${
                              status === 'suspended'
                                ? 'border-zinc-700 bg-white text-black'
                                : 'border-red-900/60 bg-red-950/40 text-red-400'
                            }`}
                          >
                            {status === 'suspended' ? 'Unsuspend' : 'Suspend'}
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-profile-in">
          <div className="relative w-full max-w-lg rounded-[16px] border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-elevated text-white max-h-[88vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover border-2 border-zinc-800 shrink-0" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-black text-white border border-zinc-800 shrink-0">
                  {(selectedUser.display_name || selectedUser.username || '?').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-white truncate">@{selectedUser.username}</h3>
                <p className="text-xs text-zinc-400 font-medium truncate">{selectedUser.display_name || 'No display name'}</p>
                <span className="font-mono text-[9px] text-zinc-500 truncate block mt-0.5">ID: {selectedUser.id}</span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs">
              <div className="rounded-[8px] bg-zinc-900/80 p-3.5 sm:p-4 border border-zinc-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  <span className="font-bold text-white uppercase">{selectedUser.account_status || 'active'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Verified:</span>
                  <span className="font-bold text-white">{selectedUser.is_verified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Blocks:</span>
                  <span className="font-bold text-white">{selectedUser.blocks_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Reports:</span>
                  <span className="font-bold text-red-400">{selectedUser.reports_count || 0}</span>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="rounded-[8px] bg-zinc-900/80 p-3.5 sm:p-4 border border-zinc-800">
                  <span className="block font-bold text-zinc-400 mb-1">User Bio:</span>
                  <p className="text-zinc-300 leading-relaxed font-medium">{selectedUser.bio}</p>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'active')}
                    className="rounded-[8px] bg-zinc-900 border border-zinc-800 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'warning')}
                    className="rounded-[8px] bg-amber-950/60 border border-amber-800/80 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900"
                  >
                    Warn
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'suspended')}
                    className="rounded-[8px] bg-red-950/60 border border-red-800/80 py-2 text-xs font-bold text-red-300 hover:bg-red-900"
                  >
                    Suspend
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.username)}
                  className="flex items-center justify-center gap-1.5 rounded-[8px] border border-red-800/80 bg-red-950/40 py-2 text-xs font-bold text-red-400 hover:bg-red-900/60 transition"
                >
                  <Trash2 size={13} />
                  <span>Delete User Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
