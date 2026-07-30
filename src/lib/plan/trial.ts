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

/**
 * Dias de calendário até a data, contando hoje como 0.
 *
 * A conta é feita entre as meias-noites, não entre os instantes. Dividir
 * a diferença bruta em milissegundos deslocava tudo em um dia: um teste
 * criado às 14h e vencendo daqui a 7 dias dava 6,99 dias, virava 6 no
 * arredondamento para baixo, e o último dia era anunciado como vencido
 * enquanto ainda valia. Assim quem assina hoje vê "faltam 7 dias", e no
 * dia do vencimento vê "termina hoje" — com o dia inteiro ainda liberado.
 *
 * `round` em vez de `floor` porque dia de mudança de horário de verão
 * tem 23 ou 25 horas.
 */
export function daysUntil(iso: string, now = new Date()): number {
  const end = new Date(iso);
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

export function describeTrial(plan: ClinicPlan): string {
  if (plan.neverExpires) return "Acesso liberado sem prazo.";
  if (plan.status === "active") return "Assinatura ativa.";
  if (plan.expired) return "Seu teste grátis terminou.";
  if (plan.daysLeft === 0) return "Seu teste grátis termina hoje.";
  if (plan.daysLeft === 1) return "Falta 1 dia de teste grátis.";
  return `Faltam ${plan.daysLeft} dias de teste grátis.`;
}
