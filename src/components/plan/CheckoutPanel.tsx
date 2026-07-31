"use client";

import { useState, useTransition } from "react";
import { CreditCard, Info, QrCode } from "lucide-react";
import { startCheckout } from "@/actions/billing";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/billing/methods";
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
 * Escolha do ciclo e da forma de pagamento.
 *
 * O anual vem pré-selecionado porque é a opção mais barata por mês, e é
 * a que a maioria das clínicas escolhe quando enxerga a diferença. O
 * mensal fica do lado, com o mesmo peso visual: nada de esconder a opção
 * mais cara de contratar.
 *
 * Enquanto o provedor de pagamento não estiver ligado, o botão não
 * finge. Ele diz o que está faltando, e a assinatura continua sendo
 * ativada só por confirmação de pagamento de verdade.
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
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  function onPay(chosen: PaymentMethod) {
    setMethod(chosen);
    setMessage(null);
    startTransition(async () => {
      const result = await startCheckout(cycle, chosen);

      if (result.status === "redirect") {
        // Navegação no cliente: o provedor devolve uma URL externa e é
        // aqui que a pessoa sai do sistema para pagar.
        window.location.href = result.url;
        return;
      }

      setMessage(
        result.status === "not_configured"
          ? `O pagamento por ${PAYMENT_METHOD_LABELS[result.method].toLowerCase()} ainda está sendo liberado. Enquanto isso, seus dados seguem guardados e a gente avisa assim que estiver no ar.`
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

      <div className="flex flex-wrap gap-3">
        <Button
          className="h-11 px-5"
          disabled={pending}
          onClick={() => onPay("card")}
        >
          <CreditCard className="size-4" />
          {pending && method === "card" ? "Abrindo..." : "Pagar com cartão"}
        </Button>
        <Button
          variant="outline"
          className="h-11 px-5"
          disabled={pending}
          onClick={() => onPay("pix")}
        >
          <QrCode className="size-4" />
          {pending && method === "pix" ? "Abrindo..." : "Pagar com Pix"}
        </Button>
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
