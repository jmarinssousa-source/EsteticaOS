-- EstéticaOS — Fase 12: Detalhes de pagamento no fechamento de venda
--
-- Ao converter um orçamento aprovado em venda, a clínica agora informa a
-- forma de pagamento (podendo dividir entre várias) e, quando for cartão,
-- a quantidade de parcelas e o código de autorização da operadora. Cada
-- forma de pagamento vira seu próprio lançamento em `financial_entries`,
-- já com status "paid" — não precisamos de uma tabela de parcelas separada
-- porque o valor de cada lançamento já representa uma parcela/forma.

alter table public.financial_entries
  add column if not exists installments integer,
  add column if not exists card_authorization_code text;

alter table public.financial_entries
  drop constraint if exists financial_entries_installments_check;

alter table public.financial_entries
  add constraint financial_entries_installments_check check (
    installments is null or installments >= 1
  );
