import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { describeTrial, type ClinicPlan } from "@/lib/plan/trial";
import { Button } from "@/components/ui/button";

/**
 * Faixa de aviso do teste grátis. Só aparece quando falta pouco ou já
 * venceu — enquanto sobra prazo, ninguém precisa ver isto todo dia.
 */
export function TrialBanner({ plan, canManage }: { plan: ClinicPlan; canManage: boolean }) {
  if (!plan.warning && !plan.expired) return null;

  const expired = plan.expired;

  return (
    <div
      className={
        expired
          ? "mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 print:hidden"
          : "mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-champagne/50 bg-champagne/10 px-4 py-3 print:hidden"
      }
    >
      {expired ? (
        <Clock className="size-5 shrink-0 text-destructive" aria-hidden />
      ) : (
        <Sparkles className="size-5 shrink-0 text-champagne" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{describeTrial(plan)}</p>
        <p className="text-xs text-muted-foreground">
          {expired
            ? "Seus dados continuam guardados. Ative o plano para voltar a usar a clínica normalmente."
            : "Ative o plano para não perder o acesso à agenda, ao prontuário e ao financeiro."}
        </p>
      </div>
      {canManage && (
        <Button size="sm" nativeButton={false} render={<Link href="/plano" />}>
          Ver plano
        </Button>
      )}
    </div>
  );
}
