import { z } from "zod";
import { ENTRY_TYPES, PAYMENT_METHODS } from "@/lib/financeiro/constants";

const emptyToNull = (value: unknown) => (value === "" || value == null ? null : value);

export const financialEntrySchema = z.object({
  type: z.enum(ENTRY_TYPES),
  description: z.string().trim().min(2, "Descreva o lançamento."),
  amount: z.coerce.number().min(0.01, "Informe um valor válido."),
  patientId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  dueDate: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const entryPaymentSchema = z.object({
  status: z.enum(["pending", "paid", "overdue", "canceled"]),
  paymentDate: z.preprocess(emptyToNull, z.string().trim().nullable()),
  paymentMethod: z.preprocess(emptyToNull, z.enum(PAYMENT_METHODS).nullable()),
  installments: z.preprocess(emptyToNull, z.coerce.number().int().min(1).nullable()),
  cardAuthorizationCode: z.preprocess(emptyToNull, z.string().trim().nullable()),
  nfIssued: z.boolean(),
  nfNumber: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const saleItemSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amount: z.coerce.number().min(0.01, "Informe um valor válido."),
  installments: z.preprocess(emptyToNull, z.coerce.number().int().min(1).nullable()),
  authorizationCode: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const saleCheckoutSchema = z.object({
  payments: z.array(saleItemSchema).min(1, "Informe ao menos uma forma de pagamento."),
});

export const commissionRuleSchema = z.object({
  professionalId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  procedureId: z.preprocess(emptyToNull, z.string().trim().nullable()),
  basis: z.enum(["sold", "received"]),
  ratePercent: z.coerce.number().min(0).max(100),
});
