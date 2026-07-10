"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateConsentTemplate } from "@/actions/consent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ConsentTemplateForm({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateConsentTemplate(content);
      if ("error" in result) toast.error(result.error);
      else toast.success("Termo salvo.");
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        className="font-mono text-sm"
      />
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar termo"}
      </Button>
    </div>
  );
}
