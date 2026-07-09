"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { patientRecordSchema, photoUploadSchema } from "@/lib/validations/prontuario";
import { PATIENT_MEDIA_BUCKET } from "@/lib/prontuario/constants";
import type { ActionState } from "@/actions/auth";

type ActionResult = { error?: string } | { success: true };

function revalidatePatient(patientId: string) {
  revalidatePath(`/pacientes/${patientId}`);
}

function dataUrlToBuffer(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
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
  const recordId = randomUUID();
  let mapImagePath: string | null = null;

  if (input.mapImageDataUrl && parsed.data.mapType) {
    mapImagePath = `${member.clinicId}/${patientId}/records/${recordId}.png`;
    const { error: uploadError } = await supabase.storage
      .from(PATIENT_MEDIA_BUCKET)
      .upload(mapImagePath, dataUrlToBuffer(input.mapImageDataUrl), { contentType: "image/png" });

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

  if (error) return { error: "Não foi possível salvar a evolução." };

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

  const supabase = await createClient();

  for (const file of files) {
    const photoId = randomUUID();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${member.clinicId}/${patientId}/photos/${photoId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PATIENT_MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type || "image/jpeg" });

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
