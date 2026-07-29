import { notFound } from "next/navigation";
import { getPublicConsent } from "@/actions/consent";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConsentSignForm } from "@/components/consent/ConsentSignForm";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";

export const metadata = { title: "Termo para assinar — EstéticaOS" };

export default async function PublicConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const consent = await getPublicConsent(token);

  if (!consent) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center">
          <p className="text-base font-semibold">{consent.clinicName}</p>
          <h1 className="text-xl font-bold tracking-tight">{consent.title}</h1>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {consent.status === "signed" ? (
              <Alert>
                <AlertDescription>
                  Obrigado! Este termo já foi assinado e está guardado com a clínica.
                </AlertDescription>
              </Alert>
            ) : (
              <ConsentSignForm token={token} content={consent.content} />
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
