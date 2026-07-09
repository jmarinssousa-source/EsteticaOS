"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await resendVerificationEmail(email);
            setMessage(
              result.success
                ? "E-mail reenviado com sucesso."
                : (result.error ?? "Não foi possível reenviar o e-mail."),
            );
          });
        }}
      >
        {isPending ? "Reenviando..." : "Reenviar e-mail de verificação"}
      </Button>
      {message && (
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
