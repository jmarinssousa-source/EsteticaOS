"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createFinancialEntry } from "@/actions/financeiro";
import type { ActionState } from "@/actions/auth";
import { ENTRY_TYPES, ENTRY_TYPE_LABELS, type EntryType } from "@/lib/financeiro/constants";
import type { PatientOption } from "@/lib/agenda/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Combobox } from "@/components/ui/combobox";
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

export function EntryFormDialog({
  patients,
  lockedPatient,
}: {
  patients: PatientOption[];
  /** Na aba Financeiro de um paciente o lançamento é sempre dele: o campo
   *  de paciente some, para não parecer que dali se lança conta de luz. */
  lockedPatient?: PatientOption;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntryType>("revenue");
  const [state, formAction, pending] = useActionState(createFinancialEntry, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) {
      setOpen(false);
      toast.success("Lançamento criado.");
      // A revalidação do servidor sozinha não estava trazendo a lista
      // nova na aba do paciente; o refresh garante que o que acabou de
      // ser lançado apareça na hora.
      router.refresh();
    }
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
          <DialogDescription>
            {lockedPatient
              ? `Cobrança ou pagamento de ${lockedPatient.name}.`
              : "Registre uma receita ou despesa da clínica."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              name="type"
              items={ENTRY_TYPES.map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] }))}
              value={type}
              onValueChange={(v) => v && setType(v as EntryType)}
            >
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
              <CurrencyInput id="amount" name="amount" required />
              {state.fieldErrors?.amount && (
                <p className="text-sm text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          {lockedPatient ? (
            <input type="hidden" name="patientId" value={lockedPatient.id} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente (opcional)</Label>
              <Combobox
                id="patientId"
                name="patientId"
                placeholder="Sem paciente vinculado"
                emptyMessage="Nenhum paciente encontrado."
                options={patients.map((patient) => ({ value: patient.id, label: patient.name }))}
              />
              <p className="text-xs text-muted-foreground">
                Despesas da clínica (aluguel, luz, material) podem ficar sem paciente — use o × para
                desvincular.
              </p>
            </div>
          )}

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
