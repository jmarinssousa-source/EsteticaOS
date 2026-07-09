"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/session";
import type { ActionState } from "@/actions/auth";

const setMonthlyGoalSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "Mês inválido."),
  goalAmount: z.coerce.number().min(0, "Informe um valor válido."),
});

export async function setMonthlyGoal(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await getCurrentMember();
  if (!member || (member.role !== "owner" && member.role !== "manager")) {
    return { error: "Apenas o dono/admin ou o gerente podem definir a meta mensal." };
  }

  const parsed = setMonthlyGoalSchema.safeParse({
    yearMonth: formData.get("yearMonth"),
    goalAmount: formData.get("goalAmount"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("monthly_goals").upsert(
    {
      clinic_id: member.clinicId,
      year_month: parsed.data.yearMonth,
      goal_amount: parsed.data.goalAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id,year_month" },
  );

  if (error) {
    return { error: "Não foi possível salvar a meta mensal." };
  }

  revalidatePath("/hoje");
  return { success: true };
}
