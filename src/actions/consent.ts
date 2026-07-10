"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, getCurrentMember } from "@/lib/auth/session";
import { CONSENT_FORM_TEXT } from "@/lib/consent/text";

type ActionResult = { error?: string } | { success: true };

export async function getConsentTemplate(): Promise<string> {
  const member = await getCurrentMember();
  if (!member) return CONSENT_FORM_TEXT;

  const supabase = await createClient();
  const { data } = await supabase
    .from("consent_templates")
    .select("content")
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  return data?.content ?? CONSENT_FORM_TEXT;
}

export async function updateConsentTemplate(content: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const trimmed = content.trim();
  if (!trimmed) return { error: "O texto do termo não pode ficar vazio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("consent_templates")
    .upsert({ clinic_id: member.clinicId, content: trimmed, updated_at: new Date().toISOString() }, { onConflict: "clinic_id" });

  if (error) return { error: "Não foi possível salvar o termo." };

  revalidatePath("/configuracoes/consentimento");
  return { success: true };
}

export async function signConsentForm(patientId: string, signatureDataUrl: string): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");

  if (!signatureDataUrl) return { error: "Assinatura inválida." };

  const supabase = await createClient();
  const content = await getConsentTemplate();
  const { error } = await supabase.from("consent_forms").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    patient_signature: signatureDataUrl,
    content,
  });

  if (error) return { error: "Não foi possível salvar o termo assinado." };

  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath(`/pacientes/${patientId}/consentimento`);
  return { success: true };
}
