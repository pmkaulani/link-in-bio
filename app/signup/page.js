'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { friendlyAuthError } from '../../lib/authHelpers';
import {
  Mail,
  Check,
  X as XIcon,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Loader2,
  Globe,
} from 'lucide-react';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import BrandLogo from '../../components/BrandLogo';
import AuthLivePreview from '../../components/auth/AuthLivePreview';
import { APP_DOMAIN } from '../../lib/constants';

const RESERVED_HANDLES = new Set([
  'admin', 'administrator', 'superadmin', 'support', 'help', 'security',
  'official', 'linkinbio', 'linkinbio_support', 'api', 'auth', 'billing',
  'root', 'verify', 'verified', 'demo', 'explore', 'dashboard', 'settings',
  'login', 'signup', 'terms', 'privacy',
]);

const VIBE_OPTIONS = [
  { id: 'minimal', label: 'Minimal', dot: '#000000' },
  { id: 'editorial', label: 'Editorial', dot: '#E5E5E0' },
  { id: 'dark', label: 'Dark', dot: '#18181B' },
  { id: 'glass', label: 'Glass', dot: '#38BDF8' },
  { id: 'creator', label: 'Creator', dot: '#F97316' },
  { id: 'cyber', label: 'Cyber', dot: '#10B981' },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = searchParams?.get('username') || '';

  // Form inputs
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState('');
  const [vibe, setVibe] = useState('minimal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Username status: null | 'checking' | { available: boolean, message: string }
  const [userStatus, setUserStatus] = useState(null);

  // Submission & Transition stages
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  // Live debounced username validation & availability check
  useEffect(() => {
    const raw = username.trim().toLowerCase();
    if (!raw) {
      setUserStatus(null);
      return;
    }

    if (raw.length < 3 || raw.length > 30) {
      setUserStatus({ available: false, message: 'Username must be 3–30 characters' });
      return;
    }

    if (!/^[a-z0-9_.-]+$/.test(raw)) {
      setUserStatus({ available: false, message: 'Only lowercase letters, numbers, and . _ -' });
      return;
    }

    if (RESERVED_HANDLES.has(raw)) {
      setUserStatus({ available: false, message: '✕ Handle reserved by system' });
      return;
    }

    setUserStatus('checking');

    const timer = setTimeout(async () => {
      try {
        if (!isSupabaseConfigured) {
          const localDb = localStorage.getItem('local_supabase_db');
          if (localDb) {
            const parsed = JSON.parse(localDb);
            const exists = (parsed.profiles || []).some(
              (p) => (p.username || '').toLowerCase() === raw
            );
            if (exists) {
              setUserStatus({ available: false, message: '✕ This username is already taken' });
              return;
            }
          }
          setUserStatus({ available: true, message: '✓ Username available' });
          return;
        }

        const { data, error: queryErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', raw)
          .maybeSingle();

        if (queryErr) {
          setUserStatus({ available: true, message: '✓ Username available' });
        } else if (data) {
          setUserStatus({ available: false, message: '✕ This username is already taken' });
        } else {
          setUserStatus({ available: true, message: '✓ Username available' });
        }
      } catch {
        setUserStatus({ available: true, message: '✓ Username available' });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  // Professional password checks
  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Password strength calculator
  function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: 'bg-zinc-200' };
    const passedCount = Object.values(passwordChecks).filter(Boolean).length;

    if (passedCount <= 2) return { score: 1, label: 'Weak', color: 'bg-amber-500' };
    if (passedCount <= 4) return { score: 2, label: 'Good', color: 'bg-blue-500' };
    return { score: 3, label: 'Strong & Secure', color: 'bg-emerald-600' };
  }

  const pwdStrength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Please choose a valid username (at least 3 characters).');
      return;
    }

    if (userStatus && userStatus.available === false) {
      setError('Please choose an available username.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all security standards: 8+ characters, uppercase, lowercase, number, and special character.');
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(true);
      setTransitionStep(1);

      setTimeout(() => setTransitionStep(2), 600);
      setTimeout(() => setTransitionStep(3), 1200);

      setTimeout(() => {
        const localDb = localStorage.getItem('local_supabase_db');
        let db = localDb ? JSON.parse(localDb) : { profiles: [], blocks: [] };
        const newProfile = {
          id: 'user-' + Date.now(),
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
          bio: `Digital creator & builder. Welcome to my space!`,
          theme: vibe,
          font_family: vibe === 'editorial' ? 'playfair' : vibe === 'cyber' ? 'jetbrains' : 'inter',
          button_style: vibe === 'glass' ? 'glass' : vibe === 'cyber' ? 'outline' : 'fill',
          background_type: vibe === 'editorial' ? 'solid' : vibe === 'glass' || vibe === 'creator' ? 'gradient' : 'solid',
          background_value:
            vibe === 'editorial'
              ? '#F5F5F0'
              : vibe === 'glass'
              ? 'linear-gradient(135deg, #090D16 0%, #1E1B4B 40%, #064E3B 100%)'
              : vibe === 'creator'
              ? 'linear-gradient(135deg, #1C0A00 0%, #7C2D12 40%, #BE123C 100%)'
              : vibe === 'cyber'
              ? '#050709'
              : '#000000',
          text_color: vibe === 'editorial' ? '#111111' : vibe === 'cyber' ? '#10B981' : '#FFFFFF',
          primary_color: vibe === 'cyber' ? '#10B981' : vibe === 'creator' ? '#F97316' : '#000000',
          button_radius: vibe === 'editorial' ? 16 : 24,
          is_verified: false,
          account_status: 'active',
          socials: { twitter: 'https://twitter.com', instagram: 'https://instagram.com' },
          onboarded: true,
        };

        db.profiles = [newProfile, ...(db.profiles || [])];
        localStorage.setItem('local_supabase_db', JSON.stringify(db));

        router.push('/dashboard');
      }, 1800);
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
          theme: vibe,
        },
      },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError));
      setLoading(false);
      return;
    }

    // If email confirmation is required, session is null — wait for user confirmation
    if (!data?.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    // Authenticated session exists — safely insert profile with valid auth.uid()
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.session.user.id,
      username: cleanUsername,
      display_name: displayName.trim() || cleanUsername,
      theme: vibe,
    });

    if (profileError && profileError.code !== '23505') {
      setError(
        profileError.message.includes('duplicate') ? 'That username is taken.' : profileError.message
      );
      setLoading(false);
      return;
    }

    setTransitionStep(1);
    setTimeout(() => setTransitionStep(2), 600);
    setTimeout(() => setTransitionStep(3), 1200);
    setTimeout(() => router.push('/dashboard'), 1800);
  }

  if (checkEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6 text-center text-black">
        <div className="flex flex-col items-center gap-4 rounded-[8px] border border-zinc-200 bg-white p-8 shadow-xl max-w-sm w-full animate-profile-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-black border border-zinc-200 shadow-xs">
            <Mail size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">Check your inbox</h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed">
              We sent a verification link to <span className="font-bold text-black">{email}</span>. Confirm it to enter your workspace.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full rounded-2xl bg-black py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Go to log in
          </Link>
        </div>
      </main>
    );
  }

  const inputClass =
    'w-full rounded-[8px] border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none transition';

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-black flex flex-col justify-between">
      {/* Celebration Transition Overlay */}
      {transitionStep > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-6 backdrop-blur-xl animate-profile-in">
          <div className="flex flex-col items-center gap-5 max-w-sm text-center">
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-2xl">
              <Sparkles size={24} className="animate-pulse text-white" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tight text-white">
                {transitionStep === 1 && 'Creating your space...'}
                {transitionStep === 2 && 'Securing handle & theme...'}
                {transitionStep === 3 && 'Your page is ready!'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {APP_DOMAIN}/{username || 'you'}
              </p>
            </div>

            {/* Step Checkpoints */}
            <div className="w-full space-y-2 pt-1 text-left text-xs font-bold text-zinc-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-white shrink-0" />
                <span>Profile created</span>
              </div>
              <div className="flex items-center gap-2.5">
                {transitionStep >= 2 ? (
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                ) : (
                  <Loader2 size={15} className="animate-spin text-zinc-600 shrink-0" />
                )}
                <span className={transitionStep >= 2 ? 'text-zinc-200' : 'text-zinc-600'}>
                  Username secured
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {transitionStep >= 3 ? (
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0" />
                )}
                <span className={transitionStep >= 3 ? 'text-zinc-200' : 'text-zinc-600'}>
                  Workspace initialised
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header - Tight & Clean with Minimal Space */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-1 flex items-center justify-between shrink-0">
        <Link href="/" className="transition hover:opacity-80">
          <BrandLogo size="md" variant="full" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-zinc-500 font-medium">Already have an account?</span>
          <Link
            href="/login"
            className="rounded-[8px] border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold text-black transition hover:bg-zinc-100 active:scale-95 shadow-2xs"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Main Split Section */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1">
        {/* Left Side: Elegant Single-Column Form (Lowered on mobile) */}
        <div className="lg:col-span-6 flex justify-center pt-8 sm:pt-12 lg:pt-14">
          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md flex flex-col gap-3.5 animate-profile-in"
            >
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">
                  Create your space
                </h1>
                <p className="mt-1 text-xs text-zinc-500 font-medium">
                  Claim your handle, choose your aesthetic, and go live in seconds.
                </p>
              </div>

              {error && (
                <p className="rounded-[8px] bg-red-50 border border-red-200/60 px-4 py-2.5 text-xs font-bold text-red-600">
                  {error}
                </p>
              )}

              <GoogleAuthButton label="Sign up with Google" />

              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">or</span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              {/* 1. Choose Handle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Choose your handle
                  </label>
                  {userStatus && userStatus !== 'checking' && (
                    <span
                      className={`text-[11px] font-bold ${
                        userStatus.available ? 'text-black' : 'text-red-600'
                      }`}
                    >
                      {userStatus.message}
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center overflow-hidden rounded-[8px] border bg-white transition shadow-xs ${
                    userStatus?.available === true
                      ? 'border-black ring-1 ring-black'
                      : userStatus?.available === false
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-zinc-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black'
                  }`}
                >
                  <span className="flex items-center gap-1.5 bg-zinc-100/90 border-r border-zinc-200 px-3.5 py-3 text-xs font-mono font-bold text-zinc-500 select-none shrink-0">
                    <Globe size={13} className="text-zinc-400" />
                    <span>{APP_DOMAIN}/</span>
                  </span>
                  <input
                    type="text"
                    placeholder="amelie"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full py-3 px-3 text-xs font-bold text-black placeholder:font-normal placeholder:text-zinc-400 focus:outline-none"
                  />
                  {userStatus === 'checking' && (
                    <div className="pr-3 text-zinc-400">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                  {userStatus?.available === true && (
                    <div className="pr-3 text-black font-bold">
                      <Check size={16} />
                    </div>
                  )}
                  {userStatus?.available === false && (
                    <div className="pr-3 text-red-500 font-bold">
                      <XIcon size={16} />
                    </div>
                  )}
                </div>

                {/* Live Clean URL Capsule Badge */}
                <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-[8px] bg-zinc-100/70 border border-zinc-200/80 text-[11px]">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live URL:</span>
                    <span className="font-mono text-zinc-500 truncate">{APP_DOMAIN}/</span>
                    <span className="font-mono font-black text-black truncate">{username || 'amelie'}</span>
                  </div>
                  {userStatus?.available === true && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-black bg-white px-2 py-0.5 rounded-[6px] border border-zinc-200 shadow-2xs shrink-0">
                      <Check size={10} strokeWidth={3} /> Available
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Creator Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Your creator / brand name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amélie Poulain"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* 3. Choose Vibe */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Choose your vibe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {VIBE_OPTIONS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVibe(v.id)}
                      className={`flex items-center gap-2 rounded-[8px] border p-2 text-xs font-bold transition ${
                        vibe === v.id
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-zinc-200 bg-zinc-50/70 text-zinc-600 hover:text-black hover:border-zinc-300'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ background: v.dot }}
                      />
                      <span className="truncate">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="creator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* 5. Professional Password with Requirements */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Password
                  </label>
                  {password.length > 0 && (
                    <span className="text-[10px] font-bold text-zinc-500">
                      {pwdStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
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

                {/* Live Password Security Checklist */}
                {password.length > 0 && (
                  <div className="mt-2.5 rounded-lg border border-zinc-200 bg-white p-2.5 text-[11px] text-zinc-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordChecks.length ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {passwordChecks.length ? '✓' : '•'}
                      </span>
                      <span className={passwordChecks.length ? 'text-black font-semibold' : 'text-zinc-500'}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordChecks.hasUpper ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {passwordChecks.hasUpper ? '✓' : '•'}
                      </span>
                      <span className={passwordChecks.hasUpper ? 'text-black font-semibold' : 'text-zinc-500'}>At least 1 uppercase letter (A–Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordChecks.hasLower ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {passwordChecks.hasLower ? '✓' : '•'}
                      </span>
                      <span className={passwordChecks.hasLower ? 'text-black font-semibold' : 'text-zinc-500'}>At least 1 lowercase letter (a–z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordChecks.hasNumber ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {passwordChecks.hasNumber ? '✓' : '•'}
                      </span>
                      <span className={passwordChecks.hasNumber ? 'text-black font-semibold' : 'text-zinc-500'}>At least 1 number (0–9)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${passwordChecks.hasSpecial ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                        {passwordChecks.hasSpecial ? '✓' : '•'}
                      </span>
                      <span className={passwordChecks.hasSpecial ? 'text-black font-semibold' : 'text-zinc-500'}>At least 1 special symbol (!@#$...)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (userStatus && userStatus.available === false)}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-[8px] bg-black py-3.5 text-xs font-black text-white hover:shadow-hard-sm transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
              >
                <span>{loading ? 'Creating space...' : 'Create my page →'}</span>
              </button>

              <p className="text-center text-[11px] text-zinc-400 font-medium">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-zinc-600 underline hover:text-black">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-zinc-600 underline hover:text-black">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>

        {/* Right Side: Live Reactive Preview */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center pt-2">
          <div className="w-full max-w-[360px] text-left mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Live Morphing Canvas
            </span>
            <h2 className="text-xl font-black text-black tracking-tight mt-0.5">
              Watch your page come alive.
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Every detail you type updates your space in real time.
            </p>
          </div>

          <AuthLivePreview
            mode="signup"
            username={username}
            displayName={displayName}
            vibe={vibe}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-zinc-400 font-medium">
        <span>© {new Date().getFullYear()} Link-in-Bio. Pure monochrome simplicity.</span>
      </footer>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F7F7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
