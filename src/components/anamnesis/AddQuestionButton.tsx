"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionFormDialog } from "@/components/anamnesis/QuestionFormDialog";

export function AddQuestionButton({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nova pergunta
      </Button>
      <QuestionFormDialog templateId={templateId} question={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
