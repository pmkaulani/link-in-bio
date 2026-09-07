# Comprehensive Authorization & Access Control Matrix — Link-in-Bio

**Date**: September 7, 2026  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Scope**: Evaluates permissions and access controls across 5 user identity tiers for every data model, endpoint, and capability.

---

## 1. Identity Definitions

- **Tier 1: Anonymous Visitor (`anon`)**: Unauthenticated public internet user or automated client.
- **Tier 2: Profile Owner (`owner`)**: Authenticated user (`auth.uid() = resource.profile_id`).
- **Tier 3: Other Authenticated User (`attacker`)**: Authenticated user attempting access on resources owned by another user (`auth.uid() != resource.profile_id`).
- **Tier 4: Platform Moderator (`moderator`)**: Authenticated internal user with `platform_admins.role = 'moderator'`.
- **Tier 5: Platform Superadmin (`superadmin`)**: Platform owner / root administrator (`platform_admins.role = 'superadmin'`).

---

## 2. Platform Permission Legend

- ✅ **ALLOWED / INTENDED**: Permission granted and expected by system security architecture.
- ❌ **BLOCKED / ENFORCED**: Permission denied by database RLS, server authorization, or application gates.
- 🚨 **VULNERABILITY / BYPASS**: Unauthorized action permitted due to missing RLS, improper gate, or mass assignment.
- ⚠️ **DEFECT / FUNCTIONAL FAILURE**: Action intended for role but fails due to missing RLS policy or client misconfiguration.

---

## 3. Comprehensive Access Control Matrix

| Resource & Operation | Anonymous Visitor | Profile Owner | Other User (Attacker) | Platform Moderator | Platform Superadmin | Implementation Mechanism & Security Finding |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **PROFILES TABLE** | | | | | | |
| Read Published / Unlisted Active Profiles | ✅ | ✅ | ✅ | ✅ | ✅ | Enforced via RLS (`publication_status in ('published', 'unlisted') and account_status in ('active', 'warning')`). |
| Read Draft / Suspended Profiles | ❌ | ✅ | ❌ | ✅ | ✅ | Owner reads via `auth.uid() = id`; Admins read via service-role API (`/api/admin/users`). |
| Insert Profile Record | ❌ | ✅ | ❌ | ❌ | ❌ | Enforced via RLS `with check (auth.uid() = id)`. |
| Update Basic Profile Fields (`bio`, `theme`, etc.) | ❌ | ✅ | ❌ | ✅ | ✅ | Owner updates own row; Admins update via service-role API. |
| Update `is_verified` (Badge Escalation) | ❌ | 🚨 **VULNERABLE** | ❌ | ✅ | ✅ | **P1 Defect**: Postgres RLS `using (auth.uid() = id)` allows owner to update ANY column including `is_verified: true`. |
| Update `account_status` (Self-Unban / Reactivation) | ❌ | 🚨 **VULNERABLE** | ❌ | ✅ | ✅ | **P1 Defect**: Suspended creator can execute `.update({ account_status: 'active' })` via direct client SDK. |
| Update `publication_status` | ❌ | ✅ | ❌ | ✅ | ✅ | Permitted for creator to publish/unpublish their page. |
| Delete Profile Record | ❌ | ⚠️ / ✅ | ❌ | 🚨 **VULNERABLE** | ✅ | **P1 Defect**: `/api/admin/users` allows moderators to delete any profile; creators delete via `/api/account/delete`. |
| **BLOCKS TABLE** | | | | | | |
| Read Active / Non-Disabled Blocks | ✅ | ✅ | ✅ | ✅ | ✅ | Enforced via RLS (`is_visible = true and is_disabled = false and profile active`). |
| Read Disabled / Moderated Blocks | ❌ | ✅ | ❌ | ✅ | ✅ | Owner inspects via `auth.uid() = profile_id`; Admins inspect via `/api/admin/links`. |
| Insert Block Record | ❌ | ✅ | ❌ | ❌ | ❌ | Enforced via RLS `with check (auth.uid() = profile_id)`. |
| Update Block URL / Title / Data | ❌ | ✅ | ❌ | ✅ | ✅ | Owner updates own blocks; Admins update via service-role client. |
| Update `is_disabled` (Unban Violating Link) | ❌ | 🚨 **VULNERABLE** | ❌ | ✅ | ✅ | **P1 Defect**: Blocks update RLS policy lacks column checks; creator can set `is_disabled: false` to unban link. |
| Update `moderation_reason` | ❌ | 🚨 **VULNERABLE** | ❌ | ✅ | ✅ | Creator can clear moderation note via direct client update. |
| Delete Block Record | ❌ | ✅ | ❌ | ✅ | ✅ | Enforced via RLS `using (auth.uid() = profile_id)`. |
| **REPORTS TABLE** | | | | | | |
| Submit Abuse Report (API Handler) | ✅ | ✅ | ✅ | ✅ | ✅ | Rate limited (5 req/min in-memory) via `/api/reports/submit`. |
| Submit Abuse Report (Direct RLS Insert) | 🚨 **VULNERABLE** | 🚨 **VULNERABLE** | 🚨 **VULNERABLE** | ✅ | ✅ | **P2 Defect**: RLS `with check (true)` allows unmetered direct database spam bypassing API rate limits. |
| List & Search Abuse Reports | ❌ | ❌ | ❌ | ✅ | ✅ | Strictly restricted to admin API (`/api/admin/reports`). |
| Resolve / Dismiss Report | ❌ | ❌ | ❌ | ✅ | ✅ | Admin POST to `/api/admin/reports` with service role. |
| Delete Abuse Report | ❌ | ❌ | ❌ | ❌ | ❌ | Only deleted via user account cascading deletion. |
| **PLATFORM ADMINS TABLE** | | | | | | |
| Read Own Admin Role | ❌ | ❌ | ❌ | ✅ | ✅ | Enforced via RLS `using (auth.uid() = user_id)`. |
| Read All Admin Records | ❌ | ❌ | ❌ | ❌ | ❌ | Direct client reads blocked; only queried by service role. |
| Insert / Promote Admin | ❌ | ❌ | ❌ | ❌ | 🚨 **VULNERABLE** | **P0 Defect**: Hardcoded email upsert in `lib/adminAuth.js` automatically promotes matching email to superadmin. |
| Modify Admin Role | ❌ | ❌ | ❌ | ❌ | ✅ | Managed via database direct operations. |
| Delete / Revoke Admin | ❌ | ❌ | ❌ | ❌ | ✅ | Managed via database direct operations. |
| **ADMIN AUDIT LOGS TABLE** | | | | | | |
| Read Audit Logs | ❌ | ❌ | ❌ | ✅ | ✅ | Queried via `/api/admin/audit` with service role. |
| Write Audit Log Entry | ❌ | ❌ | ❌ | ✅ | ✅ | Written via `logAdminAction()` in `lib/adminAuth.js` with service role. |
| Modify / Delete Audit Logs | ❌ | ❌ | ❌ | ❌ | ❌ | Immutable ledger: no update or delete endpoints exist; RLS denies all client mutations. |
| **FEATURE FLAGS & PLATFORM SETTINGS** | | | | | | |
| Read Feature Flags & Settings | ✅ | ✅ | ✅ | ✅ | ✅ | Publicly readable via RLS `using (true)`. |
| Modify Feature Flags | ❌ | ❌ | ❌ | 🚨 **VULNERABLE** | ✅ | **P2 Defect**: `/api/admin/settings` allows moderators to toggle global feature flags. |
| Modify Platform Settings (e.g. maintenance mode) | ❌ | ❌ | ❌ | 🚨 **VULNERABLE** | ✅ | **P2 Defect**: `/api/admin/settings` allows moderators to alter platform configuration settings. |
| **RESERVED USERNAMES TABLE** | | | | | | |
| Read Reserved Handles | ✅ | ✅ | ✅ | ✅ | ✅ | Publicly readable via RLS `using (true)`. |
| Add / Delete Reserved Handles | ❌ | ❌ | ❌ | 🚨 **VULNERABLE** | ✅ | **P2 Defect**: `/api/admin/settings` allows moderators to add/delete reserved handles. |
| **ANALYTICS EVENTS TABLE** | | | | | | |
| Ingest Telemetry Event (API Handler) | ✅ | ✅ | ✅ | ✅ | ✅ | Inserted via `/api/analytics` service-role client with profile check. |
| Ingest Telemetry Event (Direct RLS Insert) | ❌ | ❌ | ❌ | ❌ | ❌ | Client RLS insert policy dropped in `002_production_hardening.sql`. |
| Query Own Profile Telemetry | ❌ | ✅ | ❌ | ✅ | ✅ | Enforced via RLS `using (auth.uid() = profile_id)`. |
| Query Other Creators' Telemetry | ❌ | ❌ | ❌ | ❌ | ❌ | Denied by RLS. |
| Purge Telemetry Data (`purge_analytics`) | ❌ | ⚠️ **FAILING** | ❌ | ❌ | ❌ | **P2 Defect**: `/api/account/actions` attempts delete using user client, but RLS has NO DELETE policy. |
| **CUSTOM DOMAINS TABLE** | | | | | | |
| Resolve Custom Domain (RPC) | ✅ | ✅ | ✅ | ✅ | ✅ | Security Definer RPC returns username for verified active domains. |
| Claim Custom Domain (Insert) | ❌ | ✅ | ❌ | ❌ | ❌ | Permitted for owner via `auth.uid() = profile_id`. |
| Set `verified: true` (Domain Takeover) | ❌ | 🚨 **VULNERABLE** | ❌ | ❌ | ❌ | **P1 Defect**: RLS `with check (auth.uid() = profile_id)` allows creator to set `verified = true` without DNS check. |
| Delete Custom Domain | ❌ | ✅ | ❌ | ❌ | ❌ | Permitted for owner via RLS. |
| **STORAGE OBJECTS (`avatars` BUCKET)** | | | | | | |
| Read Public Avatar Object | ✅ | ✅ | ✅ | ✅ | ✅ | CDN public URL via Supabase Storage. |
| Upload Own Avatar (`avatars/${userId}.webp`) | ❌ | ✅ | ❌ | ❌ | ❌ | Handled via client storage SDK. |
| Overwrite Another User's Avatar | ❌ | ❌ | 🚨 **VULNERABLE** | ❌ | ❌ | **P1 Defect**: Zero storage RLS policies defined in migrations; bucket defaults permit cross-user overwrite. |
| Upload Malicious File (SVG/HTML/Exe) | ❌ | 🚨 **VULNERABLE** | 🚨 **VULNERABLE** | ❌ | ❌ | **P2 Defect**: Client downscales, but direct storage API calls can bypass client compression and upload arbitrary MIME types. |
| **ACCOUNT SECURITY & LIFECYCLE** | | | | | | |
| Change Password (without current password) | ❌ | 🚨 **VULNERABLE** | ❌ | ❌ | ❌ | **P2 Defect**: `/api/account/actions` updates password without checking current password. |
| Delete User Account (`auth.users`) | ❌ | ✅ | ❌ | 🚨 **VULNERABLE** | ✅ | Handled via service role in `/api/account/delete`; moderator can delete users in `/api/admin/users`. |
| Revoke Active Device Session | ❌ | 🚨 **COSMETIC** | ❌ | ❌ | ❌ | **P3 Defect**: Deletes entry from `socials._active_sessions` JSON array; does NOT invalidate Supabase JWT. |
| Sign Out Everywhere | ❌ | ✅ | ❌ | ❌ | ❌ | Invokes `supabase.auth.signOut({ scope: 'global' })`. |
