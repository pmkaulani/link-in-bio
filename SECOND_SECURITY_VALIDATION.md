# Secondary Production Security Validation & Penetration Assessment Report

**Target Platform**: Link-in-Bio (`link-in-bio`)  
**Assessment Date**: September 7, 2026  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Standard**: OWASP Top 10 (2021), NIST SP 800-115, CIS Controls v8  
**Scope**: Post-Remediation Verification of P0/P1 Controls, Live Remote Supabase Integration Testing, Deep Static & Architectural Code Audit across 18 Priority Control Areas.

---

## 1. Executive Summary & Production Readiness Verdict

### Production Readiness Verdict: **NOT YET PRODUCTION READY (CRITICAL BLOCKERS REMAINING)**

> [!CAUTION]
> **CRITICAL PRODUCTION DEPLOYMENT WARNING**:
> While all application-layer source code remediations, client-side sanitizers, and regression test suites pass cleanly (**183/183 unit tests passing** and **Next.js 14 production build succeeding**), live integration tests against the actual remote Supabase environment (`https://jkhlvqguathrctiocuql.supabase.co`) revealed that **Migration `004_security_remediation.sql` has not yet been executed on the live remote PostgreSQL instance**, and **critical dependency vulnerabilities (`next@14.2.5`) exist in the package tree**.
> 
> Deploying the application to production in its current state would leave the platform vulnerable to direct REST API mass assignment, username hijacking, custom domain claiming, and storage failures. The system will only be production-ready once the database migrations are applied to Supabase and dependencies are patched.

---

## 2. Live Supabase Environment Integration Testing (Items 1, 2, 3, 4)

Real integration tests were executed over the network against the live Supabase production project at `https://jkhlvqguathrctiocuql.supabase.co`.

### 2.1 Test Personas Exercised

| Persona | Identity Identifier | Authentication Mechanism | Status |
|---|---|---|:---:|
| **ANONYMOUS** | No session / Unauthenticated | Supabase Anon Key HTTP requests (`apikey: ANON_KEY`) | ✅ Validated |
| **USER_A (Creator)** | `a314b857-c774-4457-b810-4864aa208450` | Ephemeral user created via Admin API; authenticated via password to acquire valid Bearer JWT | ✅ Validated |
| **USER_B (Victim)** | `feff415a-6784-4d77-ae3c-6d747d80b39e` | Ephemeral user created via Admin API; authenticated via password to acquire valid Bearer JWT | ✅ Validated |
| **MODERATOR** | Simulated / Service Role | Admin API user verification checking `platform_admins.role = 'moderator'` | ✅ Validated |
| **SUPERADMIN** | `76456cb7-fb31-47b6-ab34-1bdaecefed10` | Pre-seeded in `platform_admins` with `role: 'superadmin'`; queried via Service Role Key | ✅ Validated |

*Note: All temporary test users created during integration testing (`USER_A` and `USER_B`) were automatically and completely cleaned up and deleted immediately after test execution. Zero test artifacts or modified records were left on the live database.*

---

### 2.2 Live HTTP/REST Request Results

#### Test LIVE-01: Anonymous Access to Administrative Tables
- **Action**: `GET /rest/v1/platform_admins?select=*` using `apikey: ANON_KEY` and `Authorization: Bearer ANON_KEY`.
- **Observed Response**: HTTP 200 `[]` (0 rows returned).
- **Evaluation**: **PASS [INTEGRATION]**. Row Level Security completely blocks anonymous actors from discovering platform administrator user IDs or roles.

#### Test LIVE-02: User A & User B Profile Creation
- **Action**: `POST /rest/v1/profiles` using User A's JWT (`id: a314b857-...`, `username: audit_a_474871`), and User B's JWT (`id: feff415a-...`, `username: audit_b_474871`).
- **Observed Response**: HTTP 201 Created for both users.
- **Evaluation**: **PASS [INTEGRATION]**. Legitimate creators can independently register profiles.

#### Test LIVE-03: IDOR / BOLA Prevention (User A mutates User B)
- **Action**: User A sends `PATCH /rest/v1/profiles?id=eq.<user_b_id>` with payload `{"display_name": "HACKED BY USER A"}` using User A's Bearer JWT.
- **Observed Response**: HTTP 200 `[]` (0 rows modified).
- **Evaluation**: **PASS [INTEGRATION]**. Postgres RLS policy `using (auth.uid() = id)` successfully prevented User A from modifying User B's profile.

#### Test LIVE-04: Mass Assignment on Live Database (`is_verified`)
- **Action**: User A sends `PATCH /rest/v1/profiles?id=eq.<user_a_id>` with payload `{"is_verified": true}` using User A's Bearer JWT.
- **Observed Response**: HTTP 200 `[{"id": "...", "is_verified": true, ...}]`.
- **Evaluation**: **FAIL [INTEGRATION]**.  
  *Root Cause*: The trigger `check_profile_update_integrity` defined in `004_security_remediation.sql` has not been executed on the live remote Supabase PostgreSQL database. While the Next.js client sanitizes this field, any attacker communicating directly with the Supabase PostgREST API can self-assign verified status until the SQL migration is deployed to the live database.

#### Test LIVE-05: System Reserved Username Collision on Live Database
- **Action**: User A sends `PATCH /rest/v1/profiles?id=eq.<user_a_id>` with payload `{"username": "admin"}` using User A's Bearer JWT.
- **Observed Response**: HTTP 200 `[{"id": "...", "username": "admin", ...}]`.
- **Evaluation**: **FAIL [INTEGRATION]**.  
  *Root Cause*: The trigger `check_reserved_username` defined in `004_security_remediation.sql` has not been executed on the remote database.

#### Test LIVE-06: Custom Domain Hijacking on Live Database (`verified: true`)
- **Action**: User A sends `POST /rest/v1/custom_domains` with `{"profile_id": user_a_id, "domain": "audit-test-474871.com", "verified": true}` using User A's Bearer JWT.
- **Observed Response**: HTTP 201 Created `[{"id": "...", "verified": true}]`.
- **Evaluation**: **FAIL [INTEGRATION]**.  
  *Root Cause*: The hardened RLS policy `Owners can insert unverified custom domain` and trigger `check_domain_verification_integrity` have not been deployed to the remote database.

#### Test LIVE-07: Storage Bucket `avatars` Deployment State
- **Action**: `GET /storage/v1/bucket/avatars` with Anon and Service Role credentials.
- **Observed Response**: HTTP 400 `{"statusCode":"400","error":"Error","message":"Bucket not found"}`.
- **Evaluation**: **FAIL [INTEGRATION]**.  
  *Root Cause*: The `avatars` bucket and object-level RLS policies have not been created on the live Supabase project.

---

## 3. Comprehensive Audit of Vulnerable Code Patterns (Item 5)

Every instance of potentially dangerous sink or query patterns across the entire codebase was audited:

### 3.1 `dangerouslySetInnerHTML` Audit
- **Audit Findings**: Exactly 2 occurrences exist across the entire repository:
  1. `app/layout.js:99`: `dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}`
  2. `app/[username]/page.js:181`: `dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileJsonLd) }}`
- **Security Assessment**: Both paths utilize `serializeJsonLd(data)` which replaces all `<` with `\u003c`. Breakout payloads (e.g. `</script><script>alert(1)</script>`) cannot escape the `<script>` context.
- **Evaluation**: **PASS [STATIC & UNIT]**.

### 3.2 `<iframe>` Embedding Audit
- **Audit Findings**: Exactly 2 occurrences exist in `components/themes/PublicProfile.jsx:1298` and `components/editor/LivePreview.js:204`.
- **Security Assessment**:
  - The `src` attribute is derived strictly via regex matching of YouTube video IDs (`/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/`) and Vimeo video IDs (`/vimeo\.com\/(\d+)/`).
  - Embed URLs are hardcoded templates: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` and `https://player.vimeo.com/video/${id}?autoplay=1`.
  - All arbitrary user URLs that fail regex matching return `null` and do not render an `<iframe>`.
- **Evaluation**: **PASS [STATIC & UNIT]**.

### 3.3 Link `href` Sanitization Audit
- **Audit Findings**:
  - `PublicProfile.jsx:1158`: `href={safeHref(data.url)}`
  - `PublicProfile.jsx:1332`: `href={safeHref(item.link_url)}`
  - Social icons: `formatSocialHref(platform, value)`
- **Security Assessment**:
  - `safeHref` enforces `ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']`.
  - `javascript:`, `data:`, `vbscript:`, `file:`, and `blob:` schemes are strictly rejected and return `#`.
  - External links enforce `target="_blank"` and `rel="noopener noreferrer"`.
- **Evaluation**: **PASS [STATIC & UNIT]**.

### 3.4 CSS `style` & `backgroundImage` Injection Audit
- **Audit Findings**:
  - In `PublicProfile.jsx:95`, `LivePreview.js:66`, and `InteractiveTheme.jsx:43`, user-provided `background_value` was interpolated into `url("${value}")`.
  - **Remediation Implemented**: Created `safeBackgroundUrl(url)` which verifies HTTP/HTTPS protocols, rejects `javascript:` / `data:`, and escapes quote characters (`replace(/"/g, '%22')`).
- **Evaluation**: **PASS [STATIC & UNIT]**.

### 3.5 Server-Side URL `fetch(...)` (SSRF Audit)
- **Audit Findings**:
  - No server-side API routes (`app/api/*`) accept an arbitrary user-supplied URL and fetch it on the server.
  - `lib/socialSync.js:21` is the only external fetch: hardcoded to `https://graph.instagram.com/me/media?fields=...&access_token=${encodeURIComponent(accessToken)}`.
  - Server-side request forgery (SSRF) via URL fetching is non-exploitable.
- **Evaluation**: **PASS [STATIC]**.

### 3.6 Overbroad Database Queries (`select('*')`, `update()`, `upsert()`)
- **Audit Findings**:
  - Public profile route (`app/[username]/page.js`) queries `profiles.select('*')`.
  - In `profiles`, the `socials` column stores internal metadata (e.g. `_password_set: true`).
  - **Remediation Implemented**: Sanitized `profile.socials` before passing to `PublicProfile` by filtering out all keys beginning with `_` (`Object.entries(profile.socials).filter(([k]) => !k.startsWith('_'))`).
  - Account actions (`app/api/account/actions/route.js:323`): `update_privacy` explicitly whitelists only allowed boolean fields (`is_private`, `search_indexing`, `sensitive_content`, `is_disabled`, `is_deactivated`).
- **Evaluation**: **PASS [STATIC & UNIT]**.

---

## 4. Authentication Flows Audit (Item 6)

| Authentication Flow | Mechanism & Implementation | Evaluation | Mode |
|---|---|:---:|:---:|
| **Password Login** | Handled via `supabase.auth.signInWithPassword({ email, password })`. No plaintext password handling. | **PASS** | INTEGRATION |
| **User Logout** | Handled via `supabase.auth.signOut()`. Client clears tokens and redirects to `/login`. | **PASS** | UNIT |
| **Password Reset** | Initiated via `supabase.auth.resetPasswordForEmail()`. Redirect URL restricted by GoTrue whitelist. | **PASS** | UNIT |
| **Email Verification** | Triggered via `supabase.auth.resend({ type: 'signup', email })`. Token confirmed via GoTrue. | **PASS** | INTEGRATION |
| **Email Change** | Triggered via `supabase.auth.updateUser({ email })`. Requires confirmation to old and new email. | **PASS** | STATIC |
| **Password Change** | Re-authentication enforced via `supabase.auth.signInWithPassword`; rate limited to 5 attempts / 15 min; complexity criteria enforced. | **PASS** | UNIT |
| **Google OAuth** | Redirects to `/auth/callback`. Intercept removed; proceeds cleanly to dashboard. | **PASS** | UNIT |
| **GitHub OAuth** | Enabled provider config. Callback exchanges authorization code securely via PKCE. | **PASS** | STATIC |
| **LinkedIn OAuth** | Enabled provider config (`linkedin_oidc`). Standard OAuth2 authorization code flow. | **PASS** | STATIC |
| **Session Refresh** | Supabase JS client automatically refreshes expiring JWTs every 50-60 minutes via secure refresh token. | **PASS** | INTEGRATION |
| **Session Revocation (Global)** | `sign_out_everywhere` calls `supabase.auth.signOut({ scope: 'global' })`, invalidating refresh tokens. | **PASS** | UNIT |
| **Single Session Revocation** | `revoke_session` removes device record from UI metadata, but underlying JWT remains valid until expiration. | **PARTIAL** | STATIC |
| **Concurrent Sessions** | Supported concurrently across multiple browsers and devices. | **PASS** | INTEGRATION |

---

## 5. Rate Limiting Multi-Layer Assessment (Item 7)

| Endpoint / Action | Rate Limiting Mechanism | Evaluation | Mode |
|---|---|:---:|:---:|
| **Login (`/auth/v1/token`)** | Enforced natively by Supabase GoTrue Auth service (IP and account limits). | **PASS** | INTEGRATION |
| **Password Reset (`/auth/v1/recover`)** | Enforced natively by Supabase GoTrue Auth service. | **PASS** | INTEGRATION |
| **Password Change (`/api/account/actions`)** | In-memory sliding-window: 5 attempts per 15 min per `userId:clientIp`. | **PASS** | UNIT |
| **Reports (`/api/reports/submit`)** | In-memory sliding-window: 5 submissions per minute per IP. | **PARTIAL** | UNIT |
| **Analytics (`/api/analytics`)** | In-memory sliding-window: 40 events per minute per `clientIp:client_token`. | **PARTIAL** | UNIT |
| **Contact** | No API endpoint. Direct `mailto:pmkaulani@gmail.com` links. | **PASS** | STATIC |
| **Storage Uploads** | No application-level rate limiter. Dependent on Supabase Storage project quotas. | **PARTIAL** | STATIC |
| **Admin Actions** | Gated by authenticated admin role check (`verifyAdminUser`); no rate limiter. | **PASS** | STATIC |

> [!NOTE]
> *Serverless Limitation Note*: In serverless multi-region deployments (Vercel / Lambda), in-memory `Map` rate limiters do not share state across concurrent ephemeral instances. For enterprise DDoS protection, integrating Upstash Redis or Vercel Edge Middleware Rate Limiting is recommended as a future enhancement.

---

## 6. Next.js & Vercel Caching Audit (Item 8)

| Route / Component | Cache Configuration Directives | Evaluation | Mode |
|---|---|:---:|:---:|
| **Public Profile (`/[username]`)** | `export const dynamic = 'force-dynamic'`, `revalidate = 0`, `fetchCache = 'force-no-store'`. Stale profile caches impossible. | **PASS** | STATIC & UNIT |
| **Dashboard (`/dashboard/*`)** | Client Component (`'use client'`). Rendered on client; state managed via React Context. | **PASS** | STATIC |
| **Settings (`/dashboard/settings`)** | Client Component (`'use client'`). Server calls are dynamic POST/GET. | **PASS** | STATIC |
| **Admin Panel (`/admin/*`)** | All API routes (`/api/admin/*`) declare `export const dynamic = 'force-dynamic'`. Client pages are `'use client'`. | **PASS** | STATIC |
| **Auth Callback (`/auth/callback`)** | Client Component (`'use client'`). Reads URL tokens strictly in browser DOM; zero server caching. | **PASS** | STATIC |

---

## 7. Supabase Storage Buckets & Policies Audit (Item 9)

- **Bucket Name**: `avatars`
- **Configured Limits**: 2,097,152 bytes (2MB), MIME types restricted to `image/webp`, `image/jpeg`, `image/png`.
- **Public Read Access**: Yes (public bucket for profile images).
- **Object-Level RLS Policies**:
  - `select`: Public access to `bucket_id = 'avatars'`.
  - `insert`: `with check (bucket_id = 'avatars' and (storage.filename(name)) = (auth.uid()::text || '.webp'))`
  - `update`: `using (bucket_id = 'avatars' and (storage.filename(name)) = (auth.uid()::text || '.webp'))`
  - `delete`: `using (bucket_id = 'avatars' and (storage.filename(name)) = (auth.uid()::text || '.webp'))`
- **Live Environment State**: **FAIL [INTEGRATION]**. Bucket has not been created on the live project.
- **Codebase Schema State**: **PASS [STATIC & UNIT]**.

---

## 8. SECURITY DEFINER Functions & Search Path Audit (Item 10)

All SQL functions were audited for `SECURITY DEFINER` privilege escalation and search-path hijacking:

| Function Name | Return Type | Security Definer | `search_path` Configured | Status |
|---|---|:---:|:---:|:---:|
| `resolve_custom_domain(text)` | `table(username text)` | Yes | `set search_path = public, pg_temp` | **PASS [STATIC]** |
| `check_profile_update_integrity()` | `trigger` | Yes | `set search_path = public, pg_temp` | **PASS [STATIC]** |
| `check_block_moderation_integrity()` | `trigger` | Yes | `set search_path = public, pg_temp` | **PASS [STATIC]** |
| `check_domain_verification_integrity()` | `trigger` | Yes | `set search_path = public, pg_temp` | **PASS [STATIC]** |
| `check_reserved_username()` | `trigger` | Yes | `set search_path = public, pg_temp` | **PASS [STATIC]** |
| `check_analytics_block_ownership()` | `trigger` | No (`SECURITY INVOKER`) | Standard invoker | **PASS [STATIC]** |
| `set_updated_at()` | `trigger` | No (`SECURITY INVOKER`) | Standard invoker | **PASS [STATIC]** |

All `SECURITY DEFINER` functions explicitly declare `set search_path = public, pg_temp`, completely preventing search path hijacking (CWE-426).

---

## 9. Support Email & Admin Mechanism Absence Verification (Items 11 & 12)

- **Target Email**: `pmkaulani@gmail.com`
- **Verification Performed**: Full repository grep across all source, component, and library files.
- **Findings**:
  - `lib/constants.js`: Defined as `SUPPORT_EMAIL`, `SECURITY_EMAIL`, `PRIVACY_EMAIL`, `LEGAL_EMAIL` (public contact mailto strings).
  - `app/page.js:1333`: Rendered in landing page footer as `mailto:pmkaulani@gmail.com` for content abuse reporting.
  - Zero authorization, permission, role check, or auto-promotion logic exists attached to `pmkaulani@gmail.com`.
  - `NEXT_PUBLIC_ADMIN_EMAIL` and `ADMIN_EMAIL`: Completely eradicated from all client bundles and application code.
- **Evaluation**: **PASS [STATIC, UNIT, & INTEGRATION]**.

---

## 10. Host Header & URL Injection Surface (Items 13 & 14)

### 10.1 Host / X-Forwarded-Host Middleware Routing
- In `middleware.js:17-18`:
  ```javascript
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.toLowerCase().trim().replace(/\.$/, '');
  ```
- **Finding**: The middleware reads `request.headers.get('host')` directly. It **never reads `x-forwarded-host`**, preventing reverse proxy header spoofing.
- Standard platform hosts (`localhost`, `127.0.0.1`, `*.vercel.app`, and `NEXT_PUBLIC_APP_HOST`) are immediately bypassed, skipping database lookups.
- Custom domain lookup invokes `resolve_custom_domain(host)` via RPC, returning strictly `{ username }` for verified domains on active profiles.
- **Evaluation**: **PASS [STATIC & UNIT]**.

### 10.2 Password Reset & Canonical URL Injection
- Password reset emails pass `redirectTo: `${origin}/reset-password``. Supabase Auth validates this origin against the configured Redirect URL whitelist.
- Canonical metadata in `app/layout.js:43` uses `new URL(siteUrl)` where `siteUrl` is hardcoded to `process.env.NEXT_PUBLIC_SITE_URL`. It does not read user-controlled Host headers.
- **Evaluation**: **PASS [STATIC & UNIT]**.

---

## 11. Public Profile Abuse Resistance (Item 15)

| Abuse Vector | Defense Mechanisms Implemented | Evaluation | Mode |
|---|---|:---:|:---:|
| **Phishing Links** | Block URL sanitization (`safeHref`, `sanitizeUrl`); urgent priority routing in `/api/reports/submit`; database trigger preventing creators from re-enabling moderated links. | **PASS** | UNIT |
| **Malicious URLs** | Scheme restriction (`http:`, `https:`, `mailto:`, `tel:` only); `javascript:`, `data:`, `vbscript:`, `file:`, `blob:` blocked; `rel="noopener noreferrer"` on all anchors. | **PASS** | UNIT |
| **Creator Impersonation** | Handle changes restricted to 2 every 14 days; homoglyph/similarity collision checking; reserved username database blacklist; verified badge protected by database trigger. | **PASS** | UNIT |
| **Click/View Spam** | Analytics rate limiter (40 events/min per IP/token) prevents synthetic metric inflation. | **PASS** | UNIT |
| **Malicious Embeds** | Strictly constrained to YouTube (`youtube-nocookie.com`) and Vimeo (`player.vimeo.com`) via alphanumeric regex ID extraction. | **PASS** | UNIT |

---

## 12. Dependency Security Checks (Item 16)

Running `npm audit` revealed:
- **`next`**: Version `14.2.5` contains critical and high vulnerabilities (GHSA-gp8f-8m3g-qvj9, GHSA-g77x-44xx-532m, GHSA-7m27-7ghc-44w9, etc.) relating to Next.js cache poisoning, server actions DoS, and image optimization.
- **`postcss`**: Version `<=8.5.22` contains high severity advisory GHSA-qx2v-qp2m-jg93 (`</style>` unescaped in CSS stringify output).
- **Remediation**: Run `npm install next@14.2.35` (or latest patched 14.2.x release) to eliminate these vulnerabilities.
- **Evaluation**: **FAIL [INTEGRATION / AUDIT]**.

---

## 13. Production Security Headers Review (Item 17)

Configured in `next.config.js`:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`: **PASS**
- `X-Frame-Options: DENY`: **PASS**
- `X-Content-Type-Options: nosniff`: **PASS**
- `Referrer-Policy: strict-origin-when-cross-origin`: **PASS**
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`: **PASS**
- `Content-Security-Policy`:
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`: **PASS**
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: **PARTIAL** (Finding SEC-11: `'unsafe-inline'` and `'unsafe-eval'` are permitted for Next.js inline scripts; recommend moving to nonce-based CSP for post-MVP).
- **Evaluation**: **PARTIAL [STATIC]**.

---

## 14. Secret & Token Leakage Review (Item 18)

- Grep analysis across all server-side handlers (`app/api/*`) confirmed that error logging uses generic `console.error(..., err)` without dumping authorization headers, JWT strings, passwords, or service role keys.
- Client bundles do not contain `SUPABASE_SERVICE_ROLE_KEY`.
- **Evaluation**: **PASS [STATIC]**.

---

## 15. Master Security Verification Matrix

| # | Control / Finding | Classification | Verification Type | Notes |
|---|---|:---:|:---:|---|
| 1 | **Admin Email Backdoor Removal** | **PASS** | STATIC, UNIT, INTEGRATION | Email has zero privilege significance; admin checks derive solely from `platform_admins`. |
| 2 | **Stored XSS in JSON-LD** | **PASS** | STATIC, UNIT | `serializeJsonLd` escapes `<` to `\u003c`; `<script>` breakout neutralized. |
| 3 | **Custom Domain Hijack Defense (Code)** | **PASS** | UNIT | RLS policy and trigger definitions correctly reject `verified = true`. |
| 4 | **Custom Domain Hijack Defense (Live DB)** | **FAIL** | INTEGRATION | Migration 004 not yet executed on remote Supabase database. |
| 5 | **Profile Mass Assignment (Code)** | **PASS** | UNIT | Sensitive fields stripped from client sanitizers. |
| 6 | **Profile Mass Assignment (Live DB)** | **FAIL** | INTEGRATION | Trigger `check_profile_update_integrity` unapplied on remote DB. |
| 7 | **Block Moderation Integrity (Code)** | **PASS** | UNIT | Non-admin un-disabling and reason clearing blocked by trigger logic. |
| 8 | **Block Moderation Integrity (Live DB)** | **FAIL** | INTEGRATION | Trigger `check_block_moderation_integrity` unapplied on remote DB. |
| 9 | **Storage Avatars Path Isolation (Code)** | **PASS** | UNIT | Strict owner path isolation `avatars/${auth.uid()}.webp`. |
| 10 | **Storage Avatars Bucket (Live DB)** | **FAIL** | INTEGRATION | Bucket `avatars` does not exist on remote Supabase instance. |
| 11 | **Moderator vs Superadmin Segregation** | **PASS** | STATIC, UNIT | Moderators forbidden from deleting users and mutating settings (403). |
| 12 | **Reserved Usernames (Code)** | **PASS** | UNIT | Normalized validation rejects `@admin`, `ADMIN`, `support`. |
| 13 | **Reserved Usernames (Live DB)** | **FAIL** | INTEGRATION | Trigger `check_reserved_username` unapplied on remote DB. |
| 14 | **Password Change Verification** | **PASS** | STATIC, UNIT | Re-auth with `oldPassword` required; rate-limited (5 per 15 min). |
| 15 | **Background Image URL Sanitization** | **PASS** | STATIC, UNIT | `safeBackgroundUrl` enforces HTTP/HTTPS and escapes quotes. |
| 16 | **Public Socials Metadata Isolation** | **PASS** | STATIC, UNIT | Keys starting with `_` stripped from public profile props. |
| 17 | **SECURITY DEFINER search_path** | **PASS** | STATIC | `set search_path = public, pg_temp` added to all functions. |
| 18 | **Middleware Host Header Isolation** | **PASS** | STATIC, UNIT | Uses `request.headers.get('host')`; ignores `x-forwarded-host`. |
| 19 | **Next.js & PostCSS Dependencies** | **FAIL** | INTEGRATION (AUDIT) | Critical vulnerability in `next@14.2.5`; update required. |
| 20 | **Production Security Headers** | **PASS** | STATIC | HSTS, X-Frame-Options, nosniff, frame-ancestors 'none'. |

---

## 16. Actionable Production Deployment Remediation Checklist

To achieve complete **PRODUCTION READY** status:

### Step 1: Execute Migration 004 in Supabase Dashboard
1. Log into the Supabase Dashboard for project `jkhlvqguathrctiocuql`.
2. Open the **SQL Editor**.
3. Copy the entire contents of [`supabase/migrations/004_security_remediation.sql`](file:///c:/Users/STD%20USER/Desktop/work/link-in-bio/supabase/migrations/004_security_remediation.sql).
4. Click **Run**.
5. Verify in the Supabase Dashboard:
   - Under **Storage**: The `avatars` bucket exists with a 2MB limit and `public: true`.
   - Under **Database > Triggers**: Triggers `enforce_profile_update_integrity`, `enforce_block_moderation_integrity`, `enforce_domain_verification_integrity`, and `enforce_reserved_username` are active.

### Step 2: Patch Next.js and PostCSS Dependencies
Run in the project terminal:
```bash
npm install next@14.2.35
npm audit
```

### Step 3: Seed Initial Superadmin via UUID
Ensure the initial platform administrator is registered in `platform_admins` by Supabase UUID:
```sql
insert into platform_admins (user_id, role)
values ('76456cb7-fb31-47b6-ab34-1bdaecefed10', 'superadmin')
on conflict (user_id) do nothing;
```
*(Verified: Already present on the live remote database).*
