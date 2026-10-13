-- TAMP authentication schema. Apply in the Supabase SQL editor or through the Supabase CLI.
-- The backend accesses these tables with the service-role key only; never expose that key to browsers.
create extension if not exists pgcrypto;

create table if not exists public.tamp_users (
  id text primary key,
  name text not null check (char_length(name) between 2 and 100),
  email text not null unique,
  phone text,
  country text,
  password_hash text not null,
  role text not null default 'student' check (role in ('student', 'admin', 'super')),
  session_version integer not null default 0 check (session_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tamp_users_created_at_idx on public.tamp_users (created_at desc);

create table if not exists public.tamp_pending_registrations (
  email text primary key,
  code_hash text not null,
  registration jsonb not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists tamp_pending_registrations_expiry_idx on public.tamp_pending_registrations (expires_at);

create table if not exists public.tamp_password_resets (
  token_hash text primary key,
  email text not null references public.tamp_users(email) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists tamp_password_resets_email_idx on public.tamp_password_resets (email);
create index if not exists tamp_password_resets_expiry_idx on public.tamp_password_resets (expires_at);

alter table public.tamp_users enable row level security;
alter table public.tamp_pending_registrations enable row level security;
alter table public.tamp_password_resets enable row level security;

-- No direct client policies are intentionally created. Server access must use the
-- Supabase service-role key in a private backend environment.
revoke all on table public.tamp_users from anon, authenticated;
revoke all on table public.tamp_pending_registrations from anon, authenticated;
revoke all on table public.tamp_password_resets from anon, authenticated;
