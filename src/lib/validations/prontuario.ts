import { z } from "zod";
import { MAP_TYPES, PHOTO_TYPES } from "@/lib/prontuario/constants";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const patientRecordSchema = z.object({
  procedureId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  recordDate: z.string().trim().min(1, "Informe a data."),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
  mapType: z.preprocess(emptyToNull, z.enum(MAP_TYPES).nullable()),
  complication: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const photoUploadSchema = z.object({
  photoType: z.enum(PHOTO_TYPES),
  label: z.preprocess(emptyToNull, z.string().trim().nullable()),
});
