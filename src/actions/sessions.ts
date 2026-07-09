"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { sessionSchema } from "@/lib/validations/sessions";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidateSessions(patientId?: string) {
  revalidatePath("/sessoes");
  if (patientId) revalidatePath(`/pacientes/${patientId}`);
}

function readSessionForm(formData: FormData) {
  return {
    patientId: formData.get("patientId"),
    professionalId: formData.get("professionalId"),
    procedureId: formData.get("procedureId"),
    packageBalanceId: formData.get("packageBalanceId"),
    sessionDate: formData.get("sessionDate"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };
}

export async function createSession(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("sessions_edit");
  const parsed = sessionSchema.safeParse(readSessionForm(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    clinic_id: member.clinicId,
    patient_id: parsed.data.patientId,
    professional_id: parsed.data.professionalId,
    procedure_id: parsed.data.procedureId,
    package_balance_id: parsed.data.packageBalanceId,
    session_date: parsed.data.sessionDate,
    status: parsed.data.status,
    notes: parsed.data.notes,
  });

  if (error) return { error: "Não foi possível criar a sessão." };

  revalidateSessions(parsed.data.patientId);
  return { success: true };
}

export async function updateSession(
  sessionId: string,
  patientId: string,
  patch: {
    patientId: string;
    professionalId: string;
    procedureId: string;
    packageBalanceId: string;
    sessionDate: string;
    status: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("sessions_edit");
  const parsed = sessionSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      patient_id: parsed.data.patientId,
      professional_id: parsed.data.professionalId,
      procedure_id: parsed.data.procedureId,
      package_balance_id: parsed.data.packageBalanceId,
      session_date: parsed.data.sessionDate,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", sessionId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar a sessão." };

  revalidateSessions(patientId);
  return { success: true };
}

export async function signSession(
  sessionId: string,
  patientId: string,
  role: "patient" | "professional",
  signatureDataUrl: string,
): Promise<ActionResult> {
  const member = await requirePermission("sessions_edit");
  const supabase = await createClient();

  const column = role === "patient" ? "patient_signature" : "professional_signature";
  const signedAtColumn = role === "patient" ? "patient_signed_at" : "professional_signed_at";

  const { error } = await supabase
    .from("sessions")
    .update({ [column]: signatureDataUrl, [signedAtColumn]: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar a assinatura." };

  revalidateSessions(patientId);
  return { success: true };
}
