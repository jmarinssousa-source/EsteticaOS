"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTemplate, toggleTemplateActive } from "@/actions/anamnesis";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

export function TemplateRowActions({
  templateId,
  active,
}: {
  templateId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleTemplateActive(templateId, checked);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTemplate(templateId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <Switch checked={active} disabled={isPending} onCheckedChange={handleToggle} />
        <span className="text-xs text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
      </div>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Só é possível excluir modelos que nunca foram enviados a um paciente. Se já houver
              anamneses enviadas, desative o modelo em vez de excluí-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
