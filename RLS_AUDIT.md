# Supabase Row Level Security (RLS) & RPC Security Audit — Link-in-Bio

**Date**: September 7, 2026  
**Auditor**: Senior Application Security Engineer & Penetration Tester  
**Repository**: `link-in-bio` (`supabase/migrations/001_initial_schema.sql`, `002_production_hardening.sql`, `003_restore_published_profile_status.sql`)

---

## 1. Executive Summary: RLS Posture

All 10 public tables have Row Level Security enabled (`alter table ... enable row level security`). However, several policies suffer from:
1. **Lack of Column-Level Restrictions on Updates**: Postgres RLS evaluates `USING` and `WITH CHECK` row-level predicates. It does NOT automatically restrict which columns can be updated. This allows authenticated users to mutate trust, verification, and moderation fields.
2. **Missing Policies for Specific Commands**: For example, `analytics_events` has no `DELETE` policy, causing valid account purge requests to fail under RLS.
3. **Unrestricted Anonymous Inserts**: `reports` permits unmetered direct database inserts by anonymous clients, circumventing API rate limiting.
4. **Complete Absence of Storage RLS**: Supabase storage bucket `avatars` has no bucket configuration or `storage.objects` policies in migration scripts.

---

## 2. Detailed Table-by-Table RLS Audit

---

### Table 1: `public.profiles`

#### Current Configuration
- **RLS Enabled**: Yes (`alter table profiles enable row level security;`)
- **Policies in `002_production_hardening.sql`**:
  - `SELECT`: `"Profiles are selectable by owner or published"`
    ```sql
    using (
      auth.uid() = id
      or (
        publication_status in ('published', 'unlisted')
        and account_status in ('active', 'warning')
      )
    );
    ```
  - `INSERT`: `"Users can insert their own profile"`
    ```sql
    with check (auth.uid() = id);
    ```
  - `UPDATE`: `"Users can update their own profile"`
    ```sql
    using (auth.uid() = id);
    ```
  - `DELETE`: None defined for standard client roles.

#### Vulnerability & Flaw Analysis
1. **Mass Assignment / Privilege Escalation via Column Mutation**:
   - The `UPDATE` policy checks only `auth.uid() = id`.
   - Any authenticated user can issue:
     ```javascript
     supabase.from('profiles').update({
       is_verified: true,
       account_status: 'active',
       suspension_reason: null
     }).eq('id', user.id);
     ```
   - **Impact**: Any user can grant themselves a verified creator badge and un-suspend their own account after being penalized by Trust & Safety.
2. **Handle Hijacking of Reserved Names during Registration**:
   - The `INSERT` policy allows any `username` string. A newly registered user can insert `username: 'admin'` or `'support'` directly if it is not already taken in `profiles`, because the table lacks a foreign key constraint or trigger referencing `reserved_usernames`.

#### Hardened Policy Remediation
```sql
-- 1. Restrict profile updates: Disallow users from altering verified status, account status, or suspension reason
create or replace function check_profile_update_integrity()
returns trigger as $$
begin
  -- If executed by standard user (authenticated client role)
  if current_user in ('authenticated', 'anon') then
    if new.is_verified is distinct from old.is_verified then
      raise exception 'Security violation: Only administrators can modify verification status.';
    end if;
    if new.account_status is distinct from old.account_status then
      raise exception 'Security violation: Only administrators can modify account moderation status.';
    end if;
    if new.suspension_reason is distinct from old.suspension_reason then
      raise exception 'Security violation: Only administrators can modify suspension reason.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_profile_update_integrity on profiles;
create trigger enforce_profile_update_integrity
  before update on profiles
  for each row execute function check_profile_update_integrity();

-- 2. Prevent claiming reserved usernames via profile insert/update
create or replace function check_reserved_username()
returns trigger as $$
begin
  if exists (
    select 1 from reserved_usernames
    where lower(username) = lower(trim(new.username))
  ) then
    raise exception 'Username "%" is reserved by the platform.', new.username;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_reserved_username on profiles;
create trigger enforce_reserved_username
  before insert or update of username on profiles
  for each row execute function check_reserved_username();
```

---

### Table 2: `public.blocks`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies in `002_production_hardening.sql`**:
  - `SELECT`: `"Blocks are selectable by owner or when publicly active"`
    ```sql
    using (
      auth.uid() = profile_id
      or (
        is_visible = true
        and is_disabled = false
        and exists (
          select 1 from profiles p
          where p.id = blocks.profile_id
            and p.publication_status in ('published', 'unlisted')
            and p.account_status in ('active', 'warning')
        )
      )
    );
    ```
  - `INSERT`: `"Users can insert their own blocks"`: `with check (auth.uid() = profile_id)`
  - `UPDATE`: `"Users can update their own blocks"`: `using (auth.uid() = profile_id)`
  - `DELETE`: `"Users can delete their own blocks"`: `using (auth.uid() = profile_id)`

#### Vulnerability & Flaw Analysis
1. **Moderation Bypass / Self-Unbanning of Flagged Links**:
   - `blocks` includes columns `is_disabled boolean` and `moderation_reason text`.
   - When Trust & Safety disables a phishing or malware block, `is_disabled` is set to `true`.
   - Because the user has full `UPDATE` permission under `auth.uid() = profile_id`, the creator can execute:
     ```javascript
     supabase.from('blocks').update({ is_disabled: false, moderation_reason: null }).eq('id', blockId);
     ```
   - **Impact**: Violating links disabled by moderators are immediately re-enabled by the offending creator.

#### Hardened Policy Remediation
```sql
create or replace function check_block_moderation_integrity()
returns trigger as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.is_disabled is distinct from old.is_disabled then
      raise exception 'Security violation: Only administrators can modify block moderation state.';
    end if;
    if new.moderation_reason is distinct from old.moderation_reason then
      raise exception 'Security violation: Only administrators can modify moderation reasons.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_block_moderation_integrity on blocks;
create trigger enforce_block_moderation_integrity
  before update on blocks
  for each row execute function check_block_moderation_integrity();
```

---

### Table 3: `public.platform_admins`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies in `002_production_hardening.sql`**:
  - `SELECT`: `"Users can check their own admin status"`
    ```sql
    using (auth.uid() = user_id);
    ```
  - `INSERT` / `UPDATE` / `DELETE`: None (Service role only).

#### Vulnerability & Flaw Analysis
- The Postgres RLS policy on this table is properly locked down for direct client queries.
- **Vulnerability Origin**: In `lib/adminAuth.js` (lines 68-75), the application layer uses `createAdminClient()` (service role!) to automatically upsert any user matching `pmkaulani@gmail.com` or `NEXT_PUBLIC_ADMIN_EMAIL` into `platform_admins` with `role: 'superadmin'`. This bypasses the DB defense at the application layer.

---

### Table 4: `public.reports`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies in `002_production_hardening.sql`**:
  - `INSERT`: `"Anyone can submit a report"`: `with check (true);`
  - `SELECT` / `UPDATE` / `DELETE`: None.

#### Vulnerability & Flaw Analysis
1. **Unmetered Direct Database Spam**:
   - Although `/api/reports/submit` implements an in-memory rate limiter (5 req/min), anonymous visitors have access to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Any client can call `supabase.from('reports').insert({...})` in a tight loop directly against PostgREST, inserting hundreds of thousands of junk reports.
   - **Impact**: Denial of Service (DoS) of the Trust & Safety review queue and database storage bloat.

#### Hardened Policy Remediation
- Revoke direct `INSERT` on `reports` for the `anon` role. Direct all report submissions exclusively through `/api/reports/submit` using the service-role client, or restrict anonymous inserts via a PostgreSQL rate-limiting function.
```sql
drop policy if exists "Anyone can submit a report" on reports;
-- Client cannot directly insert; all reports must route through validated API
revoke insert on reports from anon, authenticated;
```

---

### Table 5: `public.reserved_usernames`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies**:
  - `SELECT`: `"Reserved usernames are readable by everyone"`: `using (true);`
  - Mutations: Denied for client roles.

#### Assessment
- RLS policy is secure. Table is read-only for clients. (See Table 1 for missing trigger enforcement on `profiles`).

---

### Table 6: `public.admin_audit_logs`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies**: None defined for client roles. All access is performed via `createAdminClient()` using the service role key.

#### Assessment
- RLS is secure. Direct client reads and writes are blocked. Logs are append-only.

---

### Table 7: `public.feature_flags` & Table 8: `public.platform_settings`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies**:
  - `SELECT`: `using (true);` (Publicly readable).
  - Mutations: Denied for client roles.

#### Assessment
- RLS policies are secure. Client mutations are blocked. (See Application Layer finding regarding moderator access in `/api/admin/settings`).

---

### Table 9: `public.analytics_events`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies in `002_production_hardening.sql`**:
  - `SELECT`: `"Owners can read their own analytics"`: `using (auth.uid() = profile_id);`
  - `INSERT`: Dropped in migration 002.
  - `DELETE`: None defined.

#### Vulnerability & Functional Defect Analysis
1. **Broken Data Privacy Purge (`purge_analytics`)**:
   - In `app/api/account/actions/route.js`, line 100:
     ```javascript
     await supabase.from('analytics_events').delete().eq('profile_id', userId);
     ```
   - Because `supabase` is a request-scoped client bound to the user's JWT, and `analytics_events` has NO `DELETE` policy, PostgreSQL rejects the query under RLS.
   - **Impact**: Creators attempting to purge their view/click history are falsely informed that data was purged (`{ success: true }`), while all records remain in the database.

#### Hardened Policy Remediation
```sql
drop policy if exists "Owners can delete their own analytics" on analytics_events;
create policy "Owners can delete their own analytics"
  on analytics_events for delete
  using (auth.uid() = profile_id);
```

---

### Table 10: `public.custom_domains`

#### Current Configuration
- **RLS Enabled**: Yes
- **Policies in `002_production_hardening.sql`**:
  - `ALL`: `"Owners can manage their own custom domain"`
    ```sql
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);
    ```

#### Vulnerability & Flaw Analysis
1. **Arbitrary Custom Domain Takeover / Phishing Hijacking**:
   - The policy grants `ALL` (select, insert, update, delete) with check `auth.uid() = profile_id`.
   - It DOES NOT validate the `verified` column.
   - Any authenticated user can issue:
     ```javascript
     supabase.from('custom_domains').insert({
       profile_id: user.id,
       domain: 'target-brand.com',
       username: 'attacker',
       verification_token: 'bypass',
       verified: true
     });
     ```
   - When traffic arrives at `target-brand.com`, `middleware.js` queries `resolve_custom_domain('target-brand.com')`, which returns `attacker`.
   - **Impact**: Critical domain hijacking and phishing without DNS verification.

#### Hardened Policy Remediation
```sql
drop policy if exists "Owners can manage their own custom domain" on custom_domains;

-- Allow owners to read and delete their domain records
create policy "Owners can read their own custom domain"
  on custom_domains for select
  using (auth.uid() = profile_id);

create policy "Owners can insert unverified custom domain"
  on custom_domains for insert
  with check (auth.uid() = profile_id and verified = false);

create policy "Owners can delete their own custom domain"
  on custom_domains for delete
  using (auth.uid() = profile_id);

-- verified status can strictly only be updated via background verification RPC / service role
create or replace function check_domain_verification_integrity()
returns trigger as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.verified is distinct from old.verified then
      raise exception 'Security violation: Only automated DNS verification can set verified status.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_domain_verification_integrity on custom_domains;
create trigger enforce_domain_verification_integrity
  before update on custom_domains
  for each row execute function check_domain_verification_integrity();
```

---

### 3. Supabase Storage: `avatars` Bucket RLS Audit

#### Current Configuration
- Missing from migrations. Zero policies defined for `storage.objects`.

#### Vulnerability & Flaw Analysis
1. **Unrestricted Object Overwrites**:
   - If the `avatars` bucket is public without object-level owner policies, any authenticated user can overwrite `avatars/${targetUserId}.webp` belonging to another creator.
2. **Arbitrary File Uploads (Cross-Site Scripting via SVG / HTML)**:
   - Without storage MIME-type and size constraints, a client can bypass the browser compression script and upload malicious `.svg` files containing embedded JavaScript or `.html` phishing pages.

#### Hardened Storage Policy Remediation
```sql
-- Insert avatars bucket if missing
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Public read access to avatars
create policy "Public Access to Avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Creators can only upload to their own avatar path: avatars/${userId}.webp
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.filename(name)) = (auth.uid()::text || '.webp')
  );

-- Creators can update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.filename(name)) = (auth.uid()::text || '.webp')
  );

-- Creators can delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.filename(name)) = (auth.uid()::text || '.webp')
  );
```

---

### 4. RPC Function Audit: `resolve_custom_domain`

#### Definition in `002_production_hardening.sql`:
```sql
create or replace function resolve_custom_domain(p_domain text)
returns table (username text)
language plpgsql
security definer
as $$
begin
  return query
  select cd.username
  from custom_domains cd
  join profiles p on p.id = cd.profile_id
  where lower(cd.domain) = lower(trim(p_domain))
    and cd.verified = true
    and p.account_status in ('active', 'warning')
    and p.publication_status in ('published', 'unlisted')
  limit 1;
end;
$$;
```

#### Assessment
- Properly declared `SECURITY DEFINER` with scoped output (`returns table (username text)`).
- Does NOT leak private columns (verification tokens, user IDs, emails).
- Joins against `profiles` to ensure suspended creators are not resolved.
- **Finding**: While the RPC itself is safe, its integrity depends entirely on fixing the `custom_domains` RLS policy so that users cannot insert rows with `verified = true`.
