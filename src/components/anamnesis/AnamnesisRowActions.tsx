"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Trash2 } from "lucide-react";
import { deleteAnamnesisResponse, getAnamnesisLinkToken } from "@/actions/anamnesis";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
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

/**
 * O que fazer com uma anamnese que ficou parada em "pendente": mandar o
 * link de novo (WhatsApp ou área de transferência) ou apagar o envio.
 */
export function AnamnesisRowActions({
  responseId,
  patientId,
  patientName,
  patientPhone,
  clinicName,
}: {
  responseId: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  clinicName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [copying, setCopying] = useState(false);

  function withToken(action: (link: string) => void) {
    startTransition(async () => {
      const result = await getAnamnesisLinkToken(responseId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      action(`${window.location.origin}/anamnese/${result.token}`);
    });
  }

  function handleResend() {
    withToken((link) => {
      const message = `Olá, ${patientName}! Para agilizar seu atendimento na ${clinicName}, preencha sua anamnese pelo link: ${link}`;
      window.open(buildWhatsAppUrl(patientPhone, message), "_blank");
    });
  }

  function handleCopy() {
    setCopying(true);
    withToken((link) => {
      navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
      setCopying(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAnamnesisResponse(responseId, patientId);
      if ("error" in result) toast.error(result.error);
      else toast.success("Anamnese removida.");
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleResend} disabled={isPending}>
        <MessageCircle className="size-4" />
        Reenviar
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy} disabled={isPending || copying}>
        <Copy className="size-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta anamnese pendente?</AlertDialogTitle>
            <AlertDialogDescription>
              O link enviado ao paciente deixa de funcionar. Você pode enviar uma nova anamnese
              depois, quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
