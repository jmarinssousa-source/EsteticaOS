import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { CommissionBasis } from "@/lib/financeiro/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CommissionTotal = {
  professionalId: string;
  amount: number;
};

/** Aggregates commission per professional for sales that happened in
 * the given date range. For each sold item, the most specific matching
 * commission_rules row wins (professional+procedure > professional-only
 * > procedure-only > clinic-wide fallback). If no rule matches at all,
 * falls back to the manual `budget_items.commission` value entered
 * when the orçamento was built (Fase 6) — so clinics that never touch
 * Configurações > Comissões still get a usable number. Deliberately
 * uses several flat queries + a JS join instead of one deeply nested
 * PostgREST filter (`budgets.sales.sale_date` chains are easy to get
 * subtly wrong and hard to verify without a live database to test
 * against) — see [[project-estheticaos-stack]] if extending this. */
export async function computeCommissionsByProfessional(
  supabase: SupabaseServerClient,
  clinicId: string,
  periodStart: string,
  periodEnd: string,
): Promise<CommissionTotal[]> {
  const { data: sales } = await supabase
    .from("sales")
    .select("id, budget_id, sale_date")
    .eq("clinic_id", clinicId)
    .gte("sale_date", periodStart)
    .lte("sale_date", periodEnd);

  if (!sales || sales.length === 0) return [];

  const saleIds = sales.map((s) => s.id);
  const budgetIds = sales.map((s) => s.budget_id);

  const [{ data: entries }, { data: items }, { data: rules }] = await Promise.all([
    supabase.from("financial_entries").select("sale_id, status").in("sale_id", saleIds),
    supabase
      .from("budget_items")
      .select("budget_id, procedure_id, professional_id, quantity, unit_price, discount, commission")
      .in("budget_id", budgetIds)
      .not("professional_id", "is", null),
    supabase
      .from("commission_rules")
      .select("professional_id, procedure_id, basis, rate_percent")
      .eq("clinic_id", clinicId),
  ]);

  const paidStatusBySaleId = new Map((entries ?? []).map((e) => [e.sale_id, e.status]));
  const saleIdByBudgetId = new Map(sales.map((s) => [s.budget_id, s.id]));

  const totals = new Map<string, number>();

  for (const item of items ?? []) {
    const professionalId = item.professional_id as string;
    const saleId = saleIdByBudgetId.get(item.budget_id);
    const isPaid = saleId ? paidStatusBySaleId.get(saleId) === "paid" : false;

    const rule = findBestRule(rules ?? [], professionalId, item.procedure_id, isPaid);
    const subtotal = item.quantity * Number(item.unit_price) - Number(item.discount);
    const amount = rule ? subtotal * (rule.rate_percent / 100) : Number(item.commission ?? 0);

    totals.set(professionalId, (totals.get(professionalId) ?? 0) + amount);
  }

  return [...totals.entries()].map(([professionalId, amount]) => ({ professionalId, amount }));
}

function findBestRule(
  rules: { professional_id: string | null; procedure_id: string | null; basis: CommissionBasis; rate_percent: number }[],
  professionalId: string,
  procedureId: string | null,
  isPaid: boolean,
) {
  const applicable = rules.filter((rule) => (rule.basis === "received" ? isPaid : true));

  const exact = applicable.find(
    (r) => r.professional_id === professionalId && r.procedure_id === procedureId && procedureId != null,
  );
  if (exact) return exact;

  const byProfessional = applicable.find((r) => r.professional_id === professionalId && r.procedure_id == null);
  if (byProfessional) return byProfessional;

  const byProcedure = applicable.find(
    (r) => r.procedure_id === procedureId && procedureId != null && r.professional_id == null,
  );
  if (byProcedure) return byProcedure;

  return applicable.find((r) => r.professional_id == null && r.procedure_id == null) ?? null;
}
