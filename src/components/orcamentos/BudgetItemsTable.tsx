"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteBudgetItem } from "@/actions/orcamentos";
import { formatCurrency } from "@/lib/format";
import type { ProcedureOption } from "@/lib/procedures/types";
import type { PackageOption } from "@/lib/packages/types";
import type { ProfessionalOption } from "@/lib/agenda/types";
import type { BudgetItem } from "@/lib/orcamentos/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BudgetItemDialog } from "@/components/orcamentos/BudgetItemDialog";

export function BudgetItemsTable({
  budgetId,
  items,
  procedures,
  packages,
  professionals,
  canEdit,
}: {
  budgetId: string;
  items: BudgetItem[];
  procedures: ProcedureOption[];
  packages: PackageOption[];
  professionals: ProfessionalOption[];
  canEdit: boolean;
}) {
  const [dialogItem, setDialogItem] = useState<BudgetItem | null | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  function handleDelete(itemId: string) {
    startTransition(async () => {
      const result = await deleteBudgetItem(itemId, budgetId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead>Valor unit.</TableHead>
            <TableHead>Desconto</TableHead>
            <TableHead>Profissional</TableHead>
            <TableHead>Subtotal</TableHead>
            {canEdit && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const procedure = procedures.find((p) => p.id === item.procedure_id);
            const pkg = packages.find((p) => p.id === item.package_id);
            const professional = professionals.find((p) => p.user_id === item.professional_id);
            const subtotal = item.quantity * Number(item.unit_price) - Number(item.discount);
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {pkg ? (
                    <span className="flex items-center gap-1.5">
                      {pkg.name}
                      <Badge variant="secondary" className="text-[10px]">
                        pacote
                      </Badge>
                    </span>
                  ) : (
                    (procedure?.name ?? "—")
                  )}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(Number(item.unit_price))}</TableCell>
                <TableCell>{formatCurrency(Number(item.discount))}</TableCell>
                <TableCell>{professional?.full_name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(subtotal)}</TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setDialogItem(item)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={isPending}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="text-center text-sm text-muted-foreground">
                Nenhum item adicionado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => setDialogItem(null)}>
          <Plus className="size-4" />
          Adicionar item
        </Button>
      )}

      {dialogItem !== undefined && (
        <BudgetItemDialog
          budgetId={budgetId}
          item={dialogItem}
          procedures={procedures}
          packages={packages}
          professionals={professionals}
          open={dialogItem !== undefined}
          onOpenChange={(open) => !open && setDialogItem(undefined)}
        />
      )}
    </div>
  );
}
