"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv, downloadExcel } from "@/lib/relatorios/export";

export type ReportColumn = { key: string; label: string };
export type ReportRow = Record<string, string | number>;

export function ReportTable({
  columns,
  rows,
  filename,
  totalsLabel,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  filename: string;
  totalsLabel?: string;
}) {
  function handleExport(format: "csv" | "excel") {
    const headers = columns.map((c) => c.label);
    const data = rows.map((row) => columns.map((c) => row[c.key] ?? ""));
    if (format === "csv") downloadCsv(filename, headers, data);
    else downloadExcel(filename, headers, data);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {totalsLabel && <p className="text-sm text-muted-foreground">{totalsLabel}</p>}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={rows.length === 0}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={rows.length === 0}>
            <Download className="size-4" />
            Excel
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((c) => (
                  <TableCell key={c.key}>{row[c.key]}</TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                  Nenhum resultado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
