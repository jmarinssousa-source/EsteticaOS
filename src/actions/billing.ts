"use server";

import { getCurrentMember } from "@/lib/auth/session";
import { buildCaktoCheckoutUrl } from "@/lib/billing/cakto";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle } from "@/lib/plan/pricing";

/**
 * Início do checkout.
 *
 * Este é o único ponto por onde a assinatura é contratada, e tudo o que
 * ele faz é montar a URL do provedor com a clínica identificada e mandar
 * a pessoa para lá. A escolha entre Pix e cartão acontece na tela do
 * provedor, não aqui: o EstéticaOS não coleta cartão nem gera QR Code.
 *
 * O que este arquivo não faz, e não pode passar a fazer: marcar clínica
 * como paga, mudar `plan_status` para 'active' ou dizer que um pagamento
 * foi aprovado. Quem escreve assinatura é o webhook, conferindo o
 * segredo combinado, pela service role, e mais ninguém.
 */

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "not_configured"; cycle: BillingCycle }
  | { status: "error"; message: string };

export async function startCheckout(cycle: BillingCycle): Promise<CheckoutResult> {
  if (cycle !== "monthly" && cycle !== "yearly") {
    return { status: "error", message: "Escolha mensal ou anual para continuar." };
  }

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

  // O telefone da clínica pré-preenche o checkout. Falhar a busca não
  // impede nada: é conveniência, não requisito.
  const supabase = await createClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("phone, email")
    .eq("id", member.clinicId)
    .maybeSingle();

  const url = buildCaktoCheckoutUrl({
    cycle,
    clinicId: member.clinicId,
    // O e-mail de quem está contratando vale mais que o da clínica: é
    // ele que o webhook vai reconhecer se a referência não voltar.
    email: member.email || clinic?.email || null,
    name: member.fullName || null,
    phone: clinic?.phone ?? null,
  });

  if (!url) {
    return { status: "not_configured", cycle };
  }

  return { status: "redirect", url };
}
