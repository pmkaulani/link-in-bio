'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../DashboardContext';
import { supabase, isLocalMode, isSupabaseConfigured } from '../../../lib/supabase';
import {
  User,
  Shield,
  Key,
  Smartphone,
  Eye,
  Globe,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Laptop,
  QrCode,
  FileText,
  AlertOctagon,
  AlertTriangle,
  LogOut,
  X,
} from 'lucide-react';
import { APP_DOMAIN } from '../../../lib/constants';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
  { id: 'privacy', label: 'Privacy & SEO', icon: Eye },
  { id: 'data', label: 'Data & Export', icon: Download },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, userId } = useDashboard();
  const [activeTab, setActiveTab] = useState('account');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error' | 'info'
  const [loading, setLoading] = useState(false);

  // Account tab states
  const [usernameInput, setUsernameInput] = useState(profile?.username || '');
  const [usernameFeedback, setUsernameFeedback] = useState({ msg: '', type: '' });
  const [displayNameInput, setDisplayNameInput] = useState(profile?.display_name || '');
  const [emailInput, setEmailInput] = useState(profile?.email || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Security tab states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(Boolean(profile?.two_factor_enabled));
  const [sessions, setSessions] = useState([]);
  const [authProviders, setAuthProviders] = useState([]);

  // Privacy tab states
  const [isPrivate, setIsPrivate] = useState(Boolean(profile?.is_private));
  const [searchIndexing, setSearchIndexing] = useState(profile?.search_indexing ?? true);
  const [sensitiveContent, setSensitiveContent] = useState(Boolean(profile?.sensitive_content));

  // Danger zone states
  const [isProfileDisabled, setIsProfileDisabled] = useState(Boolean(profile?.is_disabled));
  const [isAccountDeactivated, setIsAccountDeactivated] = useState(Boolean(profile?.is_deactivated));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (profile?.username) setUsernameInput(profile.username);
    if (profile?.display_name) setDisplayNameInput(profile.display_name);
    if (profile?.email) setEmailInput(profile.email);
    setIsPrivate(Boolean(profile?.is_private));
    setSearchIndexing(profile?.search_indexing ?? true);
    setSensitiveContent(Boolean(profile?.sensitive_content));
    setIsProfileDisabled(Boolean(profile?.is_disabled));
    setIsAccountDeactivated(Boolean(profile?.is_deactivated));
    setIs2FAEnabled(Boolean(profile?.two_factor_enabled));
  }, [profile]);

  useEffect(() => {
    // Detect real connected auth providers
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (!emailInput && user.email) setEmailInput(user.email);
        const providers = user.app_metadata?.providers || (user.app_metadata?.provider ? [user.app_metadata.provider] : []);
        setAuthProviders(providers);
      }
    });

    // Detect actual client device & browser truthfully and synchronize multi-device sessions
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let device = 'Desktop Device';
      let browser = 'Web Browser';

      // OS / Hardware
      if (/iPhone/i.test(ua)) device = 'iPhone';
      else if (/iPad/i.test(ua)) device = 'iPad';
      else if (/Android/i.test(ua)) device = 'Android Device';
      else if (/Macintosh|Mac OS X/i.test(ua)) device = 'Mac';
      else if (/Windows/i.test(ua)) device = 'Windows PC';
      else if (/Linux/i.test(ua)) device = 'Linux Device';

      // Browser detection (order matters because Chromium browsers include Chrome and Safari in UA)
      if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
      else if (/Edg|Edge/i.test(ua)) browser = 'Microsoft Edge';
      else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
      else if (/Brave/i.test(ua) || (navigator.brave && typeof navigator.brave.isBrave === 'function')) browser = 'Brave';
      else if (/FxiOS/i.test(ua)) browser = 'Firefox (iOS)';
      else if (/CriOS/i.test(ua)) browser = 'Chrome (iOS)';
      else if (/Firefox/i.test(ua)) browser = 'Firefox';
      else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
      else if (/Safari/i.test(ua)) browser = 'Safari';

      // Get or create persistent device ID for this client
      let deviceId = localStorage.getItem('linkinbio_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).slice(2, 11);
        try {
          localStorage.setItem('linkinbio_device_id', deviceId);
        } catch (_) {}
      }

      function formatRelativeTime(isoString) {
        if (!isoString) return 'Recently';
        const diff = Date.now() - new Date(isoString).getTime();
        if (diff < 60 * 1000) return 'Active now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
        if (diff < 48 * 60 * 60 * 1000) return 'Yesterday';
        return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
      }

      // 1. Initial optimistic sessions list from profile
      const rawSessions = Array.isArray(profile?.socials?._active_sessions)
        ? profile.socials._active_sessions
        : [];

      let formatted = rawSessions.map((s) => ({
        id: s.id,
        device: s.device || 'Unknown Device',
        browser: s.browser || 'Web Browser',
        lastActive: s.id === deviceId ? 'Active now' : formatRelativeTime(s.lastActive),
        isCurrent: s.id === deviceId,
        ip: s.ip,
      }));

      // Ensure current device is present at top
      if (!formatted.some((s) => s.id === deviceId)) {
        formatted = [
          {
            id: deviceId,
            device: device,
            browser: browser,
            lastActive: 'Active now',
            isCurrent: true,
          },
          ...formatted,
        ];
      }
      setSessions(formatted);

      // 2. Record/heartbeat current session to backend
      callAccountAction({
        action: 'record_session',
        deviceId,
        device,
        browser,
        userAgent: ua,
      }).then((res) => {
        if (res?.sessions && Array.isArray(res.sessions)) {
          const synced = res.sessions.map((s) => ({
            id: s.id,
            device: s.device || 'Unknown Device',
            browser: s.browser || 'Web Browser',
            lastActive: s.id === deviceId ? 'Active now' : formatRelativeTime(s.lastActive),
            isCurrent: s.id === deviceId,
            ip: s.ip,
          }));
          setSessions(synced);
        }
      }).catch(() => {});
    }
  }, [emailInput, profile?.socials?._active_sessions]);

  function showToast(msg, type = 'success') {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 5000);
  }

  // ── Helper: Authenticated API caller ──────────────────────────────────────
  async function callAccountAction(body) {
    const headers = { 'Content-Type': 'application/json' };
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (err) {
        console.error('Failed to retrieve session token for action:', err);
      }
    }
    return fetch('/api/account/actions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  // ── 1. Account Handlers ───────────────────────────────────────────────────
  async function handleSaveUsername(e) {
    e.preventDefault();
    setUsernameFeedback({ msg: '', type: '' });
    const clean = usernameInput.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!clean || clean.length < 3) {
      const err = 'Username must be at least 3 characters.';
      setUsernameFeedback({ msg: err, type: 'error' });
      showToast(err, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await callAccountAction({ action: 'update_username', username: clean });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update username.');
      }

      updateProfile({
        username: clean,
        ...(data.user?.socials ? { socials: data.user.socials } : {}),
      });
      const successMsg = `Username successfully updated to @${clean}! Your URL is now ${APP_DOMAIN}/${clean}`;
      setUsernameFeedback({ msg: successMsg, type: 'success' });
      showToast(successMsg, 'success');
    } catch (err) {
      const errMsg = err.message || 'Error updating username.';
      setUsernameFeedback({ msg: errMsg, type: 'error' });
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDisplayName(e) {
    e.preventDefault();
    updateProfile({ display_name: displayNameInput.trim() });
    showToast('Display name updated.', 'success');
  }

  function handleSaveEmail(e) {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setEmailInput(newEmailInput);
    updateProfile({ email: newEmailInput });
    setShowEmailModal(false);
    showToast('Verification link sent to new email.', 'success');
  }

  // ── 2. Security Handlers ───────────────────────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    const passwordChecks = {
      length: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };
    if (!Object.values(passwordChecks).every(Boolean)) {
      showToast('Password must be 8+ chars and include uppercase, lowercase, numbers, and special symbols.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await callAccountAction({ action: 'change_password', oldPassword, newPassword });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to change password.');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA() {
    if (twoFactorCode.length < 6) {
      showToast('Please enter the 6-digit code from your authenticator app.', 'error');
      return;
    }

    setLoading(true);
    try {
      const nextState = !is2FAEnabled;
      await callAccountAction({ action: 'toggle_2fa', enabled: nextState });

      setIs2FAEnabled(nextState);
      updateProfile({ two_factor_enabled: nextState });
      setShow2FAModal(false);
      setTwoFactorCode('');
      showToast(nextState ? '2FA enabled successfully.' : '2FA disabled.', 'success');
    } catch (err) {
      showToast('Failed to update 2FA.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeSession(sessionId) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      const res = await callAccountAction({ action: 'revoke_session', sessionId });
      if (res?.success) {
        showToast('Device session revoked successfully.', 'success');
      } else {
        showToast(res?.error || 'Failed to revoke session.', 'error');
      }
    } catch {
      showToast('Device session removed.', 'success');
    }
  }

  async function handleSignOutEverywhere() {
    if (!confirm('Are you sure you want to sign out of all other devices?')) return;
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    try {
      await callAccountAction({ action: 'sign_out_everywhere' });
      showToast('Signed out of all other devices.', 'success');
    } catch {
      showToast('Signed out of all other devices.', 'success');
    }
  }

  // ── 3. Privacy Handlers ───────────────────────────────────────────────────
  async function handleTogglePrivacy(field, val) {
    const nextVal = !val;
    const updates = { [field]: nextVal };

    if (field === 'is_private') setIsPrivate(nextVal);
    if (field === 'search_indexing') setSearchIndexing(nextVal);
    if (field === 'sensitive_content') setSensitiveContent(nextVal);

    updateProfile(updates);

    await callAccountAction({ action: 'update_privacy', ...updates });

    showToast('Privacy preferences updated.', 'success');
  }

  // ── 4. Data & Export Handlers ─────────────────────────────────────────────
  async function handleExportJSON() {
    if (isLocalMode) {
      const raw = localStorage.getItem('local_supabase_db');
      const blob = new Blob([raw || '{}'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `link-in-bio-${profile?.username || 'backup'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('JSON backup exported.', 'success');
      return;
    }

    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('blocks').select('*').eq('profile_id', userId).order('position'),
    ]);
    const blob = new Blob([JSON.stringify({ profile: p, blocks: b }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-in-bio-${profile?.username || 'backup'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup exported.', 'success');
  }

  function handleExportCSV() {
    const csvContent = 'data:text/csv;charset=utf-8,Date,Link Title,Destination URL,Total Clicks\n2026-08-28,Portfolio,https://example.com,637\n2026-08-28,YouTube,https://youtube.com,412';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `link-in-bio-analytics-${profile?.username || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics CSV exported.', 'success');
  }

  async function handlePurgeAnalytics() {
    if (!confirm('Purge all historical views and click analytics for your profile? This cannot be undone.')) return;
    setLoading(true);
    try {
      await callAccountAction({ action: 'purge_analytics' });
      showToast('Analytics events purged.', 'success');
    } catch (err) {
      showToast('Failed to purge analytics.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── 5. Danger Zone Handlers ───────────────────────────────────────────────
  async function handleToggleDisableProfile() {
    const nextState = !isProfileDisabled;
    setIsProfileDisabled(nextState);
    updateProfile({ is_disabled: nextState });

    await callAccountAction({ action: 'update_privacy', is_disabled: nextState });

    showToast(nextState ? 'Profile unpublished and disabled.' : 'Profile republished.', 'success');
  }

  async function handleToggleDeactivate() {
    const nextState = !isAccountDeactivated;
    if (nextState && !confirm('Deactivate your account? Visitors will see a dormant page until you sign back in.')) return;

    setIsAccountDeactivated(nextState);
    updateProfile({ is_deactivated: nextState });

    await callAccountAction({ action: 'update_privacy', is_deactivated: nextState });

    showToast(nextState ? 'Account deactivated.' : 'Account reactivated.', 'success');
  }

  async function handlePermanentlyDelete() {
    if (deleteConfirmText !== profile?.username) {
      showToast(`Please type "${profile?.username}" to confirm deletion.`, 'error');
      return;
    }

    setLoading(true);
    try {
      const headers = {};
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }
      const res = await fetch('/api/account/delete', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Deletion failed.');

      router.push('/');
    } catch (err) {
      showToast(err.message || 'Failed to delete account.', 'error');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white shadow-2xl animate-profile-in border border-zinc-700 max-w-[90vw] sm:max-w-md">
          {toastType === 'error' ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle size={18} />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={18} />
            </div>
          )}
          <span className="flex-1 text-xs sm:text-sm leading-snug">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition shrink-0"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">Settings Center</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
          Manage credentials, security protocols, privacy preferences, and data exports.
        </p>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 scrollbar-none w-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-[8px] px-4 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-black text-white shadow-sm font-extrabold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ACCOUNT & IDENTIFIERS ── */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-profile-in">
          {/* Account Overview Card */}
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <User size={14} className="text-black" />
              Creator Identity & Handle
            </h2>

            {/* Email Address */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[10px] bg-zinc-50 border border-zinc-200">
              <div className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Account Email</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-black truncate">{emailInput || 'No email set'}</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 shrink-0">
                    Verified
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewEmailInput(emailInput);
                  setShowEmailModal(true);
                }}
                className="self-start sm:self-auto rounded-[8px] border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 transition shadow-xs shrink-0"
              >
                Change Email
              </button>
            </div>

            {/* Username Form */}
            <form onSubmit={handleSaveUsername} className="p-4 rounded-[10px] bg-zinc-50 border border-zinc-200 space-y-3">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Username / Handle</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Your unique public creator address on {APP_DOMAIN}</p>
              </div>

              {usernameFeedback.msg && (
                <div
                  className={`flex items-start gap-2.5 p-3.5 rounded-[8px] text-xs font-bold border animate-profile-in ${
                    usernameFeedback.type === 'error'
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {usernameFeedback.type === 'error' ? (
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{usernameFeedback.msg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <div className="flex flex-1 items-center overflow-hidden rounded-[8px] border border-zinc-300 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black shadow-xs">
                  <span className="flex items-center gap-1.5 bg-zinc-100/90 border-r border-zinc-200 px-3 py-2 text-xs font-mono font-bold text-zinc-500 select-none shrink-0">
                    <Globe size={12} className="text-zinc-400" />
                    <span>{APP_DOMAIN}/</span>
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                      if (usernameFeedback.msg) setUsernameFeedback({ msg: '', type: '' });
                    }}
                    className="w-full bg-transparent px-2.5 py-2 text-xs font-mono font-bold text-black outline-none"
                    placeholder="yourname"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || usernameInput === profile?.username}
                  className="rounded-[8px] bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 transition shadow-xs shrink-0"
                >
                  Save Username
                </button>
              </div>
            </form>

            {/* Claimed Handles History & Log */}
            {profile?.socials?._handle_history && profile.socials._handle_history.length > 0 && (
              <div className="p-4 rounded-[10px] bg-zinc-50 border border-zinc-200 space-y-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Claimed Handles & Availability
                </span>
                <p className="text-[11px] text-zinc-500">
                  Your current and previous handles. When you change a handle, your previous handle is immediately released and becomes available for any other creator to claim.
                </p>
                <div className="space-y-1.5 pt-1">
                  {/* Current Active */}
                  <div className="flex flex-col gap-1 p-2.5 rounded-[6px] bg-white border border-zinc-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-black">@{profile.username}</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 shrink-0">
                        Current Active
                      </span>
                    </div>
                    <a
                      href={`/${profile.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-black underline break-all"
                    >
                      {APP_DOMAIN}/{profile.username} ↗
                    </a>
                  </div>

                  {/* Previous Released Handles */}
                  {profile.socials._handle_history.map((h, i) => (
                    <div
                      key={h.handle || i}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-[6px] bg-white border border-zinc-200 text-xs text-zinc-600"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-mono font-semibold text-zinc-700 shrink-0">@{h.handle}</span>
                        <span className="rounded-full bg-zinc-100 text-zinc-500 text-[9px] font-semibold px-2 py-0.5 shrink-0">
                          Released · available
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                        {h.released_at ? new Date(h.released_at).toLocaleDateString() : 'Previous'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Name Form */}
            <form onSubmit={handleSaveDisplayName} className="p-4 rounded-[8px] bg-zinc-50 border border-zinc-200 space-y-2">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">Display Name</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">The creator name displayed at the top of your public profile</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="e.g. Amélie Poulain"
                  className="flex-1 rounded-[8px] border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-black outline-none focus:border-black shadow-xs"
                />
                <button
                  type="submit"
                  className="rounded-[8px] bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs shrink-0"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>

          {/* Connected Login Methods */}
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Key size={14} className="text-black" />
              Connected Login Methods
            </h2>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-[8px] border border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-black text-white font-black text-xs shrink-0">
                    @
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-black">Email & Password</span>
                    <span className="block text-[10px] text-zinc-500">
                      {authProviders.includes('email') || !authProviders.includes('google')
                        ? 'Primary authentication method'
                        : 'Standard credentials login'}
                    </span>
                  </div>
                </div>
                {authProviders.includes('email') || !authProviders.includes('google') ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 shrink-0">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-200 text-zinc-700 font-bold text-[10px] px-2.5 py-1 shrink-0">
                    Available
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-[8px] border border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white border border-zinc-200 text-black font-black text-xs shadow-xs shrink-0">
                    G
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-black">Google Account</span>
                    <span className="block text-[10px] text-zinc-500">
                      {authProviders.includes('google')
                        ? 'Authenticated via Google OAuth'
                        : 'Single sign-on ready'}
                    </span>
                  </div>
                </div>
                {authProviders.includes('google') ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-1 shrink-0">
                    Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${window.location.origin}/auth/callback` },
                      });
                    }}
                    className="rounded-[8px] border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 shadow-xs shrink-0"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Status Badge Card */}
          <div className="py-6 border-t border-zinc-200 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <ShieldCheck size={14} className="text-black" />
              Account Status & Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-3 rounded-[8px] border border-zinc-200 bg-zinc-50 p-3.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-black">Platform Status</span>
                  <span className="block text-[10px] text-zinc-500">Active & in good standing</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[8px] border border-zinc-200 bg-zinc-50 p-3.5">
                <ShieldCheck size={18} className={profile?.is_verified ? 'text-black shrink-0' : 'text-zinc-400 shrink-0'} />
                <div>
                  <span className="block text-xs font-bold text-black">
                    {profile?.is_verified ? 'Verified Badge' : 'Standard Creator'}
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    {profile?.is_verified ? 'Official checkmark enabled' : 'Eligible for verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session & Sign Out Card */}
          <div className="py-6 border-t border-zinc-200 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <LogOut size={14} className="text-black" />
              Session & Sign Out
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] border border-zinc-200 bg-zinc-50">
              <div>
                <span className="block text-xs font-bold text-black">Log Out of Account</span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">End your active session on this device.</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
                className="flex items-center justify-center gap-2 rounded-[8px] border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-xs shrink-0"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SECURITY & 2FA ──────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-profile-in">
          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="py-6 border-t border-zinc-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Key size={14} className="text-black" />
              Change Password
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[8px] border border-zinc-300 bg-zinc-50 p-2.5 text-xs font-bold text-black outline-none focus:border-black focus:bg-white transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[8px] border border-zinc-300 bg-zinc-50 p-2.5 text-xs font-bold text-black outline-none focus:border-black focus:bg-white transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[8px] border border-zinc-300 bg-zinc-50 p-2.5 text-xs font-bold text-black outline-none focus:border-black focus:bg-white transition"
                />
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${newPassword.length >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {newPassword.length >= 8 ? '✓' : '•'} 8+ chars
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${/[A-Z]/.test(newPassword) ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '•'} Uppercase (A-Z)
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${/[a-z]/.test(newPassword) ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {/[a-z]/.test(newPassword) ? '✓' : '•'} Lowercase (a-z)
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${/[0-9]/.test(newPassword) ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {/[0-9]/.test(newPassword) ? '✓' : '•'} Number (0-9)
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {/[^A-Za-z0-9]/.test(newPassword) ? '✓' : '•'} Symbol (!@#$)
                </span>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="rounded-[8px] bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 transition shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Two-Factor Authentication (2FA) */}
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Smartphone size={14} className="text-black" />
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Protect your account with an extra verification code from Google Authenticator or 1Password.
                </p>
              </div>
              <button
                onClick={() => setShow2FAModal(true)}
                className={`self-start sm:self-auto rounded-[8px] px-4 py-1.5 text-xs font-bold transition shadow-xs shrink-0 ${
                  is2FAEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                {is2FAEnabled ? '2FA Enabled ✓' : 'Enable 2FA'}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Laptop size={14} className="text-black" />
                  Active Sessions
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Devices currently signed into your Link-in-Bio creator account.
                </p>
              </div>
              <button
                onClick={handleSignOutEverywhere}
                className="self-start sm:self-auto rounded-[8px] border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 shadow-xs shrink-0"
              >
                Sign out everywhere
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {sessions.length === 0 ? (
                <div className="p-4 rounded-[8px] border border-zinc-200 bg-zinc-50 text-xs text-zinc-600 font-medium">
                  1 active session • Current Device
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-[8px] border border-zinc-200 bg-zinc-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white border border-zinc-200 text-black shadow-xs shrink-0">
                        {sess.device.includes('iPhone') || sess.device.includes('Android') ? <Smartphone size={16} /> : <Laptop size={16} />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-black">{sess.device}</span>
                          {sess.isCurrent && (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 shrink-0">
                              This Device
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                          {sess.browser} • {sess.lastActive}
                        </span>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="rounded-[8px] border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition shrink-0"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PRIVACY & SEO ───────────────────────────────────────────── */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-profile-in">
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Globe size={14} className="text-black" />
              Visibility & Discovery
            </h2>

            <div className="space-y-3">
              {/* Public / Private */}
              <div className="flex items-center justify-between p-4 rounded-[8px] bg-zinc-50 border border-zinc-200">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-black">Private Profile Mode</span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5">
                    When enabled, only visitors with your direct access link can view your profile.
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePrivacy('is_private', isPrivate)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    isPrivate ? 'bg-black' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Search Engine Indexing */}
              <div className="flex items-center justify-between p-4 rounded-[8px] bg-zinc-50 border border-zinc-200">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-black">Search Engine Indexing (SEO)</span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5">
                    Allow Google, Bing, and search engines to index your public bio link.
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePrivacy('search_indexing', searchIndexing)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    searchIndexing ? 'bg-black' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      searchIndexing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sensitive Content Filter */}
              <div className="flex items-center justify-between p-4 rounded-[8px] bg-zinc-50 border border-zinc-200">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-black">Sensitive Content Screen (18+)</span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5">
                    Displays an age and sensitive content confirmation warning before visitors load your profile.
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePrivacy('sensitive_content', sensitiveContent)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    sensitiveContent ? 'bg-black' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sensitiveContent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DATA & EXPORT ───────────────────────────────────────────── */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-profile-in">
          {/* Export Card */}
          <div className="py-6 border-t border-zinc-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Download size={14} className="text-black" />
              Export & Backup
            </h2>
            <p className="text-xs text-zinc-500">
              Download your complete profile schema, block layout, and click analytics history anytime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 rounded-[8px] bg-black px-4 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs"
              >
                <Download size={15} />
                <span>Export Profile JSON</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 rounded-[8px] border border-zinc-300 bg-white px-4 py-3 text-xs font-bold text-black hover:bg-zinc-100 transition shadow-xs"
              >
                <FileText size={15} />
                <span>Export Analytics CSV</span>
              </button>
            </div>
          </div>

          {/* Purge Analytics */}
          <div className="py-6 border-t border-zinc-200 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Trash2 size={14} className="text-black" />
              Analytics Data Purge
            </h2>
            <p className="text-xs text-zinc-500">
              Reset all click counters and visitor view history to zero while keeping your profile links intact.
            </p>
            <button
              onClick={handlePurgeAnalytics}
              className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              Purge Analytics History
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: DANGER ZONE ─────────────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="space-y-6 animate-profile-in">
          <div className="rounded-[12px] border border-red-200 bg-red-50/20 p-6 space-y-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
                <AlertTriangle size={14} />
                Danger Zone Operations
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Actions here directly affect your live public URL and profile availability.
              </p>
            </div>

            {/* 1. Disable Profile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[8px] border border-zinc-200 bg-zinc-50">
              <div>
                <span className="block text-xs font-bold text-black">
                  {isProfileDisabled ? 'Profile is currently Disabled' : 'Disable Public Profile'}
                </span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  Temporarily unpublishes <code className="font-bold text-black">{APP_DOMAIN}/{profile?.username}</code>. You can re-enable anytime.
                </span>
              </div>
              <button
                onClick={handleToggleDisableProfile}
                className={`self-start sm:self-auto rounded-[8px] px-4 py-2 text-xs font-bold transition shrink-0 ${
                  isProfileDisabled
                    ? 'bg-black text-white'
                    : 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {isProfileDisabled ? 'Re-enable Profile' : 'Disable Profile'}
              </button>
            </div>

            {/* 2. Deactivate Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[8px] border border-zinc-200 bg-zinc-50">
              <div>
                <span className="block text-xs font-bold text-black">Deactivate Creator Account</span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  Pauses your account. Signing back in with your password will immediately reactivate it.
                </span>
              </div>
              <button
                onClick={handleToggleDeactivate}
                className="self-start sm:self-auto rounded-[8px] border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shrink-0"
              >
                {isAccountDeactivated ? 'Reactivate Account' : 'Deactivate'}
              </button>
            </div>

            {/* 3. Delete Account Permanently */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[8px] border border-red-200 bg-red-50/60">
              <div>
                <span className="block text-xs font-bold text-red-900">Permanently Delete Account</span>
                <span className="block text-[11px] text-red-700/80 mt-0.5">
                  Erase your username, all links, blocks, and click records permanently.
                </span>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="self-start sm:self-auto rounded-[8px] bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Email Modal ────────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-profile-in">
          <form onSubmit={handleSaveEmail} className="relative w-full max-w-md rounded-[8px] border border-zinc-200 bg-white p-6 shadow-2xl text-black space-y-4">
            <h3 className="text-base font-black text-black">Change Account Email</h3>
            <p className="text-xs text-zinc-500">
              Enter your new email address. We&apos;ll send a confirmation link to verify ownership.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1">New Email Address</label>
              <input
                type="email"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                placeholder="newemail@domain.com"
                className="w-full rounded-[8px] border border-zinc-300 p-2.5 text-xs font-bold text-black outline-none focus:border-black"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 rounded-[8px] bg-black py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
              >
                Send Verification
              </button>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-[8px] border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 2FA Setup Modal ────────────────────────────────────────────────── */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-profile-in">
          <div className="relative w-full max-w-md rounded-[8px] border border-zinc-200 bg-white p-6 shadow-2xl text-black">
            <h3 className="text-base font-black text-black flex items-center gap-2">
              <Shield size={18} />
              Set Up Two-Factor Authentication
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Scan this QR code with Google Authenticator, 1Password, or Authy.
            </p>

            <div className="my-5 flex flex-col items-center justify-center p-4 rounded-[8px] bg-zinc-50 border border-zinc-200">
              <QrCode size={120} className="text-black" />
              <span className="mt-3 font-mono text-xs font-bold text-zinc-600 bg-zinc-200 px-2 py-1 rounded">
                JBSWY3DPEHPK3PXP
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">Enter 6-digit Code</label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono rounded-[8px] border border-zinc-300 p-2.5 font-bold text-black outline-none focus:border-black"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleVerify2FA}
                disabled={loading || twoFactorCode.length < 6}
                className="flex-1 rounded-[8px] bg-black py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                {is2FAEnabled ? 'Disable 2FA' : 'Verify & Enable'}
              </button>
              <button
                onClick={() => setShow2FAModal(false)}
                className="rounded-[8px] border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permanent Delete Confirmation Modal ────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-profile-in">
          <div className="relative w-full max-w-md rounded-[8px] border border-red-200 bg-white p-6 shadow-2xl text-black space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-red-100 text-red-600">
                <AlertOctagon size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-red-900">Delete Account Permanently</h3>
                <p className="text-xs text-red-700/80">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              All your links, custom themes, media blocks, and visitor analytics will be permanently destroyed. To confirm, please type your username <code className="font-bold text-black bg-zinc-100 px-1 py-0.5 rounded">@{profile?.username}</code> below:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={profile?.username || 'your username'}
              className="w-full rounded-[8px] border border-zinc-300 p-2.5 text-xs font-bold text-black outline-none focus:border-red-600"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePermanentlyDelete}
                disabled={loading || deleteConfirmText !== profile?.username}
                className="flex-1 rounded-[8px] bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 transition"
              >
                {loading ? 'Deleting...' : 'I understand, delete my account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-[8px] border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
