import type { AppointmentStatus } from "@/lib/agenda/constants";
import type { ProcedureOption } from "@/lib/procedures/types";

export type { ProcedureOption };

export type Appointment = {
  id: string;
  patient_id: string;
  professional_id: string | null;
  procedure_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
};

export type PatientOption = { id: string; name: string };
export type ProfessionalOption = { user_id: string; full_name: string };
