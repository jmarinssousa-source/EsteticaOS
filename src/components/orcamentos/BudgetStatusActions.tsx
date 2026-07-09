"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  approveBudget,
  cancelBudget,
  convertBudgetToSale,
  rejectBudget,
  sendBudget,
} from "@/actions/orcamentos";
import type { BudgetStatus } from "@/lib/orcamentos/constants";
import { Button } from "@/components/ui/button";

export function BudgetStatusActions({ budgetId, status }: { budgetId: string; status: BudgetStatus }) {
  const [isPending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ error?: string } | { success: true }>, successMessage: string) {
    startTransition(async () => {
      const result = await action(budgetId);
      if (result && "error" in result && result.error) toast.error(result.error);
      else toast.success(successMessage);
    });
  }

  if (status === "paid" || status === "rejected" || status === "canceled") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "open" && (
        <Button size="sm" disabled={isPending} onClick={() => run(sendBudget, "Orçamento enviado.")}>
          Marcar como enviado
        </Button>
      )}
      {(status === "open" || status === "sent") && (
        <>
          <Button size="sm" disabled={isPending} onClick={() => run(approveBudget, "Orçamento aprovado.")}>
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(rejectBudget, "Orçamento reprovado.")}
          >
            Reprovar
          </Button>
        </>
      )}
      {status === "approved" && (
        <Button size="sm" disabled={isPending} onClick={() => run(convertBudgetToSale, "Venda criada.")}>
          Converter em venda
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => run(cancelBudget, "Orçamento cancelado.")}
      >
        Cancelar
      </Button>
    </div>
  );
}
