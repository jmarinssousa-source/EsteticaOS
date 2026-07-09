import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/agenda/constants";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const appointmentSchema = z
  .object({
    patientId: z.string().trim().min(1, "Selecione o paciente."),
    professionalId: z.preprocess(emptyToNull, z.string().trim().nullable()),
    procedureId: z.preprocess(emptyToNull, z.string().trim().nullable()),
    appointmentDate: z.string().trim().min(1, "Informe a data."),
    startTime: z.string().trim().min(1, "Informe o horário inicial."),
    endTime: z.string().trim().min(1, "Informe o horário final."),
    status: z.enum(APPOINTMENT_STATUSES),
    notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
  })
  .refine((data) => data.endTime > data.startTime, {
    error: "O horário final deve ser depois do horário inicial.",
    path: ["endTime"],
  });

export const procedureNameSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do procedimento."),
});
