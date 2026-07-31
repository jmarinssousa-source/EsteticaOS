import { AlertTriangle, Check, Lock } from "lucide-react";
import { getClinicPlan, getCurrentMember } from "@/lib/auth/session";
import { describeTrial, TRIAL_DAYS } from "@/lib/plan/trial";
import { PLAN_FEATURES, PLAN_NAME } from "@/lib/plan/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutPanel } from "@/components/plan/CheckoutPanel";

export const metadata = { title: "Plano — EstéticaOS" };

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Rótulo curto do estado, para o selo ao lado do título. */
function describeStatus(status: string, neverExpires: boolean): string {
  if (neverExpires) return "Sem prazo";
  switch (status) {
    case "active":
      return "Assinatura ativa";
    case "past_due":
      return "Pagamento pendente";
    case "expired":
      return "Teste vencido";
    case "canceled":
      return "Assinatura encerrada";
    default:
      return "Em teste";
  }
}

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ acesso?: string }>;
}) {
  // Sem `requirePermission("settings_access")`: quando o teste vence,
  // esta é a única tela de pé, e ela precisa abrir para qualquer pessoa
  // da equipe que caia aqui. Quem contrata continua sendo só o dono, e
  // isso é checado no botão e de novo na action de checkout.
  const [member, plan, params] = await Promise.all([
    getCurrentMember(),
    getClinicPlan(),
    searchParams,
  ]);

  const canManage = member?.role === "owner";
  const blockedNotice = params.acesso === "bloqueado";
  const trialEndsAt = formatDate(plan.trialEndsAt);
  const subscriptionEndsAt = formatDate(plan.subscriptionEndsAt);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano</h1>
        <p className="text-sm text-muted-foreground">
          Situação da sua assinatura do EstéticaOS.
        </p>
      </div>

      {/* Quem chegou aqui por redirecionamento precisa entender por que
          saiu de onde estava, antes de qualquer outra coisa. */}
      {blockedNotice && plan.blocked && (
        <div
          role="alert"
          className="flex flex-wrap items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
        >
          <Lock className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">As telas da clínica estão pausadas</p>
            <p className="text-sm text-muted-foreground">
              Nenhum dado foi apagado. Agenda, prontuário, financeiro e todo o histórico voltam do
              jeito que estavam assim que o plano for ativado.
            </p>
          </div>
        </div>
      )}

      {plan.status === "past_due" && (
        <div
          role="alert"
          className="flex flex-wrap items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Não conseguimos confirmar o último pagamento</p>
            <p className="text-sm text-muted-foreground">
              O acesso segue liberado. Atualize a forma de pagamento para manter a assinatura em dia.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{describeTrial(plan)}</CardTitle>
            <Badge variant={plan.blocked || plan.status === "past_due" ? "destructive" : "default"}>
              {describeStatus(plan.status, plan.neverExpires)}
            </Badge>
          </div>
          <CardDescription>
            {plan.neverExpires
              ? "Esta clínica está marcada como acesso permanente e não é afetada pelo prazo de teste."
              : plan.subscribed && subscriptionEndsAt
                ? `Sua assinatura está válida até ${subscriptionEndsAt}.`
                : plan.subscribed
                  ? "Todos os recursos liberados, sem data de corte."
                  : plan.expired && trialEndsAt
                    ? `Seu teste de ${TRIAL_DAYS} dias terminou em ${trialEndsAt}.`
                    : trialEndsAt
                      ? `Seu teste de ${TRIAL_DAYS} dias vai até ${trialEndsAt}.`
                      : `Teste grátis de ${TRIAL_DAYS} dias.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">{PLAN_NAME}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Um plano só, com profissionais e pacientes ilimitados. O que a clínica cresce não muda
              o valor.
            </p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {PLAN_FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* O checkout só aparece para quem tem o que resolver aqui. */}
          {!plan.neverExpires && !plan.subscribed && canManage && (
            <div className="border-t border-border pt-6">
              <CheckoutPanel />
            </div>
          )}

          {!plan.neverExpires && !plan.subscribed && !canManage && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">Quem ativa o plano é quem administra a clínica</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Avise a pessoa responsável pela conta. Ela consegue ativar por aqui, no cartão ou no
                Pix.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
