import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { UserX, Sparkles, ArrowRight, Home, Globe } from 'lucide-react';
import { APP_DOMAIN } from '../../lib/constants';

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-20 items-center justify-between px-6 md:px-12 border-b border-zinc-900 bg-black/50 backdrop-blur-md">
        <Link href="/">
          <BrandLogo size="md" variant="full" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
      </header>

      {/* Profile Not Found Card */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          {/* Avatar Placeholder */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 mb-6 shadow-inner">
            <UserX size={32} className="text-zinc-400" />
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1 text-[11px] font-mono text-zinc-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <span>UNCLAIMED OR INACTIVE</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            Profile Unavailable
          </h1>

          <p className="text-xs md:text-sm text-zinc-400 mb-6 leading-relaxed">
            This handle is not yet active, has been unpublished, or is available for registration.
          </p>

          {/* CTA Banner: Claim this handle */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6 text-left flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-zinc-800 text-zinc-200">
              <Globe size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white mb-0.5">
                Ready to build your link page?
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Claim your custom {APP_DOMAIN} handle and publish your bio in seconds.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[8px] bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200 shadow-md"
            >
              <span>Claim Your Link-in-Bio</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-[8px] border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs font-mono text-zinc-500 border-t border-zinc-900">
        &copy; {new Date().getFullYear()} {APP_DOMAIN}. Pure monochrome simplicity.
      </footer>
    </div>
  );
}
