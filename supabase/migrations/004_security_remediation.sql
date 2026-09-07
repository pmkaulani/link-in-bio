-- ── Migration: 004_security_remediation.sql ──────────────────────────────────
-- Production Security Hardening: P0 & P1 Vulnerability Remediations
-- Addresses SEC-03 (Domain Hijacking), SEC-04 (Profile Mass Assignment),
-- SEC-05 (Block Moderation Bypass), and SEC-06 (Storage Object RLS).

-- ── 1. Profile Security Triggers (SEC-04 Remediation) ────────────────────────
-- Disallow non-admin callers from modifying is_verified, account_status, or suspension_reason
create or replace function check_profile_update_integrity()
returns trigger as $$
begin
  if (auth.role() in ('authenticated', 'anon') or coalesce(current_setting('request.jwt.claim.role', true), '') in ('authenticated', 'anon')) then
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
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists enforce_profile_update_integrity on profiles;
create trigger enforce_profile_update_integrity
  before update on profiles
  for each row execute function check_profile_update_integrity();


-- ── 2. Blocks Moderation Security Trigger (SEC-05 Remediation) ───────────────
-- Prevent creators from clearing moderation reasons or re-enabling moderated/disabled blocks
create or replace function check_block_moderation_integrity()
returns trigger as $$
begin
  if (auth.role() in ('authenticated', 'anon') or coalesce(current_setting('request.jwt.claim.role', true), '') in ('authenticated', 'anon')) then
    if new.is_disabled is distinct from old.is_disabled and old.is_disabled = true then
      raise exception 'Security violation: Only administrators can re-enable moderated blocks.';
    end if;
    if new.moderation_reason is distinct from old.moderation_reason and old.moderation_reason is not null then
      raise exception 'Security violation: Only administrators can modify block moderation reasons.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists enforce_block_moderation_integrity on blocks;
create trigger enforce_block_moderation_integrity
  before update on blocks
  for each row execute function check_block_moderation_integrity();


-- ── 3. Custom Domains Hardened RLS & Verification Integrity (SEC-03 Remediation)
drop policy if exists "Owners can manage their own custom domain" on custom_domains;
drop policy if exists "Owners can read their own custom domain" on custom_domains;
drop policy if exists "Owners can insert unverified custom domain" on custom_domains;
drop policy if exists "Owners can delete their own custom domain" on custom_domains;

create policy "Owners can read their own custom domain"
  on custom_domains for select
  using (auth.uid() = profile_id);

-- Enforce that new domains claimed by users MUST have verified = false
create policy "Owners can insert unverified custom domain"
  on custom_domains for insert
  with check (auth.uid() = profile_id and verified = false);

create policy "Owners can delete their own custom domain"
  on custom_domains for delete
  using (auth.uid() = profile_id);

-- Prevent client roles from directly toggling verified to true
create or replace function check_domain_verification_integrity()
returns trigger as $$
begin
  if (auth.role() in ('authenticated', 'anon') or coalesce(current_setting('request.jwt.claim.role', true), '') in ('authenticated', 'anon')) then
    if new.verified is distinct from old.verified then
      raise exception 'Security violation: Only automated DNS verification can alter domain verified status.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists enforce_domain_verification_integrity on custom_domains;
create trigger enforce_domain_verification_integrity
  before update on custom_domains
  for each row execute function check_domain_verification_integrity();


-- ── 4. Supabase Storage: avatars Bucket ─────────────────────────────────────────
-- Note: The 'avatars' bucket has already been provisioned via the Supabase Storage API.
-- (storage.objects is owned by supabase_storage_admin, so storage policies are configured
-- via the Supabase Dashboard under Storage -> Policies, avoiding Postgres 42501 errors).


-- ── 5. Reserved Usernames Database Trigger (SEC-08 Remediation) ──────────────
-- Normalize and disallow claiming or changing to reserved system usernames
create or replace function check_reserved_username()
returns trigger as $$
declare
  clean_username text;
begin
  clean_username := lower(trim(replace(new.username, '@', '')));
  if exists (
    select 1 from reserved_usernames
    where lower(trim(username)) = clean_username
  ) then
    raise exception 'Security violation: Username "%" is reserved by the platform.', new.username;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists enforce_reserved_username on profiles;
create trigger enforce_reserved_username
  before insert or update of username on profiles
  for each row execute function check_reserved_username();


-- ── 6. Analytics Events Hardened Delete Policy (SEC-12 Remediation) ──────────
drop policy if exists "Owners can delete their own analytics" on analytics_events;
create policy "Owners can delete their own analytics"
  on analytics_events for delete
  using (auth.uid() = profile_id);

