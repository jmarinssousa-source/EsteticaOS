-- EstéticaOS — Fase 4: Pacientes e Anamnese
-- A tabela `patients` já existe (criada na Fase 3 para suportar a
-- conversão de lead em paciente do CRM). Aqui adicionamos os modelos de
-- anamnese editáveis e as respostas preenchidas pelo paciente.

-- ---------------------------------------------------------------------
-- anamnesis_templates — modelos de anamnese, editáveis por clínica.
-- ---------------------------------------------------------------------
create table if not exists public.anamnesis_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists anamnesis_templates_clinic_id_idx on public.anamnesis_templates(clinic_id);

-- ---------------------------------------------------------------------
-- anamnesis_questions — perguntas de cada modelo, com tipo de resposta.
-- ---------------------------------------------------------------------
create table if not exists public.anamnesis_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.anamnesis_templates(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  label text not null,
  type text not null check (
    type in ('short_text', 'long_text', 'yes_no', 'yes_no_unsure', 'single_choice', 'multiple_choice', 'date', 'number')
  ),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now()
);

create index if not exists anamnesis_questions_template_id_idx on public.anamnesis_questions(template_id);

-- ---------------------------------------------------------------------
-- anamnesis_responses — uma anamnese enviada/preenchida para um
-- paciente. `access_token` autoriza o preenchimento público (link
-- externo ou dispositivo da clínica) sem exigir login do paciente; a
-- rota pública valida a posse do token usando a service role, não RLS
-- para `anon` (mesmo padrão já usado para convites de usuário).
-- ---------------------------------------------------------------------
create table if not exists public.anamnesis_responses (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  template_id uuid not null references public.anamnesis_templates(id) on delete restrict,
  access_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'reviewed')),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists anamnesis_responses_patient_id_idx on public.anamnesis_responses(patient_id);
create index if not exists anamnesis_responses_clinic_id_idx on public.anamnesis_responses(clinic_id);

-- ---------------------------------------------------------------------
-- RLS — isolamento por clínica para o pessoal autenticado. A rota
-- pública de preenchimento nunca usa estas policies (usa a service
-- role), então não há policy para o papel `anon` aqui de propósito.
-- ---------------------------------------------------------------------
alter table public.anamnesis_templates enable row level security;
alter table public.anamnesis_questions enable row level security;
alter table public.anamnesis_responses enable row level security;

create policy "clinic members can manage their anamnesis templates"
on public.anamnesis_templates for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their anamnesis questions"
on public.anamnesis_questions for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their anamnesis responses"
on public.anamnesis_responses for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
