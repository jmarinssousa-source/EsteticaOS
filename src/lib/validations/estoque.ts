import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto."),
  category: z.preprocess(emptyToNull, z.string().trim().nullable()),
  quantity: z.coerce.number().min(0, "Informe uma quantidade válida."),
  unit: z.string().trim().min(1, "Informe a unidade."),
  batch: z.preprocess(emptyToNull, z.string().trim().nullable()),
  expirationDate: z.preprocess(emptyToNull, z.string().trim().nullable()),
  cost: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
  price: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
  minStock: z.coerce.number().min(0).default(0),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
});
