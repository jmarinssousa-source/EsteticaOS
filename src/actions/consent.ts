"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, getCurrentMember } from "@/lib/auth/session";
import { CONSENT_FORM_TEXT, DEFAULT_CONSENT_TEMPLATE_NAME } from "@/lib/consent/text";

type ActionResult = { error?: string } | { success: true };

export type ConsentTemplate = {
  id: string;
  name: string;
  content: string;
  active: boolean;
};

function revalidateConsent(patientId?: string) {
  revalidatePath("/configuracoes/formularios");
  if (patientId) {
    revalidatePath(`/pacientes/${patientId}`);
    revalidatePath(`/pacientes/${patientId}/consentimento`);
  }
}

// ---------------------------------------------------------------------
// Modelos de termo (Configurações > Anamnese e consentimento)
// ---------------------------------------------------------------------

export async function listConsentTemplates(): Promise<ConsentTemplate[]> {
  const member = await getCurrentMember();
  if (!member) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("consent_templates")
    .select("id, name, content, active")
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: true });

  return (data ?? []) as ConsentTemplate[];
}

/**
 * Modelos disponíveis para assinar. Se a clínica ainda não criou
 * nenhum, devolve um modelo virtual com o texto padrão — assim a tela
 * do paciente nunca fica sem opção de colher assinatura.
 */
export async function listSignableConsentTemplates(): Promise<ConsentTemplate[]> {
  const templates = (await listConsentTemplates()).filter((template) => template.active);
  if (templates.length > 0) return templates;

  return [
    { id: "", name: DEFAULT_CONSENT_TEMPLATE_NAME, content: CONSENT_FORM_TEXT, active: true },
  ];
}

export async function createConsentTemplate(name: string, content?: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Dê um nome ao termo." };

  const supabase = await createClient();
  const { error } = await supabase.from("consent_templates").insert({
    clinic_id: member.clinicId,
    name: trimmed,
    content: content?.trim() || CONSENT_FORM_TEXT,
  });

  if (error) return { error: "Não foi possível criar o termo." };
  revalidateConsent();
  return { success: true };
}

export async function updateConsentTemplate(
  templateId: string,
  fields: { name?: string; content?: string; active?: boolean },
): Promise<ActionResult> {
  const member = await requirePermission("settings_access");

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.name !== undefined) {
    const trimmed = fields.name.trim();
    if (trimmed.length < 2) return { error: "Dê um nome ao termo." };
    update.name = trimmed;
  }
  if (fields.content !== undefined) {
    const trimmed = fields.content.trim();
    if (!trimmed) return { error: "O texto do termo não pode ficar vazio." };
    update.content = trimmed;
  }
  if (fields.active !== undefined) update.active = fields.active;

  const supabase = await createClient();

  // Clínicas criadas antes dos termos múltiplos podem não ter nenhum
  // modelo salvo; nesse caso o "editar" da tela padrão vira um insert.
  if (!templateId) {
    return createConsentTemplate(
      (fields.name ?? DEFAULT_CONSENT_TEMPLATE_NAME).trim(),
      fields.content ?? CONSENT_FORM_TEXT,
    );
  }

  const { error } = await supabase
    .from("consent_templates")
    .update(update)
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o termo." };
  revalidateConsent();
  return { success: true };
}

export async function deleteConsentTemplate(templateId: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("consent_templates")
    .delete()
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir o termo." };
  revalidateConsent();
  return { success: true };
}

// ---------------------------------------------------------------------
// Termos do paciente
// ---------------------------------------------------------------------

async function templateSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clinicId: string,
  templateId: string,
): Promise<{ title: string; content: string }> {
  if (!templateId) {
    return { title: DEFAULT_CONSENT_TEMPLATE_NAME, content: CONSENT_FORM_TEXT };
  }

  const { data } = await supabase
    .from("consent_templates")
    .select("name, content")
    .eq("id", templateId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  return {
    title: data?.name ?? DEFAULT_CONSENT_TEMPLATE_NAME,
    content: data?.content ?? CONSENT_FORM_TEXT,
  };
}

/** Assinatura colhida ali mesmo, no dispositivo da clínica. */
export async function signConsentForm(
  patientId: string,
  templateId: string,
  signatureDataUrl: string,
): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");
  if (!signatureDataUrl) return { error: "Assinatura inválida." };

  const supabase = await createClient();
  const snapshot = await templateSnapshot(supabase, member.clinicId, templateId);

  const { error } = await supabase.from("consent_forms").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    template_id: templateId || null,
    title: snapshot.title,
    content: snapshot.content,
    patient_signature: signatureDataUrl,
    status: "signed",
    signed_at: new Date().toISOString(),
  });

  if (error) return { error: "Não foi possível salvar o termo assinado." };

  revalidateConsent(patientId);
  return { success: true };
}

/** Cria um termo pendente e devolve o token do link para o WhatsApp. */
export async function createConsentRequest(
  patientId: string,
  templateId: string,
): Promise<{ error: string } | { success: true; token: string; title: string }> {
  const member = await requirePermission("patients_edit");

  const supabase = await createClient();
  const snapshot = await templateSnapshot(supabase, member.clinicId, templateId);
  const token = randomBytes(24).toString("base64url");

  const { error } = await supabase.from("consent_forms").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    template_id: templateId || null,
    title: snapshot.title,
    content: snapshot.content,
    access_token: token,
    status: "pending",
    signed_at: null,
  });

  if (error) return { error: "Não foi possível gerar o link do termo." };

  revalidateConsent(patientId);
  return { success: true, token, title: snapshot.title };
}

export async function deleteConsentForm(
  formId: string,
  patientId: string,
): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("consent_forms")
    .delete()
    .eq("id", formId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir o termo." };
  revalidateConsent(patientId);
  return { success: true };
}

// ---------------------------------------------------------------------
// Assinatura pública — autorizada só pela posse do token, igual ao
// preenchimento da anamnese em src/actions/anamnesis.ts.
// ---------------------------------------------------------------------

export type PublicConsent = {
  clinicName: string;
  patientName: string;
  title: string;
  content: string;
  status: "pending" | "signed";
};

export async function getPublicConsent(token: string): Promise<PublicConsent | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("consent_forms")
    .select("status, title, content, patients(name), clinics(name)")
    .eq("access_token", token)
    .maybeSingle();

  if (!data) return null;

  return {
    clinicName: (data.clinics as unknown as { name: string } | null)?.name ?? "",
    patientName: (data.patients as unknown as { name: string } | null)?.name ?? "",
    title: data.title ?? DEFAULT_CONSENT_TEMPLATE_NAME,
    content: data.content ?? CONSENT_FORM_TEXT,
    status: data.status as PublicConsent["status"],
  };
}

export async function submitConsentSignature(
  token: string,
  signatureDataUrl: string,
): Promise<{ error: string } | { success: true }> {
  if (!signatureDataUrl.startsWith("data:image/")) return { error: "Assinatura inválida." };

  const admin = createAdminClient();
  const { data: form } = await admin
    .from("consent_forms")
    .select("id, patient_id, status")
    .eq("access_token", token)
    .maybeSingle();

  if (!form) return { error: "Termo não encontrado." };
  if (form.status !== "pending") return { error: "Este termo já foi assinado." };

  const { error } = await admin
    .from("consent_forms")
    .update({
      patient_signature: signatureDataUrl,
      status: "signed",
      signed_at: new Date().toISOString(),
    })
    .eq("id", form.id);

  if (error) return { error: "Não foi possível salvar sua assinatura. Tente novamente." };

  revalidatePath(`/pacientes/${form.patient_id}`);
  return { success: true };
}
