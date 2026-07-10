"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/session";
import { questionSchema, templateNameSchema } from "@/lib/validations/anamnesis";
import { QUESTION_TYPES, CHOICE_QUESTION_TYPES } from "@/lib/anamnesis/constants";

type ActionResult = { error?: string } | { success: true };

function revalidateAnamnesis(patientId?: string) {
  revalidatePath("/configuracoes/formularios");
  if (patientId) revalidatePath(`/pacientes/${patientId}`);
}

// ---------------------------------------------------------------------
// Templates (Configurações > Modelos de anamnese)
// ---------------------------------------------------------------------

export async function createTemplate(name: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = templateNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_templates")
    .insert({ clinic_id: member.clinicId, name: parsed.data.name });

  if (error) return { error: "Não foi possível criar o modelo." };
  revalidateAnamnesis();
  return { success: true };
}

export async function renameTemplate(templateId: string, name: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = templateNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_templates")
    .update({ name: parsed.data.name })
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível renomear o modelo." };
  revalidateAnamnesis();
  return { success: true };
}

export async function toggleTemplateActive(templateId: string, active: boolean): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_templates")
    .update({ active })
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível atualizar o modelo." };
  revalidateAnamnesis();
  return { success: true };
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_templates")
    .delete()
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId);

  if (error) {
    return {
      error:
        "Não foi possível excluir este modelo: já existem anamneses enviadas com ele. Desative-o em vez de excluir.",
    };
  }
  revalidateAnamnesis();
  return { success: true };
}

// ---------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------

export async function addQuestion(
  templateId: string,
  question: { label: string; type: string; required: boolean; options: string[] },
): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = questionSchema.safeParse(question);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pergunta inválida." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("anamnesis_questions")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  const { error } = await supabase.from("anamnesis_questions").insert({
    template_id: templateId,
    clinic_id: member.clinicId,
    label: parsed.data.label,
    type: parsed.data.type,
    required: parsed.data.required,
    options: CHOICE_QUESTION_TYPES.includes(parsed.data.type) ? parsed.data.options : [],
    position: count ?? 0,
  });

  if (error) return { error: "Não foi possível adicionar a pergunta." };
  revalidateAnamnesis();
  return { success: true };
}

export async function updateQuestion(
  questionId: string,
  question: { label: string; type: string; required: boolean; options: string[] },
): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const parsed = questionSchema.safeParse(question);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pergunta inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_questions")
    .update({
      label: parsed.data.label,
      type: parsed.data.type,
      required: parsed.data.required,
      options: CHOICE_QUESTION_TYPES.includes(parsed.data.type) ? parsed.data.options : [],
    })
    .eq("id", questionId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar a pergunta." };
  revalidateAnamnesis();
  return { success: true };
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_questions")
    .delete()
    .eq("id", questionId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível remover a pergunta." };
  revalidateAnamnesis();
  return { success: true };
}

export async function reorderQuestion(
  templateId: string,
  questionId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const member = await requirePermission("settings_access");
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("anamnesis_questions")
    .select("id, position")
    .eq("template_id", templateId)
    .eq("clinic_id", member.clinicId)
    .order("position", { ascending: true });

  if (!questions) return { error: "Não foi possível reordenar." };

  const index = questions.findIndex((q) => q.id === questionId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= questions.length) return { success: true };

  const current = questions[index];
  const swap = questions[swapIndex];

  await Promise.all([
    supabase
      .from("anamnesis_questions")
      .update({ position: swap.position })
      .eq("id", current.id)
      .eq("clinic_id", member.clinicId),
    supabase
      .from("anamnesis_questions")
      .update({ position: current.position })
      .eq("id", swap.id)
      .eq("clinic_id", member.clinicId),
  ]);

  revalidateAnamnesis();
  return { success: true };
}

// ---------------------------------------------------------------------
// Responses — sending to a patient and reviewing (authenticated side)
// ---------------------------------------------------------------------

export async function sendAnamnesis(
  patientId: string,
  templateId: string,
): Promise<{ error: string } | { success: true; token: string }> {
  const member = await requirePermission("patients_edit");
  const supabase = await createClient();

  const token = randomBytes(24).toString("base64url");

  const { error } = await supabase.from("anamnesis_responses").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    template_id: templateId,
    access_token: token,
  });

  if (error) return { error: "Não foi possível criar a anamnese para este paciente." };

  revalidateAnamnesis(patientId);
  return { success: true, token };
}

export type ResponseAnswerDetail = {
  templateName: string;
  status: "pending" | "completed" | "reviewed";
  questions: { id: string; label: string; type: string; options: string[] }[];
  answers: Record<string, string | string[]>;
};

export async function getResponseAnswers(responseId: string): Promise<ResponseAnswerDetail | null> {
  const member = await requirePermission("patients_view");
  const supabase = await createClient();

  const { data: response } = await supabase
    .from("anamnesis_responses")
    .select(
      "status, answers, anamnesis_templates(name, anamnesis_questions(id, label, type, options, position))",
    )
    .eq("id", responseId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!response) return null;

  const template = response.anamnesis_templates as unknown as {
    name: string;
    anamnesis_questions: { id: string; label: string; type: string; options: string[]; position: number }[];
  } | null;

  if (!template) return null;

  return {
    templateName: template.name,
    status: response.status as ResponseAnswerDetail["status"],
    questions: [...template.anamnesis_questions].sort((a, b) => a.position - b.position),
    answers: (response.answers ?? {}) as Record<string, string | string[]>,
  };
}

export async function markResponseReviewed(responseId: string): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("anamnesis_responses")
    .update({ status: "reviewed" })
    .eq("id", responseId)
    .eq("clinic_id", member.clinicId)
    .eq("status", "completed");

  if (error) return { error: "Não foi possível marcar como revisada." };
  revalidateAnamnesis();
  return { success: true };
}

// ---------------------------------------------------------------------
// Public fill flow — unauthenticated, authorized only by possession of
// the unguessable access_token. Uses the service role deliberately,
// the same pattern as the user-invite flow in src/actions/users.ts.
// ---------------------------------------------------------------------

export type PublicAnamnesis = {
  clinicName: string;
  patientName: string;
  templateName: string;
  status: "pending" | "completed" | "reviewed";
  questions: {
    id: string;
    label: string;
    type: (typeof QUESTION_TYPES)[number];
    required: boolean;
    options: string[];
  }[];
};

export async function getPublicAnamnesis(token: string): Promise<PublicAnamnesis | null> {
  const admin = createAdminClient();

  const { data: response } = await admin
    .from("anamnesis_responses")
    .select(
      "status, template_id, patients(name), clinics(name), anamnesis_templates(name, anamnesis_questions(id, label, type, required, options, position))",
    )
    .eq("access_token", token)
    .maybeSingle();

  if (!response) return null;

  const template = response.anamnesis_templates as unknown as {
    name: string;
    anamnesis_questions: {
      id: string;
      label: string;
      type: string;
      required: boolean;
      options: string[];
      position: number;
    }[];
  } | null;

  if (!template) return null;

  return {
    clinicName: (response.clinics as unknown as { name: string } | null)?.name ?? "",
    patientName: (response.patients as unknown as { name: string } | null)?.name ?? "",
    templateName: template.name,
    status: response.status as PublicAnamnesis["status"],
    questions: [...template.anamnesis_questions]
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        id: q.id,
        label: q.label,
        type: q.type as PublicAnamnesis["questions"][number]["type"],
        required: q.required,
        options: q.options,
      })),
  };
}

export async function submitAnamnesis(
  token: string,
  answers: Record<string, string | string[]>,
): Promise<{ error: string } | { success: true }> {
  const admin = createAdminClient();

  const { data: response } = await admin
    .from("anamnesis_responses")
    .select("id, status, template_id")
    .eq("access_token", token)
    .maybeSingle();

  if (!response) return { error: "Formulário não encontrado." };
  if (response.status !== "pending") {
    return { error: "Este formulário já foi enviado anteriormente." };
  }

  const { data: questions } = await admin
    .from("anamnesis_questions")
    .select("id, required")
    .eq("template_id", response.template_id);

  const missingRequired = (questions ?? []).some((q) => {
    if (!q.required) return false;
    const value = answers[q.id];
    return value == null || (Array.isArray(value) ? value.length === 0 : value === "");
  });

  if (missingRequired) {
    return { error: "Responda todas as perguntas obrigatórias antes de enviar." };
  }

  const { error } = await admin
    .from("anamnesis_responses")
    .update({ status: "completed", answers, completed_at: new Date().toISOString() })
    .eq("id", response.id);

  if (error) return { error: "Não foi possível enviar suas respostas. Tente novamente." };
  return { success: true };
}
