import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do pacote."),
  totalSessions: z.coerce.number().int().min(1, "Informe pelo menos 1 sessão."),
  price: z.coerce.number().min(0, "Informe um valor válido."),
  validityDays: z.preprocess(emptyToNull, z.coerce.number().int().min(1).nullable()),
  notes: z.preprocess(emptyToNull, z.string().trim().nullable()),
  procedureIds: z.array(z.string()).min(1, "Selecione pelo menos um procedimento."),
});
