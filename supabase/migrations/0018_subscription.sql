-- EstéticaOS: estados de assinatura e preço público
--
-- A 0017 criou o teste de 7 dias com três estados ('trial', 'active',
-- 'expired'), mas o teste vencido nunca bloqueou nada. Agora bloqueia, e
-- por isso o vocabulário de estados precisa dar conta do que acontece
-- entre "testando" e "pagando".
--
-- Estados, e o que cada um significa para o acesso:
--
--   trialing   testando os 7 dias. Acesso liberado até trial_ends_at.
--   active     assinatura em dia. Acesso liberado.
--   past_due   cobrança falhou, mas ainda em recuperação. Acesso
--              liberado de propósito: quem já paga não perde a agenda
--              porque o cartão venceu.
--   expired    teste acabou sem assinatura. Acesso bloqueado.
--   canceled   assinatura encerrada. Acesso bloqueado.
--
-- 'trial' (nome antigo) vira 'trialing'. O check antigo é derrubado
-- antes, senão o update esbarra nele.
--
-- Idempotente: pode rodar duas vezes sem estragar nada.

-- ---------------------------------------------------------------------
-- 1. Abre o check para caber o vocabulário novo e o antigo ao mesmo
--    tempo, para o passo 2 conseguir migrar as linhas.
-- ---------------------------------------------------------------------
alter table public.clinics
  drop constraint if exists clinics_plan_status_check;

-- ---------------------------------------------------------------------
-- 2. Renomeia o estado antigo.
-- ---------------------------------------------------------------------
update public.clinics
set plan_status = 'trialing'
where plan_status = 'trial';

-- Rede de segurança: clínica sem estado nenhum (coluna criada depois da
-- linha, backup antigo) entra como assinante, não como bloqueada. O
-- padrão seguro aqui é liberar, nunca trancar quem já usava.
update public.clinics
set plan_status = 'active'
where plan_status is null
   or plan_status not in ('trialing', 'active', 'past_due', 'expired', 'canceled');

-- ---------------------------------------------------------------------
-- 3. Fecha o check no vocabulário final.
-- ---------------------------------------------------------------------
alter table public.clinics
  add constraint clinics_plan_status_check
  check (plan_status in ('trialing', 'active', 'past_due', 'expired', 'canceled'));

alter table public.clinics
  alter column plan_status set default 'trialing';

-- ---------------------------------------------------------------------
-- 4. Colunas da assinatura.
--
-- Guardam o que o provedor de pagamento devolve. Ficam nulas até existir
-- cobrança de verdade: nada aqui é preenchido por otimismo, só por
-- confirmação do provedor via webhook.
-- ---------------------------------------------------------------------
alter table public.clinics
  add column if not exists billing_cycle text
    check (billing_cycle is null or billing_cycle in ('monthly', 'yearly')),
  -- Até quando a assinatura paga vale. NULL enquanto não houver pagamento
  -- confirmado.
  add column if not exists subscription_ends_at timestamptz,
  -- Identificadores do provedor, para conciliar webhook com clínica.
  add column if not exists billing_customer_id text,
  add column if not exists billing_subscription_id text;

create unique index if not exists clinics_billing_subscription_id_idx
  on public.clinics (billing_subscription_id)
  where billing_subscription_id is not null;

-- ---------------------------------------------------------------------
-- 5. Clínicas que já existiam continuam como estavam.
--
-- Sem data de fim de teste = nunca entrou no controle de teste = segue
-- como assinante. Idêntico ao que a 0017 já fazia, repetido aqui porque
-- esta migração pode rodar num banco que recebeu clínicas no meio.
-- ---------------------------------------------------------------------
update public.clinics
set plan_status = 'active'
where trial_ends_at is null
  and plan_status = 'trialing';

-- A escrita de plano e assinatura continua só pela service role, no
-- servidor. Nenhuma policy nova: clínica não estende o próprio teste nem
-- se marca como paga.
