"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTemplate } from "@/actions/anamnesis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewTemplateButton() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await createTemplate(trimmed);
      if (result && "error" in result) toast.error(result.error);
      setName("");
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          placeholder="Nome do modelo"
          value={name}
          disabled={isPending}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          onBlur={handleCreate}
          className="h-9 w-56"
        />
      </div>
    );
  }

  return (
    <Button size="sm" onClick={() => setEditing(true)}>
      <Plus className="size-4" />
      Novo modelo
    </Button>
  );
}
