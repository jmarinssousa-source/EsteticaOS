"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  createConsentTemplate,
  deleteConsentTemplate,
  updateConsentTemplate,
  type ConsentTemplate,
} from "@/actions/consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function TemplateEditor({ template }: { template: ConsentTemplate }) {
  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateConsentTemplate(template.id, { name, content });
      if ("error" in result) toast.error(result.error);
      else toast.success("Termo salvo.");
    });
  }

  function handleToggle(active: boolean) {
    startTransition(async () => {
      const result = await updateConsentTemplate(template.id, { active });
      if ("error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteConsentTemplate(template.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Termo excluído.");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-56 flex-1 space-y-2">
            <Label>Nome do termo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
          </div>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex items-center gap-2">
              <Switch
                checked={template.active}
                disabled={isPending || !template.id}
                onCheckedChange={handleToggle}
              />
              <span className="text-xs text-muted-foreground">
                {template.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            {template.id && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                  <Trash2 className="size-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir “{template.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O modelo some da lista. Termos já assinados guardam uma cópia do texto e
                      continuam intactos no histórico dos pacientes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="font-mono text-sm"
          disabled={isPending}
        />

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar termo"}
        </Button>
      </CardContent>
    </Card>
  );
}

function NewConsentTemplateButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createConsentTemplate(trimmed);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Termo criado. Edite o texto abaixo.");
      setName("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo termo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo termo</DialogTitle>
          <DialogDescription>
            Cada clínica pode ter quantos termos quiser — uso de imagem, publicação em rede
            social, procedimento específico. O texto começa com o modelo padrão e você edita.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <Label htmlFor="consentTemplateName">Nome do termo</Label>
          <Input
            id="consentTemplateName"
            autoFocus
            placeholder="Ex.: Autorização para publicação em redes sociais"
            value={name}
            disabled={isPending}
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Criando..." : "Criar termo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConsentTemplateForm({ templates }: { templates: ConsentTemplate[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewConsentTemplateButton />
      </div>
      {templates.map((template) => (
        <TemplateEditor key={template.id || "padrao"} template={template} />
      ))}
    </div>
  );
}
