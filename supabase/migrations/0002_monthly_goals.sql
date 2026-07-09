-- EstéticaOS — Fase 2: Tela Hoje
-- Meta mensal por clínica. Os demais cards da Tela Hoje (leads, agenda,
-- orçamentos, sessões, financeiro) leem de tabelas que ainda não existem
-- e serão conectados conforme cada fase correspondente for construída.

create table if not exists public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  year_month char(7) not null, -- formato 'YYYY-MM'
  goal_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, year_month)
);

create index if not exists monthly_goals_clinic_id_idx on public.monthly_goals(clinic_id);

alter table public.monthly_goals enable row level security;

create policy "clinic members can view their monthly goals"
on public.monthly_goals for select
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "owner or manager can set monthly goals"
on public.monthly_goals for insert
to authenticated
with check (
  clinic_id = (select clinic_id from public.current_clinic_member())
  and (select role from public.current_clinic_member()) in ('owner', 'manager')
);

create policy "owner or manager can update monthly goals"
on public.monthly_goals for update
to authenticated
using (
  clinic_id = (select clinic_id from public.current_clinic_member())
  and (select role from public.current_clinic_member()) in ('owner', 'manager')
);
