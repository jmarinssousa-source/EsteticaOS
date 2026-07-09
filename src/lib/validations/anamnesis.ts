import { z } from "zod";
import { QUESTION_TYPES } from "@/lib/anamnesis/constants";

export const templateNameSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do modelo.").max(80, "Nome muito longo."),
});

export const questionSchema = z.object({
  label: z.string().trim().min(1, "Escreva a pergunta."),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1)).default([]),
});
