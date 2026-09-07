# Security Fix Log — Link-in-Bio Platform

**Assessment Standard**: Production Security Audit & Defensive Remediation  
**Scope**: All 9 Prioritized P0 & P1 Production Security Remediations from `SECURITY_AUDIT_REPORT.md`  
**Date**: September 7, 2026  
**Auditor / Engineer**: Senior Application Security Engineer & Penetration Tester  
**Test Suite Status**: 183 tests passing across 33 suites (155 baseline + 28 new security & persona regression tests)  
**Production Build Status**: Next.js 14 Production Build PASSED (All 28 routes compiled cleanly)

---

## Remediation Summary Table

| Finding / Item | Severity | CVSS v3.1 | Title | Affected Files | Status |
|---|:---:|:---:|---|---|:---:|
| **SEC-01** | **P0 Critical** | **9.8** | Client-Side Hardcoded Admin Email Escalation Backdoor | `lib/adminAuth.js`, `app/admin/layout.js`, `app/dashboard/layout.js`, `app/login/page.js` | **RESOLVED** |
| **SEC-02** | **P0 Critical** | **9.6** | Stored XSS via Public Profile JSON-LD Structured Data | `lib/publicProfileUtils.js`, `app/[username]/page.js`, `app/layout.js` | **RESOLVED** |
| **SEC-03** | **P1 High** | **8.5** | Arbitrary Custom Domain Takeover via Missing RLS Verification Check | `supabase/migrations/004_security_remediation.sql`, `supabase/schema.sql` | **RESOLVED** |
| **SEC-04** | **P1 High** | **8.1** | Mass Assignment Privilege Escalation (`is_verified`, `account_status`) via Direct RLS | `supabase/migrations/004_security_remediation.sql`, `supabase/schema.sql`, `app/dashboard/DashboardContext.js` | **RESOLVED** |
| **SEC-05** | **P1 High** | **7.7** | Moderation Bypass: Creators Can Un-Disable Banned Blocks | `supabase/migrations/004_security_remediation.sql`, `supabase/schema.sql` | **RESOLVED** |
| **SEC-06** | **P1 High** | **7.5** | Missing Supabase Storage Bucket & Object RLS Policies | `supabase/migrations/004_security_remediation.sql`, `supabase/schema.sql` | **RESOLVED** |
| **SEC-07** | **P1 High** | **7.4** | Over-Privileged Moderator Role: Arbitrary Account Deletion & Settings Mutation | `app/api/admin/users/route.js`, `app/api/admin/settings/route.js` | **RESOLVED** |
| **SEC-08** | **P1 High** | **7.2** | System Reserved Username Hijacking & Case-Insensitive Bypass | `supabase/migrations/004_security_remediation.sql`, `supabase/schema.sql`, `app/onboarding/page.js`, `app/auth/callback/page.js` | **RESOLVED** |
| **SEC-09** | **P1 High** | **7.1** | Insecure Password Change: Missing Re-Authentication & Rate Limiting | `app/api/account/actions/route.js` | **RESOLVED** |

---

## Detailed Remediation Entries

---

### [SEC-01] P0 CRITICAL — Client-Side Hardcoded Admin Email Escalation Backdoor

#### 1. Root Cause
`lib/adminAuth.js` and `app/admin/layout.js` derived root administrative privileges from client-provided email string matches (`user.email === 'pmkaulani@gmail.com' || ...`). If matched, the server-side client executed an automated upsert into `platform_admins` with `role: 'superadmin'`. An attacker signing up with that email address on an unconfirmed setup or via OAuth would be immediately and permanently granted superadmin privileges. Furthermore, `pmkaulani@gmail.com` is strictly a support and contact address and must never grant administrative privileges.

#### 2. Smallest Safe Change
1. **`lib/adminAuth.js`**: Removed all hardcoded email string checks and auto-promotion upserts. Access is derived strictly by querying `platform_admins` by `user_id = user.id`.
2. **`app/admin/layout.js`**: Removed hardcoded email check and auto-grant. Admin access is solely gated by the `platform_admins` record for `session.user.id`.
3. **`app/dashboard/layout.js`**: Removed email-based fallback check.
4. **`app/login/page.js`**: Removed hardcoded email routing heuristics.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-01 Regression: Client-Side Hardcoded Admin Email Escalation Backdoor`
- **Result**: PASSED. Verified that any caller presenting the target email address without an existing pre-seeded record in `platform_admins` receives `{ isAdmin: false, role: null }`.

---

### [SEC-02] P0 CRITICAL — Stored Cross-Site Scripting (XSS) via Public Profile JSON-LD

#### 1. Root Cause
In `app/[username]/page.js` and `app/layout.js`, profile structured data was rendered inside `<script type="application/ld+json">` tags using `dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}`. Because `JSON.stringify()` does not escape `<` or `</script>`, any user setting their `display_name` or `bio` to `</script><script>...` broke out of the `<script>` tag and executed arbitrary JavaScript in visitor browsers.

#### 2. Smallest Safe Change
1. **`lib/publicProfileUtils.js`**: Added helper function `serializeJsonLd(data)`:
   ```javascript
   export function serializeJsonLd(data) {
     if (!data) return '{}';
     return JSON.stringify(data).replace(/</g, '\\u003c');
   }
   ```
   Escaping `<` to `\u003c` ensures that HTML parsers never detect opening or closing HTML tags, while JSON parsers in modern browsers and search engines (Schema.org / Googlebot) decode `\u003c` as `<` without data loss.
2. **`app/[username]/page.js` & `app/layout.js`**: Replaced all instances of `JSON.stringify(profileJsonLd)` with `serializeJsonLd(profileJsonLd)`.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-02 Regression: Stored XSS via JSON-LD Structured Data`
- **Result**: PASSED. Verified that payloads containing `</script><script>alert("pwned")</script>` and `<img src=x onerror=...>` contain no raw `<` or `</script>`, correctly format as `\u003c/script>`, and round-trip faithfully through `JSON.parse`.

---

### [SEC-03] P1 HIGH — Arbitrary Custom Domain Takeover via Missing RLS Verification Check

#### 1. Root Cause
In `002_production_hardening.sql`, the RLS policy for `custom_domains` granted full `ALL` access with `check (auth.uid() = profile_id)`. Creators could insert rows with `verified = true`, claiming arbitrary external domains that edge middleware would immediately route to the attacker.

#### 2. Smallest Safe Change
1. **`supabase/migrations/004_security_remediation.sql`**:
   - Replaced permissive policy with fine-grained `select`, `insert`, and `delete` policies.
   - Enforced `with check (auth.uid() = profile_id and verified = false)` on insertion.
   - Added PostgreSQL trigger `check_domain_verification_integrity` that raises an exception if any client role (`authenticated` or `anon`) attempts to alter the `verified` column.
2. **`supabase/schema.sql`**: Updated with hardened custom domains policies and integrity triggers.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-03 Regression: Custom Domain Verification Integrity`
- **Result**: PASSED. Verified that client attempts to insert or mutate domains with `verified: true` are blocked.

---

### [SEC-04] P1 HIGH — Mass Assignment Privilege Escalation (`is_verified`, `account_status`) via Direct RLS

#### 1. Root Cause
In `002_production_hardening.sql`, `profiles for update` only asserted `using (auth.uid() = id)`. Lacking column constraints, any creator could execute `.update({ is_verified: true, account_status: 'active' })` directly from client DevTools to give themselves verified status or un-suspend their own account. In addition, `DashboardContext.js` included these fields in `VALID_PROFILE_COLUMNS`.

#### 2. Smallest Safe Change
1. **`app/dashboard/DashboardContext.js`**: Removed `'is_verified'`, `'account_status'`, and `'suspension_reason'` from `VALID_PROFILE_COLUMNS`.
2. **`supabase/migrations/004_security_remediation.sql`**: Created PostgreSQL trigger `check_profile_update_integrity` on `profiles`. If `current_user in ('authenticated', 'anon')`, raises a security violation exception if `is_verified`, `account_status`, or `suspension_reason` differs between `OLD` and `NEW`.
3. **`supabase/schema.sql`**: Added trigger definition to baseline schema.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-04 Regression: Mass Assignment Privilege Escalation on Profiles`
- **Result**: PASSED. Verified that client-supplied payloads attempting to inject `is_verified`, `account_status`, or `suspension_reason` are stripped by the client sanitizer and blocked by database triggers.

---

### [SEC-05] P1 HIGH — Moderation Bypass: Creators Can Un-Disable Banned Blocks

#### 1. Root Cause
In `002_production_hardening.sql`, the `blocks` update policy allowed owners to mutate any column on their own blocks. When moderators disabled an offensive or phishing link (`is_disabled = true`), the creator could execute `.update({ is_disabled: false, moderation_reason: null })` via the client SDK to immediately restore the link.

#### 2. Smallest Safe Change
1. **`supabase/migrations/004_security_remediation.sql`**: Added PostgreSQL trigger `check_block_moderation_integrity` on `blocks`. Raises an exception if a non-service-role caller attempts to change `is_disabled` from `true` to `false` or clear `moderation_reason`.
2. **`supabase/schema.sql`**: Added trigger definition to baseline schema.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-05 Regression: Block Moderation Integrity`
- **Result**: PASSED. Verified that creators cannot re-enable disabled blocks or clear moderation reasons while retaining the ability to edit standard block content (titles, URLs) on active blocks.

---

### [SEC-06] P1 HIGH — Missing Supabase Storage Bucket & Object RLS Policies

#### 1. Root Cause
No migration defined the `avatars` bucket or created policies on `storage.objects`. Without explicit object-level RLS, creators could overwrite avatar objects belonging to other users (`avatars/${targetUserId}.webp`) or upload unauthorized file types.

#### 2. Smallest Safe Change
1. **`supabase/migrations/004_security_remediation.sql`**:
   - Inserted `avatars` bucket with public read access, a 2MB file size limit, and restricted MIME types (`image/webp`, `image/jpeg`, `image/png`).
   - Enabled RLS on `storage.objects`.
   - Created RLS policies restricting `insert`, `update`, and `delete` strictly to `storage.filename(name) = (auth.uid()::text || '.webp')`.
2. **`supabase/schema.sql`**: Added storage bucket configuration and policies to baseline schema.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-06 Regression: Storage Object Avatar Path Isolation`
- **Result**: PASSED. Verified that avatar uploads are strictly isolated to `avatars/${userId}.webp`, cross-account overwrite attempts are rejected, and unauthorized extensions are blocked.

---

### [SEC-07] P1 HIGH — Over-Privileged Moderator Role: Arbitrary Account Deletion & Settings Mutation

#### 1. Root Cause
In `app/api/admin/users/route.js` and `app/api/admin/settings/route.js`, authorization checks only verified `adminCheck.isAdmin`. As a result, staff assigned the `moderator` role possessed the ability to irreversibly delete user accounts and tamper with global platform settings or toggle system feature flags.

#### 2. Smallest Safe Change
1. **`app/api/admin/users/route.js`**: Enforced that `action === 'delete_user'` strictly requires `adminCheck.role === 'superadmin'`, returning `403 Forbidden` for moderators.
2. **`app/api/admin/settings/route.js`**: Enforced that all POST mutation endpoints (toggling feature flags, modifying platform settings, and adding/removing reserved usernames) strictly require `adminCheck.role === 'superadmin'`, returning `403 Forbidden` for moderators.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-10 / Role Segregation: Moderator vs Superadmin Permissions`
- **Result**: PASSED. Verified that moderators cannot delete accounts or alter platform configuration, while superadmins retain full authorized control.

---

### [SEC-08] P1 HIGH — System Reserved Username Hijacking & Case-Insensitive Bypass

#### 1. Root Cause
Reserved username checks existed only as non-exhaustive client or edge filters. Callers could register reserved system paths (e.g. `admin`, `support`, `api`, `login`, `dashboard`) via OAuth callback, onboarding, or direct database updates, often bypassing checks using mixed casing (e.g. `Admin`), whitespace padding, or `@` prefixing.

#### 2. Smallest Safe Change
1. **`supabase/migrations/004_security_remediation.sql`**: Added PostgreSQL trigger `check_reserved_username` on `profiles`. Normalizes input using `lower(trim(replace(username, '@', '')))` and blocks any matching entry present in `reserved_usernames`.
2. **`app/onboarding/page.js` & `app/auth/callback/page.js`**: Added client and callback normalization and checks against `reserved_usernames`.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-08 Regression: Reserved Username Database Normalization & Enforcement`
- **Result**: PASSED. Verified that variations such as `ADMIN`, `@admin`, `  @Support  `, and `DASHBOARD` are completely rejected, while legitimate creator handles are allowed.

---

### [SEC-09] P1 HIGH — Insecure Password Change: Missing Re-Authentication & Rate Limiting

#### 1. Root Cause
`app/api/account/actions/route.js` allowed any active session to update the account password without supplying the current password (`oldPassword`). An attacker obtaining a temporary session or accessing an unattended browser could take over the account permanently without knowing the victim's existing credentials. Furthermore, there was no brute-force rate limiting on password changes.

#### 2. Smallest Safe Change
1. **`app/api/account/actions/route.js`**:
   - Implemented a sliding-window rate limiter (maximum 5 attempts per 15-minute window keyed by `userId:clientIp`).
   - For users with an existing password, strictly required `oldPassword` and verified it via `supabase.auth.signInWithPassword` before calling `updateUser`.
   - Enforced strict password complexity requirements (8+ characters, uppercase, lowercase, numbers, and symbols).
   - Sanitized error messages to return generic failure responses without disclosing internal state.

#### 3. Verification & Regression Test
- **Test File**: `tests/p0_p1_security_regression.test.mjs`
- **Subtest**: `SEC-09 Regression: Secure Password Change & Sliding-Window Rate Limiting`
- **Result**: PASSED. Verified password complexity enforcement, sliding-window rate limiting after 5 attempts, and rejection of password change when `oldPassword` is omitted or incorrect.

---

## Multi-Persona Security Verification Matrix

All remediations were rigorously evaluated across five distinct personas:

| Test Scenario | ANONYMOUS | USER_A (Creator) | USER_B (Victim) | MODERATOR | SUPERADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| **Admin Route Access (`/api/admin/*`)** | ❌ Blocked (401/403) | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Allowed (View/Mod) | ✅ Allowed (Full) |
| **Account Deletion (`action: delete_user`)** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked (403) | ✅ Allowed (200) |
| **Platform Settings & Flag Mutation** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Blocked (403) | ✅ Allowed (200) |
| **Profile Mutation (Cross-User)** | ❌ Blocked | ✅ Own Profile Only | ✅ Own Profile Only | ❌ Direct RLS Blocked | ❌ Direct RLS Blocked |
| **Profile Badge Escalation (`is_verified`)** | ❌ Blocked | ❌ Blocked (Trigger) | ❌ Blocked (Trigger) | ✅ Admin Route Only | ✅ Admin Route Only |
| **Custom Domain: Verified Assertion** | ❌ Blocked | ❌ Blocked (RLS+Trigger) | ❌ Blocked (RLS+Trigger) | N/A | N/A |
| **Storage Avatar Path Isolation** | ❌ Read Only | ✅ `avatars/a.webp` Only | ✅ `avatars/b.webp` Only | ❌ Standard RLS | ❌ Standard RLS |
| **Cross-User Block Tampering** | ❌ Blocked | ❌ Cannot touch B | ❌ Cannot touch A | ✅ Admin Route Only | ✅ Admin Route Only |
| **Re-enabling Moderated Blocks** | ❌ Blocked | ❌ Blocked (Trigger) | ❌ Blocked (Trigger) | ✅ Admin Route Only | ✅ Admin Route Only |
| **Reserved Username Claiming** | ❌ Blocked | ❌ Blocked (Trigger) | ❌ Blocked (Trigger) | ❌ Blocked (Trigger) | ❌ Blocked (Trigger) |
| **Password Change without Old Password** | ❌ Blocked (401) | ❌ Blocked (400) | ❌ Blocked (400) | ❌ Blocked (400) | ❌ Blocked (400) |

---

## Final Verification Test Execution

```text
# tests 183
# suites 33
# pass 183
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3385.0724
```

- **Unit & Security Regression Tests**: **183 / 183 passed** (0 failures).
- **Next.js Production Build**: **Passed** (0 build errors, 28/28 routes successfully generated).
