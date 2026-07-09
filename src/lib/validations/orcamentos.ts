import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const budgetItemSchema = z
  .object({
    procedureId: z.preprocess(emptyToNull, z.string().trim().nullable()),
    packageId: z.preprocess(emptyToNull, z.string().trim().nullable()),
    quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1."),
    unitPrice: z.coerce.number().min(0, "Informe um valor válido."),
    discount: z.coerce.number().min(0).default(0),
    professionalId: z.preprocess(emptyToNull, z.string().trim().nullable()),
    commission: z.coerce.number().min(0).default(0),
  })
  .refine((data) => Boolean(data.procedureId) !== Boolean(data.packageId), {
    error: "Selecione um procedimento avulso ou um pacote.",
    path: ["procedureId"],
  });

export const budgetNotesSchema = z.object({
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
  discount: z.coerce.number().min(0).default(0),
});
