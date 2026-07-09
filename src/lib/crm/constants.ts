export const DEFAULT_STAGES = [
  "Novo lead",
  "Em atendimento",
  "Avaliação marcada",
  "Compareceu",
  "Orçamento enviado",
  "Fechado",
  "Perdido",
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
