-- EstéticaOS — Conta desativada perde o acesso também no banco
--
-- ## O problema
--
-- Desativar alguém em Configurações > Usuários só escrevia
-- `clinic_members.status = 'inactive'`. O painel passava a barrar essa
-- pessoa (src/app/(dashboard)/layout.tsx), mas o banco não: a sessão do
-- Supabase continuava válida e todas as policies liberavam a linha
-- inteira da clínica, porque `current_clinic_member()` devolvia o
-- vínculo sem olhar o status.
--
-- Na prática isso significava que a recepcionista demitida hoje de manhã
-- ainda conseguia, do celular dela, ler a agenda, a lista de pacientes,
-- o prontuário e o financeiro da clínica pela API REST do Supabase — sem
-- passar pelo painel, que é onde o bloqueio morava. A chave `anon` é
-- pública (vai no navegador, por definição) e o token de sessão dela
-- continuava se renovando sozinho.
--
-- ## A correção
--
-- `current_clinic_member()` passa a exigir vínculo ativo. Como toda
-- policy de dado do sistema é escrita em cima dessa função, uma linha
-- fecha a porta em todas as tabelas de uma vez — inclusive no Storage
-- das fotos de prontuário.
--
-- A leitura da própria linha de vínculo fica de fora, por uma policy
-- nova: sem ela o sistema não teria como saber que a pessoa existe e
-- está desativada, e mostraria "conta sem clínica" no lugar de "conta
-- desativada".
--
-- ## Efeito colateral desejado
--
-- Membro inativo deixa de enxergar os colegas, a clínica e qualquer
-- dado. É exatamente o esperado — e é o que já acontecia na tela.

-- ---------------------------------------------------------------------
-- 1. O vínculo precisa estar ativo
-- ---------------------------------------------------------------------
create or replace function public.current_clinic_member()
returns table (clinic_id uuid, role text, status text)
language sql
security definer
set search_path = public
stable
as $$
  select clinic_id, role, status
  from public.clinic_members
  where user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 2. Todo mundo continua enxergando o próprio vínculo
--
-- Policies de RLS somam (OR), então esta convive com a de "ver os
-- colegas da minha clínica" sem afrouxá-la: o que ela libera é uma linha
-- só, a da própria pessoa.
-- ---------------------------------------------------------------------
drop policy if exists "members can view their own membership" on public.clinic_members;

create policy "members can view their own membership"
on public.clinic_members for select
to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Índice para a checagem de "último dono"
--
-- `blockIfLastOwner` (src/actions/users.ts) conta os donos ativos da
-- clínica a cada rebaixamento, desativação ou remoção. Sem índice isso é
-- varredura da tabela inteira.
-- ---------------------------------------------------------------------
create index if not exists clinic_members_clinic_role_status_idx
  on public.clinic_members(clinic_id, role, status);
