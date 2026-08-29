'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { APP_DOMAIN } from '../lib/constants';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log unhandled error to console / error monitoring
    console.error('Application runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* Background ambient light */}
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

      {/* Error Card */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 mb-6 shadow-inner">
            <AlertOctagon size={28} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/90 px-3.5 py-1 text-[11px] font-mono text-zinc-400 mb-4 border border-zinc-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>UNEXPECTED RUNTIME ERROR</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            Something went wrong
          </h1>

          <p className="text-xs md:text-sm text-zinc-400 mb-6 leading-relaxed">
            An unexpected error occurred while processing this request. Our system has logged the diagnostic incident.
          </p>

          {error?.digest && (
            <div className="mb-6 rounded-xl bg-black border border-zinc-800 p-3 text-left">
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
              className="flex items-center justify-center gap-2 w-full py-3 rounded-[8px] bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200 shadow-md"
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-[8px] border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Home size={14} />
              <span>Return Home</span>
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
