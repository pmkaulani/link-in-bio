import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import { Home, ArrowLeft, Search, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f17] text-zinc-100 selection:bg-brand-500 selection:text-white">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[100px]" />
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

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-lg">
          {/* 404 Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-mono font-medium text-brand-400 mb-6 backdrop-blur-sm shadow-inner">
            <Search size={13} />
            <span>ERROR 404 • PAGE NOT FOUND</span>
          </div>

          {/* Editorial Display */}
          <h1 className="text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 font-sans mb-4">
            404
          </h1>

          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
            Lost in the digital ether
          </h2>

          <p className="text-sm md:text-base text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            The page or profile you are looking for has moved, been unpublished, or never existed in the first place.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs mx-auto">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 hover:bg-brand-400 hover:shadow-brand-500/30 transition-all duration-200"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-zinc-200 text-sm font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <Sparkles size={16} className="text-amber-400" />
              <span>Create Your Page</span>
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
