import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do paciente."),
  phone: z.preprocess(emptyToNull, z.string().trim().nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().nullable()),
  cpf: z.preprocess(emptyToNull, z.string().trim().nullable()),
  birthDate: z.preprocess(emptyToNull, z.string().trim().nullable()),
  gender: z.preprocess(emptyToNull, z.string().trim().nullable()),
  address: z.preprocess(emptyToNull, z.string().trim().nullable()),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
});
