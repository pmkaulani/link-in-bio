'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { friendlyAuthError, requestPasswordReset } from '../../lib/authHelpers';
import { Check, Eye, EyeOff, ArrowRight } from 'lucide-react';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import BrandLogo from '../../components/BrandLogo';
import AuthLivePreview from '../../components/auth/AuthLivePreview';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add credentials to .env.local first.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(friendlyAuthError(signInError));
      return;
    }
    router.push('/dashboard');
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"');
      return;
    }
    setError('');
    setResetting(true);
    const { error: resetError } = await requestPasswordReset(email);
    setResetting(false);
    if (resetError) {
      setError(friendlyAuthError(resetError));
      return;
    }
    setResetSent(true);
  }

  const inputClass =
    'w-full rounded-[8px] border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none transition';

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-black flex flex-col justify-between">
      {/* Top Header - Tight & Minimal Space */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-1 flex items-center justify-between shrink-0">
        <Link href="/" className="transition hover:opacity-80">
          <BrandLogo size="md" variant="full" />
        </Link>
        <Link
          href="/signup"
          className="rounded-[8px] border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-zinc-100 active:scale-95 shadow-2xs"
        >
          Sign up
        </Link>
      </header>

      {/* Main Split Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1">
        {/* Left Side: Live Animated Preview */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center pt-1">
          <div className="w-full max-w-[360px] text-left mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Living Identity
            </span>
            <h2 className="text-xl font-black text-black tracking-tight mt-0.5">
              Your online world in one link.
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Every link responds dynamically with spring physics and widgets.
            </p>
          </div>

          <AuthLivePreview mode="login" username="peter.dev" displayName="Peter Kaulani" vibe="minimal" />
        </div>

        {/* Right Side: Login Form (Lowered on Mobile) */}
        <div className="lg:col-span-6 flex justify-center pt-8 sm:pt-12 lg:pt-14">
          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md flex flex-col gap-3.5 animate-profile-in"
            >
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">Welcome back</h1>
                <p className="mt-1 text-xs text-zinc-500 font-medium">
                  Log in to continue building and customizing your space.
                </p>
              </div>

              {error && (
                <p className="rounded-[8px] bg-red-50 border border-red-200/60 px-4 py-2.5 text-xs font-bold text-red-600">
                  {error}
                </p>
              )}

              {resetSent && (
                <p className="flex items-center gap-2 rounded-[8px] bg-zinc-100 border border-zinc-200 px-4 py-2.5 text-xs font-bold text-black">
                  <Check size={14} /> Password reset instructions sent to your email.
                </p>
              )}

              <GoogleAuthButton label="Continue with Google" />

              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">or</span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              {/* Email */}
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Email address
                </span>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </label>

              {/* Password */}
              <label className="block">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Password
                  </span>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="text-[11px] font-bold text-zinc-500 hover:text-black hover:underline disabled:opacity-60 transition"
                  >
                    {resetting ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-[8px] bg-black py-3.5 text-xs font-black text-white hover:shadow-hard-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
              >
                <span>{loading ? 'Logging in...' : 'Log in'}</span>
                <ArrowRight size={14} />
              </button>

              <p className="text-center text-xs text-zinc-500 font-medium">
                Don't have an account?{' '}
                <Link href="/signup" className="font-bold text-black hover:underline">
                  Sign up free
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-zinc-400 font-medium">
        <span>© {new Date().getFullYear()} Link-in-Bio. Pure monochrome simplicity.</span>
      </footer>
    </main>
  );
}
