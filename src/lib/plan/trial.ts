export const TRIAL_DAYS = 7;

/** A partir de quantos dias restantes a tela começa a avisar. */
export const TRIAL_WARNING_DAYS = 3;

export type PlanStatus = "trial" | "active" | "expired";

export type ClinicPlan = {
  status: PlanStatus;
  neverExpires: boolean;
  trialEndsAt: string | null;
  /** Dias inteiros que faltam. Negativo quando já passou. */
  daysLeft: number | null;
  expired: boolean;
  /** Vale a pena mostrar o aviso de fim de teste? */
  warning: boolean;
};

export function trialEndDate(from = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end.toISOString();
}

/**
 * Traduz as colunas de plano da clínica no que a interface precisa saber.
 *
 * Regras, na ordem: conta marcada como `never_expires` nunca vence; sem
 * `trial_ends_at` também não vence (clínica anterior ao controle de
 * teste); quem assinou não vence. Só sobra vencer quem está em teste e
 * passou da data.
 */
export function resolveClinicPlan(row: {
  plan_status?: string | null;
  never_expires?: boolean | null;
  trial_ends_at?: string | null;
} | null): ClinicPlan {
  const status = (row?.plan_status as PlanStatus | undefined) ?? "active";
  const neverExpires = row?.never_expires ?? false;
  const trialEndsAt = row?.trial_ends_at ?? null;

  if (neverExpires || !trialEndsAt || status === "active") {
    return {
      status: neverExpires ? "active" : status,
      neverExpires,
      trialEndsAt,
      daysLeft: null,
      expired: false,
      warning: false,
    };
  }

  const daysLeft = daysUntil(trialEndsAt);
  const expired = daysLeft < 0;

  return {
    status: expired ? "expired" : "trial",
    neverExpires,
    trialEndsAt,
    daysLeft,
    expired,
    warning: !expired && daysLeft <= TRIAL_WARNING_DAYS,
  };
}

/** Dias inteiros até a data, contando o dia de hoje como 0. */
export function daysUntil(iso: string, now = new Date()): number {
  const end = new Date(iso);
  const diff = end.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function describeTrial(plan: ClinicPlan): string {
  if (plan.neverExpires) return "Acesso liberado sem prazo.";
  if (plan.status === "active") return "Assinatura ativa.";
  if (plan.expired) return "Seu teste grátis terminou.";
  if (plan.daysLeft === 0) return "Seu teste grátis termina hoje.";
  if (plan.daysLeft === 1) return "Falta 1 dia de teste grátis.";
  return `Faltam ${plan.daysLeft} dias de teste grátis.`;
}
