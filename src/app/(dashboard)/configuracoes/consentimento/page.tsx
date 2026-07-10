import { requirePermission } from "@/lib/auth/session";
import { getConsentTemplate } from "@/actions/consent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentTemplateForm } from "@/components/settings/ConsentTemplateForm";

export const metadata = { title: "Termo de consentimento — EstéticaOS" };

export default async function ConsentimentoSettingsPage() {
  await requirePermission("settings_access");
  const content = await getConsentTemplate();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Termo de consentimento</h1>
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
          <ConsentTemplateForm initialContent={content} />
        </CardContent>
      </Card>
    </div>
  );
}
