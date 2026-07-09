"use client";

import { useState, useTransition } from "react";
import { submitAnamnesis } from "@/actions/anamnesis";
import type { PublicAnamnesis } from "@/actions/anamnesis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnamnesisFillForm({
  token,
  questions,
}: {
  token: string;
  questions: PublicAnamnesis["questions"];
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <Alert>
        <AlertDescription>
          Obrigado! Suas respostas foram enviadas para a clínica.
        </AlertDescription>
      </Alert>
    );
  }

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitAnamnesis(token, answers);
      if ("error" in result) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <Label>
            {question.label}
            {question.required && <span className="text-destructive"> *</span>}
          </Label>

          {question.type === "short_text" && (
            <Input
              value={(answers[question.id] as string) ?? ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}

          {question.type === "long_text" && (
            <Textarea
              rows={3}
              value={(answers[question.id] as string) ?? ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}

          {question.type === "number" && (
            <Input
              type="number"
              value={(answers[question.id] as string) ?? ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}

          {question.type === "date" && (
            <Input
              type="date"
              value={(answers[question.id] as string) ?? ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              required={question.required}
            />
          )}

          {question.type === "yes_no" && (
            <Select
              value={(answers[question.id] as string) ?? ""}
              onValueChange={(v) => v && setAnswer(question.id, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          )}

          {question.type === "yes_no_unsure" && (
            <Select
              value={(answers[question.id] as string) ?? ""}
              onValueChange={(v) => v && setAnswer(question.id, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
                <SelectItem value="Não sei">Não sei</SelectItem>
              </SelectContent>
            </Select>
          )}

          {question.type === "single_choice" && (
            <Select
              value={(answers[question.id] as string) ?? ""}
              onValueChange={(v) => v && setAnswer(question.id, v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {question.type === "multiple_choice" && (
            <div className="space-y-1.5">
              {question.options.map((option) => {
                const selected = ((answers[question.id] as string[]) ?? []).includes(option);
                return (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const current = (answers[question.id] as string[]) ?? [];
                        setAnswer(
                          question.id,
                          checked ? [...current, option] : current.filter((o) => o !== option),
                        );
                      }}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar respostas"}
      </Button>
    </form>
  );
}
