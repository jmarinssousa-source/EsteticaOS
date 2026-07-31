"use client";

import { useActionState } from "react";
import { CircleAlert, FileSpreadsheet, Sheet as SheetIcon, Upload } from "lucide-react";
import type { ImportResult, ImportTemplate } from "@/lib/importacao/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ImportResult = { total: 0, imported: 0, errors: [] };

/** Passo numerado, para a ordem ficar óbvia sem precisar ler tudo. */
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Mostra o modelo do jeito que ele chega na planilha: cabeçalho na
 * primeira linha, um exemplo preenchido na segunda.
 *
 * Ver a tabela poupa a maior parte das dúvidas. O erro mais comum na
 * importação é renomear a coluna ("Nome completo" em vez de "nome"), e
 * quem enxerga o cabeçalho esperado antes de preencher não erra.
 */
function TemplatePreview({ template }: { template: ImportTemplate }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-muted/60">
            {template.headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="whitespace-nowrap border-b px-2 py-1.5 text-left font-mono font-medium"
              >
                {header}
                {template.required.includes(header) && (
                  <span className="ml-1 text-destructive" aria-label="obrigatória">
                    *
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {template.example.map((cell, index) => (
              <td
                key={template.headers[index]}
                className="whitespace-nowrap px-2 py-1.5 text-muted-foreground"
              >
                {cell || <span className="opacity-50">(vazio)</span>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ImportCard({
  template,
  action,
}: {
  template: ImportTemplate;
  action: (prevState: ImportResult | null, formData: FormData) => Promise<ImportResult>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const { type, label, description, required, rules, duplicateRule } = template;

  const importedAll = state.total > 0 && state.errors.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Step number={1} title="Baixe o modelo">
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
        </Step>

        <Step number={2} title="Preencha mantendo os nomes das colunas">
          <TemplatePreview template={template} />
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              <span className="text-destructive">*</span> Obrigatória:{" "}
              <span className="font-mono">{required.join(", ")}</span>. Sem ela o arquivo é
              recusado inteiro.
            </li>
            <li>
              As demais colunas podem ficar em branco, e você pode apagar as que não vai usar.
            </li>
            <li>
              Não renomeie o cabeçalho. Maiúsculas e acentos não atrapalham, e a ordem das colunas
              também não.
            </li>
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
            <li>{duplicateRule}</li>
          </ul>
        </Step>

        <Step number={3} title="Envie a planilha preenchida">
          <form action={formAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`file-${type}`} className="sr-only">
                Arquivo da planilha de {label}
              </Label>
              <Input
                id={`file-${type}`}
                name="file"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                required
              />
              <p className="text-xs text-muted-foreground">
                Aceita Excel (.xlsx) ou CSV. Pode enviar de novo quantas vezes quiser: o que já
                está no sistema não é duplicado.
              </p>
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              <Upload className="size-4" />
              {pending ? "Importando..." : "Importar"}
            </Button>
          </form>
        </Step>

        {state.total > 0 && (
          <Alert variant={state.errors.length > 0 ? "destructive" : "default"}>
            <AlertDescription>
              <p className={cn("font-medium", importedAll && "text-emerald-700 dark:text-emerald-400")}>
                {state.imported} de {state.total} linha{state.total === 1 ? "" : "s"} importada
                {state.imported === 1 ? "" : "s"}.
              </p>
              {state.errors.length > 0 && (
                <>
                  <p className="mt-1 text-xs">
                    As linhas abaixo ficaram de fora. Corrija na planilha e envie de novo, só com
                    elas ou com o arquivo inteiro.
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                    {state.errors.map((err, i) => (
                      <li key={i}>
                        {err.row > 0 ? `Linha ${err.row}: ` : ""}
                        {err.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        {state.total === 0 && state.errors.length > 0 && (
          <Alert variant="destructive">
            <CircleAlert className="size-4" />
            <AlertDescription>{state.errors[0].reason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
