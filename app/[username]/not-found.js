import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { UserX, Sparkles, ArrowRight, Home } from 'lucide-react';

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f17] text-zinc-100 selection:bg-brand-500 selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-20 items-center justify-between px-6 md:px-12 border-b border-white/5 backdrop-blur-md">
        <BrandLogo showText={true} />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
      </header>

      {/* Profile Not Found Card */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          {/* Avatar Placeholder */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 mb-6 shadow-inner">
            <UserX size={36} className="text-zinc-400" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            Profile Unavailable
          </h1>

          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            This Link-in-Bio profile doesn&apos;t exist yet, is currently set to private/draft mode, or has been suspended.
          </p>

          {/* CTA Banner: Claim this handle */}
          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 mb-1">
              <Sparkles size={14} />
              <span>Looking for your own page?</span>
            </div>
            <p className="text-xs text-zinc-300">
              Create your free, customizable link in bio in less than 60 seconds.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-400 hover:shadow-brand-500/30 transition-all duration-200"
            >
              <span>Claim your Link-in-Bio</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-zinc-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <span>Back to LinkBio Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-zinc-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} LinkBio. All rights reserved.
      </footer>
    </div>
  );
}
