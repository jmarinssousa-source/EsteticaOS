"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { appointmentSchema } from "@/lib/validations/agenda";
import { APPOINTMENT_STATUSES } from "@/lib/agenda/constants";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidateAgenda() {
  revalidatePath("/agenda");
}

function readAppointmentForm(formData: FormData) {
  return {
    patientId: formData.get("patientId"),
    professionalId: formData.get("professionalId"),
    procedureId: formData.get("procedureId"),
    appointmentDate: formData.get("appointmentDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };
}

export async function createAppointment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("agenda_edit");
  const parsed = appointmentSchema.safeParse(readAppointmentForm(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { patientId, professionalId, procedureId, appointmentDate, startTime, endTime, status, notes } =
    parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert({
    clinic_id: member.clinicId,
    patient_id: patientId,
    professional_id: professionalId,
    procedure_id: procedureId,
    appointment_date: appointmentDate,
    start_time: startTime,
    end_time: endTime,
    status,
    notes,
  });

  if (error) return { error: "Não foi possível criar o agendamento." };

  revalidateAgenda();
  return { success: true };
}

export async function updateAppointment(
  appointmentId: string,
  patch: {
    patientId: string;
    professionalId: string;
    procedureId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("agenda_edit");
  const parsed = appointmentSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { patientId, professionalId, procedureId, appointmentDate, startTime, endTime, status, notes } =
    parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      patient_id: patientId,
      professional_id: professionalId,
      procedure_id: procedureId,
      appointment_date: appointmentDate,
      start_time: startTime,
      end_time: endTime,
      status,
      notes,
    })
    .eq("id", appointmentId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o agendamento." };

  revalidateAgenda();
  return { success: true };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string,
): Promise<ActionResult> {
  const member = await requirePermission("agenda_edit");
  const parsedStatus = APPOINTMENT_STATUSES.includes(status as (typeof APPOINTMENT_STATUSES)[number]);
  if (!parsedStatus) return { error: "Status inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível atualizar o status." };

  revalidateAgenda();
  return { success: true };
}
