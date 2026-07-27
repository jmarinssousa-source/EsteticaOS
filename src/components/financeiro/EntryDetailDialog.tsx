"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { updateEntryPayment } from "@/actions/financeiro";
import {
  ENTRY_STATUSES,
  ENTRY_STATUS_LABELS,
  ENTRY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/financeiro/constants";
import type { FinancialEntry } from "@/lib/financeiro/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function buildForm(entry: FinancialEntry) {
  return {
    status: entry.status,
    paymentDate: entry.payment_date ?? "",
    paymentMethod: entry.payment_method ?? "",
    installments: entry.installments ? String(entry.installments) : "",
    cardAuthorizationCode: entry.card_authorization_code ?? "",
    nfIssued: entry.nf_issued,
    nfNumber: entry.nf_number ?? "",
  };
}

const CARD_METHODS = new Set(["debit_card", "credit_card"]);

export function EntryDetailDialog({
  entry,
  patientName,
  canEdit,
  open,
  onOpenChange,
}: {
  entry: FinancialEntry;
  patientName: string | null;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(() => buildForm(entry));

  const [syncedWith, setSyncedWith] = useState({ open, id: entry.id });
  if (open !== syncedWith.open || entry.id !== syncedWith.id) {
    setSyncedWith({ open, id: entry.id });
    if (open) setForm(buildForm(entry));
  }

  function submit(next: typeof form) {
    return updateEntryPayment(entry.id, entry.patient_id, {
      ...next,
      installments: next.installments ? Number(next.installments) : null,
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await submit(form);
      if ("error" in result) toast.error(result.error);
      else toast.success("Lançamento atualizado.");
    });
  }

  function handleMarkPaid() {
    const next = { ...form, status: "paid" as const, paymentDate: form.paymentDate || new Date().toISOString().slice(0, 10) };
    setForm(next);
    startTransition(async () => {
      const result = await submit(next);
      if ("error" in result) toast.error(result.error);
      else toast.success("Marcado como pago.");
    });
  }

  const isCardMethod = CARD_METHODS.has(form.paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry.description}</DialogTitle>
          <DialogDescription>
            {ENTRY_TYPE_LABELS[entry.type]} · {formatCurrency(entry.amount)}
            {patientName && ` · ${patientName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                items={ENTRY_STATUSES.map((status) => ({
                  value: status,
                  label: ENTRY_STATUS_LABELS[status],
                }))}
                value={form.status}
                onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as typeof form.status }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ENTRY_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data do pagamento</Label>
              <Input
                type="date"
                value={form.paymentDate}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select
              items={[
                { value: "none", label: "Não informada" },
                ...PAYMENT_METHODS.map((method) => ({
                  value: method,
                  label: PAYMENT_METHOD_LABELS[method],
                })),
              ]}
              value={form.paymentMethod || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v === "none" ? "" : (v ?? "") }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Não informada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informada</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCardMethod && (
            <div className="grid grid-cols-2 gap-4">
              {form.paymentMethod === "credit_card" && (
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.installments}
                    disabled={!canEdit}
                    onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Código de autorização</Label>
                <Input
                  value={form.cardAuthorizationCode}
                  disabled={!canEdit}
                  onChange={(e) => setForm((f) => ({ ...f, cardAuthorizationCode: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="nfIssued">Nota fiscal emitida</Label>
            <Switch
              id="nfIssued"
              checked={form.nfIssued}
              disabled={!canEdit}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, nfIssued: checked }))}
            />
          </div>

          {form.nfIssued && (
            <div className="space-y-2">
              <Label>Número da NF</Label>
              <Input
                value={form.nfNumber}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, nfNumber: e.target.value }))}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {entry.type === "revenue" && form.status === "paid" && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/financeiro/${entry.id}/recibo`} target="_blank" />}
            >
              Gerar recibo
            </Button>
          )}
          {canEdit && (
            <div className="flex gap-2">
              {form.status !== "paid" && (
                <Button variant="outline" onClick={handleMarkPaid} disabled={isPending}>
                  Marcar como pago
                </Button>
              )}
              <Button onClick={handleSave} disabled={isPending}>
                Salvar
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
