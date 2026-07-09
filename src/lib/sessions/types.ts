import type { SessionStatus } from "@/lib/sessions/constants";

export type Session = {
  id: string;
  patient_id: string;
  professional_id: string | null;
  procedure_id: string | null;
  package_balance_id: string | null;
  session_date: string;
  status: SessionStatus;
  notes: string | null;
  patient_signature: string | null;
  patient_signed_at: string | null;
  professional_signature: string | null;
  professional_signed_at: string | null;
  created_at: string;
};

export type PackageBalanceOption = {
  id: string;
  package_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  expires_at: string | null;
};
