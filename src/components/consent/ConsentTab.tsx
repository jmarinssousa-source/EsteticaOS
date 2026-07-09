"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { signConsentForm } from "@/actions/consent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { SignatureDisplay } from "@/components/signature/SignatureDisplay";

export function ConsentTab({
  patientId,
  latestConsent,
  canEdit,
}: {
  patientId: string;
  latestConsent: { signature: string; signedAt: string } | null;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [resigning, setResigning] = useState(false);

  function handleSign(dataUrl: string) {
    startTransition(async () => {
      const result = await signConsentForm(patientId, dataUrl);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Termo assinado.");
        setResigning(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" />
          Termo de consentimento e autorização de imagem
        </CardTitle>
        <CardDescription>
          {latestConsent
            ? `Assinado em ${new Date(latestConsent.signedAt).toLocaleString("pt-BR")}`
            : "Ainda não assinado por este paciente."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestConsent && !resigning && (
          <>
            <SignatureDisplay dataUrl={latestConsent.signature} label="Assinatura do paciente" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/pacientes/${patientId}/consentimento`} target="_blank" />}
              >
                Visualizar / baixar
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setResigning(true)}>
                  Coletar nova assinatura
                </Button>
              )}
            </div>
          </>
        )}

        {(!latestConsent || resigning) && canEdit && (
          <SignaturePad saving={isPending} onSave={handleSign} />
        )}

        {!latestConsent && !canEdit && (
          <p className="text-sm text-muted-foreground">
            Peça para um usuário com permissão de edição coletar a assinatura.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
