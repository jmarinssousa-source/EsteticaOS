import type { BudgetStatus } from "@/lib/orcamentos/constants";

export type Budget = {
  id: string;
  patient_id: string;
  status: BudgetStatus;
  discount: number;
  total_value: number;
  notes: string | null;
  created_at: string;
};

export type BudgetItem = {
  id: string;
  budget_id: string;
  procedure_id: string | null;
  package_id: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  professional_id: string | null;
  commission: number;
};
