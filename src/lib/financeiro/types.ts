import type { EntryStatus, EntryType, PaymentMethod, CommissionBasis } from "@/lib/financeiro/constants";

export type FinancialEntry = {
  id: string;
  patient_id: string | null;
  sale_id: string | null;
  type: EntryType;
  description: string;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: EntryStatus;
  payment_method: PaymentMethod | null;
  installments: number | null;
  card_authorization_code: string | null;
  commission_amount: number | null;
  nf_issued: boolean;
  nf_number: string | null;
  created_at: string;
};

export type CommissionRule = {
  id: string;
  professional_id: string | null;
  procedure_id: string | null;
  basis: CommissionBasis;
  /** Percentual OU valor fixo por atendimento — nunca os dois. */
  rate_percent: number | null;
  fixed_amount: number | null;
  custom_basis_label: string | null;
};
