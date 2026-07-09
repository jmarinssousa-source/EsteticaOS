import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";
import Link from "next/link";

export const metadata = { title: "Verifique seu e-mail — EstéticaOS" };

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifique seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um e-mail de verificação para você confirmar sua conta. Por favor,
          verifique sua caixa de entrada. Caso não encontre a mensagem, confira também
          a pasta de spam ou lixo eletrônico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {email && (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm font-medium">
            {email}
          </p>
        )}
        <ResendVerificationButton email={email} />
        <p className="text-center text-sm text-muted-foreground">
          Já verificou?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
