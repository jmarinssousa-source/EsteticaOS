import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listSignableConsentTemplates } from "@/actions/consent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewTemplateButton } from "@/components/anamnesis/NewTemplateButton";
import { TemplateRowActions } from "@/components/anamnesis/TemplateRowActions";
import { ConsentTemplateForm } from "@/components/settings/ConsentTemplateForm";
import { SettingsBackLink } from "@/components/settings/SettingsBackLink";

export const metadata = { title: "Anamnese e consentimento — EstéticaOS" };

export default async function FormulariosSettingsPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const [{ data: templates }, consentTemplates] = await Promise.all([
    supabase
      .from("anamnesis_templates")
      .select("id, name, active, anamnesis_questions(count)")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: true }),
    listSignableConsentTemplates(),
  ]);

  return (
    <div className="space-y-4">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anamnese e consentimento</h1>
        <p className="text-sm text-muted-foreground">
          Modelos de anamnese e os termos de consentimento/autorização que os pacientes preenchem
          e assinam.
        </p>
      </div>

      <Tabs defaultValue="anamnese">
        <TabsList>
          <TabsTrigger value="anamnese">Modelos de anamnese</TabsTrigger>
          <TabsTrigger value="consentimento">Termos de consentimento</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="space-y-4">
          <div className="flex justify-end">
            <NewTemplateButton />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Seus modelos</CardTitle>
              <CardDescription>Clique no nome de um modelo para editar as perguntas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!templates || templates.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum modelo criado ainda.</p>
              )}
              {templates?.map((template) => {
                const questionCount = (template.anamnesis_questions as unknown as { count: number }[])[0]
                  ?.count ?? 0;
                return (
                  // O bloco deixou de ser um link inteiro: o botão de
                  // excluir ficava dentro dele e a navegação disparava
                  // junto com a confirmação, fechando o aviso antes de dar
                  // tempo de ler.
                  <div
                    key={template.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <Link
                      href={`/configuracoes/anamnese/${template.id}`}
                      className="min-w-0 flex-1 rounded-md transition-colors hover:text-primary"
                    >
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {questionCount} pergunta{questionCount === 1 ? "" : "s"}
                      </p>
                    </Link>
                    <TemplateRowActions templateId={template.id} active={template.active} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cada termo pode ser assinado na clínica ou enviado pelo WhatsApp do paciente.
            Assinaturas já colhidas guardam uma cópia do texto vigente, então editar aqui não
            altera o que alguém já assinou.
          </p>
          <ConsentTemplateForm templates={consentTemplates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
