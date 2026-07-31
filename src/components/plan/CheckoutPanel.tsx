"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Info, Lock } from "lucide-react";
import { startCheckout } from "@/actions/billing";
import {
  formatPrice,
  PLAN_MONTHLY_PRICE_CENTS,
  PLAN_YEARLY_EQUIVALENT_CENTS,
  PLAN_YEARLY_PRICE_CENTS,
  PLAN_YEARLY_SAVINGS_CENTS,
  type BillingCycle,
} from "@/lib/plan/pricing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Escolha do ciclo da assinatura.
 *
 * Só existe uma decisão para tomar aqui: pagar por mês ou pagar o ano de
 * uma vez. Pix ou cartão é escolhido na tela de pagamento, do lado do
 * provedor — e é assim que tem que ser, porque quem sabe quais formas
 * estão liberadas é ele, não esta tela.
 *
 * O anual vem pré-selecionado porque é a opção mais barata por mês. O
 * mensal fica do lado, com o mesmo peso visual: nada de esconder a opção
 * mais cara de contratar.
 *
 * Enquanto o provedor não estiver configurado, o botão não finge. Diz o
 * que está faltando, e a assinatura continua sendo ativada só por
 * confirmação de pagamento de verdade.
 */

const CYCLES: {
  id: BillingCycle;
  title: string;
  price: string;
  note: string;
  highlight?: string;
}[] = [
  {
    id: "yearly",
    title: "Anual",
    price: `${formatPrice(PLAN_YEARLY_EQUIVALENT_CENTS)}/mês`,
    note: `${formatPrice(PLAN_YEARLY_PRICE_CENTS)} por ano, pagos de uma vez`,
    highlight: `Economize ${formatPrice(PLAN_YEARLY_SAVINGS_CENTS)} por ano`,
  },
  {
    id: "monthly",
    title: "Mensal",
    price: `${formatPrice(PLAN_MONTHLY_PRICE_CENTS)}/mês`,
    note: "Cobrança todo mês",
  },
];

export function CheckoutPanel() {
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onPay() {
    setMessage(null);
    startTransition(async () => {
      const result = await startCheckout(cycle);

      if (result.status === "redirect") {
        // Navegação no cliente: o provedor devolve uma URL externa e é
        // aqui que a pessoa sai do sistema para pagar.
        window.location.href = result.url;
        return;
      }

      setMessage(
        result.status === "not_configured"
          ? "O pagamento ainda está sendo liberado. Enquanto isso, seus dados seguem guardados e a gente avisa assim que estiver no ar."
          : result.message,
      );
    });
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-medium">Como você prefere pagar</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CYCLES.map((option) => {
            const selected = cycle === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
                  "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="billing-cycle"
                    value={option.id}
                    checked={selected}
                    onChange={() => setCycle(option.id)}
                    className="size-4 accent-[var(--primary)] outline-none"
                  />
                  <span className="text-sm font-medium">{option.title}</span>
                </span>
                <span className="mt-2 font-heading text-xl font-semibold">{option.price}</span>
                <span className="text-xs text-muted-foreground">{option.note}</span>
                {option.highlight && (
                  <span className="mt-2 self-start rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-[oklch(0.42_0.08_150)] dark:text-sage">
                    {option.highlight}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-3">
        <Button className="h-11 px-5" disabled={pending} onClick={onPay}>
          {pending ? "Abrindo pagamento..." : "Ativar plano"}
          <ArrowRight className="size-4" />
        </Button>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Você escolhe Pix ou cartão na tela de pagamento. O acesso é liberado aqui assim que o
          pagamento for confirmado — pode levar alguns instantes no Pix.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {message}
        </p>
      )}
    </div>
  );
}
