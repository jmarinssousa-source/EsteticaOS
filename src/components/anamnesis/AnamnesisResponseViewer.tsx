"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { getResponseAnswers, type ResponseAnswerDetail } from "@/actions/anamnesis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Answer = string | string[] | undefined;

function formatAnswer(value: Answer) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return value;
}

function isEmpty(value: Answer) {
  if (value == null || value === "") return true;
  return Array.isArray(value) && value.length === 0;
}

/**
 * Numa anamnese, "Sim" quase sempre é o que exige atenção (alergia,
 * gravidez, uso de medicação). Destacar essas respostas evita que o
 * profissional precise reler o formulário inteiro na frente do paciente.
 */
function isAlert(value: Answer) {
  return typeof value === "string" && value.trim().toLocaleLowerCase() === "sim";
}

export function AnamnesisResponseViewer({
  responseId,
  patientName,
  printHref,
  open,
  onOpenChange,
}: {
  responseId: string | null;
  patientName?: string;
  printHref?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ResponseAnswerDetail | null>(null);

  // Limpa os dados antigos assim que sabemos qual anamnese está sendo
  // carregada — derivado no render, não em efeito, para evitar um
  // render a mais. O efeito só faz a busca.
  const [syncedWith, setSyncedWith] = useState(responseId);
  if (responseId !== syncedWith) {
    setSyncedWith(responseId);
    setDetail(null);
  }

  useEffect(() => {
    if (!open || !responseId) return;
    getResponseAnswers(responseId).then(setDetail);
  }, [open, responseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.templateName ?? "Anamnese"}</DialogTitle>
          <DialogDescription>
            {patientName ? `${patientName} · ` : ""}
            {detail?.completedAt
              ? `Preenchida em ${new Date(detail.completedAt).toLocaleString("pt-BR")}`
              : "Respostas enviadas pelo paciente."}
          </DialogDescription>
        </DialogHeader>

        {!detail && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {detail && (
          <div className="divide-y rounded-md border">
            {detail.questions.map((question) => {
              const answer = detail.answers[question.id];
              return (
                <div
                  key={question.id}
                  className={cn("space-y-1 p-3", isAlert(answer) && "bg-amber-500/10")}
                >
                  <p className="text-xs text-muted-foreground">{question.label}</p>
                  <p
                    className={cn(
                      "text-base leading-snug font-medium",
                      isEmpty(answer) && "font-normal text-muted-foreground",
                    )}
                  >
                    {formatAnswer(answer)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {printHref && (
          <DialogFooter>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={printHref} target="_blank" rel="noopener noreferrer" />}
            >
              <Printer className="size-4" />
              Imprimir / salvar em PDF
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
