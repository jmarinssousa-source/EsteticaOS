"use client";

import { useActionState } from "react";
import { FileSpreadsheet, Sheet as SheetIcon, Upload } from "lucide-react";
import type { ImportResult } from "@/lib/importacao/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ImportResult = { total: 0, imported: 0, errors: [] };

export function ImportCard({
  type,
  label,
  description,
  action,
}: {
  type: string;
  label: string;
  description: string;
  action: (prevState: ImportResult | null, formData: FormData) => Promise<ImportResult>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">1. Baixe o modelo</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/configuracoes/importacao/modelo/${type}?formato=xlsx`} />}
            >
              <FileSpreadsheet className="size-4" />
              Modelo Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/configuracoes/importacao/modelo/${type}`} />}
            >
              <SheetIcon className="size-4" />
              Modelo CSV
            </Button>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`file-${type}`}>2. Envie a planilha preenchida</Label>
            <Input
              id={`file-${type}`}
              name="file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              required
            />
            <p className="text-xs text-muted-foreground">
              Aceita Excel (.xlsx) ou CSV. Telefone, CPF, datas e valores entram no padrão do
              sistema mesmo se estiverem formatados de outro jeito na planilha.
            </p>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            <Upload className="size-4" />
            {pending ? "Importando..." : "Importar"}
          </Button>
        </form>

        {state.total > 0 && (
          <Alert variant={state.errors.length > 0 ? "destructive" : "default"}>
            <AlertDescription>
              <p className="font-medium">
                {state.imported} de {state.total} registro(s) importado(s).
              </p>
              {state.errors.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {state.errors.map((err, i) => (
                    <li key={i}>
                      {err.row > 0 ? `Linha ${err.row}: ` : ""}
                      {err.reason}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
        {state.total === 0 && state.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>{state.errors[0].reason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
