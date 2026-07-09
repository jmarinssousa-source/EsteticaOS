import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewTemplateButton } from "@/components/anamnesis/NewTemplateButton";
import { TemplateRowActions } from "@/components/anamnesis/TemplateRowActions";

export const metadata = { title: "Modelos de anamnese — EstéticaOS" };

export default async function AnamneseTemplatesPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("anamnesis_templates")
    .select("id, name, active, anamnesis_questions(count)")
    .eq("clinic_id", member.clinicId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modelos de anamnese</h1>
          <p className="text-sm text-muted-foreground">
            Crie os formulários que os pacientes preenchem antes do atendimento.
          </p>
        </div>
        <NewTemplateButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus modelos</CardTitle>
          <CardDescription>
            Clique em um modelo para editar as perguntas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!templates || templates.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum modelo criado ainda.</p>
          )}
          {templates?.map((template) => {
            const questionCount = (template.anamnesis_questions as unknown as { count: number }[])[0]
              ?.count ?? 0;
            return (
              <Link
                key={template.id}
                href={`/configuracoes/anamnese/${template.id}`}
                className="flex items-center justify-between gap-2 rounded-md border p-3 transition-colors hover:bg-accent/50"
              >
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {questionCount} pergunta{questionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <TemplateRowActions templateId={template.id} active={template.active} />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
