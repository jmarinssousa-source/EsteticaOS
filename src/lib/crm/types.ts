import type { LeadOrigin, LeadStatus } from "@/lib/crm/constants";

export type Stage = {
  id: string;
  name: string;
  position: number;
};

export type Lead = {
  id: string;
  stage_id: string;
  patient_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  origin: LeadOrigin;
  assigned_to: string | null;
  next_action: string | null;
  follow_up_date: string | null;
  potential_value: number | null;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
  last_moved_at: string;
};

export type ClinicMemberOption = {
  user_id: string;
  full_name: string;
};

export function isLeadStale(lead: Lead, staleLeadDays: number) {
  if (lead.status !== "open") return false;
  const lastMoved = new Date(lead.last_moved_at).getTime();
  const days = (Date.now() - lastMoved) / (1000 * 60 * 60 * 24);
  return days >= staleLeadDays;
}
