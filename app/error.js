'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log unhandled error to console / error monitoring
    console.error('Application runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f17] text-zinc-100 selection:bg-brand-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[120px]" />
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

      {/* Error Card */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 mb-6 shadow-inner">
            <AlertOctagon size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-mono font-medium text-rose-400 mb-4 border border-rose-500/20">
            <span>UNEXPECTED APPLICATION ERROR</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            Something went wrong
          </h1>

          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            An unexpected error occurred while processing this request. Our systems have logged the issue.
          </p>

          {error?.digest && (
            <div className="mb-6 rounded-xl bg-black/40 border border-white/5 p-3 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-0.5">
                Error Reference
              </span>
              <code className="text-xs font-mono text-zinc-300 select-all break-all">
                {error.digest}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 hover:bg-brand-400 transition-all duration-200"
            >
              <RotateCcw size={15} />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-zinc-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Home size={15} />
              <span>Return Home</span>
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
