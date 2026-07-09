"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { deleteQuestion, reorderQuestion } from "@/actions/anamnesis";
import { QUESTION_TYPE_LABELS } from "@/lib/anamnesis/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionFormDialog, type EditableQuestion } from "@/components/anamnesis/QuestionFormDialog";

export function QuestionRow({
  templateId,
  question,
  isFirst,
  isLast,
}: {
  templateId: string;
  question: EditableQuestion;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleReorder(direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderQuestion(templateId, question.id, direction);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteQuestion(question.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-md border p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{question.label}</p>
          {question.required && (
            <Badge variant="outline" className="text-[10px]">
              obrigatória
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{QUESTION_TYPE_LABELS[question.type]}</p>
        {question.options.length > 0 && (
          <p className="text-xs text-muted-foreground">Opções: {question.options.join(", ")}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isFirst || isPending}
          onClick={() => handleReorder("up")}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isLast || isPending}
          onClick={() => handleReorder("down")}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" disabled={isPending} onClick={handleDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <QuestionFormDialog
        templateId={templateId}
        question={question}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
