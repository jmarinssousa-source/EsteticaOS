"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createStage } from "@/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewStageButton() {
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
      const result = await createStage(trimmed);
      if (result && "error" in result) toast.error(result.error);
      setName("");
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex h-fit w-72 shrink-0 items-center gap-2 rounded-lg border border-dashed p-2">
        <Input
          autoFocus
          placeholder="Nome da coluna"
          value={name}
          disabled={isPending}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          onBlur={handleCreate}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="h-fit w-72 shrink-0 justify-start gap-2 border-dashed text-muted-foreground"
      onClick={() => setEditing(true)}
    >
      <Plus className="size-4" />
      Nova coluna
    </Button>
  );
}
