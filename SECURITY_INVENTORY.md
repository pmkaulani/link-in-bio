# Application Security Inventory — Link-in-Bio

**Date**: September 7, 2026  
**Assessment Type**: Defensive Production Security Audit & Penetration Assessment  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Repository**: `link-in-bio` (Next.js 14 App Router, Supabase Backend, Tailwind CSS)

---

## 1. Public Routes (No Authentication Required)

| Route Path | Component / Page File | Rendering Mode | Security Perimeter & Data Exposed |
|---|---|---|---|
| `/` | `app/page.js` | Server / Client Hybrid | Public marketing landing page. Exposes live platform features, hero demo, and brand assets. No user PII. |
| `/[username]` | `app/[username]/page.js` | Dynamic SSR (`force-dynamic`, `revalidate=0`) | Visitor profile page. Exposes public creator handle, display name, bio, avatar, socials, active links, and embed media. Renders JSON-LD structured data. |
| `/login` | `app/login/page.js` | Client Component (`'use client'`) | User login interface. Handles email/password and Google OAuth initiation. |
| `/signup` | `app/signup/page.js` | Client Component (`'use client'`) | User registration interface. Collects email, password, username, display name, initial theme. Debounces username availability check against `profiles` and local storage. |
| `/auth/callback` | `app/auth/callback/page.js` | Client Component (`'use client'`) | OAuth & Magic Link callback handler. Exchanges PKCE auth code for session via `supabase.auth.exchangeCodeForSession`. Creates fallback profile if none exists. |
| `/reset-password` | `app/reset-password/page.js` | Client Component (`'use client'`) | Password reset completion page. Consumes recovery session established by Supabase password reset link. |
| `/set-password` | `app/set-password/page.js` | Client Component (`'use client'`) | Post-OAuth password creation prompt for accounts authenticated via Google without an existing password. |
| `/sitemap.xml` | `app/sitemap.js` | Dynamic Route Handler | XML sitemap generating canonical URLs for public routes and platform pages. |
| `/robots.txt` | `app/robots.js` | Dynamic Route Handler | Directs search engine crawler indexing rules. |

---

## 2. Authenticated User Routes (`/dashboard/*`)

Protected by client-side auth state listener (`supabase.auth.onAuthStateChange`) and layout redirection in `app/dashboard/layout.js`.

| Route Path | File | Purpose | Sensitive Data / Capabilities |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.js` | Core Link Editor & Live Canvas | Full link/block builder, drag-and-drop reordering, visibility toggling, visual customization, and publishing snapshot engine. |
| `/dashboard/profile` | `app/dashboard/profile/page.js` | Profile Information Editor | Updates display name, bio, avatar image upload/compression, and connected social accounts. |
| `/dashboard/theme` | `app/dashboard/theme/page.js` | Styling & Appearance Studio | Palette selection, font family, button radii, background types (solid/gradient/image), background animations, and cursor FX. |
| `/dashboard/analytics` | `app/dashboard/analytics/page.js` | Performance Analytics | Creator analytics dashboard: total views, link clicks, click-through rates, top devices, referrers, and timeline charts. |
| `/dashboard/settings` | `app/dashboard/settings/page.js` | Account & Security Center | Password updates, handle changes, active session inspection/revocation, 2FA toggle UI, account deactivation, and data export. |
| `/dashboard/domain` | `app/dashboard/domain/page.js` | Custom Domain Manager | Redirects to profile settings; legacy placeholder for custom domain mapping. |
| `/onboarding` | `app/onboarding/page.js` | New Creator Setup Flow | 4-step wizard: handle claim, starter template selection, social account configuration, and initial avatar setup. |

---

## 3. Administrative Routes (`/admin/*`)

Protected by `app/admin/layout.js` checking session email against hardcoded superadmin address and `platform_admins` DB table.

| Route Path | File | Administrative Scope |
|---|---|---|
| `/admin` | `app/admin/page.js` | Global telemetry overview: total users, active profiles, total links, reports pending, system operational status. |
| `/admin/users` | `app/admin/users/page.js` | User moderation: search creators, inspect profile states, toggle verification badge, warn/suspend/ban accounts, purge accounts. |
| `/admin/links` | `app/admin/links/page.js` | Content moderation: search all creator blocks/links, disable malicious or violating URLs, assign moderation reasons. |
| `/admin/reports` | `app/admin/reports/page.js` | Trust & Safety queue: review abuse reports, triage by priority, dismiss or resolve, trigger automated block disablement or user suspension. |
| `/admin/settings` | `app/admin/settings/page.js` | Platform operations: feature flags toggle, platform configuration values (max blocks, defaults), reserved usernames blacklist manager. |
| `/admin/audit` | `app/admin/audit/page.js` | Administrative audit log: chronological ledger of all actions taken by administrators and moderators. |

---

## 4. Next.js API Route Handlers

All API handlers are defined under `app/api/*` and use `export const dynamic = 'force-dynamic'`.

| Route Path | Methods | Auth Gate / Validation Mechanism | Privilege Level | File |
|---|---|---|---|---|
| `/api/health` | `GET` | None (Public probe) | Anonymous | `app/api/health/route.js` |
| `/api/analytics` | `POST` | In-memory IP/token rate limiter (40 req/min) | Anonymous / Visitor | `app/api/analytics/route.js` |
| `/api/reports/submit` | `POST` | In-memory IP rate limiter (5 req/min) | Anonymous / Visitor | `app/api/reports/submit/route.js` |
| `/api/domain/resolve` | `GET` | Service-role RPC caller | Edge / Internal | `app/api/domain/resolve/route.js` |
| `/api/account/actions` | `POST` | JWT Bearer via `createRequestClient` (`auth.getUser`) | Authenticated User | `app/api/account/actions/route.js` |
| `/api/account/delete` | `POST` | JWT Bearer via `createRequestClient` + Service-role purge | Authenticated User | `app/api/account/delete/route.js` |
| `/api/admin/health` | `GET` | `verifyAdminUser` (JWT check against `platform_admins`) | Admin / Superadmin | `app/api/admin/health/route.js` |
| `/api/admin/users` | `GET`, `POST` | `verifyAdminUser` | Admin / Superadmin | `app/api/admin/users/route.js` |
| `/api/admin/links` | `GET`, `POST` | `verifyAdminUser` | Admin / Superadmin | `app/api/admin/links/route.js` |
| `/api/admin/reports` | `GET`, `POST` | `verifyAdminUser` | Admin / Superadmin | `app/api/admin/reports/route.js` |
| `/api/admin/settings` | `GET`, `POST` | `verifyAdminUser` | Admin / Superadmin | `app/api/admin/settings/route.js` |
| `/api/admin/audit` | `GET` | `verifyAdminUser` | Admin / Superadmin | `app/api/admin/audit/route.js` |

---

## 5. Server Actions

- **Status**: No `"use server"` Server Actions are utilized in this codebase. All client-to-server mutations are routed through standard HTTP API routes or direct Supabase client RPCs/queries.

---

## 6. Edge & Middleware Functions

- **File**: `middleware.js`
- **Scope**: Matches `/((?!_next/static|_next/image|favicon.ico|api).*)`.
- **Functionality**:
  - Extracts incoming `host` header.
  - Skips known platform hosts (`localhost:3000`, `127.0.0.1:3000`, `VERCEL_URL`, `NEXT_PUBLIC_APP_HOST`, and `*.vercel.app`).
  - Intercepts root path (`/`) requests on custom domains.
  - Queries Supabase REST RPC `resolve_custom_domain` with `{ p_domain: host }`.
  - Performs URL rewrite via `NextResponse.rewrite(new URL('/' + username, request.url))`.

---

## 7. Client-Side Supabase Calls (`lib/supabase.js`)

Initialized using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

| Calling Component | Operation | Target Table / Service |
|---|---|---|
| `app/login/page.js` | `auth.signInWithPassword`, `auth.getSession` | Supabase Auth GoTrue |
| `app/signup/page.js` | `auth.signUp`, `auth.getSession`, `from('profiles').insert` | Supabase Auth, `profiles` |
| `app/auth/callback/page.js` | `auth.exchangeCodeForSession`, `from('profiles').insert` | Supabase Auth, `profiles` |
| `app/reset-password/page.js` | `auth.updateUser` (via `lib/authHelpers.js`) | Supabase Auth |
| `app/dashboard/DashboardContext.js` | `from('profiles').select/update`, `from('blocks').select/insert/update/delete` | `profiles`, `blocks` |
| `app/dashboard/profile/page.js` | `storage.from('avatars').upload/getPublicUrl` | Supabase Storage (`avatars`) |
| `app/dashboard/analytics/page.js` | `from('analytics_events').select` | `analytics_events` |
| `app/admin/layout.js` | `from('platform_admins').select` | `platform_admins` |

---

## 8. Server-Side Supabase Calls (User-Scoped: `lib/supabaseServer.js`)

- Factory function: `createRequestClient(authHeader)` creates a Supabase client configured with the incoming caller's `Authorization: Bearer <JWT>` header and `persistSession: false`.
- Enforces Row Level Security (RLS) bound to `auth.uid() = caller_jwt.sub`.
- Used in:
  - `app/api/account/actions/route.js`
  - `app/api/account/delete/route.js`
  - `lib/adminAuth.js` (step 1: caller verification via `auth.getUser()`)

---

## 9. Service-Role Supabase Calls (`lib/supabaseAdmin.js`)

- Factory function: `createAdminClient()` initializes `@supabase/supabase-js` with `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- Bypasses Row Level Security (RLS) entirely.
- Used in:
  - `app/api/analytics/route.js`: Ingestion of analytics events and profile existence verification.
  - `app/api/domain/resolve/route.js`: Resolution of custom domains via `resolve_custom_domain` RPC and fallback queries.
  - `app/api/account/delete/route.js`: Cascading deletion of blocks, reports, analytics, profile, and `auth.admin.deleteUser()`.
  - `lib/adminAuth.js`: Querying `platform_admins`, writing to `admin_audit_logs`, querying `reserved_usernames`.
  - `app/api/admin/*`: All administrative read, write, toggle, and moderation operations.

---

## 10. Supabase Database Tables

All tables reside in the `public` schema:

1. **`profiles`**: User profiles, usernames, themes, layout styling, verified status, account suspension states, snapshot JSON caches (`published_profile`, `published_blocks`).
2. **`blocks`**: User links and dynamic content blocks (headers, text, images, videos, dividers, contact pills) with visibility and moderation flags.
3. **`platform_admins`**: Administrative role assignments (`superadmin`, `admin`, `moderator`) keyed by `user_id uuid references auth.users`.
4. **`reports`**: Abuse, spam, phishing, and TOS violation reports submitted by public visitors.
5. **`reserved_usernames`**: System reserved handle blacklist.
6. **`admin_audit_logs`**: Immutable ledger of administrative interventions and moderation actions.
7. **`feature_flags`**: Dynamic system feature toggles (`user_registration`, `public_pages`, `custom_domains`, etc.).
8. **`platform_settings`**: Key-value JSON platform constraints (`max_blocks_per_user`, `maintenance_mode`, etc.).
9. **`analytics_events`**: Telemetry log of public profile page views and link clicks.
10. **`custom_domains`**: Mapping between custom domains and platform usernames with verification status.

---

## 11. Supabase Views & Materialized Views

- None currently defined in migrations or schema files.

---

## 12. Supabase Stored Functions & RPCs

1. **`resolve_custom_domain(p_domain text)`**:
   - Language: PL/pgSQL
   - Security: `SECURITY DEFINER`
   - Permissions: `GRANT EXECUTE ON FUNCTION resolve_custom_domain(text) TO anon, authenticated, service_role`
   - Purpose: Resolves a hostname to an active creator username where `domain = p_domain`, `verified = true`, `account_status in ('active', 'warning')`, and `publication_status in ('published', 'unlisted')`.

---

## 13. Supabase Database Triggers

1. **`check_analytics_block_ownership()`**:
   - Trigger name: `analytics_block_ownership`
   - Target: `BEFORE INSERT ON analytics_events`
   - Functionality: Ensures that if `block_id` is supplied in an analytics event, it strictly belongs to the specified `profile_id`. Prevents spoofed attribution across profiles.
2. **`set_updated_at()`**:
   - Trigger name: `profiles_set_updated_at`
   - Target: `BEFORE UPDATE ON profiles`
   - Functionality: Automatically maintains `updated_at = now()`.

---

## 14. Supabase Row Level Security (RLS) Policies

All 10 tables have `alter table <name> enable row level security` asserted in `002_production_hardening.sql`:

- **`profiles`**:
  - `SELECT`: Owner (`auth.uid() = id`) OR (`publication_status in ('published', 'unlisted') and account_status in ('active', 'warning')`).
  - `INSERT`: With check `auth.uid() = id`.
  - `UPDATE`: Using `auth.uid() = id`.
  - `DELETE`: None defined for standard users (handled via service-role API).
- **`blocks`**:
  - `SELECT`: Owner (`auth.uid() = profile_id`) OR (`is_visible = true and is_disabled = false and profile is published/active`).
  - `INSERT`: With check `auth.uid() = profile_id`.
  - `UPDATE`: Using `auth.uid() = profile_id`.
  - `DELETE`: Using `auth.uid() = profile_id`.
- **`platform_admins`**:
  - `SELECT`: Using `auth.uid() = user_id`.
  - `INSERT` / `UPDATE` / `DELETE`: None defined for client roles.
- **`reports`**:
  - `INSERT`: With check `true` (Anonymous submission permitted).
  - `SELECT` / `UPDATE` / `DELETE`: None defined for client roles (Service role only).
- **`reserved_usernames`**:
  - `SELECT`: Using `true` (Publicly readable).
  - `INSERT` / `UPDATE` / `DELETE`: None defined for client roles.
- **`feature_flags`**:
  - `SELECT`: Using `true` (Publicly readable).
  - `INSERT` / `UPDATE` / `DELETE`: None defined for client roles.
- **`platform_settings`**:
  - `SELECT`: Using `true` (Publicly readable).
  - `INSERT` / `UPDATE` / `DELETE`: None defined for client roles.
- **`analytics_events`**:
  - `SELECT`: Using `auth.uid() = profile_id`.
  - `INSERT`: None defined for client roles in migration 002 (inserted via service-role API).
  - `UPDATE` / `DELETE`: None defined for client roles.
- **`custom_domains`**:
  - `ALL`: Using `auth.uid() = profile_id` with check `auth.uid() = profile_id`.
- **`admin_audit_logs`**:
  - No client policies defined (Exclusively read/written via service-role admin client).

---

## 15. Supabase Storage Buckets & Policies

- **Bucket Name**: `avatars`
- **Intended Storage Path**: `avatars/${userId}.webp`
- **Bucket Configuration in Migrations**: Missing. No DDL exists in migrations creating bucket `avatars` or establishing `storage.objects` RLS policies.

---

## 16. Supabase Auth Configurations & Hooks

- **Auth Mechanisms**:
  - Email + Password (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`)
  - Google OAuth (`supabase.auth.signInWithOAuth({ provider: 'google' })`)
  - Password Reset Recovery Flow (`supabase.auth.resetPasswordForEmail`)
  - Session Refresh (`supabase.auth.onAuthStateChange`)
- **Auth Hooks**: No Supabase Auth MFA hooks, Send SMS hooks, or Custom Access Token claims hooks are configured in the database.

---

## 17. Environment Variables Inventory

| Variable Name | Exposure Scope | Sensitivity Level | Purpose & Assessment |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client Bundle | Low (Standard Public Endpoint) | Directs client and server SDK to Supabase project instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client Bundle | Low / Medium (Protected by RLS) | Anon API key. Must be constrained strictly by RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Side Only | **CRITICAL (Full DB Admin)** | Bypasses all RLS policies. Must NEVER be leaked or prefixed with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Public / Client Bundle | **HIGH (Reconnaissance / PII)** | Exposes the superadmin's email address directly in browser bundles. |
| `ADMIN_EMAIL` | Server-Side Only | Medium | Server-side fallback for admin identity comparison. |
| `NEXT_PUBLIC_APP_HOST` | Public / Client Bundle | Low | Hostname for absolute URL synthesis (e.g. `my-link-in-bio.vercel.app`). |
| `NEXT_PUBLIC_SITE_URL` | Public / Client Bundle | Low | Canonical site root for metadata generation. |
| `VERCEL_URL` | Edge / Server-Side | Low | Injected by Vercel deployment infrastructure. |

---

## 18. Third-Party Integrations & External APIs

1. **Google OAuth (Supabase Identity Provider)**: Used for single sign-on authentication.
2. **YouTube Video Embeds**: Embedded via `youtube-nocookie.com/embed/${videoId}`.
3. **Vimeo Video Embeds**: Embedded via `player.vimeo.com/video/${videoId}`.
4. **Google Fonts CDN**: `https://fonts.googleapis.com` and `https://fonts.gstatic.com` for dynamic typography.
5. **Cloudflare CDN / cdnjs**: Specified in CSP for font/script distribution.

---

## 19. Cron Jobs & Background Tasks

- No internal scheduled cron jobs or worker queues are active in the application codebase. Rate limiter cleanup occurs lazily in Node.js process memory upon map threshold breach.

---

## 20. File Upload Paths & Processors

- **Client Upload Handler**: `app/dashboard/profile/page.js` and `app/onboarding/page.js`.
- **Image Processor**: `lib/imageUtils.js` -> `compressAvatarImage(file, maxDimension=320, quality=0.82)`.
  - Uses HTML5 Canvas API (`document.createElement('canvas')`) to resize input images to maximum 320x320 and re-encode to `image/webp`.
  - Converts output to a base64 DataURL and `Blob`.
- **Target Destination**: Supabase Storage bucket `avatars` at path `avatars/${userId}.webp`.

---

## 21. Rendering Modes (SSR vs SSG vs Client)

- **`app/[username]/page.js`**: Dynamic Server-Side Rendering (`force-dynamic`, `revalidate = 0`, `fetchCache = 'force-no-store'`).
- **`app/api/*`**: Dynamic Serverless API Handlers (`force-dynamic`).
- **`app/dashboard/*`**, **`app/admin/*`**, **`app/login/*`**, **`app/signup/*`**: Client-side single page applications rendered with `'use client'`.

---

## 22. External Dependencies, Script Tags & CDNs

- **Fonts**:
  - `https://fonts.googleapis.com/css2?...` dynamically injected in `PublicProfile.jsx` and `LivePreview.js`.
- **Embeds**:
  - `https://www.youtube-nocookie.com`
  - `https://player.vimeo.com`
  - `https://open.spotify.com` (permitted in CSP `frame-src`)
- **Icons**:
  - `lucide-react` (local bundle, SVG-based, safe from DOM injection).

---

## 23. Client Storage Usages (Cookies, LocalStorage, SessionStorage)

| Key Name | Storage Medium | Stored Data / Purpose | Security Implication |
|---|---|---|---|
| `sb-<project-ref>-auth-token` | LocalStorage | Supabase Auth JWT access token and refresh token | Stored unencrypted in browser localStorage. Vulnerable to theft if XSS exists. |
| `local_supabase_db` | LocalStorage | Standalone mock database for offline demo mode | Contains mock profiles and blocks. Non-sensitive in production. |
| `linkinbio_cached_profile` | LocalStorage | Legacy cache cleared upon dashboard initialization | Deprecated. |
| `linkinbio_cached_blocks` | LocalStorage | Legacy cache cleared upon dashboard initialization | Deprecated. |

---

## 24. Security Headers, CSP & CORS

Defined in `next.config.js`:
- **`X-Frame-Options`**: `DENY`
- **`X-Content-Type-Options`**: `nosniff`
- **`Referrer-Policy`**: `strict-origin-when-cross-origin`
- **`Permissions-Policy`**: `camera=(), microphone=(), geolocation=(), interest-cohort=()`
- **`Strict-Transport-Security`**: `max-age=63072000; includeSubDomains; preload`
- **`X-DNS-Prefetch-Control`**: `on`
- **`Content-Security-Policy`**:
  ```text
  default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
  ```

---

## 25. Realtime / WebSocket Subscriptions

- `DashboardContext.js` establishes an auth subscription (`supabase.auth.onAuthStateChange`) over GoTrue event listeners.
- No Supabase Realtime channel subscriptions (`supabase.channel(...)`) are currently open to postgres change broadcasts.
