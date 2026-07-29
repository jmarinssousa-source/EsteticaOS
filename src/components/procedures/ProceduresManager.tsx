"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createProcedure, deleteProcedure, updateProcedure } from "@/actions/procedures";
import type { ProcedureOption } from "@/lib/procedures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function ProcedureRow({ procedure }: { procedure: ProcedureOption }) {
  const [name, setName] = useState(procedure.name);
  const [price, setPrice] = useState(procedure.price != null ? String(procedure.price) : "");
  const [isPending, startTransition] = useTransition();

  // Compara como número: "1234.50" e 1234.5 são o mesmo preço.
  const changed =
    name.trim() !== procedure.name || Number(price || 0) !== Number(procedure.price ?? 0);

  function handleSave() {
    startTransition(async () => {
      const result = await updateProcedure(procedure.id, name, price);
      if ("error" in result) toast.error(result.error);
      else toast.success("Procedimento salvo.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProcedure(procedure.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Procedimento excluído.");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nome</Label>
        <Input value={name} disabled={isPending} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="w-36 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
        <CurrencyInput value={price} disabled={isPending} onValueChange={setPrice} />
      </div>
      <Button size="sm" onClick={handleSave} disabled={isPending || !changed || !name.trim()}>
        Salvar
      </Button>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-9" />}>
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{procedure.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Só dá para excluir procedimentos que ainda não foram usados em agendamentos,
              orçamentos, pacotes ou atendimentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ProceduresManager({ procedures }: { procedures: ProcedureOption[] }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const visible = procedures.filter((procedure) =>
    procedure.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createProcedure(trimmed, price);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Procedimento cadastrado.");
      setName("");
      setPrice("");
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="newProcedure" className="text-xs text-muted-foreground">
            Novo procedimento
          </Label>
          <Input
            id="newProcedure"
            placeholder="Ex.: Limpeza de pele profunda"
            value={name}
            disabled={isPending}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
          <CurrencyInput value={price} disabled={isPending} onValueChange={setPrice} />
        </div>
        <Button type="submit" disabled={isPending || !name.trim()}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </form>

      {procedures.length > 6 && (
        <Input
          placeholder="Buscar procedimento"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {procedures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum procedimento cadastrado ainda. Comece pelos que a clínica mais faz.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((procedure) => (
            <ProcedureRow key={procedure.id} procedure={procedure} />
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum procedimento com esse nome.</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {procedures.length} procedimento{procedures.length === 1 ? "" : "s"} no catálogo · o valor
        preenche o orçamento automaticamente, mas pode ser alterado em cada venda.
        {procedures.some((p) => p.price == null) && " Alguns ainda estão sem valor."}
      </p>
    </div>
  );
}
