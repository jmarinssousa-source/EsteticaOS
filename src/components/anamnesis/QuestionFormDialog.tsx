"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { addQuestion, updateQuestion } from "@/actions/anamnesis";
import { CHOICE_QUESTION_TYPES, QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/anamnesis/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type EditableQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: string[];
};

export function QuestionFormDialog({
  templateId,
  question,
  open,
  onOpenChange,
}: {
  templateId: string;
  question: EditableQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(question?.label ?? "");
  const [type, setType] = useState<QuestionType>(question?.type ?? "short_text");
  const [required, setRequired] = useState(question?.required ?? false);
  const [options, setOptions] = useState<string[]>(question?.options ?? [""]);

  const [syncedWith, setSyncedWith] = useState(open);
  if (open !== syncedWith) {
    setSyncedWith(open);
    if (open) {
      setLabel(question?.label ?? "");
      setType(question?.type ?? "short_text");
      setRequired(question?.required ?? false);
      setOptions(question?.options && question.options.length > 0 ? question.options : [""]);
      setError(null);
    }
  }

  const isChoiceType = CHOICE_QUESTION_TYPES.includes(type);

  function handleSave() {
    const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (isChoiceType && cleanedOptions.length < 2) {
      setError("Adicione pelo menos duas opções.");
      return;
    }

    startTransition(async () => {
      const payload = { label, type, required, options: isChoiceType ? cleanedOptions : [] };
      const result = question
        ? await updateQuestion(question.id, payload)
        : await addQuestion(templateId, payload);

      if (result && "error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
          <DialogDescription>
            Escolha o tipo de resposta que o paciente vai preencher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Pergunta</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de resposta</Label>
            <Select value={type} onValueChange={(v) => v && setType(v as QuestionType)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isChoiceType && (
            <div className="space-y-2">
              <Label>Opções</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    placeholder={`Opção ${index + 1}`}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((o, i) => (i === index ? e.target.value : o)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                    disabled={options.length <= 1}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, ""])}
              >
                <Plus className="size-4" />
                Adicionar opção
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="required">Pergunta obrigatória</Label>
            <Switch id="required" checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending || !label.trim()}>
            {isPending ? "Salvando..." : "Salvar pergunta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
