"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { addBudgetItem, updateBudgetItem } from "@/actions/orcamentos";
import { createProcedure } from "@/actions/procedures";
import { cn } from "@/lib/utils";
import type { ProcedureOption } from "@/lib/procedures/types";
import type { PackageOption } from "@/lib/packages/types";
import type { ProfessionalOption } from "@/lib/agenda/types";
import type { BudgetItem } from "@/lib/orcamentos/types";
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
} from "@/components/ui/dialog";

type ItemType = "procedure" | "package";

function buildForm(item: BudgetItem | null) {
  return {
    itemType: (item?.package_id ? "package" : "procedure") as ItemType,
    procedureId: item?.procedure_id ?? "",
    packageId: item?.package_id ?? "",
    quantity: String(item?.quantity ?? 1),
    unitPrice: item?.unit_price != null ? String(item.unit_price) : "",
    discount: item?.discount != null ? String(item.discount) : "0",
    professionalId: item?.professional_id ?? "",
    commission: item?.commission != null ? String(item.commission) : "0",
  };
}

export function BudgetItemDialog({
  budgetId,
  item,
  procedures,
  packages,
  professionals,
  open,
  onOpenChange,
}: {
  budgetId: string;
  item: BudgetItem | null;
  procedures: ProcedureOption[];
  packages: PackageOption[];
  professionals: ProfessionalOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [procedureList, setProcedureList] = useState(procedures);
  const [form, setForm] = useState(() => buildForm(item));
  const [newProcedureOpen, setNewProcedureOpen] = useState(false);
  const [newProcedureName, setNewProcedureName] = useState("");

  const [syncedWith, setSyncedWith] = useState(open);
  if (open !== syncedWith) {
    setSyncedWith(open);
    if (open) {
      setForm(buildForm(item));
      setError(null);
    }
  }

  function handleProcedureChange(procedureId: string) {
    const procedure = procedureList.find((p) => p.id === procedureId);
    setForm((f) => ({
      ...f,
      procedureId,
      unitPrice: procedure?.price != null ? String(procedure.price) : f.unitPrice,
    }));
  }

  function handlePackageChange(packageId: string) {
    const pkg = packages.find((p) => p.id === packageId);
    setForm((f) => ({
      ...f,
      packageId,
      unitPrice: pkg ? String(pkg.price) : f.unitPrice,
    }));
  }

  function handleCreateProcedure() {
    const name = newProcedureName.trim();
    if (!name) return;
    createProcedure(name).then((result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setProcedureList((prev) => [...prev, { id: result.id, name, price: null }]);
      setForm((f) => ({ ...f, procedureId: result.id }));
      setNewProcedureName("");
      setNewProcedureOpen(false);
    });
  }

  function handleSave() {
    const payload = {
      procedureId: form.itemType === "procedure" ? form.procedureId : "",
      packageId: form.itemType === "package" ? form.packageId : "",
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      discount: Number(form.discount),
      professionalId: form.professionalId,
      commission: Number(form.commission),
    };

    startTransition(async () => {
      const result = item
        ? await updateBudgetItem(item.id, budgetId, payload)
        : await addBudgetItem(budgetId, payload);

      if (result && "error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
      } else {
        onOpenChange(false);
      }
    });
  }

  const selectionMissing =
    form.itemType === "procedure" ? !form.procedureId : !form.packageId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Adicionar item"}</DialogTitle>
          <DialogDescription>Um procedimento avulso ou um pacote de sessões.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!item && (
            <div className="flex rounded-lg border p-0.5">
              {(["procedure", "package"] as ItemType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, itemType: type }))}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    form.itemType === type
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {type === "procedure" ? "Procedimento avulso" : "Pacote"}
                </button>
              ))}
            </div>
          )}

          {form.itemType === "procedure" ? (
            <div className="space-y-2">
              <Label>Procedimento</Label>
              {newProcedureOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    placeholder="Nome do procedimento"
                    value={newProcedureName}
                    onChange={(e) => setNewProcedureName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateProcedure();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleCreateProcedure}>
                    Adicionar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={form.procedureId} onValueChange={(v) => v && handleProcedureChange(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedureList.map((procedure) => (
                        <SelectItem key={procedure.id} value={procedure.id}>
                          {procedure.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewProcedureOpen(true)}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Pacote</Label>
              <Select value={form.packageId} onValueChange={(v) => v && handlePackageChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.total_sessions} sessões)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {packages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum pacote cadastrado. Crie um em Configurações &gt; Pacotes.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Desconto (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Comissão (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.commission}
                onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select
              value={form.professionalId || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, professionalId: v === "none" ? "" : (v ?? "") }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem profissional</SelectItem>
                {professionals.map((professional) => (
                  <SelectItem key={professional.user_id} value={professional.user_id}>
                    {professional.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || selectionMissing}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
