export const PRODUCT_STATUSES = ["active", "inactive"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const PRODUCT_UNITS = ["un", "ml", "l", "g", "kg", "caixa", "ampola", "frasco"] as const;

/** Not user-configurable (unlike stale_lead_days) — a fixed, simple
 * default for "próximo do vencimento" keeps the feature proportional
 * to what the PRD actually asks for. */
export const EXPIRING_SOON_DAYS = 30;
