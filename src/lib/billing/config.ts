import "server-only";
import type { PaymentMethod } from "@/lib/billing/methods";

/**
 * Configuração de cobrança.
 *
 * Nada aqui exige variável de ambiente para o sistema subir: em
 * desenvolvimento, e enquanto o provedor não estiver ligado, o checkout
 * responde "ainda não configurado" e a tela mostra isso com todas as
 * letras. O que não pode acontecer, em nenhuma hipótese, é a assinatura
 * ser marcada como paga sem confirmação do provedor.
 *
 * Tipo e rótulo de forma de pagamento moram em `methods.ts`, que a tela
 * pode importar. Aqui só entra o que lê variável de ambiente.
 */

/** Cartão recorrente sai pelo Stripe. Precisa da chave e dos dois preços. */
export function isCardCheckoutConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_ID &&
      process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_ID,
  );
}

/**
 * Pix ainda não tem provedor escolhido.
 *
 * Fica explicitamente `false` em vez de reaproveitar a configuração do
 * cartão: gerar um QR Code inventado seria pedir dinheiro para uma conta
 * que não existe.
 */
export function isPixCheckoutConfigured(): boolean {
  return Boolean(process.env.PIX_PROVIDER_KEY);
}

export function isCheckoutConfigured(method: PaymentMethod): boolean {
  return method === "card" ? isCardCheckoutConfigured() : isPixCheckoutConfigured();
}

/** O webhook é o único caminho que pode marcar uma clínica como paga. */
export function isBillingWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}
