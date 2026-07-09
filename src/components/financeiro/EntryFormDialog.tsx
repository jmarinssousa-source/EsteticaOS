"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createFinancialEntry } from "@/actions/financeiro";
import type { ActionState } from "@/actions/auth";
import { ENTRY_TYPES, ENTRY_TYPE_LABELS, type EntryType } from "@/lib/financeiro/constants";
import type { PatientOption } from "@/lib/agenda/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function EntryFormDialog({ patients }: { patients: PatientOption[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntryType>("revenue");
  const [state, formAction, pending] = useActionState(createFinancialEntry, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo lançamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>Registre uma receita ou despesa da clínica.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" value={type} onValueChange={(v) => v && setType(v as EntryType)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ENTRY_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
              {state.fieldErrors?.amount && (
                <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientId">Paciente (opcional)</Label>
            <Select name="patientId" defaultValue="">
              <SelectTrigger id="patientId" className="w-full">
                <SelectValue placeholder="Sem paciente vinculado" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Criar lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
