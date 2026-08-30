'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured, isLocalMode } from '../../lib/supabase';
import { DashboardProvider, useDashboard } from './DashboardContext';
import LivePreview from '../../components/editor/LivePreview';
import { Link2, Palette, User, BarChart2, Settings, LogOut, Eye, ExternalLink, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Links', icon: Link2 },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/theme', label: 'Appearance', icon: Palette },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function PreviewPane() {
  const { profile, blocks } = useDashboard();
  return <LivePreview profile={profile} blocks={blocks} />;
}

function InnerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, hasUnpostedChanges, publishChanges } = useDashboard();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [postingHeader, setPostingHeader] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const email = session.user.email?.toLowerCase();
        if (
          email === 'pmkaulani@gmail.com' ||
          (process.env.NEXT_PUBLIC_ADMIN_EMAIL && email === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase())
        ) {
          setIsAdmin(true);
          return;
        }

        const { data: adminRecord } = await supabase
          .from('platform_admins')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (adminRecord) {
          setIsAdmin(true);
        }
      } catch (_) {}
    }
    checkAdminStatus();
  }, []);

  // Auto-scroll focused inputs into view above mobile virtual soft keyboards
  useEffect(() => {
    function scrollActiveElementIntoView() {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        // Immediate smooth scroll to center
        active.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Secondary scroll after mobile virtual keyboard finishes opening (~300ms)
        setTimeout(() => {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 320);
      }
    }

    function handleFocusIn(e) {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 320);
      }
    }

    window.addEventListener('focusin', handleFocusIn);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scrollActiveElementIntoView);
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', scrollActiveElementIntoView);
      }
    };
  }, []);

  async function handleHeaderPublish() {
    setPostingHeader(true);
    const didPublish = await publishChanges();
    if (!didPublish) {
      setPostingHeader(false);
      return;
    }
    setTimeout(() => setPostingHeader(false), 500);
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {
      // ignore signOut errors — we clear storage regardless
    }
    // Force-wipe all Supabase auth tokens from localStorage so the session
    // cannot be automatically restored when the user visits /login or /signup
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('gotrue') ||
          key === 'local_supabase_db' ||
          key === 'linkinbio_local_session'
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}
    // Hard navigation tears down the React component tree + clears all state
    window.location.href = '/login?logout=1';
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#FAFAFA] sm:flex-row text-black">
      {/* Mobile Top Header */}
      <header
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className="flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3.5 sm:hidden"
      >
        <Link href="/dashboard" className="shrink-0">
          <BrandLogo size="xs" variant="full" />
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex h-8 items-center gap-1 rounded-full border border-amber-300 bg-amber-50/90 px-2.5 text-[11px] font-black text-amber-950 transition active:scale-95 shadow-2xs hover:bg-amber-100"
              title="Open Superadmin Portal"
            >
              <ShieldAlert size={12} className="text-amber-700 shrink-0" />
              <span>Admin</span>
            </Link>
          )}
          {hasUnpostedChanges && (
            <button
              onClick={handleHeaderPublish}
              disabled={postingHeader}
              className="flex h-8 items-center gap-1.5 rounded-full bg-black px-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>{postingHeader ? 'Posting...' : 'Post'}</span>
            </button>
          )}
          <button
            onClick={() => setMobilePreviewOpen(true)}
            className="flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 text-xs font-bold text-zinc-900 transition active:scale-95 hover:bg-zinc-200"
          >
            <Eye size={13} className="shrink-0" />
            <span>Preview</span>
          </button>
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition active:scale-95 hover:bg-zinc-100 hover:text-black shadow-2xs"
              title="Open live page"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside className="hidden h-full w-60 flex-col border-r border-zinc-200 bg-white py-6 sm:flex">
        {/* Logo */}
        <div className="mb-8 px-5">
          <Link href="/dashboard">
            <BrandLogo size="md" variant="full" />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex w-full flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[8px] px-3.5 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-zinc-200">
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-[8px] border border-amber-300 bg-amber-50/90 px-3 py-2.5 text-xs font-black text-amber-950 transition hover:bg-amber-100 shadow-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldAlert size={16} className="text-amber-700 shrink-0 group-hover:scale-110 transition" />
                  <span className="truncate">Superadmin</span>
                </div>
                <span className="rounded-[6px] bg-amber-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-900">
                  Panel ↗
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Public link + publish + logout */}
        <div className="flex w-full flex-col gap-2 border-t border-zinc-200 px-3 pt-4">
          {hasUnpostedChanges && (
            <button
              onClick={handleHeaderPublish}
              disabled={postingHeader}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-black px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>{postingHeader ? 'Posting changes...' : 'Post changes live'}</span>
            </button>
          )}
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 transition hover:bg-zinc-100 hover:text-black"
            >
              <ExternalLink size={13} className="text-zinc-600" />
              <span>View live page</span>
            </a>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content area - split into editor + desktop preview */}
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <div
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
          className="h-full flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 sm:!pb-16 lg:max-w-[54%]"
        >
          {isLocalMode && (
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-100 p-3.5 sm:p-4 text-xs sm:text-sm text-zinc-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-zinc-600" />
              <div>
                <p className="font-bold text-black">Local Sandbox Mode</p>
                <p className="mt-0.5 text-zinc-600">Database not connected; saving directly to your browser sandbox.</p>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-xl">{children}</div>
        </div>

        {/* Desktop Preview column */}
        <div className="hidden h-full border-l border-zinc-200 bg-[#F4F4F5] p-8 lg:flex lg:flex-1 lg:items-start lg:justify-center lg:overflow-y-auto">
          <PreviewPane />
        </div>
      </div>

      {/* Mobile Floating Tab Bar */}
      <nav
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        className="fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-zinc-200 bg-white/90 p-1.5 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.18)] backdrop-blur-2xl ring-1 ring-black/5 sm:hidden max-w-[94vw]"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-black px-3.5 py-2 text-xs font-bold text-white shadow-sm'
                  : 'p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {active && <span className="text-xs font-bold">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Preview Modal / Drawer */}
      {mobilePreviewOpen && (
        <div
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm sm:hidden animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-zinc-200">
            <span className="text-xs font-bold uppercase tracking-wider text-black">Live Preview</span>
            <button
              onClick={() => setMobilePreviewOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-black hover:bg-zinc-200"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start bg-[#F4F4F5]">
            <PreviewPane />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          router.push('/login');
          return;
        }

        const { data: p } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (p && p.onboarded === false) {
          router.push('/onboarding');
          return;
        }
      } catch (e) {
        console.error('Error verifying onboarding status:', e);
      } finally {
        setChecking(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
        router.push('/login');
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
          <p className="text-xs font-medium text-zinc-500">Loading editor...</p>
        </div>
      </main>
    );
  }

  return (
    <DashboardProvider>
      <InnerLayout>{children}</InnerLayout>
    </DashboardProvider>
  );
}
