import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { Home, ArrowRight, Search, Sparkles } from 'lucide-react';
import { APP_DOMAIN } from '../lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      {/* Subtle ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[140px]" />
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

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-lg">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-[11px] font-mono font-medium text-zinc-300 mb-6 backdrop-blur-sm shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>ERROR 404 • PAGE NOT FOUND</span>
          </div>

          {/* Editorial Display */}
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white mb-3">
            404
          </h1>

          <h2 className="text-xl md:text-2xl font-bold text-zinc-200 mb-3 tracking-tight">
            Lost in the digital space
          </h2>

          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            The page or profile you are looking for has moved, been unpublished, or does not exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs mx-auto">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-[8px] bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200 shadow-md"
            >
              <Home size={14} />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-[8px] border border-zinc-800 bg-zinc-900/60 text-zinc-200 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all duration-200"
            >
              <Sparkles size={14} />
              <span>Claim Handle</span>
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
