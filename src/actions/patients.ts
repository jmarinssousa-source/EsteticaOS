"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { patientSchema } from "@/lib/validations/patients";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

export async function createPatient(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("patients_edit");

  const parsed = patientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { birthDate, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data: patient, error } = await supabase
    .from("patients")
    .insert({ clinic_id: member.clinicId, birth_date: birthDate, ...rest })
    .select("id")
    .single();

  if (error || !patient) return { error: "Não foi possível cadastrar o paciente." };

  revalidatePath("/pacientes");
  redirect(`/pacientes/${patient.id}`);
}

export async function updatePatient(
  patientId: string,
  patch: {
    name: string;
    phone: string;
    email: string;
    cpf: string;
    birthDate: string;
    gender: string;
    address: string;
    notes: string;
  },
): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");
  const parsed = patientSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { birthDate, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({ birth_date: birthDate, ...rest })
    .eq("id", patientId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível salvar o paciente." };

  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/pacientes");
  return { success: true };
}
