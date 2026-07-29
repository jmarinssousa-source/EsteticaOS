"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTemplate } from "@/actions/anamnesis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewTemplateButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createTemplate(trimmed);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Modelo criado.");
      setName("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo modelo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo modelo de anamnese</DialogTitle>
          <DialogDescription>
            Dê um nome ao modelo. Depois é só abrir e montar as perguntas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <Label htmlFor="templateName">Nome do modelo</Label>
          <Input
            id="templateName"
            autoFocus
            placeholder="Ex.: Anamnese facial"
            value={name}
            disabled={isPending}
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Criando..." : "Criar modelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
