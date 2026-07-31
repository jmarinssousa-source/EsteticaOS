import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaidPayment, type CaktoPayment } from "@/lib/billing/cakto";
import type { PlanStatus } from "@/lib/plan/trial";

/**
 * O que o webhook da Cakto escreve na clínica.
 *
 * Este arquivo é o único lugar do sistema que muda `plan_status` para
 * 'active'. Por isso ele é chato de propósito: cada caminho até uma
 * clínica é conferido, e quando a conferência não fecha ele desiste e
 * registra o motivo, em vez de escolher a clínica mais parecida.
 *
 * Marcar a clínica errada como paga é dar o sistema de graça para uma e
 * cobrar a outra. Não achar a clínica é um problema que uma pessoa
 * resolve em dois minutos olhando o log.
 */

export type MatchedBy = "subscription" | "reference" | "email";

export type ApplyResult =
  | { applied: true; clinicId: string; status: PlanStatus; matchedBy: MatchedBy }
  | {
      applied: false;
      reason:
        | "ignored_event"
        | "not_paid"
        | "clinic_not_found"
        | "ambiguous_email"
        | "not_subscribed"
        | "db_error";
      clinicId?: string;
    };

type ClinicRow = { id: string; plan_status: string | null };

const CLINIC_COLUMNS = "id, plan_status";

/**
 * Acha a clínica dona deste pagamento, em três tentativas, da mais firme
 * para a mais frágil.
 *
 * 1. **Assinatura já conhecida.** A partir da segunda cobrança, o id da
 *    assinatura na Cakto já está gravado na clínica. É prova direta.
 * 2. **Referência do checkout.** O `sck` que o próprio sistema colocou na
 *    URL, carregando o id da clínica. Vale porque o UUID ainda é
 *    conferido contra a tabela — um valor inventado não acha ninguém.
 * 3. **E-mail do comprador.** Última tentativa, e a única que pode dar
 *    empate. Se der, desiste: duas clínicas com o mesmo e-mail e uma só
 *    assinatura não é coisa que um `limit(1)` deva decidir.
 */
async function findClinic(
  admin: ReturnType<typeof createAdminClient>,
  payment: CaktoPayment,
): Promise<
  | { clinic: ClinicRow; matchedBy: MatchedBy }
  | { error: "clinic_not_found" | "ambiguous_email" | "db_error" }
> {
  if (payment.subscriptionId) {
    const { data, error } = await admin
      .from("clinics")
      .select(CLINIC_COLUMNS)
      .eq("billing_subscription_id", payment.subscriptionId)
      .maybeSingle();

    if (error) return { error: "db_error" };
    if (data) return { clinic: data, matchedBy: "subscription" };
  }

  if (payment.clinicRef) {
    const { data, error } = await admin
      .from("clinics")
      .select(CLINIC_COLUMNS)
      .eq("id", payment.clinicRef)
      .maybeSingle();

    if (error) return { error: "db_error" };
    if (data) return { clinic: data, matchedBy: "reference" };
  }

  if (payment.customerEmail) {
    // Quem contrata é o dono, então o e-mail dele vem primeiro. O e-mail
    // cadastrado na clínica entra depois, para o caso de a pessoa ter
    // pago com o endereço comercial.
    const { data: owners, error: ownersError } = await admin
      .from("clinic_members")
      .select("clinic_id")
      .eq("role", "owner")
      .ilike("email", payment.customerEmail)
      .limit(2);

    if (ownersError) return { error: "db_error" };

    const clinicIds = Array.from(new Set((owners ?? []).map((row) => row.clinic_id)));

    if (clinicIds.length === 0) {
      const { data: byClinicEmail, error: clinicEmailError } = await admin
        .from("clinics")
        .select(CLINIC_COLUMNS)
        .ilike("email", payment.customerEmail)
        .limit(2);

      if (clinicEmailError) return { error: "db_error" };
      if (byClinicEmail && byClinicEmail.length > 1) return { error: "ambiguous_email" };
      if (byClinicEmail && byClinicEmail.length === 1) {
        return { clinic: byClinicEmail[0], matchedBy: "email" };
      }
      return { error: "clinic_not_found" };
    }

    if (clinicIds.length > 1) return { error: "ambiguous_email" };

    const { data, error } = await admin
      .from("clinics")
      .select(CLINIC_COLUMNS)
      .eq("id", clinicIds[0])
      .maybeSingle();

    if (error) return { error: "db_error" };
    if (data) return { clinic: data, matchedBy: "email" };
  }

  return { error: "clinic_not_found" };
}

/**
 * Uma clínica que nunca assinou não pode ser mexida por evento negativo.
 *
 * Sem esta trava, um pagamento recusado marcaria a clínica como
 * `past_due` — e `past_due` libera o acesso de propósito, para não tirar
 * a agenda do dia de quem já paga. Ou seja: clicar em pagar e deixar o
 * cartão ser recusado viraria uma forma de destravar o sistema. E um
 * estorno de outro produto, batendo por e-mail, cancelaria uma clínica
 * que ainda está no teste.
 */
function isSubscribed(status: string | null): boolean {
  return status === "active" || status === "past_due";
}

export async function applyCaktoEvent(payment: CaktoPayment): Promise<ApplyResult> {
  if (payment.outcome === "ignore") {
    return { applied: false, reason: "ignored_event" };
  }

  // Cobrança emitida não é cobrança paga. Assinatura criada com o Pix
  // ainda pendente cai aqui e não libera nada.
  if (payment.outcome === "activate" && !isPaidPayment(payment)) {
    return { applied: false, reason: "not_paid" };
  }

  const admin = createAdminClient();
  const found = await findClinic(admin, payment);

  if ("error" in found) return { applied: false, reason: found.error };

  const { clinic, matchedBy } = found;

  if (payment.outcome !== "activate" && !isSubscribed(clinic.plan_status)) {
    return { applied: false, reason: "not_subscribed", clinicId: clinic.id };
  }

  const status: PlanStatus =
    payment.outcome === "activate"
      ? "active"
      : payment.outcome === "overdue"
        ? "past_due"
        : "canceled";

  const update: Record<string, unknown> = { plan_status: status };

  // Os identificadores da Cakto são gravados sempre que aparecem, em
  // qualquer evento: é o que faz a próxima renovação achar a clínica sem
  // depender de e-mail nem de referência.
  if (payment.subscriptionId) update.billing_subscription_id = payment.subscriptionId;
  if (payment.customerId) update.billing_customer_id = payment.customerId;
  // Ciclo e vencimento só entram quando o pagamento entrou. Numa
  // recusa, o que vale é a data da última cobrança que deu certo.
  if (payment.outcome === "activate") {
    if (payment.cycle) update.billing_cycle = payment.cycle;
    if (payment.nextPaymentDate) update.subscription_ends_at = payment.nextPaymentDate;
  }

  const { error } = await admin.from("clinics").update(update).eq("id", clinic.id);

  if (error) return { applied: false, reason: "db_error", clinicId: clinic.id };

  return { applied: true, clinicId: clinic.id, status, matchedBy };
}
