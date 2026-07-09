"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { renameTemplate } from "@/actions/anamnesis";
import { Input } from "@/components/ui/input";

export function TemplateNameEditor({ templateId, name }: { templateId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    startTransition(async () => {
      const result = await renameTemplate(templateId, trimmed);
      if (result && "error" in result) {
        toast.error(result.error);
        setValue(name);
      }
    });
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="h-9 max-w-sm text-xl font-bold"
      />
    );
  }

  return (
    <button
      type="button"
      className="group flex items-center gap-2 text-2xl font-bold tracking-tight"
      onClick={() => setEditing(true)}
    >
      {value}
      <Pencil className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  );
}
