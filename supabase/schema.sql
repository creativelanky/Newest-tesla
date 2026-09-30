-- SpaceX Invest — Supabase schema + Row Level Security
-- Paste this whole file into the Supabase SQL Editor (Dashboard → SQL Editor →
-- New query) and run it once. Safe to re-run: everything is IF NOT EXISTS /
-- OR REPLACE / DROP POLICY IF EXISTS.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Enums
-- ============================================================================
do $$ begin
  create type kyc_status as enum ('none', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_kind as enum ('deposit', 'withdrawal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type funding_method as enum ('bitcoin', 'paypal', 'bank');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tx_type as enum ('credit', 'debit', 'invest', 'sell');
exception when duplicate_object then null; end $$;

do $$ begin
  create type position_dir as enum ('long', 'short');
exception when duplicate_object then null; end $$;

do $$ begin
  create type option_kind as enum ('call', 'put');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_from as enum ('user', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type parcel_status as enum ('processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'on_hold', 'cancelled');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per authenticated person. id == auth.users.id (1:1 with Supabase Auth).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  country text not null default '',
  city text not null default '',
  role text not null default 'user',            -- 'user' | 'admin'
  status account_status not null default 'active',
  suspend_reason text not null default '',
  kyc_status kyc_status not null default 'none',
  kyc_note text not null default '',
  balance numeric(14, 2) not null default 0,
  deposit_total numeric(14, 2) not null default 0,
  profit numeric(14, 2) not null default 0,
  unread_for_user integer not null default 0,
  unread_for_admin integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  opportunity_id text not null,
  units numeric(18, 8) not null,
  invested numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  symbol text not null,
  dir position_dir not null,
  margin numeric(14, 2) not null,
  leverage integer not null,
  entry numeric(14, 4) not null,
  opened_at timestamptz not null default now()
);

create table if not exists options_positions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  kind option_kind not null,
  strike numeric(14, 2) not null,
  expiry_days integer not null,
  contracts integer not null,
  entry_premium numeric(10, 4) not null,
  opened_at timestamptz not null default now()
);

create table if not exists copy_allocations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  trader_id text not null,
  allocated numeric(14, 2) not null,
  started_at timestamptz not null default now()
);

create table if not exists ipo_reservations (
  profile_id uuid primary key references profiles (id) on delete cascade,
  reserved numeric(14, 2) not null default 0
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  type tx_type not null,
  label text not null,
  amount numeric(14, 2) not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists funding_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  kind request_kind not null,
  method funding_method not null,
  amount numeric(14, 2) not null,
  reference text not null default '',
  receipt_url text,
  destination jsonb,
  status request_status not null default 'pending',
  note text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists kyc_docs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  doc_type text not null,
  side text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  "from" message_from not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'system',
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists parcel_trackings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  tracking_code text not null unique,
  title text not null default 'Investment parcel',
  origin text not null default '',
  destination text not null default '',
  carrier text not null default '',
  status parcel_status not null default 'processing',
  current_location text not null default '',
  estimated_delivery date,
  note text not null default '',
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform_settings (
  id integer primary key default 1,
  btc_address text not null default '',
  btc_network text not null default 'Bitcoin (BTC) · Native SegWit',
  paypal_email text not null default '',
  bank_name text not null default '',
  bank_account_name text not null default '',
  bank_account_number text not null default '',
  bank_routing text not null default '',
  bank_swift text not null default '',
  min_deposit numeric(10, 2) not null default 100,
  support_name text not null default 'Support',
  constraint single_row check (id = 1)
);
insert into platform_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- Helper: is the current session an admin?
-- ============================================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table holdings enable row level security;
alter table positions enable row level security;
alter table options_positions enable row level security;
alter table copy_allocations enable row level security;
alter table ipo_reservations enable row level security;
alter table transactions enable row level security;
alter table funding_requests enable row level security;
alter table kyc_docs enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table parcel_trackings enable row level security;
alter table platform_settings enable row level security;

-- profiles: read/update your own row; admins read/update everyone's.
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());

-- Generic pattern for the per-user tables: owner or admin can read;
-- writes go through server-side routes using the service-role key, which
-- bypasses RLS entirely — so these tables have no insert/update policy for
-- regular users, only select.
do $$
declare t text;
begin
  foreach t in array array[
    'holdings', 'positions', 'options_positions', 'copy_allocations',
    'ipo_reservations', 'transactions', 'funding_requests', 'kyc_docs', 'messages',
    'parcel_trackings'
  ]
  loop
    execute format('drop policy if exists "%1$s_select_own_or_admin" on %1$s', t);
    execute format(
      'create policy "%1$s_select_own_or_admin" on %1$s for select using (profile_id = auth.uid() or is_admin())',
      t
    );
  end loop;
end $$;

-- platform_settings: everyone signed in can read (needed for the deposit
-- flow to show payment details); only admins can write.
drop policy if exists "settings_select_all" on platform_settings;
create policy "settings_select_all" on platform_settings for select
  using (auth.role() = 'authenticated');

drop policy if exists "settings_update_admin" on platform_settings;
create policy "settings_update_admin" on platform_settings for update
  using (is_admin());

drop policy if exists "notif_select_own" on notifications;
create policy "notif_select_own" on notifications for select
  using (profile_id = auth.uid() or is_admin());

drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own" on notifications for update
  using (profile_id = auth.uid());

create index if not exists notifications_profile_idx on notifications (profile_id, created_at desc);
create index if not exists parcel_trackings_profile_id_idx on parcel_trackings (profile_id);
create index if not exists parcel_trackings_tracking_code_idx on parcel_trackings (tracking_code);

-- ============================================================================
-- Auto-create a profile row when someone signs up via Supabase Auth
-- ============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, country, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', ''),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
