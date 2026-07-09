-- EstéticaOS — Fase 10: Estoque
--
-- PRD 12.14 modela lote/validade como campos diretos do produto (não
-- uma tabela de lotes separada) — o mesmo produto com dois lotes
-- diferentes vira duas linhas. Seguido à risca aqui, mantendo simples.
-- Baixa automática de estoque ao executar procedimento é fora do MVP
-- (PRD 10.13), então quantidade só muda por edição manual.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric(12, 2) not null default 0,
  unit text not null default 'un',
  batch text,
  expiration_date date,
  cost numeric(12, 2),
  price numeric(12, 2),
  min_stock numeric(12, 2) not null default 0,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create index if not exists products_clinic_id_idx on public.products(clinic_id);

alter table public.products enable row level security;

create policy "clinic members can manage their products"
on public.products for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));
