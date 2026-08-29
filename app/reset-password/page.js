'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { updatePassword } from '../../lib/authHelpers';
import { AlertTriangle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    // Supabase's recovery link authenticates the browser automatically
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        setError('This reset link is invalid or has expired. Request a new one from the login page.');
      }
      setReady(true);
    });
  }, []);

  // Professional password checks
  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password must meet all security standards: 8+ characters, uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError('');
    setSaving(true);
    const { error: updateError } = await updatePassword(password);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push('/dashboard');
  }

  const inputClass =
    'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-xs font-semibold text-black placeholder:font-normal placeholder:text-zinc-400 focus:border-black focus:outline-none transition shadow-2xs';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6 py-12 text-black">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center transition hover:opacity-80">
          <BrandLogo size="md" variant="full" />
        </Link>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl animate-profile-in"
        >
          <div className="mb-1 text-center">
            <h1 className="text-xl font-black tracking-tight text-black">Set new password</h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium">Choose a secure password for your account.</p>
          </div>

          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-zinc-700" />
              <div>
                <p className="font-bold">Sandbox Mode Active</p>
                <p className="mt-0.5 text-zinc-500 text-[11px]">Database not configured. Demo reset active.</p>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-2xl bg-red-50 border border-red-200/60 px-4 py-3 text-xs font-bold text-red-600">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              New Password
            </span>
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Live Password Security Checklist */}
            {password.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-zinc-200 bg-white p-2.5 text-[11px] text-zinc-600 space-y-1 text-left">
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
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Confirm Password
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={saving || !ready}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-xs font-black text-white shadow-md transition hover:bg-zinc-800 active:scale-95 disabled:opacity-60"
          >
            <span>{saving ? 'Updating password...' : 'Update password'}</span>
            <ArrowRight size={14} />
          </button>

          <p className="mt-2 text-center text-xs text-zinc-500 font-medium">
            Remembered your password?{' '}
            <Link href="/login" className="font-bold text-black hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
