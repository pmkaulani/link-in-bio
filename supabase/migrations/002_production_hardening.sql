-- ── Migration: 002_production_hardening.sql ──────────────────────────────────
-- Security Hardening: Restrictive RLS, publication states, domain RPC, analytics constraints

-- 1. Add publication_status to profiles
alter table profiles add column if not exists publication_status text not null default 'published' check (publication_status in ('draft', 'published', 'unlisted', 'suspended'));
alter table blocks add column if not exists is_disabled boolean not null default false;
alter table blocks add column if not exists moderation_reason text;

-- 2. Enable Row Level Security (RLS) across all tables
alter table profiles enable row level security;
alter table blocks enable row level security;
alter table platform_admins enable row level security;
alter table reports enable row level security;
alter table reserved_usernames enable row level security;
alter table admin_audit_logs enable row level security;
alter table feature_flags enable row level security;
alter table platform_settings enable row level security;
alter table analytics_events enable row level security;
alter table custom_domains enable row level security;

-- 3. Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles are selectable by owner or published" on profiles;
create policy "Profiles are selectable by owner or published"
  on profiles for select
  using (
    auth.uid() = id
    or (
      publication_status in ('published', 'unlisted')
      and account_status in ('active', 'warning')
    )
  );

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- 4. Blocks Policies
drop policy if exists "Public blocks are viewable by everyone" on blocks;
drop policy if exists "Blocks are selectable by owner or when publicly active" on blocks;
create policy "Blocks are selectable by owner or when publicly active"
  on blocks for select
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

drop policy if exists "Users can insert their own blocks" on blocks;
create policy "Users can insert their own blocks"
  on blocks for insert with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own blocks" on blocks;
create policy "Users can update their own blocks"
  on blocks for update using (auth.uid() = profile_id);

drop policy if exists "Users can delete their own blocks" on blocks;
create policy "Users can delete their own blocks"
  on blocks for delete using (auth.uid() = profile_id);

-- 5. Reports Policies
drop policy if exists "Anyone can submit a report" on reports;
create policy "Anyone can submit a report"
  on reports for insert with check (true);

-- 6. Platform Admins Policies
drop policy if exists "Users can check their own admin status" on platform_admins;
create policy "Users can check their own admin status"
  on platform_admins for select using (auth.uid() = user_id);

-- 7. Feature Flags, Platform Settings & Reserved Usernames Policies
drop policy if exists "Feature flags are readable by everyone" on feature_flags;
create policy "Feature flags are readable by everyone"
  on feature_flags for select using (true);

drop policy if exists "Platform settings are readable by everyone" on platform_settings;
create policy "Platform settings are readable by everyone"
  on platform_settings for select using (true);

drop policy if exists "Reserved usernames are readable by everyone" on reserved_usernames;
create policy "Reserved usernames are readable by everyone"
  on reserved_usernames for select using (true);

-- 8. Analytics Policies
drop policy if exists "Anyone can log an analytics event" on analytics_events;
drop policy if exists "Owners can read their own analytics" on analytics_events;
create policy "Owners can read their own analytics"
  on analytics_events for select using (auth.uid() = profile_id);

-- 9. Custom Domains Policies
drop policy if exists "Verified domains are resolvable by the routing layer" on custom_domains;
drop policy if exists "Owners can manage their own custom domain" on custom_domains;
create policy "Owners can manage their own custom domain"
  on custom_domains for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- 10. Secure Custom Domain Resolver Function (RPC)
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

grant execute on function resolve_custom_domain(text) to anon, authenticated, service_role;

-- 11. Analytics Block Ownership Trigger
create or replace function check_analytics_block_ownership()
returns trigger as $$
begin
  if new.block_id is not null then
    if not exists (
      select 1 from blocks
      where id = new.block_id
        and profile_id = new.profile_id
    ) then
      raise exception 'Integrity error: block_id does not belong to profile_id';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists analytics_block_ownership on analytics_events;
create trigger analytics_block_ownership
  before insert on analytics_events
  for each row execute function check_analytics_block_ownership();

-- 12. Helper Triggers & Indices
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create index if not exists profiles_username_idx on profiles (username);
create index if not exists profiles_pub_status_idx on profiles (publication_status, account_status);
create index if not exists blocks_profile_idx on blocks (profile_id, position);
create index if not exists blocks_visibility_idx on blocks (profile_id, is_visible, is_disabled);
create index if not exists reports_status_idx on reports (status, created_at desc);
create index if not exists reports_profile_idx on reports (reported_profile_id);
create index if not exists audit_logs_created_idx on admin_audit_logs (created_at desc);
create index if not exists analytics_events_profile_idx on analytics_events (profile_id, created_at);
create index if not exists analytics_events_block_idx on analytics_events (block_id);
create index if not exists custom_domains_domain_idx on custom_domains (domain);
