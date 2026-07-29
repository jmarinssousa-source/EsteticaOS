import { notFound } from "next/navigation";
import { getPublicAnamnesis } from "@/actions/anamnesis";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnamnesisFillForm } from "@/components/anamnesis/AnamnesisFillForm";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";

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
          <p className="text-base font-semibold">{anamnesis.clinicName}</p>
          <h1 className="text-xl font-bold tracking-tight">{anamnesis.templateName}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            {anamnesis.status !== "pending" ? (
              <Alert>
                <AlertDescription>
                  Obrigado! Suas respostas já foram enviadas para a clínica.
                </AlertDescription>
              </Alert>
            ) : (
              <AnamnesisFillForm token={token} questions={anamnesis.questions} />
            )}
          </CardContent>
        </Card>

        <footer className="flex flex-col items-center gap-1 pt-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <LogoMark className="size-4" />
            <Wordmark className="text-xs" />
          </span>
          <OrbyniqBadge className="items-center" />
        </footer>
      </div>
    </div>
  );
}
