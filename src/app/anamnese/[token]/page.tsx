import { notFound } from "next/navigation";
import { getPublicAnamnesis } from "@/actions/anamnesis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnamnesisFillForm } from "@/components/anamnesis/AnamnesisFillForm";

export const metadata = { title: "Anamnese — EstéticaOS" };

export default async function PublicAnamnesePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const anamnesis = await getPublicAnamnesis(token);

  if (!anamnesis) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{anamnesis.clinicName}</p>
          <h1 className="text-xl font-bold tracking-tight">{anamnesis.templateName}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Olá, {anamnesis.patientName.split(" ")[0]}</CardTitle>
            <CardDescription>
              Responda as perguntas abaixo antes do seu atendimento. Leva menos de 5 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {anamnesis.status !== "pending" ? (
              <Alert>
                <AlertDescription>Este formulário já foi preenchido. Obrigado!</AlertDescription>
              </Alert>
            ) : (
              <AnamnesisFillForm token={token} questions={anamnesis.questions} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
