"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBudgetNotes } from "@/actions/orcamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BudgetNotesForm({
  budgetId,
  notes,
  discount,
  canEdit,
}: {
  budgetId: string;
  notes: string | null;
  discount: number;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ notes: notes ?? "", discount: String(discount) });

  function handleSave() {
    startTransition(async () => {
      const result = await updateBudgetNotes(budgetId, {
        notes: form.notes,
        discount: Number(form.discount),
      });
      if ("error" in result) toast.error(result.error);
      else toast.success("Orçamento atualizado.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-2">
        <Label>Desconto geral (R$)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.discount}
          disabled={!canEdit}
          onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          rows={2}
          value={form.notes}
          disabled={!canEdit}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
      {canEdit && (
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      )}
    </div>
  );
}
