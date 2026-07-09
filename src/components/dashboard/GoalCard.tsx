"use client";

import { useActionState, useState } from "react";
import { Target } from "lucide-react";
import { setMonthlyGoal } from "@/actions/goals";
import type { ActionState } from "@/actions/auth";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

export function GoalCard({
  yearMonth,
  goalAmount,
  soldAmount,
  canEdit,
}: {
  yearMonth: string;
  goalAmount: number;
  soldAmount: number;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(setMonthlyGoal, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  const remaining = Math.max(goalAmount - soldAmount, 0);
  const progress = goalAmount > 0 ? Math.min((soldAmount / goalAmount) * 100, 100) : 0;

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4 text-muted-foreground" />
          Meta do mês
        </CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Editar meta
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Meta do mês</DialogTitle>
                <DialogDescription>
                  Defina o valor que a clínica precisa vender neste mês.
                </DialogDescription>
              </DialogHeader>
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="yearMonth" value={yearMonth} />
                {state.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="goalAmount">Meta (R$)</Label>
                  <Input
                    id="goalAmount"
                    name="goalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={goalAmount || ""}
                    required
                  />
                  {state.fieldErrors?.goalAmount && (
                    <p className="text-sm text-destructive">{state.fieldErrors.goalAmount[0]}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Salvando..." : "Salvar meta"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-xl font-bold">{formatCurrency(goalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendido no mês</p>
            <p className="text-xl font-bold">{formatCurrency(soldAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Falta para a meta</p>
            <p className="text-xl font-bold">{formatCurrency(remaining)}</p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {goalAmount === 0 && (
          <p className="text-xs text-muted-foreground">
            {canEdit
              ? "Nenhuma meta definida para este mês ainda."
              : "O dono/admin ou gerente ainda não definiu a meta deste mês."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          O valor vendido passa a ser calculado automaticamente a partir da Fase 6 — Orçamentos e
          Vendas.
        </p>
      </CardContent>
    </Card>
  );
}
