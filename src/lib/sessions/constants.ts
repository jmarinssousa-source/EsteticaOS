export const SESSION_STATUSES = ["scheduled", "done", "canceled", "pending_signature"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Prevista",
  done: "Realizada",
  canceled: "Cancelada",
  pending_signature: "Pendente de assinatura",
};
