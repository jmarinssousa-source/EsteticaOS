"use client";

import { useState, useTransition } from "react";
import { submitConsentSignature } from "@/actions/consent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignaturePad } from "@/components/signature/SignaturePad";

export function ConsentSignForm({ token, content }: { token: string; content: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <Alert>
        <AlertDescription>
          Pronto! Sua assinatura foi enviada para a clínica. Avise a recepção que você já assinou
          para darem sequência ao seu atendimento.
        </AlertDescription>
      </Alert>
    );
  }

  function handleSave(dataUrl: string) {
    setError(null);
    startTransition(async () => {
      const result = await submitConsentSignature(token, dataUrl);
      if ("error" in result) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="max-h-72 overflow-y-auto whitespace-pre-line rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
        {content}
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium">Assine com o dedo no espaço abaixo</p>
        <SignaturePad saving={isPending} onSave={handleSave} />
      </div>
    </div>
  );
}
