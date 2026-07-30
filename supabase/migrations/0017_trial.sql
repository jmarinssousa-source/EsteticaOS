-- EstéticaOS — teste grátis de 7 dias
--
-- Três colunas em `clinics`:
--
--   trial_ends_at  quando o teste acaba. NULL = clínica sem controle de
--                  teste (as que já existiam antes desta migração), e
--                  NULL nunca expira — ninguém que já usava o sistema
--                  perde acesso por causa desta mudança.
--   plan_status    'trial' enquanto testa, 'active' depois de assinar.
--   never_expires  trava de segurança para contas internas/demonstração:
--                  ignora trial_ends_at, aconteça o que acontecer.

alter table public.clinics
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan_status text not null default 'trial'
    check (plan_status in ('trial', 'active', 'expired')),
  add column if not exists never_expires boolean not null default false;

-- Quem já estava dentro continua dentro: sem data de fim e marcada como
-- assinante, em vez de virar "teste vencido" no primeiro acesso.
update public.clinics
set plan_status = 'active'
where trial_ends_at is null;

-- Conta interna de testes: nunca expira, independente de data ou plano.
-- Para liberar outra conta depois, rode o mesmo update trocando o e-mail
-- (é o e-mail do dono da clínica, o mesmo usado para entrar no sistema).
update public.clinics
set never_expires = true, plan_status = 'active'
where id in (
  select clinic_id
  from public.clinic_members
  where role = 'owner'
    and lower(email) in ('jonatamarinssousa@gmail.com', 'jmarinssousa@gmail.com')
);

-- O dono precisa enxergar o próprio plano na tela; a policy de select de
-- clinics já cobre isso (membros veem a própria clínica), então nada de
-- policy nova aqui. A escrita de plano/trial continua só pela service
-- role, no servidor — clínica nenhuma estende o próprio teste.
