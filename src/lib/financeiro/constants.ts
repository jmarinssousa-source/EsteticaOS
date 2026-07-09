export const ENTRY_TYPES = ["revenue", "expense"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  revenue: "Receita",
  expense: "Despesa",
};

export const ENTRY_STATUSES = ["pending", "paid", "overdue", "canceled"] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  canceled: "Cancelado",
};

export const PAYMENT_METHODS = [
  "cash",
  "pix",
  "debit_card",
  "credit_card",
  "bank_transfer",
  "boleto",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  bank_transfer: "Transferência",
  boleto: "Boleto",
  other: "Outro",
};

export const COMMISSION_BASIS = ["sold", "received"] as const;
export type CommissionBasis = (typeof COMMISSION_BASIS)[number];

export const COMMISSION_BASIS_LABELS: Record<CommissionBasis, string> = {
  sold: "Sobre valor vendido",
  received: "Sobre valor recebido",
};
