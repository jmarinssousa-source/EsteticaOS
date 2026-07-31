/**
 * Formas de pagamento, na parte que a tela precisa saber.
 *
 * Fica separado de `config.ts` de propósito: aquele arquivo é
 * `server-only`, porque lê chave de provedor, e o painel de checkout é
 * componente de cliente. Tipo e rótulo podem atravessar a fronteira;
 * chave de API, não.
 */

export type PaymentMethod = "card" | "pix";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "cartão de crédito",
  pix: "Pix",
};
