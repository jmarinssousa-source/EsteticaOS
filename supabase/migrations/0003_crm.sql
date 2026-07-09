-- EstéticaOS — Fase 3: CRM
-- Kanban de leads (colunas personalizáveis) + conversão em paciente.
--
-- "Pacientes" (tabela completa, com prontuário/anamnese/etc.) é escopo da
-- Fase 4. Aqui criamos apenas o cadastro mínimo (PRD 12.4) necessário para
-- a conversão lead -> paciente exigida pela Fase 3; a tela completa do
-- paciente é construída depois, lendo desta mesma tabela.

alter table public.clinics
  add column if not exists stale_lead_days integer not null default 3;

-- ---------------------------------------------------------------------
-- crm_stages — colunas do funil, personalizáveis por clínica.
-- ---------------------------------------------------------------------
create table if not exists public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

create index if not exists crm_stages_clinic_id_idx on public.crm_stages(clinic_id);

-- ---------------------------------------------------------------------
-- patients — cadastro mínimo (PRD 12.4). A tela completa do paciente
-- (abas, anamnese, prontuário...) é construída na Fase 4.
-- ---------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid,
  name text not null,
  phone text,
  email text,
  cpf text,
  birth_date date,
  gender text,
  address text,
  origin text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists patients_clinic_id_idx on public.patients(clinic_id);

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  stage_id uuid not null references public.crm_stages(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete set null,
  name text not null,
  phone text,
  email text,
  origin text not null check (
    origin in ('instagram', 'whatsapp', 'indicacao', 'trafego_pago', 'google', 'presencial', 'outro')
  ),
  assigned_to uuid references auth.users(id) on delete set null,
  next_action text,
  follow_up_date date,
  potential_value numeric(12, 2),
  notes text,
  status text not null default 'open' check (status in ('open', 'converted', 'lost')),
  created_at timestamptz not null default now(),
  last_moved_at timestamptz not null default now()
);

alter table public.patients
  add constraint patients_lead_id_fkey foreign key (lead_id) references public.leads(id) on delete set null;

create index if not exists leads_clinic_id_idx on public.leads(clinic_id);
create index if not exists leads_stage_id_idx on public.leads(stage_id);

-- ---------------------------------------------------------------------
-- lead_interactions — histórico manual de interações com o lead.
-- ---------------------------------------------------------------------
create table if not exists public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_interactions_lead_id_idx on public.lead_interactions(lead_id);

-- ---------------------------------------------------------------------
-- RLS — todas as tabelas ficam restritas à clínica do usuário. A
-- granularidade "ver x editar" (crm_view/crm_edit, patients_view/edit)
-- já é aplicada na camada de Server Actions (requirePermission), como
-- no restante do produto; RLS aqui garante apenas o isolamento
-- multi-clínica.
-- ---------------------------------------------------------------------
alter table public.crm_stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_interactions enable row level security;
alter table public.patients enable row level security;

create policy "clinic members can manage their crm stages"
on public.crm_stages for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their leads"
on public.leads for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their lead interactions"
on public.lead_interactions for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their patients"
on public.patients for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
