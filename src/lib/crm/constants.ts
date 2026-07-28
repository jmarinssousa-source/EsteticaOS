/** Papel da coluna no funil — ver 0014_crm_stage_roles.sql. */
export type StageRole = "won" | "lost";

export const STAGE_ROLE_LABELS: Record<StageRole, string> = {
  won: "Converte em paciente",
  lost: "Marca como perdido",
};

export const DEFAULT_STAGES: { name: string; role: StageRole | null }[] = [
  { name: "Novo lead", role: null },
  { name: "Em atendimento", role: null },
  { name: "Avaliação marcada", role: null },
  { name: "Compareceu", role: null },
  { name: "Orçamento enviado", role: null },
  { name: "Fechado", role: "won" },
  { name: "Perdido", role: "lost" },
];

export const LEAD_ORIGINS = [
  "instagram",
  "whatsapp",
  "indicacao",
  "trafego_pago",
  "google",
  "presencial",
  "outro",
] as const;

export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export const LEAD_ORIGIN_LABELS: Record<LeadOrigin, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  trafego_pago: "Tráfego pago",
  google: "Google",
  presencial: "Presencial",
  outro: "Outro",
};

export type LeadStatus = "open" | "converted" | "lost";
