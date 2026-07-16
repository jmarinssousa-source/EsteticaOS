"use client";

import { useActionState, useState } from "react";
import { Flag, Target, TrendingUp, Wallet } from "lucide-react";
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

// Status palette (fixed, not themed): red/orange track how far behind the
// goal the clinic is; green marks hitting it; blue kicks in once it's been
// clearly surpassed — a visibly different, more celebratory tier.
function progressColor(progress: number) {
  if (progress >= 120) return "#3b6fc4";
  if (progress >= 100) return "#4f9b6e";
  if (progress >= 40) return "#d98a3d";
  return "#c75450";
}

function progressStatusLabel(progress: number) {
  if (progress >= 120) return "Meta ultrapassada! Resultado excepcional.";
  if (progress >= 100) return "Meta batida! Parabéns pelo resultado.";
  if (progress >= 70) return "Quase lá! Falta pouco para bater a meta.";
  if (progress >= 40) return "Atenção: ritmo abaixo do ideal.";
  return "Crítico: bem atrás da meta.";
}

// A full ring instead of a semicircle: the background track is always a
// complete circle, so there's never a mostly-empty arc at low percentages
// and no asymmetric viewBox to get the aspect ratio wrong. Fixed square
// pixel size (no %, no aspect-ratio auto-computation) so it can't collapse
// depending on the parent's flex sizing.
function GoalGauge({ progress, color }: { progress: number; color: string }) {
  const size = 176;
  const r = 76;
  const cx = 88;
  const cy = 88;
  const circumference = 2 * Math.PI * r;
  const arcProgress = Math.min(progress, 100);
  const dashOffset = circumference * (1 - arcProgress / 100);

  return (
    <svg
      viewBox="0 0 176 176"
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={`${Math.round(progress)}% da meta atingida`}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={16} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={32} fontWeight={800} fill={color}>
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

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
  const overage = Math.max(soldAmount - goalAmount, 0);
  const goalMet = goalAmount > 0 && soldAmount >= goalAmount;
  const progress = goalAmount > 0 ? (soldAmount / goalAmount) * 100 : 0;
  const color = progressColor(progress);

  return (
    <Card
      className="sm:col-span-2 lg:col-span-3"
      style={goalMet ? { borderLeft: `4px solid ${color}` } : undefined}
    >
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
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex shrink-0 flex-col items-center gap-2 text-center">
            <GoalGauge progress={progress} color={color} />
            <p className="max-w-[176px] text-xs font-medium" style={{ color }}>
              {progressStatusLabel(progress)}
            </p>
          </div>
          <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Wallet className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Meta</p>
                <p className="truncate text-lg font-bold">{formatCurrency(goalAmount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <TrendingUp className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vendido no mês</p>
                <p className="truncate text-lg font-bold">{formatCurrency(soldAmount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Flag className="size-5 shrink-0" style={{ color: goalMet ? color : "var(--muted-foreground)" }} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {goalMet ? "Superou a meta em" : "Falta para a meta"}
                </p>
                <p className="truncate text-lg font-bold" style={goalMet ? { color } : undefined}>
                  {formatCurrency(goalMet ? overage : remaining)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {goalAmount === 0 && (
          <p className="text-xs text-muted-foreground">
            {canEdit
              ? "Nenhuma meta definida para este mês ainda."
              : "O dono/admin ainda não definiu a meta deste mês."}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          O valor vendido é somado automaticamente sempre que você aprova um orçamento e ele vira
          uma venda, em Orçamentos.
        </p>
      </CardContent>
    </Card>
  );
}
