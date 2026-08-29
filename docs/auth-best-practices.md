# Auth: standard practices not yet in the codebase

Reference snippets, built against `lib/supabase.js` as it exists now. Say the word if you want any of these wired into actual pages.

## 1. Forgot / reset password

Missing entirely right now — `/login` has no "forgot password?" link.

```js
// lib/auth-extra.js
import { supabase } from './supabase';

export function requestPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}
```

```jsx
// app/reset-password/page.js  (new file)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '../../lib/auth-extra';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Supabase's password-recovery link logs the user in automatically
  // (session comes from the URL fragment) before this page loads.

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await updatePassword(password);
    if (error) return setError(error.message);
    router.push('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p>{error}</p>}
      <button type="submit">Set new password</button>
    </form>
  );
}
```

## 2. Generic auth error messages (prevent user enumeration)

Right now `setError(signInError.message)` passes Supabase's raw message straight through. That's mostly fine (Supabase already returns a generic "Invalid login credentials" for both wrong-password and no-such-user), but worth having a mapping layer so unexpected errors don't leak internals:

```js
// lib/auth-extra.js
const KNOWN_ERRORS = {
  'Invalid login credentials': 'Incorrect email or password.',
  'User already registered': 'An account with this email already exists.',
  'Email not confirmed': 'Confirm your email before logging in — check your inbox.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
};

export function friendlyAuthError(error) {
  if (!error) return '';
  return KNOWN_ERRORS[error.message] || 'Something went wrong. Please try again.';
}
```

Use it in `login/page.js` / `signup/page.js`: `setError(friendlyAuthError(signInError))`.

## 3. Password strength check (client-side, before hitting the API)

```js
export function passwordIssues(pw) {
  const issues = [];
  if (pw.length < 8) issues.push('At least 8 characters');
  if (!/[A-Z]/.test(pw)) issues.push('One uppercase letter');
  if (!/[0-9]/.test(pw)) issues.push('One number');
  return issues; // empty array = passes
}
```

Real enforcement still has to happen server-side — set a minimum length policy in **Supabase → Authentication → Policies**. Client-side checks are UX, not security.

## 4. Resend confirmation email

```js
export function resendConfirmation(email) {
  return supabase.auth.resend({ type: 'signup', email });
}
```

Useful on the signup "check your email" screen — add a "Didn't get it? Resend" link that calls this.

## 5. Keep session in sync across tabs / handle expiry

Nothing currently listens for auth state changes after initial load — if a session expires or the user logs out in another tab, the dashboard doesn't react until the next manual navigation.

```js
// app/dashboard/layout.js — inside DashboardLayout, alongside the existing getSession() check
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
      router.push('/login');
    }
  });
  return () => subscription.unsubscribe();
}, [router]);
```

## 6. Account deletion

Deleting a `profiles` row (which cascades to `blocks`, `analytics_events`, `custom_domains` via `on delete cascade`) is doable client-side. Deleting the actual `auth.users` row is **not** — that requires the service-role key, which must never reach the browser.

```js
// Client: safe to do, deletes all their app data
export async function deleteMyData(userId) {
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.signOut();
}
```

```js
// Server-only (Edge Function / serverless route) — needs SUPABASE_SERVICE_ROLE_KEY
// This is the ONLY correct place to call auth.admin.*
import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function DELETE(req) {
  const { userId } = await req.json();
  // verify the caller actually owns userId (check their JWT) before this line
  await admin.auth.admin.deleteUser(userId);
  return new Response(null, { status: 204 });
}
```

This app has no server routes today (pure client + Supabase), so full account deletion would need adding one — flagging it rather than half-building it.

## 7. Environment variable hygiene

```
NEXT_PUBLIC_SUPABASE_URL        ✅ fine in the browser
NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅ fine in the browser — RLS is what actually protects data, not this key
SUPABASE_SERVICE_ROLE_KEY       ❌ NEVER prefix with NEXT_PUBLIC_, never import in a 'use client' file — bypasses RLS entirely
```

If a `SUPABASE_SERVICE_ROLE_KEY` ever gets added to this project (e.g. for #6 above), it belongs only in a server route/Edge Function and only in `.env.local` / hosting secrets — never in anything shipped to the client.

## 8. OAuth redirect safety

`GoogleAuthButton.js` already does this correctly — `redirectTo: window.location.origin + '/auth/callback'` is same-origin, so there's no open-redirect risk. The one thing to actually configure: in **Supabase → Authentication → URL Configuration**, add your real production domain(s) to the redirect allow-list, or Supabase will reject the callback in production even though it works on localhost.

## 9. Rate limiting

Supabase applies built-in rate limits to auth endpoints (signup/login attempts) — nothing to add there. What *isn't* covered: the username-uniqueness check in onboarding (`validateUsernameAndAdvance`) fires a DB query on every "Continue" click with no debounce. Low risk at this scale, but if it ever needs hardening:

```js
import { useMemo } from 'react';
import debounce from 'lodash/debounce'; // already a dependency

const debouncedCheck = useMemo(() => debounce(checkUsernameAvailable, 400), []);
```

## 10. Optional: MFA

Supabase supports TOTP-based MFA if you want it later:

```js
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
// data.totp.qr_code -> render for the user to scan, then verify with a code
await supabase.auth.mfa.challengeAndVerify({ factorId: data.id, code: userEnteredCode });
```

Not something I'd add unless you're handling data sensitive enough to justify the UX cost — this is a link-in-bio tool, not a bank.
