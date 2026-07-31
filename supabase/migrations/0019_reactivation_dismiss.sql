-- Tirar um paciente da lista de reativação sem excluir o cadastro.
--
-- Base importada de planilha costuma trazer gente que não é mais
-- paciente: mudou de cidade, faleceu, o telefone é de outra pessoa. Essa
-- gente aparecia todo dia na reativação e a única saída era apagar o
-- cadastro, perdendo o histórico junto. Agora dá para só tirar da lista.
--
-- A data é guardada, e não um simples "sim/não", porque serve de marco:
-- se a pessoa voltar a se consultar depois dessa data, ela volta sozinha
-- para a lista quando ficar inativa de novo. Tirar da lista é dizer
-- "hoje não me cobre sobre esta pessoa", não "esqueça esta pessoa para
-- sempre".
alter table public.patients
  add column if not exists reactivation_dismissed_at timestamptz;

comment on column public.patients.reactivation_dismissed_at is
  'Quando o paciente foi tirado da lista de reativação. Nulo = aparece normalmente.';
