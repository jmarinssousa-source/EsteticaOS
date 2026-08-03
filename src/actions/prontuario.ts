"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { patientRecordSchema, photoUploadSchema } from "@/lib/validations/prontuario";
import { PATIENT_MEDIA_BUCKET } from "@/lib/prontuario/constants";
import { checkPhotoFile, parseMapImageDataUrl } from "@/lib/prontuario/upload";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidatePatient(patientId: string) {
  revalidatePath(`/pacientes/${patientId}`);
}

/**
 * O paciente existe e é desta clínica?
 *
 * O `patientId` vem do cliente. As policies do banco conferem o
 * `clinic_id` que **nós** gravamos, não o paciente apontado — sem esta
 * checagem dava para criar um registro desta clínica pendurado no
 * paciente de outra, e o histórico de duas clínicas passava a se
 * misturar em silêncio.
 */
async function patientBelongsToClinic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
  clinicId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  return Boolean(data);
}

export async function createPatientRecord(
  patientId: string,
  input: {
    procedureId: string;
    recordDate: string;
    notes: string;
    mapType: string;
    complication: string;
    mapImageDataUrl: string | null;
  },
): Promise<ActionResult> {
  const member = await requirePermission("records_edit");
  const parsed = patientRecordSchema.safeParse({
    procedureId: input.procedureId,
    recordDate: input.recordDate,
    notes: input.notes,
    mapType: input.mapType,
    complication: input.complication,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();

  if (!(await patientBelongsToClinic(supabase, patientId, member.clinicId))) {
    return { error: "Paciente não encontrado." };
  }

  const recordId = randomUUID();
  let mapImagePath: string | null = null;

  if (input.mapImageDataUrl && parsed.data.mapType) {
    const mapImage = parseMapImageDataUrl(input.mapImageDataUrl);
    if (!mapImage) return { error: "Não foi possível ler a marcação do mapa." };

    mapImagePath = `${member.clinicId}/${patientId}/records/${recordId}.png`;
    const { error: uploadError } = await supabase.storage
      .from(PATIENT_MEDIA_BUCKET)
      .upload(mapImagePath, mapImage, { contentType: "image/png" });

    if (uploadError) return { error: "Não foi possível salvar a marcação do mapa." };
  }

  const { error } = await supabase.from("patient_records").insert({
    id: recordId,
    clinic_id: member.clinicId,
    patient_id: patientId,
    professional_id: member.userId,
    procedure_id: parsed.data.procedureId,
    record_date: parsed.data.recordDate,
    notes: parsed.data.notes,
    map_type: parsed.data.mapType,
    map_image_path: mapImagePath,
    complication: parsed.data.complication,
  });

  if (error) return { error: "Não foi possível salvar o registro." };

  revalidatePatient(patientId);
  return { success: true };
}

export async function deletePatientRecord(recordId: string, patientId: string): Promise<ActionResult> {
  const member = await requirePermission("records_edit");
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("patient_records")
    .select("map_image_path")
    .eq("id", recordId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!record) return { error: "Registro não encontrado." };

  if (record.map_image_path) {
    await supabase.storage.from(PATIENT_MEDIA_BUCKET).remove([record.map_image_path]);
  }

  const { error } = await supabase
    .from("patient_records")
    .delete()
    .eq("id", recordId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível excluir o registro." };

  revalidatePatient(patientId);
  return { success: true };
}

export async function uploadPatientPhotos(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requirePermission("records_edit");

  const patientId = formData.get("patientId") as string;
  const recordId = (formData.get("recordId") as string) || null;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  const parsed = photoUploadSchema.safeParse({
    photoType: formData.get("photoType"),
    label: formData.get("label"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  if (files.length === 0) return { error: "Selecione ao menos uma foto." };

  // Formato e tamanho conferidos antes de qualquer envio: melhor recusar
  // o lote inteiro do que subir metade e parar no meio. Ver
  // lib/prontuario/upload.ts para o motivo de a lista ser fechada.
  const checked = files.map((file) => ({ file, check: checkPhotoFile(file) }));
  const rejected = checked.find(({ check }) => !check.ok);
  if (rejected && !rejected.check.ok) return { error: rejected.check.error };

  const supabase = await createClient();

  if (!(await patientBelongsToClinic(supabase, patientId, member.clinicId))) {
    return { error: "Paciente não encontrado." };
  }

  for (const { file, check } of checked) {
    if (!check.ok) continue;

    const photoId = randomUUID();
    // Extensão e tipo saem da lista, nunca do nome nem do `file.type`
    // que o navegador declarou.
    const path = `${member.clinicId}/${patientId}/photos/${photoId}.${check.extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PATIENT_MEDIA_BUCKET)
      .upload(path, file, { contentType: check.mimeType });

    if (uploadError) return { error: "Não foi possível enviar uma das fotos. Tente novamente." };

    const { error: insertError } = await supabase.from("patient_photos").insert({
      id: photoId,
      clinic_id: member.clinicId,
      patient_id: patientId,
      record_id: recordId,
      storage_path: path,
      label: parsed.data.label,
      photo_type: parsed.data.photoType,
    });

    if (insertError) return { error: "Foto enviada, mas não foi possível salvar o registro." };
  }

  revalidatePatient(patientId);
  return { success: true };
}

export async function deletePatientPhoto(photoId: string, patientId: string): Promise<ActionResult> {
  const member = await requirePermission("records_edit");
  const supabase = await createClient();

  const { data: photo } = await supabase
    .from("patient_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!photo) return { error: "Foto não encontrada." };

  await supabase.storage.from(PATIENT_MEDIA_BUCKET).remove([photo.storage_path]);

  const { error } = await supabase
    .from("patient_photos")
    .delete()
    .eq("id", photoId)
    .eq("clinic_id", member.clinicId);

  if (error) return { error: "Não foi possível remover a foto." };

  revalidatePatient(patientId);
  return { success: true };
}
