-- ── Migration: 001_initial_schema.sql ─────────────────────────────────────────
-- Baseline schema: Core tables for Link-in-Bio platform

create extension if not exists pgcrypto;

-- 1. Profiles Table
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
  motion_preference text not null default 'auto',
  socials jsonb not null default '{}'::jsonb,
  layout text not null default 'classic',
  onboarded boolean not null default false,
  is_verified boolean not null default false,
  account_status text not null default 'active',
  suspension_reason text,
  sensitive_content boolean not null default false,
  published_profile jsonb,
  published_blocks jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Blocks Table
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'link',
  position int not null default 0,
  is_visible boolean not null default true,
  is_disabled boolean not null default false,
  moderation_reason text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Platform Admins Table
create table if not exists platform_admins (
  user_id uuid references auth.users on delete cascade primary key,
  role text not null default 'admin' check (role in ('admin', 'superadmin', 'moderator')),
  created_at timestamptz not null default now()
);

-- 4. Reports Table
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reported_profile_id uuid references profiles(id) on delete cascade not null,
  reported_block_id uuid references blocks(id) on delete set null,
  reporter_email text,
  reason text not null,
  details text not null default '',
  status text not null default 'pending' check (status in ('pending', 'investigating', 'resolved', 'dismissed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  resolution_note text not null default '',
  resolved_at timestamptz,
  resolved_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

-- 5. Reserved Usernames Table
create table if not exists reserved_usernames (
  username text primary key,
  reason text not null default 'System reserved',
  created_at timestamptz not null default now()
);

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

-- 6. Admin Audit Logs Table
create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users on delete set null,
  admin_email text,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 7. Feature Flags Table
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

-- 8. Platform Settings Table
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

-- 9. Analytics Events Table
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  block_id uuid references blocks(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'click')),
  client_token text,
  referrer text,
  device_type text,
  country text,
  created_at timestamptz not null default now()
);

-- 10. Custom Domains Table
create table if not exists custom_domains (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null unique,
  domain text unique not null,
  username text not null,
  verification_token text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
