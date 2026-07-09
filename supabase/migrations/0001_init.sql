-- EstéticaOS — Fase 1: Fundação do SaaS
-- Clínicas, membros de clínica (usuários + perfis + permissões) e RLS
-- multi-tenant. Rode este arquivo no SQL Editor do Supabase (ou via
-- `supabase db push`, se estiver usando a CLI ligada ao projeto).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  phone text,
  email text,
  address text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- clinic_members — links auth.users to a clinic with a role and
-- per-user permission overrides. One active membership per user in
-- Phase 1; the schema allows a user to belong to more than one clinic
-- for future multiunidade support.
-- ---------------------------------------------------------------------
create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'reception', 'professional', 'finance')),
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create index if not exists clinic_members_user_id_idx on public.clinic_members(user_id);
create index if not exists clinic_members_clinic_id_idx on public.clinic_members(clinic_id);

-- ---------------------------------------------------------------------
-- current_clinic_member() — security-definer helper used inside RLS
-- policies. It bypasses RLS on clinic_members (function owner also
-- owns the table and RLS is not FORCE'd), which avoids infinite
-- recursion when clinic_members' own policies call back into this
-- function. Never expose this pattern for anything beyond read-only
-- policy checks.
-- ---------------------------------------------------------------------
create or replace function public.current_clinic_member()
returns table (clinic_id uuid, role text, status text)
language sql
security definer
set search_path = public
stable
as $$
  select clinic_id, role, status
  from public.clinic_members
  where user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- RLS: clinics
-- ---------------------------------------------------------------------
alter table public.clinics enable row level security;

create policy "clinic members can view their clinic"
on public.clinics for select
to authenticated
using (id = (select clinic_id from public.current_clinic_member()));

create policy "owner can update their clinic"
on public.clinics for update
to authenticated
using (
  id = (select clinic_id from public.current_clinic_member())
  and (select role from public.current_clinic_member()) = 'owner'
);

-- No insert/delete policy for authenticated users: clinic creation
-- happens server-side with the service role during signup, and
-- clinic deletion is not part of the MVP.

-- ---------------------------------------------------------------------
-- RLS: clinic_members
-- ---------------------------------------------------------------------
alter table public.clinic_members enable row level security;

create policy "members can view teammates in their clinic"
on public.clinic_members for select
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "owner can update teammates in their clinic"
on public.clinic_members for update
to authenticated
using (
  clinic_id = (select clinic_id from public.current_clinic_member())
  and (select role from public.current_clinic_member()) = 'owner'
);

-- No insert/delete policy for authenticated users: members are
-- created server-side with the service role (clinic signup, user
-- invites), which bypasses RLS by design.
