-- EstéticaOS — Fase 9: Financeiro
--
-- `financial_entries` já existe desde a Fase 6 (criada ali porque
-- "venda gera lançamento financeiro" era exigência da própria Fase 6).
-- Esta migração só adiciona o motor de comissão configurável.

alter table public.financial_entries
  drop constraint if exists financial_entries_payment_method_check;

alter table public.financial_entries
  add constraint financial_entries_payment_method_check check (
    payment_method is null or payment_method in (
      'cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'boleto', 'other'
    )
  );

-- ---------------------------------------------------------------------
-- commission_rules — taxa de comissão configurável por profissional
-- e/ou procedimento, calculada sobre o valor vendido ou o valor
-- recebido. `professional_id`/`procedure_id` nulos = regra geral
-- (fallback). Ao calcular, a regra mais específica vence; se nenhuma
-- regra bater, o relatório de comissões cai para o valor manual já
-- lançado em `budget_items.commission` (Fase 6).
-- ---------------------------------------------------------------------
create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid references auth.users(id) on delete cascade,
  procedure_id uuid references public.procedures(id) on delete cascade,
  basis text not null default 'sold' check (basis in ('sold', 'received')),
  rate_percent numeric(5, 2) not null check (rate_percent >= 0 and rate_percent <= 100),
  created_at timestamptz not null default now()
);

create index if not exists commission_rules_clinic_id_idx on public.commission_rules(clinic_id);

alter table public.commission_rules enable row level security;

create policy "clinic members can manage their commission rules"
on public.commission_rules for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
