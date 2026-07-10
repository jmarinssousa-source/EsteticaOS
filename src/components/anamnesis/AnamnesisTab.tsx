"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markResponseReviewed } from "@/actions/anamnesis";
import { RESPONSE_STATUS_LABELS, type ResponseStatus } from "@/lib/anamnesis/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SendAnamnesisDialog } from "@/components/anamnesis/SendAnamnesisDialog";
import { AnamnesisResponseViewer } from "@/components/anamnesis/AnamnesisResponseViewer";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function AnamnesisTab({
  patientId,
  patientName,
  patientPhone,
  clinicName,
  templates,
  responses,
  canEdit,
}: {
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  clinicName: string;
  templates: { id: string; name: string }[];
  responses: { id: string; template_name: string; status: ResponseStatus; created_at: string }[];
  canEdit: boolean;
}) {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReview(responseId: string) {
    startTransition(async () => {
      const result = await markResponseReviewed(responseId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <SendAnamnesisDialog
            patientId={patientId}
            patientName={patientName}
            patientPhone={patientPhone}
            clinicName={clinicName}
            templates={templates}
          />
        </div>
      )}

      {templates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum modelo de anamnese ativo. Crie um em Configurações &gt; Anamnese e consentimento.
        </p>
      )}

      {responses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma anamnese enviada para este paciente.</p>
      ) : (
        <div className="space-y-2">
          {responses.map((response) => (
            <Card key={response.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{response.template_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviada em {formatDate(response.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={response.status === "pending" ? "outline" : "secondary"}>
                    {RESPONSE_STATUS_LABELS[response.status]}
                  </Badge>
                  {response.status !== "pending" && (
                    <Button variant="outline" size="sm" onClick={() => setViewerId(response.id)}>
                      Ver respostas
                    </Button>
                  )}
                  {response.status === "completed" && canEdit && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleReview(response.id)}
                    >
                      Marcar como revisada
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnamnesisResponseViewer
        responseId={viewerId}
        open={viewerId != null}
        onOpenChange={(open) => !open && setViewerId(null)}
      />
    </div>
  );
}
