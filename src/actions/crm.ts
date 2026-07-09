"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember, requirePermission } from "@/lib/auth/session";
import { leadSchema, stageNameSchema, interactionSchema } from "@/lib/validations/crm";
import { DEFAULT_STAGES } from "@/lib/crm/constants";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidateCrm() {
  revalidatePath("/crm");
}

/** Called from the CRM page on load; idempotent. */
export async function ensureDefaultStages(clinicId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  if (count && count > 0) return;

  await supabase.from("crm_stages").insert(
    DEFAULT_STAGES.map((name, index) => ({
      clinic_id: clinicId,
      name,
      position: index,
    })),
  );
}

export async function createStage(name: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = stageNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_stages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", member.clinicId);

  const { error } = await supabase.from("crm_stages").insert({
    clinic_id: member.clinicId,
    name: parsed.data.name,
    position: count ?? 0,
  });

  if (error) return { error: "Não foi possível criar a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function renameStage(stageId: string, name: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = stageNameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_stages")
    .update({ name: parsed.data.name })
    .eq("id", stageId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível renomear a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function deleteStage(stageId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", stageId)
    .eq("clinic_id", member.clinicId);

  if (count && count > 0) {
    return { error: "Mova ou remova os leads desta coluna antes de excluí-la." };
  }

  const { error } = await supabase
    .from("crm_stages")
    .delete()
    .eq("id", stageId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir a coluna." };
  revalidateCrm();
  return { success: true };
}

export async function reorderStage(
  stageId: string,
  direction: "left" | "right",
): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { data: stages } = await supabase
    .from("crm_stages")
    .select("id, position")
    .eq("clinic_id", member.clinicId)
    .order("position", { ascending: true });

  if (!stages) return { error: "Não foi possível reordenar." };

  const index = stages.findIndex((s) => s.id === stageId);
  const swapIndex = direction === "left" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= stages.length) return { success: true };

  const current = stages[index];
  const swap = stages[swapIndex];

  await Promise.all([
    supabase
      .from("crm_stages")
      .update({ position: swap.position })
      .eq("id", current.id)
      .eq("clinic_id", member.clinicId),
    supabase
      .from("crm_stages")
      .update({ position: current.position })
      .eq("id", swap.id)
      .eq("clinic_id", member.clinicId),
  ]);

  revalidateCrm();
  return { success: true };
}

export async function createLead(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("crm_edit");

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    origin: formData.get("origin"),
    assignedTo: formData.get("assignedTo"),
    nextAction: formData.get("nextAction"),
    followUpDate: formData.get("followUpDate"),
    potentialValue: formData.get("potentialValue"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: firstStage } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("clinic_id", member.clinicId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!firstStage) return { error: "Nenhuma coluna encontrada. Recarregue a página." };

  const { assignedTo, ...rest } = parsed.data;

  const { error } = await supabase.from("leads").insert({
    clinic_id: member.clinicId,
    stage_id: firstStage.id,
    assigned_to: assignedTo,
    ...rest,
  });

  if (error) return { error: "Não foi possível criar o lead." };

  revalidateCrm();
  return { success: true };
}

export async function updateLead(
  leadId: string,
  patch: {
    name: string;
    phone: string;
    email: string;
    origin: string;
    assignedTo: string;
    nextAction: string;
    followUpDate: string;
    potentialValue: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = leadSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { assignedTo, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ ...rest, assigned_to: assignedTo })
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o lead." };
  revalidateCrm();
  return { success: true };
}

export async function moveLeadToStage(leadId: string, stageId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ stage_id: stageId, last_moved_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível mover o lead." };
  revalidateCrm();
  return { success: true };
}

export async function addLeadInteraction(leadId: string, note: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const parsed = interactionSchema.safeParse({ note });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Anotação inválida." };

  const supabase = await createClient();
  const { error } = await supabase.from("lead_interactions").insert({
    clinic_id: member.clinicId,
    lead_id: leadId,
    author_id: member.userId,
    note: parsed.data.note,
  });

  if (error) return { error: "Não foi possível salvar a anotação." };
  revalidateCrm();
  return { success: true };
}

export type LeadInteraction = {
  id: string;
  note: string;
  author_id: string | null;
  created_at: string;
};

export async function getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  const member = await getCurrentMember();
  if (!member) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_interactions")
    .select("id, note, author_id, created_at")
    .eq("lead_id", leadId)
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function markLeadLost(leadId: string): Promise<ActionResult> {
  const member = await requirePermission("crm_edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: "lost" })
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível marcar o lead como perdido." };
  revalidateCrm();
  return { success: true };
}

export async function convertLeadToPatient(leadId: string): Promise<ActionResult> {
  const member = await getCurrentMember();
  if (!member) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, clinic_id, name, phone, email, origin, notes, status")
    .eq("id", leadId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!lead) return { error: "Lead não encontrado." };
  if (lead.status === "converted") return { error: "Este lead já foi convertido em paciente." };

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      clinic_id: member.clinicId,
      lead_id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      origin: lead.origin,
      notes: lead.notes,
    })
    .select("id")
    .single();

  if (patientError || !patient) return { error: "Não foi possível criar o paciente." };

  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "converted", patient_id: patient.id })
    .eq("id", lead.id);

  if (leadError) return { error: "Paciente criado, mas não foi possível atualizar o lead." };

  revalidateCrm();
  return { success: true };
}
