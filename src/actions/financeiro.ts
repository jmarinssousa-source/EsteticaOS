"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { entryPaymentSchema, financialEntrySchema } from "@/lib/validations/financeiro";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidateFinanceiro(patientId?: string | null) {
  revalidatePath("/financeiro");
  revalidatePath("/hoje");
  if (patientId) revalidatePath(`/pacientes/${patientId}`);
}

export async function createFinancialEntry(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("finance_edit");
  const parsed = financialEntrySchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    patientId: formData.get("patientId"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("financial_entries").insert({
    clinic_id: member.clinicId,
    type: parsed.data.type,
    description: parsed.data.description,
    amount: parsed.data.amount,
    patient_id: parsed.data.patientId,
    due_date: parsed.data.dueDate,
  });

  if (error) return { error: "Não foi possível criar o lançamento." };

  revalidateFinanceiro(parsed.data.patientId);
  return { success: true };
}

export async function updateEntryPayment(
  entryId: string,
  patientId: string | null,
  patch: {
    status: string;
    paymentDate: string;
    paymentMethod: string;
    nfIssued: boolean;
    nfNumber: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("finance_edit");
  const parsed = entryPaymentSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("financial_entries")
    .update({
      status: parsed.data.status,
      payment_date: parsed.data.paymentDate,
      payment_method: parsed.data.paymentMethod,
      nf_issued: parsed.data.nfIssued,
      nf_number: parsed.data.nfNumber,
    })
    .eq("id", entryId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível atualizar o lançamento." };

  revalidateFinanceiro(patientId);
  return { success: true };
}
