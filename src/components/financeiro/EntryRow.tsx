"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { ENTRY_STATUS_LABELS, ENTRY_TYPE_LABELS } from "@/lib/financeiro/constants";
import type { FinancialEntry } from "@/lib/financeiro/types";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntryDetailDialog } from "@/components/financeiro/EntryDetailDialog";

export function EntryRow({
  entry,
  patientName,
  canEdit,
}: {
  entry: FinancialEntry;
  patientName: string | null;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen(true)}>
        <TableCell className="font-medium">{entry.description}</TableCell>
        <TableCell>{patientName ?? "—"}</TableCell>
        <TableCell>
          <Badge variant={entry.type === "revenue" ? "secondary" : "outline"}>
            {ENTRY_TYPE_LABELS[entry.type]}
          </Badge>
        </TableCell>
        <TableCell
          className={cn(entry.type === "expense" && "text-destructive")}
        >
          {formatCurrency(entry.amount)}
        </TableCell>
        <TableCell>{entry.due_date ? new Date(entry.due_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
        <TableCell>
          <Badge variant={entry.status === "paid" ? "default" : "outline"}>
            {ENTRY_STATUS_LABELS[entry.status]}
          </Badge>
        </TableCell>
      </TableRow>

      <EntryDetailDialog
        entry={entry}
        patientName={patientName}
        canEdit={canEdit}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
