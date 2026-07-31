import "server-only";
import { caktoCheckoutUrl, caktoWebhookSecret } from "@/lib/billing/cakto";
import type { BillingCycle } from "@/lib/plan/pricing";

/**
 * Configuração de cobrança.
 *
 * Nada aqui é obrigatório para o sistema subir. Sem as variáveis, o
 * checkout responde "ainda não configurado" e a tela diz isso com todas
 * as letras — o que não pode acontecer, em hipótese nenhuma, é a
 * assinatura ser marcada como paga sem confirmação do provedor.
 *
 * O provedor é a Cakto. O que ele exige mora em `cakto.ts`; aqui fica só
 * a pergunta que o resto do sistema faz: dá para cobrar ou não?
 */

/** Existe uma URL de checkout válida para este ciclo? */
export function isCheckoutConfigured(cycle: BillingCycle): boolean {
  return caktoCheckoutUrl(cycle) !== null;
}

/**
 * O webhook é o único caminho autorizado a marcar uma clínica como
 * pagante — e ele só funciona com o segredo configurado. Sem segredo, a
 * rota recusa tudo em vez de confiar em quem bater na porta.
 */
export function isBillingWebhookConfigured(): boolean {
  return caktoWebhookSecret() !== null;
}
