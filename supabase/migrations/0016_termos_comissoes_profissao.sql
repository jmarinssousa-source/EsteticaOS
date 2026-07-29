-- EstéticaOS — Termos múltiplos, comissão em valor fixo e profissão
--
-- Três mudanças pequenas e independentes, agrupadas por virem do mesmo
-- ciclo de ajustes:
--
-- 1. Termos de consentimento deixam de ser um por clínica. Cada clínica
--    pode ter vários (uso de imagem, post em rede social, procedimento
--    específico), e o paciente assina o que for pertinente — inclusive
--    de novo, se voltar depois de muito tempo.
-- 2. Regras de comissão passam a aceitar valor fixo por atendimento
--    (R$ 20 por paciente que comparece) e uma base de cálculo escrita
--    pela própria clínica, além das duas bases prontas.
-- 3. Cada membro da equipe pode registrar sua profissão (biomédico,
--    fisioterapeuta, nutricionista...), separada do papel de acesso.

-- ---------------------------------------------------------------------
-- 1. Termos de consentimento
-- ---------------------------------------------------------------------
alter table public.consent_templates
  add column if not exists name text not null default 'Termo de consentimento e autorização de imagem',
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- O termo era único por clínica; agora são vários.
alter table public.consent_templates
  drop constraint if exists consent_templates_clinic_id_key;

create index if not exists consent_templates_clinic_id_idx
  on public.consent_templates(clinic_id);

-- `access_token` permite ao paciente assinar pelo celular, por um link
-- enviado no WhatsApp — mesmo mecanismo já usado na anamnese pública.
-- Por isso a assinatura passa a ser opcional: o termo nasce pendente e
-- só ganha assinatura quando a pessoa assina (na clínica ou pelo link).
alter table public.consent_forms
  add column if not exists template_id uuid references public.consent_templates(id) on delete set null,
  add column if not exists title text,
  add column if not exists access_token text unique,
  add column if not exists status text not null default 'signed'
    check (status in ('pending', 'signed'));

alter table public.consent_forms
  alter column patient_signature drop not null;

-- `signed_at` só faz sentido depois de assinado.
alter table public.consent_forms
  alter column signed_at drop not null;

create index if not exists consent_forms_clinic_status_idx
  on public.consent_forms(clinic_id, status);

-- ---------------------------------------------------------------------
-- 2. Comissões: valor fixo e base de cálculo livre
-- ---------------------------------------------------------------------
alter table public.commission_rules
  add column if not exists fixed_amount numeric(12, 2),
  add column if not exists custom_basis_label text;

alter table public.commission_rules
  alter column rate_percent drop not null;

alter table public.commission_rules
  drop constraint if exists commission_rules_basis_check;

alter table public.commission_rules
  add constraint commission_rules_basis_check
  check (basis in ('sold', 'received', 'custom'));

-- Uma regra paga percentual OU valor fixo, nunca os dois nem nenhum.
alter table public.commission_rules
  drop constraint if exists commission_rules_amount_check;

alter table public.commission_rules
  add constraint commission_rules_amount_check
  check (
    (rate_percent is not null and fixed_amount is null)
    or (rate_percent is null and fixed_amount is not null)
  );

-- ---------------------------------------------------------------------
-- 3. Profissão do membro da equipe
-- ---------------------------------------------------------------------
alter table public.clinic_members
  add column if not exists profession text;
