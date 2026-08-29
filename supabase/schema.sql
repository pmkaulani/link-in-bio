create extension if not exists pgcrypto;

-- ── 1. Profiles Table ────────────────────────────────────────────────────────
-- One row per user, linked to Supabase auth.users
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  theme text not null default 'growth',
  font_family text not null default 'inter',
  primary_color text not null default '#0E7A46',
  text_color text not null default '#111827',
  background_type text not null default 'solid',
  background_value text not null default '#F8FAFC',
  bg_effect text not null default 'none',
  button_style text not null default 'fill',
  button_radius integer not null default 24,
  cursor_glow text not null default 'subtle',
  motion_preference text not null default 'auto',    -- auto, reduced, normal, dynamic
  socials jsonb not null default '{}'::jsonb,
  layout text not null default 'classic',
  onboarded boolean not null default false,
  is_verified boolean not null default false,        -- real verification flag controlled by platform admins
  account_status text not null default 'active',     -- 'active' | 'warning' | 'suspended' | 'banned'
  publication_status text not null default 'published' check (publication_status in ('draft', 'published', 'unlisted', 'suspended')),
  suspension_reason text,
  sensitive_content boolean not null default false,  -- 18+ / sensitive content warning
  published_profile jsonb,
  published_blocks jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Column backfills if table already existed
alter table profiles add column if not exists font_family text not null default 'inter';
alter table profiles add column if not exists primary_color text not null default '#0E7A46';
alter table profiles add column if not exists text_color text not null default '#111827';
alter table profiles add column if not exists background_type text not null default 'solid';
alter table profiles add column if not exists background_value text not null default '#F8FAFC';
alter table profiles add column if not exists bg_effect text not null default 'none';
alter table profiles add column if not exists button_style text not null default 'fill';
alter table profiles add column if not exists button_radius integer not null default 24;
alter table profiles add column if not exists cursor_glow text not null default 'subtle';
alter table profiles add column if not exists motion_preference text not null default 'auto';
alter table profiles add column if not exists socials jsonb not null default '{}'::jsonb;
alter table profiles add column if not exists layout text not null default 'classic';
alter table profiles add column if not exists onboarded boolean not null default false;
alter table profiles add column if not exists is_verified boolean not null default false;
alter table profiles add column if not exists account_status text not null default 'active';
alter table profiles add column if not exists publication_status text not null default 'published';
alter table profiles add column if not exists suspension_reason text;
alter table profiles add column if not exists sensitive_content boolean not null default false;
alter table profiles add column if not exists published_profile jsonb;
alter table profiles add column if not exists published_blocks jsonb;
alter table profiles add column if not exists published_at timestamptz;
alter table profiles add column if not exists updated_at timestamptz not null default now();

-- ── 2. Blocks Table ──────────────────────────────────────────────────────────
-- Core building blocks for user link pages
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'link',          -- link, heading, text, image, video, grid, divider, spacer, callout, socials_bar
  position int not null default 0,
  is_visible boolean not null default true,
  is_disabled boolean not null default false, -- disabled by trust & safety moderation
  moderation_reason text,
  data jsonb not null default '{}'::jsonb,    -- payload: title, url, icon, animation, hover, schedule, etc.
  created_at timestamptz not null default now()
);

alter table blocks add column if not exists is_disabled boolean not null default false;
alter table blocks add column if not exists moderation_reason text;

-- ── 3. Platform Admins Table ─────────────────────────────────────────────────
-- Server-side verified platform admins for Trust & Safety and System operations
create table if not exists platform_admins (
  user_id uuid references auth.users on delete cascade primary key,
  role text not null default 'admin' check (role in ('admin', 'superadmin', 'moderator')),
  created_at timestamptz not null default now()
);

-- ── 4. Reports Table ─────────────────────────────────────────────────────────
-- Real moderation report intake and resolution lifecycle
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reported_profile_id uuid references profiles(id) on delete cascade not null,
  reported_block_id uuid references blocks(id) on delete set null,
  reporter_email text,
  reason text not null,                       -- Harmful, Spam/Phishing, Harassment, Copyright, Impersonation, Other
  details text not null default '',
  status text not null default 'pending' check (status in ('pending', 'investigating', 'resolved', 'dismissed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  resolution_note text not null default '',
  resolved_at timestamptz,
  resolved_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- ── 5. Reserved Usernames Table ──────────────────────────────────────────────
-- Blacklist & system usernames prevention
create table if not exists reserved_usernames (
  username text primary key,
  reason text not null default 'System reserved',
  created_at timestamptz not null default now()
);

-- Seed reserved usernames
insert into reserved_usernames (username, reason) values
  ('admin', 'Platform administrative route'),
  ('administrator', 'Platform administrative route'),
  ('superadmin', 'Platform administrative route'),
  ('support', 'Official support channel'),
  ('help', 'Official help and documentation'),
  ('security', 'Trust & Safety team'),
  ('official', 'Official platform handle'),
  ('linkinbio', 'Brand handle'),
  ('linkinbio_support', 'Brand support handle'),
  ('api', 'System API reserved namespace'),
  ('auth', 'System authentication route'),
  ('billing', 'Billing namespace'),
  ('root', 'System root namespace'),
  ('verify', 'Verification service namespace'),
  ('verified', 'Verification service namespace')
on conflict (username) do nothing;

-- ── 6. Admin Audit Logs Table ────────────────────────────────────────────────
create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users on delete set null,
  admin_email text,
  action text not null,                       -- e.g. 'suspend_user', 'disable_link', 'resolve_report', 'verify_user'
  target_type text not null,                  -- 'user', 'profile', 'block', 'report', 'setting', 'flag'
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── 7. Feature Flags Table ───────────────────────────────────────────────────
create table if not exists feature_flags (
  name text primary key,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  description text not null default '',
  updated_at timestamptz not null default now()
);

insert into feature_flags (name, enabled, description, config) values
  ('user_registration', true, 'Allow new accounts to sign up', '{}'::jsonb),
  ('public_pages', true, 'Serve live visitor traffic to user profiles', '{}'::jsonb),
  ('advanced_analytics', true, 'Track unique visitors and referrer channels', '{}'::jsonb),
  ('custom_domains', false, 'Custom domain mapping and routing (V2 feature)', '{}'::jsonb),
  ('experimental_themes', true, 'Enable dynamic and experimental ReactBits FX', '{}'::jsonb),
  ('sensitive_content_filter', true, 'Enforce sensitive content warnings', '{}'::jsonb)
on conflict (name) do nothing;

-- ── 8. Platform Settings Table ───────────────────────────────────────────────
create table if not exists platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into platform_settings (key, value) values
  ('max_blocks_per_user', '50'::jsonb),
  ('default_theme', '"growth"'::jsonb),
  ('default_font', '"inter"'::jsonb),
  ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

-- ── 9. Analytics Events Table ────────────────────────────────────────────────
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  block_id uuid references blocks(id) on delete cascade,  -- null for page views
  event_type text not null check (event_type in ('view', 'click')),
  client_token text,
  referrer text,                              -- e.g. 'instagram', 'tiktok', 'whatsapp', 'direct', 'google', 'twitter'
  device_type text,                           -- 'mobile', 'desktop', 'tablet'
  country text,
  created_at timestamptz not null default now()
);

alter table analytics_events add column if not exists client_token text;
alter table analytics_events add column if not exists referrer text;
alter table analytics_events add column if not exists device_type text;
alter table analytics_events add column if not exists country text;

-- ── 10. Custom Domains Table ─────────────────────────────────────────────────
create table if not exists custom_domains (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null unique,
  domain text unique not null,
  username text not null,
  verification_token text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Row Level Security (RLS) ─────────────────────────────────────────────────
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

-- ── Profiles Policies ────────────────────────────────────────────────────────
-- Authenticated owner can view their own profile regardless of state.
-- Public visitors can only select published or unlisted profiles that are active/warning.
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

-- ── Blocks Policies ──────────────────────────────────────────────────────────
-- Authenticated owners can select all their own blocks (including hidden and drafts).
-- Anonymous/public visitors can ONLY select blocks that are marked visible (is_visible = true),
-- not moderated (is_disabled = false), and belong to an active published profile.
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

-- ── Reports Policies ─────────────────────────────────────────────────────────
drop policy if exists "Anyone can submit a report" on reports;
create policy "Anyone can submit a report"
  on reports for insert with check (true);

-- ── Platform Admins Policies ─────────────────────────────────────────────────
drop policy if exists "Users can check their own admin status" on platform_admins;
create policy "Users can check their own admin status"
  on platform_admins for select using (auth.uid() = user_id);

-- ── Feature Flags Policies ───────────────────────────────────────────────────
drop policy if exists "Feature flags are readable by everyone" on feature_flags;
create policy "Feature flags are readable by everyone"
  on feature_flags for select using (true);

-- ── Platform Settings Policies ───────────────────────────────────────────────
drop policy if exists "Platform settings are readable by everyone" on platform_settings;
create policy "Platform settings are readable by everyone"
  on platform_settings for select using (true);

-- ── Reserved Usernames Policies ──────────────────────────────────────────────
drop policy if exists "Reserved usernames are readable by everyone" on reserved_usernames;
create policy "Reserved usernames are readable by everyone"
  on reserved_usernames for select using (true);

-- ── Analytics Policies ───────────────────────────────────────────────────────
-- Direct table insertion from public anon clients is disabled.
-- Analytics ingestion is handled securely via the /api/analytics server route with
-- validation, rate limiting, and block ownership verification using the service role.
drop policy if exists "Owners can read their own analytics" on analytics_events;
create policy "Owners can read their own analytics"
  on analytics_events for select using (auth.uid() = profile_id);

-- ── Custom Domains Policies ──────────────────────────────────────────────────
-- Only the owner can select and manage their own domain row.
-- Verification tokens are NEVER exposed to anonymous public select.
drop policy if exists "Owners can manage their own custom domain" on custom_domains;
create policy "Owners can manage their own custom domain"
  on custom_domains for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);


-- ── Secure Custom Domain Resolver Function (RPC) ─────────────────────────────
-- Returns only the associated username for verified domains on active profiles.
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

-- Grant execution to anon and authenticated roles
grant execute on function resolve_custom_domain(text) to anon, authenticated, service_role;

-- ── Analytics Block-Profile Relationship Enforcement Trigger ─────────────────
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

-- ── Helper triggers and indices ──────────────────────────────────────────────
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

-- Indices for fast querying
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
