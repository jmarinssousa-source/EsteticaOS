-- EstéticaOS — Fase 5: Agenda
--
-- `procedures` é criado aqui como um catálogo mínimo (apenas nome),
-- porque a própria Agenda já precisa vincular um procedimento ao
-- agendamento. A Fase 6 (Orçamentos e Vendas) estende esta mesma
-- tabela com preço/duração — não crie uma tabela nova lá.
--
-- Agendamentos exigem um paciente (não um lead). O fluxo adotado é:
-- converter o lead em paciente no CRM (um clique) e então agendar.

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists procedures_clinic_id_idx on public.procedures(clinic_id);

-- Datas/horários são armazenados como campos "wall clock" locais (sem
-- fuso), não timestamptz — a clínica opera em um único fuso horário e
-- isso evita qualquer ambiguidade de conversão entre navegador/servidor.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references auth.users(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (
    status in (
      'scheduled', 'confirmed', 'attended', 'no_show',
      'canceled_by_patient', 'canceled_by_clinic', 'rescheduled', 'done'
    )
  ),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_clinic_id_idx on public.appointments(clinic_id);
create index if not exists appointments_date_idx on public.appointments(clinic_id, appointment_date);
create index if not exists appointments_professional_idx on public.appointments(professional_id);

alter table public.procedures enable row level security;
alter table public.appointments enable row level security;

create policy "clinic members can manage their procedures"
on public.procedures for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their appointments"
on public.appointments for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
