"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  deletePatient,
  getPatientDeletionSummary,
  type PatientDeletionSummary,
} from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Lista o que será apagado, omitindo o que está zerado. */
function describe(summary: PatientDeletionSummary) {
  const parts: string[] = [];
  const add = (count: number, singular: string, plural: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
  };

  add(summary.appointments, "agendamento", "agendamentos");
  add(summary.sessions, "sessão", "sessões");
  add(summary.records, "registro clínico", "registros clínicos");
  add(summary.photos, "foto", "fotos");
  add(summary.budgets, "orçamento", "orçamentos");
  add(summary.anamnesis, "anamnese", "anamneses");
  add(summary.consents, "termo assinado", "termos assinados");

  return parts;
}

export function DeletePatientButton({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<PatientDeletionSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setSummary(null);
      getPatientDeletionSummary(patientId).then(setSummary);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePatient(patientId);
      if ("error" in result) toast.error(result.error);
      else toast.success("Paciente excluído.");
    });
  }

  const losing = summary ? describe(summary) : [];

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <TooltipHint label="Excluir este paciente e todo o histórico dele">
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Excluir paciente"
            />
          }
        >
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
      </TooltipHint>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir {summary?.name ? `“${summary.name}”` : "este paciente"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!summary
              ? "Verificando o que está vinculado a este paciente..."
              : losing.length > 0
                ? `Isso apaga junto ${losing.join(", ")}. Não dá para desfazer.`
                : "Este paciente ainda não tem histórico. Não dá para desfazer."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {summary && summary.financialEntries > 0 && (
          <p className="text-sm text-muted-foreground">
            {summary.financialEntries === 1
              ? "1 lançamento financeiro continua no caixa da clínica, sem o vínculo com o paciente."
              : `${summary.financialEntries} lançamentos financeiros continuam no caixa da clínica, sem o vínculo com o paciente.`}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending || !summary}>
            {isPending ? "Excluindo..." : "Excluir paciente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
