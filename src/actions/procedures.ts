"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { procedureSchema } from "@/lib/validations/procedures";

export async function createProcedure(
  name: string,
  price?: number,
): Promise<{ error: string } | { success: true; id: string }> {
  const member = await getCurrentMember();
  if (!member || (!hasPermission(member, "agenda_edit") && !hasPermission(member, "budgets_edit"))) {
    return { error: "Você não tem permissão para criar procedimentos." };
  }

  const parsed = procedureSchema.safeParse({ name, price: price ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .insert({ clinic_id: member.clinicId, name: parsed.data.name, price: parsed.data.price })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar o procedimento." };

  revalidatePath("/agenda");
  revalidatePath("/orcamentos");
  return { success: true, id: data.id };
}
