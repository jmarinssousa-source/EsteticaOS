"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { packageSchema } from "@/lib/validations/packages";

type ActionResult = { error?: string } | { success: true };

type PackageInput = {
  name: string;
  totalSessions: number;
  price: number;
  validityDays: string;
  notes: string;
  procedureIds: string[];
};

function revalidatePackages() {
  revalidatePath("/configuracoes/pacotes");
  revalidatePath("/orcamentos");
}

export async function createPackage(input: PackageInput): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data: pkg, error } = await supabase
    .from("packages")
    .insert({
      clinic_id: member.clinicId,
      name: parsed.data.name,
      total_sessions: parsed.data.totalSessions,
      price: parsed.data.price,
      validity_days: parsed.data.validityDays,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error || !pkg) return { error: "Não foi possível criar o pacote." };

  const { error: linkError } = await supabase.from("package_procedures").insert(
    parsed.data.procedureIds.map((procedureId) => ({
      package_id: pkg.id,
      clinic_id: member.clinicId,
      procedure_id: procedureId,
    })),
  );

  if (linkError) return { error: "Pacote criado, mas não foi possível vincular os procedimentos." };

  revalidatePackages();
  return { success: true };
}

export async function updatePackage(packageId: string, input: PackageInput): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("packages")
    .update({
      name: parsed.data.name,
      total_sessions: parsed.data.totalSessions,
      price: parsed.data.price,
      validity_days: parsed.data.validityDays,
      notes: parsed.data.notes,
    })
    .eq("id", packageId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o pacote." };

  await supabase.from("package_procedures").delete().eq("package_id", packageId);
  const { error: linkError } = await supabase.from("package_procedures").insert(
    parsed.data.procedureIds.map((procedureId) => ({
      package_id: packageId,
      clinic_id: member.clinicId,
      procedure_id: procedureId,
    })),
  );

  if (linkError) return { error: "Pacote salvo, mas não foi possível atualizar os procedimentos." };

  revalidatePackages();
  return { success: true };
}

export async function deletePackage(packageId: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("packages")
    .delete()
    .eq("id", packageId)
    .eq("clinic_id", member.clinicId);

  if (error) {
    return { error: "Não é possível excluir: este pacote já foi vendido a algum paciente." };
  }

  revalidatePackages();
  return { success: true };
}
