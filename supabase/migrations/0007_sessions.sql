-- EstéticaOS — Fase 7: Sessões e Assinaturas
--
-- Fecha o item deixado pendente pela Fase 6: orçamentos agora podem
-- vender pacotes (além de procedimentos avulsos), e a conversão para
-- venda cria o saldo automático de sessões.

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  total_sessions integer not null check (total_sessions > 0),
  price numeric(12, 2) not null default 0,
  validity_days integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists packages_clinic_id_idx on public.packages(clinic_id);

create table if not exists public.package_procedures (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete cascade
);

create index if not exists package_procedures_package_id_idx on public.package_procedures(package_id);

-- budget_items: um item agora referencia um procedimento avulso OU um
-- pacote, nunca os dois.
alter table public.budget_items
  alter column procedure_id drop not null,
  add column if not exists package_id uuid references public.packages(id) on delete restrict;

alter table public.budget_items
  drop constraint if exists budget_items_procedure_xor_package;

alter table public.budget_items
  add constraint budget_items_procedure_xor_package check (
    (procedure_id is not null and package_id is null) or
    (procedure_id is null and package_id is not null)
  );

-- ---------------------------------------------------------------------
-- package_balances — saldo de sessões de um pacote comprado por um
-- paciente. `total_sessions` é uma cópia do pacote no momento da venda
-- (se o pacote mudar depois, vendas antigas não são afetadas).
-- Sessões restantes = total_sessions - contagem de sessões 'done'
-- vinculadas a este saldo (calculado em consulta, não armazenado, para
-- evitar bugs de contador dessincronizado).
-- ---------------------------------------------------------------------
create table if not exists public.package_balances (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete restrict,
  sale_id uuid not null references public.sales(id) on delete cascade,
  total_sessions integer not null,
  expires_at date,
  created_at timestamptz not null default now()
);

create index if not exists package_balances_patient_id_idx on public.package_balances(patient_id);

-- ---------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references auth.users(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  package_balance_id uuid references public.package_balances(id) on delete set null,
  session_date date not null default current_date,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'done', 'canceled', 'pending_signature')
  ),
  notes text,
  patient_signature text,
  patient_signed_at timestamptz,
  professional_signature text,
  professional_signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sessions_clinic_id_idx on public.sessions(clinic_id);
create index if not exists sessions_patient_id_idx on public.sessions(patient_id);
create index if not exists sessions_package_balance_id_idx on public.sessions(package_balance_id);

-- ---------------------------------------------------------------------
-- consent_forms — termo de consentimento + autorização de imagem,
-- assinado pelo paciente. Um paciente pode assinar mais de uma vez ao
-- longo do tempo (histórico); a mais recente é a vigente.
-- ---------------------------------------------------------------------
create table if not exists public.consent_forms (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  patient_signature text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists consent_forms_patient_id_idx on public.consent_forms(patient_id);

alter table public.packages enable row level security;
alter table public.package_procedures enable row level security;
alter table public.package_balances enable row level security;
alter table public.sessions enable row level security;
alter table public.consent_forms enable row level security;

create policy "clinic members can manage their packages"
on public.packages for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their package procedures"
on public.package_procedures for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their package balances"
on public.package_balances for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their sessions"
on public.sessions for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their consent forms"
on public.consent_forms for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
