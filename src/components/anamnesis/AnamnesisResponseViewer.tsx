"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Printer, Search } from "lucide-react";
import { getResponseAnswers, type ResponseAnswerDetail } from "@/actions/anamnesis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  // Limpa os dados antigos assim que sabemos qual anamnese está sendo
  // carregada — derivado no render, não em efeito, para evitar um
  // render a mais. O efeito só faz a busca.
  const [syncedWith, setSyncedWith] = useState(responseId);
  if (responseId !== syncedWith) {
    setSyncedWith(responseId);
    setDetail(null);
    setSearch("");
    setOnlyAlerts(false);
  }

  useEffect(() => {
    if (!open || !responseId) return;
    getResponseAnswers(responseId).then(setDetail);
  }, [open, responseId]);

  const query = search.trim().toLocaleLowerCase();
  const questions = (detail?.questions ?? []).filter((question) => {
    const answer = detail?.answers[question.id];
    if (onlyAlerts && !isAlert(answer)) return false;
    if (!query) return true;
    return (
      question.label.toLocaleLowerCase().includes(query) ||
      formatAnswer(answer).toLocaleLowerCase().includes(query)
    );
  });

  const alertCount = (detail?.questions ?? []).filter((question) =>
    isAlert(detail?.answers[question.id]),
  ).length;

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
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar pergunta ou resposta"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {alertCount > 0 && (
                <Button
                  size="sm"
                  variant={onlyAlerts ? "default" : "outline"}
                  onClick={() => setOnlyAlerts((value) => !value)}
                >
                  <AlertTriangle className="size-4" />
                  {alertCount} resposta{alertCount === 1 ? "" : "s"} “Sim”
                </Button>
              )}
            </div>

            <div className="divide-y rounded-md border">
              {questions.map((question) => {
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
              {questions.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhuma pergunta corresponde ao filtro.
                </p>
              )}
            </div>
          </>
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
