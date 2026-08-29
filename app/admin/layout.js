'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Flag,
  Link2,
  Sliders,
  FileText,
  Activity,
  ArrowLeft,
  Lock,
  LogOut,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { supabase, isLocalMode } from '../../lib/supabase';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: Activity },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/links', label: 'Links', icon: Link2 },
  { href: '/admin/settings', label: 'Settings', icon: Sliders },
  { href: '/admin/audit', label: 'Audit', icon: FileText },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('superadmin');

  useEffect(() => {
    async function checkAuth() {
      if (isLocalMode) {
        if (process.env.NODE_ENV === 'production') {
          setIsAdmin(false);
          setChecking(false);
          return;
        }
        setIsAdmin(true);
        setAdminRole('superadmin');
        setChecking(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: adminRecord, error } = await supabase
          .from('platform_admins')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error || !adminRecord) {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
          setAdminRole(adminRecord.role || 'admin');
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
        <div className="flex flex-col items-center gap-4 animate-profile-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-zinc-900 border border-zinc-800 text-white">
            <ShieldAlert size={24} className="animate-pulse text-white" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
              Superadmin Portal
            </span>
            <p className="text-xs font-semibold text-zinc-300">Verifying administrator credentials...</p>
          </div>
          <div className="h-0.5 w-36 overflow-hidden rounded-full bg-zinc-850 mt-1">
            <div className="h-full w-1/2 rounded-full bg-white animate-indeterminate-slide" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 sm:px-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-zinc-900 text-red-400 border border-zinc-800 mb-4">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white">Access Restricted</h1>
        <p className="mt-2 max-w-sm text-xs text-zinc-400 leading-relaxed">
          The Superadmin control center requires verified administrator privileges in <code className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-[8px] text-white">platform_admins</code>.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-[8px] bg-white px-4 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 transition active:scale-95"
          >
            Return to Creator Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-[8px] border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition active:scale-95"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white antialiased selection:bg-white selection:text-black overflow-x-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-14 sm:h-16 w-full items-center justify-between border-b border-zinc-900 bg-black px-3 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/admin" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <BrandLogo size="sm" variant="text" theme="light" />
            <span className="rounded-[8px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-zinc-300">
              Admin
            </span>
          </Link>
        </div>

        {/* Global Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-[8px] px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-[11px] font-bold text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Platform Active</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1 sm:gap-1.5 rounded-[8px] border border-zinc-800 bg-zinc-900 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-zinc-200 transition hover:bg-zinc-800 hover:text-white active:scale-95"
          >
            <ArrowLeft size={12} className="shrink-0" />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="flex items-center gap-1 sm:gap-1.5 rounded-[8px] border border-zinc-800 bg-zinc-900 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-zinc-400 transition hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 active:scale-95"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={12} className="shrink-0" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Viewport */}
      <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 max-w-7xl mx-auto w-full pb-24 md:pb-12 overflow-x-hidden">
        {children}
      </main>

      {/* iOS Floating Island Bottom Bar for Mobile UX */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center justify-around gap-1 rounded-full bg-zinc-950/95 p-1.5 text-white shadow-elevated border border-zinc-800 max-w-[95vw] w-max"
      >
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] font-bold transition-all active:scale-90 shrink-0 ${
                active
                  ? 'bg-white text-black font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={label}
            >
              <Icon size={15} />
              {active && <span className="text-[10px] sm:text-xs leading-none">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
