"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { procedureSchema } from "@/lib/validations/procedures";

type ActionResult = { error: string } | { success: true };

function revalidateProcedures() {
  revalidatePath("/configuracoes/procedimentos");
  revalidatePath("/configuracoes/pacotes");
  revalidatePath("/agenda");
  revalidatePath("/orcamentos");
  revalidatePath("/sessoes");
}

/** Quem monta agenda, orçamento ou configurações pode ampliar o catálogo:
 *  a lista de procedimentos de estética é grande demais para vir pronta. */
async function requireProcedureAccess() {
  const member = await getCurrentMember();
  if (
    !member ||
    (!hasPermission(member, "agenda_edit") &&
      !hasPermission(member, "budgets_edit") &&
      !hasPermission(member, "settings_access"))
  ) {
    return null;
  }
  return member;
}

export async function createProcedure(
  name: string,
  price?: number | string,
): Promise<{ error: string } | { success: true; id: string }> {
  const member = await requireProcedureAccess();
  if (!member) return { error: "Você não tem permissão para criar procedimentos." };

  const parsed = procedureSchema.safeParse({ name, price: price ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .insert({ clinic_id: member.clinicId, name: parsed.data.name, price: parsed.data.price })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar o procedimento." };

  revalidateProcedures();
  return { success: true, id: data.id };
}

export async function updateProcedure(
  procedureId: string,
  name: string,
  price?: number | string,
): Promise<ActionResult> {
  const member = await requireProcedureAccess();
  if (!member) return { error: "Você não tem permissão para editar procedimentos." };

  const parsed = procedureSchema.safeParse({ name, price: price ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("procedures")
    .update({ name: parsed.data.name, price: parsed.data.price })
    .eq("id", procedureId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o procedimento." };

  revalidateProcedures();
  return { success: true };
}

export async function deleteProcedure(procedureId: string): Promise<ActionResult> {
  const member = await requireProcedureAccess();
  if (!member) return { error: "Você não tem permissão para excluir procedimentos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("procedures")
    .delete()
    .eq("id", procedureId)
    .eq("clinic_id", member.clinicId);

  if (error) {
    return {
      error:
        "Não foi possível excluir: este procedimento já aparece em pacotes, orçamentos ou atendimentos.",
    };
  }

  revalidateProcedures();
  return { success: true };
}
