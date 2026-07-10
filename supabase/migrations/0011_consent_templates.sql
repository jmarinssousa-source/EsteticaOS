-- EstéticaOS — Fase 11: Termo de consentimento editável por clínica
--
-- Até aqui o texto do termo de consentimento/autorização de imagem era um
-- único texto fixo no código (src/lib/consent/text.ts), igual para todas as
-- clínicas. Esta migração dá a cada clínica seu próprio texto editável.
--
-- `consent_forms.content` grava uma cópia do texto vigente no momento da
-- assinatura (auditoria): se a clínica editar o modelo depois, assinaturas
-- antigas continuam mostrando o texto que a pessoa realmente assinou.

create table if not exists public.consent_templates (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  content text not null,
  updated_at timestamptz not null default now()
);

alter table public.consent_templates enable row level security;

create policy "clinic members can manage their consent template"
on public.consent_templates for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

alter table public.consent_forms
  add column if not exists content text;
