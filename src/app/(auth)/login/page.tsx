import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — EstéticaOS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/hoje";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse o sistema operacional da sua clínica.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {params.error === "link-invalido" && (
          <Alert variant="destructive">
            <AlertDescription>
              Este link expirou ou já foi usado. Solicite um novo.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
