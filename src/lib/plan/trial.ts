export const TRIAL_DAYS = 7;

/**
 * Estados possíveis da conta. Ver 0018_subscription.sql para o que cada
 * um significa no banco.
 *
 * `past_due` libera o acesso de propósito: quem já assinou não perde a
 * agenda do dia porque o cartão venceu. Quem bloqueia é `expired`
 * (o teste acabou e ninguém assinou) e `canceled`.
 */
export const PLAN_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "expired",
  "canceled",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export type BillingCycle = "monthly" | "yearly";

export type ClinicPlan = {
  status: PlanStatus;
  neverExpires: boolean;
  trialEndsAt: string | null;
  /** Dias inteiros que faltam de teste. Negativo quando já passou. */
  daysLeft: number | null;
  /** O teste acabou e não há assinatura no lugar. */
  expired: boolean;
  /** Está nos 7 dias de teste, com prazo ainda de pé. */
  onTrial: boolean;
  /** Assinatura paga valendo, inclusive em recuperação de cobrança. */
  subscribed: boolean;
  /** As telas internas devem ser bloqueadas. */
  blocked: boolean;
  billingCycle: BillingCycle | null;
  subscriptionEndsAt: string | null;
};

export function trialEndDate(from = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end.toISOString();
}

/** Aceita o vocabulário antigo ('trial') sem quebrar, para o caso de a
 *  migração 0018 ainda não ter rodado no banco. */
function normalizeStatus(raw: string | null | undefined): PlanStatus | null {
  if (!raw) return null;
  if (raw === "trial") return "trialing";
  return (PLAN_STATUSES as readonly string[]).includes(raw) ? (raw as PlanStatus) : null;
}

/**
 * Traduz as colunas de plano da clínica no que a interface precisa saber.
 *
 * Regra que vale acima de todas: na dúvida, libera. Conta marcada como
 * `never_expires` nunca bloqueia; clínica sem `trial_ends_at` é de antes
 * do controle de teste e também não bloqueia; e um banco sem as colunas
 * (migração não rodada) devolve "assinatura ativa". Trancar a clínica
 * por causa de um SQL que ninguém rodou seria o pior erro possível aqui.
 */
export function resolveClinicPlan(
  row: {
    plan_status?: string | null;
    never_expires?: boolean | null;
    trial_ends_at?: string | null;
    billing_cycle?: string | null;
    subscription_ends_at?: string | null;
  } | null,
): ClinicPlan {
  const neverExpires = row?.never_expires ?? false;
  const trialEndsAt = row?.trial_ends_at ?? null;
  const billingCycle = (row?.billing_cycle as BillingCycle | null) ?? null;
  const subscriptionEndsAt = row?.subscription_ends_at ?? null;
  const stored = normalizeStatus(row?.plan_status);

  const base = {
    neverExpires,
    trialEndsAt,
    billingCycle,
    subscriptionEndsAt,
  };

  // Acesso liberado sem prazo: conta interna, ou clínica anterior ao
  // controle de teste, ou banco sem as colunas.
  if (neverExpires || !stored || !trialEndsAt) {
    return {
      ...base,
      // Sem data de fim não existe teste em andamento, então o estado
      // reportado é "active" mesmo que a coluna ainda diga 'trialing'.
      // Do contrário o selo da tela de Plano diria "Em teste" embaixo de
      // um texto dizendo "Assinatura ativa".
      status: "active",
      daysLeft: null,
      expired: false,
      onTrial: false,
      subscribed: true,
      blocked: false,
    };
  }

  // Quem assinou não depende mais da data do teste.
  if (stored === "active" || stored === "past_due") {
    return {
      ...base,
      status: stored,
      daysLeft: null,
      expired: false,
      onTrial: false,
      subscribed: true,
      blocked: false,
    };
  }

  if (stored === "canceled") {
    return {
      ...base,
      status: "canceled",
      daysLeft: null,
      expired: true,
      onTrial: false,
      subscribed: false,
      blocked: true,
    };
  }

  // Sobrou quem está em teste, ou já marcado como vencido.
  const daysLeft = daysUntil(trialEndsAt);
  const expired = stored === "expired" || daysLeft < 0;

  return {
    ...base,
    status: expired ? "expired" : "trialing",
    daysLeft,
    expired,
    onTrial: !expired,
    subscribed: false,
    blocked: expired,
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

/**
 * A frase da tarja, dita do jeito que a dona da clínica leria em voz
 * alta. Sempre com o número de dias na frente, porque é a informação que
 * ela quer: quanto tempo ainda tenho.
 */
export function describeTrial(plan: ClinicPlan): string {
  if (plan.neverExpires) return "Acesso liberado sem prazo.";
  if (plan.status === "past_due") return "Não conseguimos confirmar o último pagamento.";
  if (plan.status === "canceled") return "Sua assinatura foi encerrada.";
  if (plan.subscribed) return "Assinatura ativa.";
  if (plan.expired) return "Seu teste grátis terminou. Ative o plano para voltar a usar.";
  if (plan.daysLeft === 0) return "Seu teste grátis termina hoje. Ative o plano para continuar usando.";
  if (plan.daysLeft === 1) return "Falta 1 dia para seu teste grátis terminar.";
  return `Faltam ${plan.daysLeft} dias para seu teste grátis terminar.`;
}
