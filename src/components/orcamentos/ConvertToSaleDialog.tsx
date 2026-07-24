"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { convertBudgetToSale } from "@/actions/orcamentos";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/financeiro/constants";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type PaymentRow = {
  method: PaymentMethod;
  amount: string;
  installments: string;
  authorizationCode: string;
};

const CARD_METHODS = new Set<PaymentMethod>(["debit_card", "credit_card"]);

export function ConvertToSaleDialog({ budgetId, total }: { budgetId: string; total: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PaymentRow[]>([
    { method: "pix", amount: total.toFixed(2), installments: "", authorizationCode: "" },
  ]);
  const [isPending, startTransition] = useTransition();

  function resetAndOpen(next: boolean) {
    if (next) {
      setRows([{ method: "pix", amount: total.toFixed(2), installments: "", authorizationCode: "" }]);
    }
    setOpen(next);
  }

  function updateRow(index: number, patch: Partial<PaymentRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { method: "pix", amount: "", installments: "", authorizationCode: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const informed = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const remaining = Math.round((total - informed) * 100) / 100;

  function handleConfirm() {
    startTransition(async () => {
      const result = await convertBudgetToSale(
        budgetId,
        rows.map((row) => ({
          method: row.method,
          amount: Number(row.amount) || 0,
          installments: row.installments ? Number(row.installments) : null,
          authorizationCode: row.authorizationCode || null,
        })),
      );
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Venda criada.");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => resetAndOpen(true)}>
        Converter em venda
      </Button>
      <Dialog open={open} onOpenChange={resetAndOpen}>
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Como foi o pagamento?</DialogTitle>
          <DialogDescription>
            Total do orçamento: <strong>{formatCurrency(total)}</strong>. Informe a forma de pagamento — se
            o paciente pagou de mais de um jeito, adicione uma linha para cada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={row.method}
                    onValueChange={(v) => v && updateRow(index, { method: v as PaymentMethod })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.amount}
                    onChange={(e) => updateRow(index, { amount: e.target.value })}
                  />
                </div>
              </div>

              {CARD_METHODS.has(row.method) && (
                <div className="grid grid-cols-2 gap-3">
                  {row.method === "credit_card" && (
                    <div className="space-y-1.5">
                      <Label>Parcelas</Label>
                      <Input
                        type="number"
                        min={1}
                        value={row.installments}
                        onChange={(e) => updateRow(index, { installments: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Código de autorização</Label>
                    <Input
                      value={row.authorizationCode}
                      onChange={(e) => updateRow(index, { authorizationCode: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {rows.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeRow(index)}>
                  <Trash2 className="size-3.5" />
                  Remover
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" />
            Adicionar forma de pagamento
          </Button>

          <p className={remaining === 0 ? "text-sm text-muted-foreground" : "text-sm font-medium text-destructive"}>
            {remaining === 0
              ? "Valores informados batem com o total do orçamento."
              : remaining > 0
                ? `Faltam ${formatCurrency(remaining)} para completar o total.`
                : `Os valores informados passam ${formatCurrency(Math.abs(remaining))} do total.`}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={isPending || remaining !== 0}>
            {isPending ? "Confirmando..." : "Confirmar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
