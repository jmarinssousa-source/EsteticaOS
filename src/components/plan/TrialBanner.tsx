import Link from "next/link";
import { AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { describeTrial, type ClinicPlan } from "@/lib/plan/trial";
import { formatPrice, PLAN_MONTHLY_PRICE_CENTS } from "@/lib/plan/pricing";
import { Button } from "@/components/ui/button";

/**
 * Tarja do teste grátis, visível do primeiro ao último dia.
 *
 * Antes ela só aparecia nos três dias finais, e a conta chegava ao fim
 * como surpresa. Agora o prazo fica à vista desde o começo: quem está
 * decidindo precisa saber quanto tempo ainda tem para testar de verdade,
 * e quem esqueceu não descobre no dia em que a agenda trava.
 *
 * Três aparências, por gravidade: informativa durante o teste, de
 * atenção no último dia, e de bloqueio depois de vencido.
 */
export function TrialBanner({ plan, canManage }: { plan: ClinicPlan; canManage: boolean }) {
  // Assinante em dia e conta sem prazo não veem tarja nenhuma.
  if (plan.subscribed && plan.status !== "past_due") return null;
  if (plan.neverExpires) return null;

  const urgent = plan.expired || plan.status === "past_due" || plan.daysLeft === 0;

  const detail = plan.expired
    ? "Seus dados continuam guardados. Ative o plano para voltar a usar a agenda, o prontuário e o financeiro."
    : plan.status === "past_due"
      ? "O acesso segue liberado. Atualize a forma de pagamento para manter a assinatura em dia."
      : `Depois disso, o acesso fica pausado até a ativação do plano. São ${formatPrice(PLAN_MONTHLY_PRICE_CENTS)} por mês, ou menos no anual.`;

  return (
    <div
      role={urgent ? "alert" : undefined}
      className={
        urgent
          ? "mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 print:hidden"
          : "mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-champagne/50 bg-champagne/10 px-4 py-3 print:hidden"
      }
    >
      {plan.expired ? (
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
      ) : plan.status === "past_due" ? (
        <CreditCard className="size-5 shrink-0 text-destructive" aria-hidden />
      ) : (
        <Sparkles
          className={urgent ? "size-5 shrink-0 text-destructive" : "size-5 shrink-0 text-champagne"}
          aria-hidden
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{describeTrial(plan)}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>

      {/* Só quem pode assinar vê o botão. Para o resto da equipe a tarja
          é informativa: mandar a recepção para uma tela que ela não pode
          resolver é só frustração. */}
      {canManage && (
        <Button size="sm" nativeButton={false} render={<Link href="/plano" />}>
          {plan.expired ? "Ativar plano" : "Ver plano"}
        </Button>
      )}
    </div>
  );
}
