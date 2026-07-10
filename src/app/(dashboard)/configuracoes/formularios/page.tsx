import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getConsentTemplate } from "@/actions/consent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewTemplateButton } from "@/components/anamnesis/NewTemplateButton";
import { TemplateRowActions } from "@/components/anamnesis/TemplateRowActions";
import { ConsentTemplateForm } from "@/components/settings/ConsentTemplateForm";

export const metadata = { title: "Anamnese e consentimento — EstéticaOS" };

export default async function FormulariosSettingsPage() {
  const member = await requirePermission("settings_access");

  const supabase = await createClient();
  const [{ data: templates }, consentContent] = await Promise.all([
    supabase
      .from("anamnesis_templates")
      .select("id, name, active, anamnesis_questions(count)")
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: true }),
    getConsentTemplate(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anamnese e consentimento</h1>
        <p className="text-sm text-muted-foreground">
          Modelos de anamnese e o termo de consentimento/autorização de imagem que os pacientes
          preenchem e assinam.
        </p>
      </div>

      <Tabs defaultValue="anamnese">
        <TabsList>
          <TabsTrigger value="anamnese">Modelos de anamnese</TabsTrigger>
          <TabsTrigger value="consentimento">Termo de consentimento</TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="space-y-4">
          <div className="flex justify-end">
            <NewTemplateButton />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Seus modelos</CardTitle>
              <CardDescription>Clique em um modelo para editar as perguntas.</CardDescription>
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
        </TabsContent>

        <TabsContent value="consentimento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consentimento e autorização de imagem</CardTitle>
              <CardDescription>
                Este texto é mostrado ao paciente antes de assinar. Personalize como quiser — cada
                assinatura guarda uma cópia do texto vigente no momento, então mudanças aqui não
                alteram termos já assinados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsentTemplateForm initialContent={consentContent} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
