import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const procedureSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do procedimento."),
  price: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable()),
});
