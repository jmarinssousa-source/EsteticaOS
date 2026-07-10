"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Sheet as SheetIcon, FileSpreadsheet } from "lucide-react";
import type { ExportData } from "@/actions/exportacao";
import { downloadCsv, downloadExcel } from "@/lib/relatorios/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ExportCard({
  label,
  description,
  filename,
  action,
}: {
  label: string;
  description: string;
  filename: string;
  action: () => Promise<ExportData>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleExport(format: "csv" | "excel") {
    startTransition(async () => {
      const { headers, rows } = await action();
      if (rows.length === 0) {
        toast.error("Nada para exportar ainda.");
        return;
      }
      if (format === "csv") downloadCsv(filename, headers, rows);
      else downloadExcel(filename, headers, rows);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("csv")}>
          <SheetIcon className="size-4" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="size-4" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
}
