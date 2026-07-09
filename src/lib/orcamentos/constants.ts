export const BUDGET_STATUSES = ["open", "sent", "approved", "rejected", "paid", "canceled"] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  open: "Aberto",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Reprovado",
  paid: "Pago",
  canceled: "Cancelado",
};
