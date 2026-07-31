import "server-only";
import type { BillingCycle } from "@/lib/plan/pricing";
import {
  PLAN_MONTHLY_PRICE_CENTS,
  PLAN_YEARLY_PRICE_CENTS,
} from "@/lib/plan/pricing";

/**
 * Cakto — o provedor de pagamento do EstéticaOS.
 *
 * O checkout é hospedado por eles: o sistema não coleta cartão, não gera
 * QR Code de Pix e não sabe qual forma de pagamento a pessoa escolheu na
 * hora. A única escolha que acontece aqui dentro é o ciclo (mensal ou
 * anual), e cada ciclo tem uma URL de produto própria.
 *
 * A regra que não se negocia: quem marca clínica como paga é o webhook,
 * conferindo o segredo combinado. Clicar no botão só leva a pessoa para
 * a tela de pagamento.
 *
 * Documentação consultada (julho/2026):
 *   https://cakto-dece4a15.mintlify.app/webhooks/visao-geral
 *   https://cakto-dece4a15.mintlify.app/webhooks/eventos
 *   https://cakto-dece4a15.mintlify.app/webhooks/pagamento-recorrente
 *   https://cakto-dece4a15.mintlify.app/webhooks/campos-assinatura
 *   https://docs.cakto.com.br/api-reference/webhooks/update
 */

// ---------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------

export function caktoCheckoutUrl(cycle: BillingCycle): string | null {
  const raw =
    cycle === "yearly"
      ? process.env.CAKTO_CHECKOUT_YEARLY_URL
      : process.env.CAKTO_CHECKOUT_MONTHLY_URL;

  const url = raw?.trim();
  if (!url) return null;

  // Só aceita o domínio de checkout da Cakto. Uma variável de ambiente
  // trocada por engano não pode virar redirecionamento para qualquer
  // lugar da internet a partir de um botão do sistema.
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "pay.cakto.com.br") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** O segredo que a Cakto devolve no corpo de todo webhook. */
export function caktoWebhookSecret(): string | null {
  const secret = process.env.CAKTO_WEBHOOK_SECRET?.trim();
  return secret ? secret : null;
}

// ---------------------------------------------------------------------
// Referência da clínica no checkout
// ---------------------------------------------------------------------

/**
 * Parâmetro de rastreamento livre da Cakto. É o que carrega a identidade
 * da clínica do sistema até o pagamento e de volta.
 *
 * A Cakto aceita `src`, `sck` e as `utm_*` na URL do checkout e guarda o
 * valor no pedido. `sck` é o campo descrito na documentação como
 * "parâmetro personalizado, geralmente usado internamente para rastrear
 * algo específico" — que é exatamente o uso aqui.
 */
export const CLINIC_REF_PARAM = "sck";

/**
 * Formato: `<uuid-da-clínica>_<ciclo>`.
 *
 * O separador é `_` porque é um dos poucos caracteres que sobrevivem
 * inteiros à codificação de formulário: `~`, por exemplo, vira `%7E` na
 * URL, e aí dependeria da Cakto decodificar antes de guardar o valor.
 * O UUID não tem `_`, então a separação nunca fica ambígua.
 */
const REF_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(monthly|yearly)$/i;

export function buildClinicRef(clinicId: string, cycle: BillingCycle): string {
  return `${clinicId}_${cycle}`;
}

export function parseClinicRef(
  value: unknown,
): { clinicId: string; cycle: BillingCycle } | null {
  if (typeof value !== "string") return null;
  const match = REF_PATTERN.exec(value.trim());
  if (!match) return null;
  return { clinicId: match[1].toLowerCase(), cycle: match[2].toLowerCase() as BillingCycle };
}

/**
 * URL do checkout já apontando para a clínica certa.
 *
 * Além da referência, vão os dados que a Cakto usa para pré-preencher o
 * formulário. Isso não é conveniência à toa: quanto menos a pessoa
 * redigita, menor a chance de o e-mail do pagamento sair diferente do
 * e-mail da conta — e o e-mail é a segunda âncora que o webhook usa para
 * achar a clínica quando a referência não volta.
 */
export function buildCaktoCheckoutUrl(params: {
  cycle: BillingCycle;
  clinicId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}): string | null {
  const base = caktoCheckoutUrl(params.cycle);
  if (!base) return null;

  const url = new URL(base);
  url.searchParams.set(CLINIC_REF_PARAM, buildClinicRef(params.clinicId, params.cycle));
  // Redundância barata: se um dia o `sck` parar de voltar no webhook, a
  // `utm_content` continua sendo mais um lugar onde procurar.
  url.searchParams.set("utm_source", "esteticaos");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", params.cycle);
  url.searchParams.set("utm_content", params.clinicId);

  if (params.email) {
    url.searchParams.set("email", params.email);
    url.searchParams.set("confirmEmail", params.email);
  }
  if (params.name) url.searchParams.set("name", params.name);
  // A Cakto exige o código do país junto do telefone.
  const phone = params.phone?.replace(/\D/g, "");
  if (phone && phone.length >= 10) {
    url.searchParams.set("phone", phone.startsWith("55") ? phone : `55${phone}`);
  }

  return url.toString();
}

// ---------------------------------------------------------------------
// Formato do webhook
// ---------------------------------------------------------------------

/** Todos os eventos que a Cakto pode disparar, conforme o enum da API. */
export const CAKTO_EVENTS = [
  "initiate_checkout",
  "checkout_abandonment",
  "purchase_approved",
  "purchase_refused",
  "pix_gerado",
  "boleto_gerado",
  "picpay_gerado",
  "openfinance_nubank_gerado",
  "chargeback",
  "refund",
  "subscription_created",
  "subscription_canceled",
  "subscription_renewed",
  "subscription_renewal_refused",
] as const;

export type CaktoEvent = (typeof CAKTO_EVENTS)[number];

export type CaktoWebhookBody = {
  secret?: unknown;
  event?: unknown;
  data?: Record<string, unknown>;
};

/**
 * O que o evento significa para a assinatura da clínica.
 *
 * - `activate`   — dinheiro confirmado, libera o acesso.
 * - `overdue`    — cobrança falhou. Mantém o acesso e avisa (regra do
 *                  produto: ninguém perde a agenda do dia por cartão
 *                  vencido).
 * - `terminate`  — assinatura encerrada, estornada ou contestada.
 * - `ignore`     — cobrança apenas emitida, ou intenção de compra. Não
 *                  mexe em nada.
 */
export type CaktoOutcome = "activate" | "overdue" | "terminate" | "ignore";

/**
 * Mapa evento → efeito.
 *
 * O que **não** libera acesso está aqui de propósito, escrito como
 * `ignore` em vez de ficar de fora: Pix, boleto, PicPay e Nubank
 * "gerado" significam cobrança emitida e ainda não paga. Tratar
 * qualquer um deles como pagamento seria dar o sistema de graça para
 * quem só clicou em gerar o QR Code.
 *
 * Sobre estorno e chargeback: os dois viram `terminate`. Estorno é
 * dinheiro devolvido e chargeback é dinheiro contestado — em nenhum dos
 * dois a assinatura segue paga. Não viram `overdue` porque `overdue`
 * mantém o acesso liberado, e aqui não há pagamento nenhum de pé.
 */
export const CAKTO_EVENT_OUTCOMES: Record<CaktoEvent, CaktoOutcome> = {
  purchase_approved: "activate",
  subscription_created: "activate",
  subscription_renewed: "activate",

  purchase_refused: "overdue",
  subscription_renewal_refused: "overdue",

  refund: "terminate",
  chargeback: "terminate",
  subscription_canceled: "terminate",

  initiate_checkout: "ignore",
  checkout_abandonment: "ignore",
  pix_gerado: "ignore",
  boleto_gerado: "ignore",
  picpay_gerado: "ignore",
  openfinance_nubank_gerado: "ignore",
};

export function isCaktoEvent(value: unknown): value is CaktoEvent {
  return typeof value === "string" && (CAKTO_EVENTS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------
// Leitura do payload
// ---------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Procura a referência da clínica em qualquer lugar do payload.
 *
 * A documentação da Cakto lista `sck` e as `utm_*` no objeto do pedido
 * na API, mas os exemplos de webhook publicados não mostram esses campos
 * — ou seja, não dá para apostar num caminho fixo. Em vez de escolher um
 * e torcer, a varredura passa por todo o objeto até quatro níveis.
 *
 * É seguro fazer assim porque a referência não autoriza nada sozinha: o
 * que ela devolve é um UUID que ainda vai ser conferido contra a tabela
 * de clínicas. Um valor inventado simplesmente não acha ninguém.
 */
export function findClinicRef(
  value: unknown,
  depth = 0,
): { clinicId: string; cycle: BillingCycle } | null {
  if (depth > 4) return null;

  const direct = parseClinicRef(value);
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findClinicRef(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) return null;

  for (const item of Object.values(record)) {
    const found = findClinicRef(item, depth + 1);
    if (found) return found;
  }
  return null;
}

export type CaktoPayment = {
  event: CaktoEvent;
  outcome: CaktoOutcome;
  /** `refId` do pedido — curto e não sensível, serve para o log. */
  orderRef: string | null;
  /** Estado do pedido: `paid`, `waiting_payment`, `refused`, ... */
  status: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  customerId: string | null;
  customerEmail: string | null;
  /** Próxima cobrança programada, quando a Cakto informa. */
  nextPaymentDate: string | null;
  cycle: BillingCycle | null;
  clinicRef: string | null;
  paidPayments: number | null;
};

/**
 * Descobre o ciclo cobrado.
 *
 * Ordem: o que o próprio sistema mandou no checkout, depois o intervalo
 * da recorrência que a Cakto devolve, e por último o valor pago. Nenhum
 * dos três é obrigatório no payload, então o resultado pode ser `null` —
 * e nesse caso o ciclo gravado antes é mantido, em vez de sobrescrito
 * com um palpite.
 */
function inferCycle(
  data: Record<string, unknown>,
  fromRef: BillingCycle | null,
): BillingCycle | null {
  if (fromRef) return fromRef;

  const subscription = asRecord(data.subscription);
  const period = asNumber(subscription?.recurrence_period);
  // 30 dias no mensal, 365 no anual. O corte no meio absorve variações
  // (31, 360) sem confundir os dois.
  if (period && period > 0) return period >= 180 ? "yearly" : "monthly";

  const amountReais =
    asNumber(data.baseAmount) ?? asNumber(data.amount) ?? asNumber(asRecord(data.offer)?.price);
  if (amountReais != null) {
    const cents = Math.round(amountReais * 100);
    if (cents === PLAN_YEARLY_PRICE_CENTS) return "yearly";
    if (cents === PLAN_MONTHLY_PRICE_CENTS) return "monthly";
  }

  return null;
}

export function parseCaktoPayment(event: CaktoEvent, raw: unknown): CaktoPayment {
  const data = asRecord(raw) ?? {};
  const subscription = asRecord(data.subscription);
  const customer = asRecord(data.customer);
  const ref = findClinicRef(data);

  return {
    event,
    outcome: CAKTO_EVENT_OUTCOMES[event],
    orderRef: asString(data.refId),
    status: asString(data.status),
    subscriptionId: asString(subscription?.id),
    subscriptionStatus: asString(subscription?.status),
    customerId: asString(customer?.id),
    customerEmail: asString(customer?.email)?.toLowerCase() ?? null,
    nextPaymentDate: asString(subscription?.next_payment_date),
    cycle: inferCycle(data, ref?.cycle ?? null),
    clinicRef: ref?.clinicId ?? null,
    paidPayments: asNumber(subscription?.paid_payments_quantity),
  };
}

/**
 * O pagamento realmente entrou?
 *
 * Nem todo evento de ativação vem com dinheiro confirmado: uma
 * assinatura pode ser criada com a primeira cobrança ainda aguardando
 * Pix. Sem esta checagem, `subscription_created` liberaria o sistema
 * antes de qualquer pagamento.
 */
export function isPaidPayment(payment: CaktoPayment): boolean {
  if (payment.status === "paid") return true;
  return (
    payment.subscriptionStatus === "active" &&
    payment.paidPayments != null &&
    payment.paidPayments >= 1
  );
}

/**
 * Comparação de segredo em tempo constante.
 *
 * Comparar com `===` vaza, pelo tempo de resposta, quantos caracteres do
 * começo estão certos. É pouco, mas é grátis não vazar.
 */
export function secretMatches(received: unknown, expected: string): boolean {
  if (typeof received !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}
