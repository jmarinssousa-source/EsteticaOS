-- EstéticaOS — Fase 8: Prontuário Visual
--
-- Primeira fase a usar Supabase Storage (fotos e mapas marcados pesam
-- muito mais que os textos/JSON armazenados até aqui). Bucket privado
-- único `patient-media`, organizado por caminho
-- `{clinic_id}/{patient_id}/...`; o isolamento multi-clínica é
-- garantido por RLS em `storage.objects` usando esse prefixo, e as
-- imagens são sempre servidas por signed URL (nunca públicas), para
-- atender ao requisito de proteção de fotos/prontuário (PRD 11.4).

create table if not exists public.patient_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_id uuid references auth.users(id) on delete set null,
  procedure_id uuid references public.procedures(id) on delete set null,
  record_date date not null default current_date,
  notes text,
  map_type text check (map_type in ('facial', 'body')),
  map_image_path text,
  complication text,
  created_at timestamptz not null default now()
);

create index if not exists patient_records_patient_id_idx on public.patient_records(patient_id);

create table if not exists public.patient_photos (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  record_id uuid references public.patient_records(id) on delete set null,
  storage_path text not null,
  label text,
  photo_type text not null default 'general' check (photo_type in ('before', 'after', 'general')),
  created_at timestamptz not null default now()
);

create index if not exists patient_photos_patient_id_idx on public.patient_photos(patient_id);
create index if not exists patient_photos_record_id_idx on public.patient_photos(record_id);

alter table public.patient_records enable row level security;
alter table public.patient_photos enable row level security;

create policy "clinic members can manage their patient records"
on public.patient_records for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

create policy "clinic members can manage their patient photos"
on public.patient_photos for all
to authenticated
using (clinic_id = (select clinic_id from public.current_clinic_member()))
with check (clinic_id = (select clinic_id from public.current_clinic_member()));

-- ---------------------------------------------------------------------
-- Storage: bucket privado + policies em storage.objects.
-- Caminho esperado: `{clinic_id}/{patient_id}/records/...` ou
-- `{clinic_id}/{patient_id}/photos/...`. A policy só confere o
-- primeiro segmento do caminho (clinic_id) contra a clínica do
-- usuário — suficiente para isolamento multi-clínica.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('patient-media', 'patient-media', false)
on conflict (id) do nothing;

create policy "clinic members can manage their patient media"
on storage.objects for all
to authenticated
using (
  bucket_id = 'patient-media'
  and (storage.foldername(name))[1] = (select clinic_id::text from public.current_clinic_member())
)
with check (
  bucket_id = 'patient-media'
  and (storage.foldername(name))[1] = (select clinic_id::text from public.current_clinic_member())
);
