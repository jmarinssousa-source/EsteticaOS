import { z } from "zod";
import { SESSION_STATUSES } from "@/lib/sessions/constants";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const sessionSchema = z.object({
  patientId: z.string().trim().min(1, "Selecione o paciente."),
  professionalId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  procedureId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  packageBalanceId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  sessionDate: z.string().trim().min(1, "Informe a data."),
  status: z.enum(SESSION_STATUSES),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
});
