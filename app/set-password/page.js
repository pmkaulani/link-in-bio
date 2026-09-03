'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { updatePassword } from '../../lib/authHelpers';
import { AlertTriangle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (!isSupabaseConfigured) {
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push('/login');
        return;
      }

      const currentUser = data.session.user;
      if (cancelled) return;
      setUser(currentUser);

      // Check if user already set password or dismissed prompt
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, socials')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profile?.socials?._password_set || profile?.socials?._password_prompt_dismissed) {
        router.push('/dashboard');
        return;
      }

      setReady(true);
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  async function handleSetPassword(e) {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password must meet all security standards: 8+ characters, uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError('');
    setSaving(true);

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      // Record _password_set: true so user is never prompted again
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', user.id)
          .maybeSingle();

        const updatedSocials = {
          ...(profile?.socials || {}),
          _password_set: true,
        };

        await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', user.id);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to set password. Please try again.');
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    setError('');

    try {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', user.id)
          .maybeSingle();

        const updatedSocials = {
          ...(profile?.socials || {}),
          _password_prompt_dismissed: true,
        };

        await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', user.id);
      }

      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm space-y-6 animate-profile-in">
        {/* App Logo */}
        <div className="flex justify-center">
          <BrandLogo size="md" variant="stacked" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-2">
              <ShieldCheck size={22} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Secure your account</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create a password so you can also log in directly using your email address, or skip to continue with Google.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-white focus:ring-1 focus:ring-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-white focus:ring-1 focus:ring-white transition"
              />
            </div>

            {/* Security Requirements Checklist */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-1.5 text-xs">
              <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Security checklist</span>
              <div className="grid grid-cols-1 gap-1 text-zinc-400">
                <div className={'flex items-center gap-1.5 ' + (passwordChecks.length ? 'text-emerald-400 font-semibold' : '')}>
                  <span>{passwordChecks.length ? '✓' : '•'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={'flex items-center gap-1.5 ' + (passwordChecks.hasUpper && passwordChecks.hasLower ? 'text-emerald-400 font-semibold' : '')}>
                  <span>{passwordChecks.hasUpper && passwordChecks.hasLower ? '✓' : '•'}</span>
                  <span>Uppercase & lowercase letters</span>
                </div>
                <div className={'flex items-center gap-1.5 ' + (passwordChecks.hasNumber ? 'text-emerald-400 font-semibold' : '')}>
                  <span>{passwordChecks.hasNumber ? '✓' : '•'}</span>
                  <span>At least one number (0-9)</span>
                </div>
                <div className={'flex items-center gap-1.5 ' + (passwordChecks.hasSpecial ? 'text-emerald-400 font-semibold' : '')}>
                  <span>{passwordChecks.hasSpecial ? '✓' : '•'}</span>
                  <span>At least one symbol (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || skipping}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50 transition shadow-sm"
            >
              {saving ? 'Saving password...' : 'Save Password & Continue'}
              {!saving && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Skip Option */}
          <div className="pt-1 text-center border-t border-zinc-800/60">
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving || skipping}
              className="text-xs font-semibold text-zinc-400 hover:text-white underline transition py-1"
            >
              {skipping ? 'Skipping...' : 'Skip for now (continue with Google)'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
