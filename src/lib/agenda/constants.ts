export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "attended",
  "no_show",
  "canceled_by_patient",
  "canceled_by_clinic",
  "rescheduled",
  "done",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Compareceu",
  no_show: "Falta",
  canceled_by_patient: "Cancelado pelo paciente",
  canceled_by_clinic: "Cancelado pela clínica",
  rescheduled: "Reagendado",
  done: "Realizado",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "border-blue-400",
  confirmed: "border-emerald-500",
  attended: "border-emerald-500",
  no_show: "border-red-500",
  canceled_by_patient: "border-muted-foreground/40",
  canceled_by_clinic: "border-muted-foreground/40",
  rescheduled: "border-amber-500",
  done: "border-emerald-600",
};

export type AgendaView = "day" | "week" | "month";
