"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  approveBudget,
  cancelBudget,
  rejectBudget,
  sendBudget,
} from "@/actions/orcamentos";
import type { BudgetStatus } from "@/lib/orcamentos/constants";
import { Button } from "@/components/ui/button";
import { ConvertToSaleDialog } from "@/components/orcamentos/ConvertToSaleDialog";

export function BudgetStatusActions({
  budgetId,
  status,
  total,
}: {
  budgetId: string;
  status: BudgetStatus;
  total: number;
}) {
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
      {status === "approved" && <ConvertToSaleDialog budgetId={budgetId} total={total} />}
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
