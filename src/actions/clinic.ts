"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth/session";
import type { ActionState } from "@/actions/auth";

const updateClinicSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da clínica."),
  cnpj: z.string().trim().optional(),
  phone: z.string().trim().min(8, "Informe um telefone válido."),
  email: z.email("Informe um e-mail válido."),
  address: z.string().trim().optional(),
  staleLeadDays: z.coerce.number().int().min(1, "Informe pelo menos 1 dia."),
});

export async function updateClinic(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await getCurrentMember();
  if (!member || member.role !== "owner") {
    return { error: "Apenas o dono/admin da clínica pode editar estes dados." };
  }

  const parsed = updateClinicSchema.safeParse({
    name: formData.get("name"),
    cnpj: formData.get("cnpj"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    staleLeadDays: formData.get("staleLeadDays"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { staleLeadDays, ...clinicFields } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinics")
    .update({ ...clinicFields, stale_lead_days: staleLeadDays })
    .eq("id", member.clinicId);

  if (error) {
    return { error: "Não foi possível salvar os dados da clínica." };
  }

  revalidatePath("/configuracoes/clinica");
  return { success: true };
}
