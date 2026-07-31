import type { NextRequest } from "next/server";
import { applyCaktoEvent } from "@/lib/billing/apply-cakto-event";
import {
  caktoWebhookSecret,
  isCaktoEvent,
  parseCaktoPayment,
  secretMatches,
  type CaktoWebhookBody,
} from "@/lib/billing/cakto";

/**
 * Webhook da Cakto.
 *
 * É a única porta do sistema por onde uma clínica vira pagante. Tudo o
 * que chega aqui é tratado como vindo da internet aberta até provar o
 * contrário: o segredo é conferido antes de qualquer leitura do corpo, e
 * um corpo que não seja JSON válido devolve 400 em vez de derrubar a
 * rota.
 *
 * A Cakto entrega o segredo dentro do próprio corpo, no campo `secret`
 * (documentado em https://cakto-dece4a15.mintlify.app/webhooks/visao-geral),
 * e não assina a requisição com HMAC. Isso significa que o segredo
 * trafega em texto no corpo — daí a exigência de HTTPS e de um segredo
 * longo e aleatório. O cabeçalho `x-cakto-secret` e o `?secret=` na URL
 * são aceitos como alternativa para quem testa localmente, e ficam
 * documentados como o que são: a limitação do provedor, não uma escolha.
 *
 * Resposta: a Cakto considera qualquer resposta como entrega bem
 * sucedida e não repete o envio. Por isso um evento que não bate com
 * clínica nenhuma devolve 200 e grita no log — não adianta devolver
 * erro esperando retentativa que não vem.
 */

export const runtime = "nodejs";

function log(message: string, extra?: Record<string, unknown>) {
  // Nunca entram aqui: o segredo, o corpo cru, e-mail, telefone, CPF ou
  // dados do cartão. O `refId` do pedido é curto, não identifica pessoa
  // e é o suficiente para achar a venda no painel da Cakto.
  console.log(`[cakto] ${message}`, extra ? JSON.stringify(extra) : "");
}

/** E-mail mascarado, só para o operador achar a venda quando nada bate. */
function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status });
}

export async function POST(request: NextRequest) {
  const expected = caktoWebhookSecret();

  if (!expected) {
    // Sem segredo configurado não existe requisição confiável. Recusar é
    // o único comportamento seguro: aceitar seria deixar qualquer pessoa
    // ativar assinatura mandando um POST.
    log("recusado: CAKTO_WEBHOOK_SECRET não configurado");
    return json({ error: "webhook_not_configured" }, 503);
  }

  const raw = await request.text();

  let body: CaktoWebhookBody;
  try {
    body = JSON.parse(raw) as CaktoWebhookBody;
  } catch {
    log("recusado: corpo não é JSON válido", { bytes: raw.length });
    return json({ error: "invalid_json" }, 400);
  }

  const presented =
    body?.secret ??
    request.headers.get("x-cakto-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (!secretMatches(presented, expected)) {
    log("recusado: segredo inválido");
    return json({ error: "unauthorized" }, 401);
  }

  const event = body?.event;

  if (!isCaktoEvent(event)) {
    // Evento novo do provedor não pode quebrar a rota. Registra e segue.
    log("evento desconhecido, ignorado", { event: typeof event === "string" ? event : null });
    return json({ received: true, handled: false, reason: "unknown_event" }, 200);
  }

  const payment = parseCaktoPayment(event, body.data);
  const result = await applyCaktoEvent(payment);

  if (result.applied) {
    log("assinatura atualizada", {
      event,
      order: payment.orderRef,
      clinic: result.clinicId,
      status: result.status,
      matched: result.matchedBy,
      cycle: payment.cycle,
    });
    return json({ received: true, handled: true }, 200);
  }

  if (result.reason === "clinic_not_found" || result.reason === "ambiguous_email") {
    // O único caso que precisa de uma pessoa: há dinheiro do lado da
    // Cakto e o sistema não sabe de quem. Fica gritante no log, com o
    // que basta para achar a venda no painel.
    log("PAGAMENTO SEM CLÍNICA — ativar na mão", {
      event,
      reason: result.reason,
      order: payment.orderRef,
      ref: payment.clinicRef,
      email: maskEmail(payment.customerEmail),
    });
  } else {
    log("evento sem efeito", {
      event,
      reason: result.reason,
      order: payment.orderRef,
      clinic: result.clinicId ?? null,
      status: payment.status,
    });
  }

  return json({ received: true, handled: false, reason: result.reason }, 200);
}

/**
 * Só para conferir que a URL responde ao configurar o webhook no painel.
 * Não diz se o segredo está configurado nem devolve dado nenhum.
 */
export async function GET() {
  return json({ error: "method_not_allowed", hint: "Este endereço só aceita POST." }, 405);
}
