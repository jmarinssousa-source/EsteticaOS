"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { budgetItemSchema, budgetNotesSchema } from "@/lib/validations/orcamentos";

type ActionResult = { error?: string } | { success: true };
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function revalidateBudget(budgetId?: string) {
  revalidatePath("/orcamentos");
  if (budgetId) revalidatePath(`/orcamentos/${budgetId}`);
}

async function recalcBudgetTotal(supabase: SupabaseServerClient, budgetId: string, clinicId: string) {
  const { data: budget } = await supabase
    .from("budgets")
    .select("discount")
    .eq("id", budgetId)
    .eq("clinic_id", clinicId)
    .single();

  const { data: items } = await supabase
    .from("budget_items")
    .select("quantity, unit_price, discount")
    .eq("budget_id", budgetId)
    .eq("clinic_id", clinicId);

  const itemsTotal = (items ?? []).reduce(
    (sum, item) => sum + item.quantity * Number(item.unit_price) - Number(item.discount),
    0,
  );
  const total = Math.max(itemsTotal - Number(budget?.discount ?? 0), 0);

  await supabase
    .from("budgets")
    .update({ total_value: total })
    .eq("id", budgetId)
    .eq("clinic_id", clinicId);
}

export async function createBudget(patientId: string, notes: string) {
  const member = await requirePermission("budgets_edit");

  const supabase = await createClient();
  const { data: budget, error } = await supabase
    .from("budgets")
    .insert({ clinic_id: member.clinicId, patient_id: patientId, notes: notes || null })
    .select("id")
    .single();

  if (error || !budget) return { error: "Não foi possível criar o orçamento." };

  revalidateBudget();
  redirect(`/orcamentos/${budget.id}`);
}

export async function addBudgetItem(
  budgetId: string,
  item: {
    procedureId: string;
    packageId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    professionalId: string;
    commission: number;
  },
): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const parsed = budgetItemSchema.safeParse(item);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").insert({
    budget_id: budgetId,
    clinic_id: member.clinicId,
    procedure_id: parsed.data.procedureId,
    package_id: parsed.data.packageId,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unitPrice,
    discount: parsed.data.discount,
    professional_id: parsed.data.professionalId,
    commission: parsed.data.commission,
  });

  if (error) return { error: "Não foi possível adicionar o item." };

  await recalcBudgetTotal(supabase, budgetId, member.clinicId);
  revalidateBudget(budgetId);
  return { success: true };
}

export async function updateBudgetItem(
  itemId: string,
  budgetId: string,
  item: {
    procedureId: string;
    packageId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    professionalId: string;
    commission: number;
  },
): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const parsed = budgetItemSchema.safeParse(item);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_items")
    .update({
      procedure_id: parsed.data.procedureId,
      package_id: parsed.data.packageId,
      quantity: parsed.data.quantity,
      unit_price: parsed.data.unitPrice,
      discount: parsed.data.discount,
      professional_id: parsed.data.professionalId,
      commission: parsed.data.commission,
    })
    .eq("id", itemId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o procedimento." };

  await recalcBudgetTotal(supabase, budgetId, member.clinicId);
  revalidateBudget(budgetId);
  return { success: true };
}

export async function deleteBudgetItem(itemId: string, budgetId: string): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_items")
    .delete()
    .eq("id", itemId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível remover o procedimento." };

  await recalcBudgetTotal(supabase, budgetId, member.clinicId);
  revalidateBudget(budgetId);
  return { success: true };
}

export async function updateBudgetNotes(
  budgetId: string,
  patch: { notes: string; discount: number },
): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const parsed = budgetNotesSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({ notes: parsed.data.notes, discount: parsed.data.discount })
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o orçamento." };

  await recalcBudgetTotal(supabase, budgetId, member.clinicId);
  revalidateBudget(budgetId);
  return { success: true };
}

async function transitionStatus(
  budgetId: string,
  from: string[],
  to: string,
): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const supabase = await createClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!budget || !from.includes(budget.status)) {
    return { error: "Este orçamento não está em um status válido para essa ação." };
  }

  const { error } = await supabase
    .from("budgets")
    .update({ status: to })
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível atualizar o orçamento." };

  revalidateBudget(budgetId);
  return { success: true };
}

export async function sendBudget(budgetId: string) {
  return transitionStatus(budgetId, ["open"], "sent");
}

export async function approveBudget(budgetId: string) {
  return transitionStatus(budgetId, ["open", "sent"], "approved");
}

export async function rejectBudget(budgetId: string) {
  return transitionStatus(budgetId, ["open", "sent"], "rejected");
}

export async function cancelBudget(budgetId: string) {
  return transitionStatus(budgetId, ["open", "sent", "approved"], "canceled");
}

export async function convertBudgetToSale(budgetId: string): Promise<ActionResult> {
  const member = await requirePermission("budgets_edit");
  const supabase = await createClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("id, patient_id, status, total_value")
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!budget) return { error: "Orçamento não encontrado." };
  if (budget.status !== "approved") {
    return { error: "Apenas orçamentos aprovados podem virar venda." };
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      clinic_id: member.clinicId,
      patient_id: budget.patient_id,
      budget_id: budget.id,
      total_value: budget.total_value,
    })
    .select("id")
    .single();

  if (saleError || !sale) return { error: "Não foi possível criar a venda." };

  const { data: packageItems } = await supabase
    .from("budget_items")
    .select("package_id, quantity, packages(total_sessions, validity_days)")
    .eq("budget_id", budgetId)
    .not("package_id", "is", null);

  if (packageItems && packageItems.length > 0) {
    const balances = packageItems.flatMap((item) => {
      const pkg = item.packages as unknown as { total_sessions: number; validity_days: number | null } | null;
      if (!pkg) return [];
      const expiresAt = pkg.validity_days
        ? new Date(Date.now() + pkg.validity_days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null;
      return Array.from({ length: item.quantity }, () => ({
        clinic_id: member.clinicId,
        patient_id: budget.patient_id,
        package_id: item.package_id as string,
        sale_id: sale.id,
        total_sessions: pkg.total_sessions,
        expires_at: expiresAt,
      }));
    });

    if (balances.length > 0) {
      const { error: balanceError } = await supabase.from("package_balances").insert(balances);
      if (balanceError) {
        return { error: "Venda criada, mas não foi possível gerar o saldo de sessões do pacote." };
      }
    }
  }

  const { error: entryError } = await supabase.from("financial_entries").insert({
    clinic_id: member.clinicId,
    patient_id: budget.patient_id,
    sale_id: sale.id,
    type: "revenue",
    description: "Venda de orçamento",
    amount: budget.total_value,
    due_date: new Date().toISOString().slice(0, 10),
  });

  if (entryError) return { error: "Venda criada, mas não foi possível gerar o lançamento financeiro." };

  const { error: statusError } = await supabase
    .from("budgets")
    .update({ status: "paid" })
    .eq("id", budgetId)
    .eq("clinic_id", member.clinicId);

  if (statusError) return { error: "Venda criada, mas não foi possível atualizar o status do orçamento." };

  revalidateBudget(budgetId);
  revalidatePath("/hoje");
  return { success: true };
}
