"use client";

import { RotateCcw } from "lucide-react";
import { renderPatientMessage } from "@/lib/patients/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Editor do modelo de mensagem, com prévia.
 *
 * Mora fora dos dois lugares que o usam (aniversariantes no Hoje e
 * reativação em Pacientes) para que os dois se comportem igual: mesmas
 * marcações, mesma prévia, mesmo "voltar ao texto original". Quem chama
 * é dono do diálogo; aqui vai só o conteúdo dele.
 */
export function MessageTemplateEditor({
  title,
  draft,
  onDraftChange,
  defaultMessage,
  previewName,
  clinicName,
  onCancel,
  onSave,
}: {
  title: string;
  draft: string;
  onDraftChange: (value: string) => void;
  defaultMessage: string;
  /** Nome que aparece na prévia. */
  previewName: string;
  clinicName: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Use <code className="font-mono">{"{nome}"}</code> para o primeiro nome do paciente e{" "}
          <code className="font-mono">{"{clinica}"}</code> para o nome da clínica. O texto fica
          salvo neste navegador e passa a valer para as próximas mensagens.
        </DialogDescription>
      </DialogHeader>

      <Textarea
        rows={5}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        aria-label="Texto da mensagem"
      />

      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-xs font-medium text-muted-foreground">Como vai ficar</p>
        <p className="mt-1 text-sm">{renderPatientMessage(draft, previewName, clinicName)}</p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onDraftChange(defaultMessage)}>
          <RotateCcw className="size-4" />
          Voltar ao texto original
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave}>Salvar</Button>
      </DialogFooter>
    </>
  );
}
