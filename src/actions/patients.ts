"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { patientSchema } from "@/lib/validations/patients";
import { buildPatientSearchFilter } from "@/lib/patients/search";
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

/**
 * Quanto histórico some junto com o paciente. A tela mostra estes
 * números antes de confirmar, porque um cadastro de teste e um paciente
 * com dois anos de atendimento são idênticos na lista.
 */
export type PatientDeletionSummary = {
  name: string;
  appointments: number;
  sessions: number;
  records: number;
  photos: number;
  budgets: number;
  anamnesis: number;
  consents: number;
  financialEntries: number;
};

async function countFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  patientId: string,
) {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId);
  return count ?? 0;
}

export async function getPatientDeletionSummary(
  patientId: string,
): Promise<PatientDeletionSummary | null> {
  const member = await requirePermission("patients_view");
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("name")
    .eq("id", patientId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!patient) return null;

  const [appointments, sessions, records, photos, budgets, anamnesis, consents, financialEntries] =
    await Promise.all([
      countFor(supabase, "appointments", patientId),
      countFor(supabase, "sessions", patientId),
      countFor(supabase, "patient_records", patientId),
      countFor(supabase, "patient_photos", patientId),
      countFor(supabase, "budgets", patientId),
      countFor(supabase, "anamnesis_responses", patientId),
      countFor(supabase, "consent_forms", patientId),
      countFor(supabase, "financial_entries", patientId),
    ]);

  return {
    name: patient.name,
    appointments,
    sessions,
    records,
    photos,
    budgets,
    anamnesis,
    consents,
    financialEntries,
  };
}

/**
 * Exclui o paciente e, por cascata do banco, agenda, sessões, prontuário,
 * fotos, orçamentos, anamneses e termos dele. Os lançamentos financeiros
 * ficam (só perdem o vínculo), para o caixa da clínica não mudar
 * retroativamente, e o lead de origem no CRM também sobrevive.
 *
 * Restrito a dono e gerente: apagar prontuário é decisão de quem
 * administra a clínica, não de quem só edita cadastro no dia a dia.
 */
export async function deletePatient(patientId: string): Promise<ActionResult> {
  const member = await requirePermission("patients_edit");

  if (member.role !== "owner" && member.role !== "manager") {
    return { error: "Só o dono ou o gerente da clínica pode excluir um paciente." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("clinic_id", member.clinicId);

  if (error) {
    console.error("deletePatient falhou:", error.message);
    return { error: "Não foi possível excluir o paciente." };
  }

  revalidatePathsAfterPatientChange();
  return { success: true };
}

function revalidatePathsAfterPatientChange() {
  revalidatePath("/pacientes");
  revalidatePath("/crm");
  revalidatePath("/agenda");
  revalidatePath("/financeiro");
}

/**
 * Exclusão em lote, para limpar uma importação que veio errada sem ter de
 * apagar de um em um. Dois modos:
 *
 * - `ids`: só os pacientes marcados na tela.
 * - `allMatching`: tudo que a busca atual encontra, inclusive o que está
 *   nas outras páginas — é a diferença entre "marquei os 25 desta tela" e
 *   "quero fora os 3275". O filtro é remontado aqui no servidor a partir
 *   do texto buscado, nunca de uma lista vinda do navegador.
 */
export async function deletePatients(
  input: { ids: string[] } | { allMatching: true; search: string },
): Promise<{ error: string } | { success: true; removed: number }> {
  const member = await requirePermission("patients_edit");

  if (member.role !== "owner" && member.role !== "manager") {
    return { error: "Só o dono ou o gerente da clínica pode excluir pacientes." };
  }

  const supabase = await createClient();
  let query = supabase.from("patients").delete().eq("clinic_id", member.clinicId);

  if ("allMatching" in input) {
    const filter = buildPatientSearchFilter(input.search);
    if (filter) query = query.or(filter);
  } else {
    if (input.ids.length === 0) return { error: "Nenhum paciente selecionado." };
    query = query.in("id", input.ids);
  }

  const { data, error } = await query.select("id");

  if (error) {
    console.error("deletePatients falhou:", error.message);
    return { error: "Não foi possível excluir os pacientes selecionados." };
  }

  revalidatePathsAfterPatientChange();
  return { success: true, removed: data?.length ?? 0 };
}
