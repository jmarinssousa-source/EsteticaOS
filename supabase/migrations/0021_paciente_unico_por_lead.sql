-- EstéticaOS — Um lead gera no máximo um paciente
--
-- ## Por que esta migração existe
--
-- Converter lead em paciente são duas escritas — criar o paciente e
-- apontar o lead para ele — e não há transação entre as duas. Entre
-- "conferi que ainda não existe paciente" e "criei o paciente" cabe outra
-- requisição fazendo exatamente o mesmo.
--
-- Não é hipótese de laboratório. Os dois caminhos que convertem (o botão
-- "Converter em paciente" e arrastar o card para a coluna Fechado) ficam
-- na mesma tela, e o quadro do CRM é usado no celular, onde toque duplo
-- acidental é rotina. Duas requisições quase simultâneas criavam dois
-- cadastros do mesmo paciente, e o segundo ficava órfão: sem vínculo com
-- o lead, aparecendo na lista de pacientes, disponível para receber
-- agendamento e prontuário. Separar depois é trabalho manual e arriscado.
--
-- `src/lib/crm/transition.ts` já procura um paciente existente antes de
-- criar, o que fecha a janela na maioria dos casos. Este índice fecha o
-- que sobra: com ele, a segunda inserção é recusada pelo banco, e a
-- aplicação trata a recusa (código 23505) reaproveitando o cadastro que
-- ganhou a corrida. É a diferença entre "quase nunca duplica" e "não
-- duplica".
--
-- ## Por que parcial
--
-- A maioria dos pacientes é cadastrada direto, sem passar pelo CRM, e
-- fica com `lead_id` nulo. Um índice único comum aceitaria vários nulos
-- no Postgres, mas o `where` deixa a intenção explícita e mantém o índice
-- pequeno — ele só indexa quem veio do funil.
--
-- ## Se falhar ao rodar
--
-- O bloco abaixo recusa a migração, com a lista dos leads envolvidos,
-- caso já existam duplicatas criadas pelo comportamento antigo. Isso é
-- proposital: apagar paciente automaticamente é exatamente o que não se
-- pode fazer aqui — pode haver agendamento, prontuário ou pagamento
-- pendurado no cadastro "errado". A limpeza é decisão de quem conhece a
-- clínica. Depois de resolver os casos apontados, rode este arquivo de
-- novo.

do $$
declare
  duplicados text;
begin
  select string_agg(lead_id::text, ', ')
  into duplicados
  from (
    select lead_id
    from public.patients
    where lead_id is not null
    group by lead_id
    having count(*) > 1
  ) as t;

  if duplicados is not null then
    raise exception
      'Existem leads com mais de um paciente. Resolva manualmente antes de criar o índice. Leads afetados: %',
      duplicados;
  end if;
end $$;

create unique index if not exists patients_lead_id_unique
  on public.patients(lead_id)
  where lead_id is not null;
