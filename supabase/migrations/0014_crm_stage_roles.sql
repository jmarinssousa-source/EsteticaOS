-- Papel da coluna no funil: arrastar um lead para cá muda o status dele.
-- Guardar o papel (em vez de comparar o nome) faz a automação continuar
-- valendo depois que a clínica renomear a coluna.
--   won  → converter em paciente (com confirmação na tela)
--   lost → marcar como perdido
--   null → coluna comum, só move o card
alter table public.crm_stages
  add column if not exists role text check (role in ('won', 'lost'));

-- Marca as colunas que já existem com os nomes padrão.
update public.crm_stages set role = 'won'
  where role is null and lower(name) in ('fechado', 'fechada', 'ganho', 'convertido');

update public.crm_stages set role = 'lost'
  where role is null and lower(name) in ('perdido', 'perdida');
