"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  createConsentRequest,
  deleteConsentForm,
  signConsentForm,
  type ConsentTemplate,
} from "@/actions/consent";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SignaturePad } from "@/components/signature/SignaturePad";
import { SignatureDisplay } from "@/components/signature/SignatureDisplay";

export type PatientConsentForm = {
  id: string;
  title: string | null;
  status: "pending" | "signed";
  signature: string | null;
  signedAt: string | null;
  createdAt: string;
  token: string | null;
};

export function ConsentTab({
  patientId,
  patientName,
  patientPhone,
  clinicName,
  forms,
  templates,
  canEdit,
}: {
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  clinicName: string;
  forms: PatientConsentForm[];
  templates: ConsentTemplate[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [signingOpen, setSigningOpen] = useState(false);

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  function handleSign(dataUrl: string) {
    startTransition(async () => {
      const result = await signConsentForm(patientId, templateId, dataUrl);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Termo assinado.");
        setSigningOpen(false);
      }
    });
  }

  function handleSendWhatsApp() {
    startTransition(async () => {
      const result = await createConsentRequest(patientId, templateId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const link = `${window.location.origin}/termo/${result.token}`;
      const message =
        `Olá, ${patientName}! Aqui é da ${clinicName}. ` +
        `Para seguirmos com seu atendimento, leia e assine o ${result.title.toLowerCase()} ` +
        `por este link: ${link}`;
      window.open(buildWhatsAppUrl(patientPhone, message), "_blank");
    });
  }

  function handleCopyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/termo/${token}`);
    toast.success("Link copiado.");
  }

  function handleDelete(formId: string) {
    startTransition(async () => {
      const result = await deleteConsentForm(formId, patientId);
      if ("error" in result) toast.error(result.error);
      else toast.success("Termo removido.");
    });
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo termo</CardTitle>
            <CardDescription>
              Escolha o termo, colha a assinatura aqui mesmo ou mande o link para o paciente
              assinar com o dedo no celular dele.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Termo</Label>
              <Select
                items={templates.map((t) => ({ value: t.id, label: t.name }))}
                value={templateId}
                onValueChange={(v) => setTemplateId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setSigningOpen((open) => !open)}>
                <Plus className="size-4" />
                {signingOpen ? "Fechar assinatura" : "Assinar aqui"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleSendWhatsApp} disabled={isPending}>
                <MessageCircle className="size-4" />
                Enviar pelo WhatsApp
              </Button>
            </div>

            {signingOpen && (
              <>
                <p className="max-h-48 overflow-y-auto whitespace-pre-line rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  {template?.content}
                </p>
                <SignaturePad saving={isPending} onSave={handleSign} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este paciente ainda não assinou nenhum termo.
        </p>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="size-4 text-muted-foreground" />
                      {form.title ?? "Termo de consentimento"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {form.status === "signed" && form.signedAt
                        ? `Assinado em ${new Date(form.signedAt).toLocaleString("pt-BR")}`
                        : `Enviado em ${new Date(form.createdAt).toLocaleString("pt-BR")} — aguardando assinatura`}
                    </p>
                  </div>
                  <Badge variant={form.status === "signed" ? "default" : "outline"}>
                    {form.status === "signed" ? "Assinado" : "Pendente"}
                  </Badge>
                </div>

                {form.signature && (
                  <SignatureDisplay dataUrl={form.signature} label="Assinatura do paciente" />
                )}

                <div className="flex flex-wrap gap-2">
                  {form.status === "signed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/pacientes/${patientId}/consentimento?termo=${form.id}`}
                          target="_blank"
                        />
                      }
                    >
                      Visualizar / baixar
                    </Button>
                  )}
                  {form.status === "pending" && form.token && (
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(form.token!)}>
                      <Copy className="size-4" />
                      Copiar link
                    </Button>
                  )}
                  {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                        <Trash2 className="size-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir este termo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O termo sai do histórico do paciente. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(form.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
