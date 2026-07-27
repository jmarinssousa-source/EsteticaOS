-- Cor de identificação do membro na agenda. Guarda a chave da paleta do
-- app (ex.: "blue", "rose" — ver src/lib/agenda/professional-colors.ts);
-- null = cor automática derivada do user_id, comportamento anterior.
alter table public.clinic_members
  add column if not exists color text;
