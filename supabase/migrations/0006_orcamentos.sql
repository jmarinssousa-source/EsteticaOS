-- EstéticaOS — Fase 6: Orçamentos e Vendas
--
-- `procedures` (criado na Fase 5 só com nome) ganha preço/duração aqui,
-- como planejado — não crie uma tabela nova de procedimentos.
--
-- `financial_entries` é criado de forma mínima porque a própria Fase 6
-- exige "venda gera lançamento financeiro" (10.8/10.12). A tela
-- completa de Financeiro é da Fase 9, que deve construir em cima desta
-- mesma tabela.
--
-- "Pacote" e "saldo de sessões" (10.9) ainda não existem — isso é
-- escopo da Fase 7. Por isso orçamentos desta fase só lidam com
-- procedimentos avulsos; a criação de sessões a partir de pacotes fica
-- para quando a Fase 7 introduzir as tabelas de pacote/sessão.

alter table public.procedures
  add column if not exists price numeric(12, 2),
  add column if not exists duration_minutes integer;

-- ---------------------------------------------------------------------
-- budgets (orçamentos)
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'open' check (
    status in ('open', 'sent', 'approved', 'rejected', 'paid', 'canceled')
  ),
  discount numeric(12, 2) not null default 0,
  total_value numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists budgets_clinic_id_idx on public.budgets(clinic_id);
create index if not exists budgets_patient_id_idx on public.budgets(patient_id);

-- ---------------------------------------------------------------------
-- budget_items
-- ---------------------------------------------------------------------
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  procedure_id uuid not null references public.procedures(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  professional_id uuid references auth.users(id) on delete set null,
  commission numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists budget_items_budget_id_idx on public.budget_items(budget_id);

-- ---------------------------------------------------------------------
-- sales (vendas) — criadas quando um orçamento aprovado é convertido.
-- ---------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  budget_id uuid not null unique references public.budgets(id) on delete restrict,
  total_value numeric(12, 2) not null,
  sale_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists sales_clinic_id_idx on public.sales(clinic_id);
create index if not exists sales_patient_id_idx on public.sales(patient_id);

-- ---------------------------------------------------------------------
-- financial_entries — mínimo necessário para "venda gera financeiro".
-- A Fase 9 constrói a tela de Financeiro completa sobre esta tabela.
-- ---------------------------------------------------------------------
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  type text not null check (type in ('revenue', 'expense')),
  description text not null,
  amount numeric(12, 2) not null,
  due_date date,
  payment_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'canceled')),
  payment_method text,
  commission_amount numeric(12, 2),
  nf_issued boolean not null default false,
  nf_number text,
  created_at timestamptz not null default now()
);

create index if not exists financial_entries_clinic_id_idx on public.financial_entries(clinic_id);
create index if not exists financial_entries_sale_id_idx on public.financial_entries(sale_id);

alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.sales enable row level security;
alter table public.financial_entries enable row level security;

create policy "clinic members can manage their budgets"
on public.budgets for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their budget items"
on public.budget_items for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their sales"
on public.sales for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their financial entries"
on public.financial_entries for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
