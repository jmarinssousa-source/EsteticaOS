import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateNameEditor } from "@/components/anamnesis/TemplateNameEditor";
import { AddQuestionButton } from "@/components/anamnesis/AddQuestionButton";
import { QuestionRow } from "@/components/anamnesis/QuestionRow";
import type { QuestionType } from "@/lib/anamnesis/constants";

export const metadata = { title: "Editar modelo de anamnese — EstéticaOS" };

export default async function AnamneseTemplateBuilderPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("anamnesis_templates")
    .select("id, name")
    .eq("id", templateId)
    .eq("clinic_id", member.clinicId)
    .maybeSingle();

  if (!template) notFound();

  const { data: questions } = await supabase
    .from("anamnesis_questions")
    .select("id, label, type, required, options, position")
    .eq("template_id", templateId)
    .order("position", { ascending: true });

  return (
    <div className="space-y-4">
      <Link
        href="/configuracoes/anamnese"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Modelos de anamnese
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <TemplateNameEditor templateId={template.id} name={template.name} />
        <AddQuestionButton templateId={template.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas</CardTitle>
          <CardDescription>
            O paciente responde essas perguntas na ordem em que aparecem aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!questions || questions.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhuma pergunta adicionada ainda.</p>
          )}
          {questions?.map((question, index) => (
            <QuestionRow
              key={question.id}
              templateId={template.id}
              question={{
                id: question.id,
                label: question.label,
                type: question.type as QuestionType,
                required: question.required,
                options: (question.options as string[] | null) ?? [],
              }}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
