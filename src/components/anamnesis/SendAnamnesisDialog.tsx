"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Send } from "lucide-react";
import { sendAnamnesis } from "@/actions/anamnesis";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SendAnamnesisDialog({
  patientId,
  patientName,
  patientPhone,
  clinicName,
  templates,
}: {
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  clinicName: string;
  templates: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [link, setLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setLink(null);
  }

  function handleSend() {
    if (!templateId) return;
    startTransition(async () => {
      const result = await sendAnamnesis(patientId, templateId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setLink(`${window.location.origin}/anamnese/${result.token}`);
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  }

  function handleSendWhatsApp() {
    if (!link) return;
    const message = `Olá, ${patientName}! Para agilizar seu atendimento na ${clinicName}, preencha sua anamnese pelo link: ${link}`;
    window.open(buildWhatsAppUrl(patientPhone, message), "_blank");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" disabled={templates.length === 0} />}>
        <Send className="size-4" />
        Enviar anamnese
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar anamnese</DialogTitle>
          <DialogDescription>
            Escolha um modelo. Depois é só entregar o dispositivo da clínica para o paciente
            preencher, ou enviar o link pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={templateId} onValueChange={(v) => v && setTemplateId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleSend} disabled={isPending || !templateId}>
                {isPending ? "Gerando..." : "Gerar formulário"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Button type="button" className="w-full justify-center" onClick={handleSendWhatsApp}>
              <MessageCircle className="size-4" />
              Enviar para WhatsApp
            </Button>
            <div className="space-y-2">
              <Label>Ou copie o link</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">
                  {link}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <Button
              nativeButton={false}
              render={<a href={link} />}
              variant="outline"
              className="w-full justify-center"
            >
              Preencher agora neste dispositivo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
