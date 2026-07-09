"use client";

import { useActionState } from "react";
import { Download, Upload } from "lucide-react";
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
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={`/configuracoes/importacao/modelo/${type}`} />}
        >
          <Download className="size-4" />
          Baixar modelo
        </Button>

        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`file-${type}`}>Arquivo CSV preenchido</Label>
            <Input id={`file-${type}`} name="file" type="file" accept=".csv,text/csv" required />
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
