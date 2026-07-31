"use server";

import { getCurrentMember } from "@/lib/auth/session";
import { isCheckoutConfigured } from "@/lib/billing/config";
import type { PaymentMethod } from "@/lib/billing/methods";
import type { BillingCycle } from "@/lib/plan/pricing";

/**
 * Início do checkout.
 *
 * Este é o único ponto por onde a assinatura vai ser contratada, e hoje
 * ele ainda não contrata nada: enquanto o provedor não estiver ligado,
 * devolve um estado honesto para a tela mostrar.
 *
 * O que este arquivo não faz, e não deve passar a fazer sem webhook:
 * marcar clínica como paga, mudar `plan_status` para 'active', gerar
 * QR Code de Pix ou dizer que um pagamento foi aprovado. Quem escreve
 * assinatura é a confirmação do provedor, pela service role, e mais
 * ninguém.
 *
 * Quando o provedor entrar, muda só o corpo do `switch`: devolver
 * `{ status: "redirect", url }` com a URL da sessão de checkout.
 */

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "not_configured"; method: PaymentMethod; cycle: BillingCycle }
  | { status: "error"; message: string };

export async function startCheckout(
  cycle: BillingCycle,
  method: PaymentMethod,
): Promise<CheckoutResult> {
  const member = await getCurrentMember();

  if (!member) {
    return { status: "error", message: "Sua sessão expirou. Entre de novo para continuar." };
  }

  // Só quem responde pela clínica contrata. A checagem é aqui, no
  // servidor, e não só no botão: esconder o botão não é autorização.
  if (member.role !== "owner") {
    return {
      status: "error",
      message: "Só quem administra a clínica pode ativar o plano. Fale com a pessoa responsável.",
    };
  }

  if (!isCheckoutConfigured(method)) {
    return { status: "not_configured", method, cycle };
  }

  // Aqui entra a criação da sessão no provedor, escolhendo o preço pelo
  // `cycle`. Enquanto isso não existe, o retorno continua honesto: nada
  // de assinatura marcada como paga por otimismo.
  return { status: "not_configured", method, cycle };
}
