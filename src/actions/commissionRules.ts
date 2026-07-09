"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { commissionRuleSchema } from "@/lib/validations/financeiro";

type ActionResult = { error?: string } | { success: true };

function revalidateRules() {
  revalidatePath("/configuracoes/comissoes");
  revalidatePath("/financeiro");
}

export async function createCommissionRule(input: {
  professionalId: string;
  procedureId: string;
  basis: string;
  ratePercent: number;
}): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = commissionRuleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("commission_rules").insert({
    clinic_id: member.clinicId,
    professional_id: parsed.data.professionalId,
    procedure_id: parsed.data.procedureId,
    basis: parsed.data.basis,
    rate_percent: parsed.data.ratePercent,
  });

  if (error) return { error: "Não foi possível criar a regra de comissão." };
  revalidateRules();
  return { success: true };
}

export async function deleteCommissionRule(ruleId: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("commission_rules")
    .delete()
    .eq("id", ruleId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível remover a regra." };
  revalidateRules();
  return { success: true };
}
