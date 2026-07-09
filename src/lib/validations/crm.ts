import { z } from "zod";
import { LEAD_ORIGINS } from "@/lib/crm/constants";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do lead."),
  phone: z.preprocess(emptyToNull, z.string().trim().nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().nullable()),
  origin: z.enum(LEAD_ORIGINS),
  assignedTo: z.preprocess(emptyToNull, z.string().trim().nullable()),
  nextAction: z.preprocess(emptyToNull, z.string().trim().nullable()),
  followUpDate: z.preprocess(emptyToNull, z.string().trim().nullable()),
  potentialValue: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const stageNameSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coluna.").max(40, "Nome muito longo."),
});

export const interactionSchema = z.object({
  note: z.string().trim().min(1, "Escreva uma anotação antes de salvar."),
});
