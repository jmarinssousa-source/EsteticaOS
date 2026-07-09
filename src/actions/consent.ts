"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";

type ActionResult = { error?: string } | { success: true };

export async function signConsentForm(patientId: string, signatureDataUrl: string): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");

  if (!signatureDataUrl) return { error: "Assinatura inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("consent_forms").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    patient_signature: signatureDataUrl,
  });

  if (error) return { error: "Não foi possível salvar o termo assinado." };

  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath(`/pacientes/${patientId}/consentimento`);
  return { success: true };
}
