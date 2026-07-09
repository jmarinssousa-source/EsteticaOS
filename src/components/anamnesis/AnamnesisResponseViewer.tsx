"use client";

import { useEffect, useState } from "react";
import { getResponseAnswers, type ResponseAnswerDetail } from "@/actions/anamnesis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatAnswer(value: string | string[] | undefined) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return value;
}

export function AnamnesisResponseViewer({
  responseId,
  open,
  onOpenChange,
}: {
  responseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ResponseAnswerDetail | null>(null);

  // Clear stale data as soon as we know which response we're loading —
  // derived during render instead of in the effect below, to avoid an
  // extra render pass. The effect only performs the async fetch.
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
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.templateName ?? "Anamnese"}</DialogTitle>
          <DialogDescription>Respostas enviadas pelo paciente.</DialogDescription>
        </DialogHeader>

        {!detail && <p className="text-sm text-muted-foreground">Carregando...</p>}

        <div className="space-y-4">
          {detail?.questions.map((question) => (
            <div key={question.id}>
              <p className="text-sm font-medium">{question.label}</p>
              <p className="text-sm text-muted-foreground">
                {formatAnswer(detail.answers[question.id])}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
