"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createPackage, updatePackage } from "@/actions/packages";
import type { ProcedureOption } from "@/lib/procedures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

export type EditablePackage = {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  validity_days: number | null;
  notes: string | null;
  procedureIds: string[];
};

function buildForm(pkg: EditablePackage | null) {
  return {
    name: pkg?.name ?? "",
    totalSessions: String(pkg?.total_sessions ?? 1),
    price: pkg?.price != null ? String(pkg.price) : "",
    validityDays: pkg?.validity_days != null ? String(pkg.validity_days) : "",
    notes: pkg?.notes ?? "",
    procedureIds: pkg?.procedureIds ?? [],
  };
}

export function PackageFormDialog({
  pkg,
  procedures,
  trigger,
}: {
  pkg: EditablePackage | null;
  procedures: ProcedureOption[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => buildForm(pkg));

  const [syncedWith, setSyncedWith] = useState(open);
  if (open !== syncedWith) {
    setSyncedWith(open);
    if (open) {
      setForm(buildForm(pkg));
      setError(null);
    }
  }

  function toggleProcedure(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      procedureIds: checked ? [...f.procedureIds, id] : f.procedureIds.filter((p) => p !== id),
    }));
  }

  function handleSave() {
    const input = {
      name: form.name,
      totalSessions: Number(form.totalSessions),
      price: Number(form.price),
      validityDays: form.validityDays,
      notes: form.notes,
      procedureIds: form.procedureIds,
    };

    startTransition(async () => {
      const result = pkg ? await updatePackage(pkg.id, input) : await createPackage(input);
      if (result && "error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pkg ? "Editar pacote" : "Novo pacote"}</DialogTitle>
          <DialogDescription>
            Um pacote agrupa sessões de um ou mais procedimentos vendidas de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Nome do pacote</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sessões</Label>
              <Input
                type="number"
                min="1"
                value={form.totalSessions}
                onChange={(e) => setForm((f) => ({ ...f, totalSessions: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Validade (dias)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Sem validade"
                value={form.validityDays}
                onChange={(e) => setForm((f) => ({ ...f, validityDays: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Procedimentos incluídos</Label>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-2">
              {procedures.map((procedure) => (
                <label key={procedure.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.procedureIds.includes(procedure.id)}
                    onCheckedChange={(checked) => toggleProcedure(procedure.id, checked === true)}
                  />
                  {procedure.name}
                </label>
              ))}
              {procedures.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum procedimento cadastrado ainda. Crie um na Agenda ou em Orçamentos.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
            {isPending ? "Salvando..." : "Salvar pacote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
