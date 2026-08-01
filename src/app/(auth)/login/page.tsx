import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — EstéticaOS" };

const ERROR_MESSAGES: Record<string, string> = {
  // Quem cai aqui por um link quebrado muitas vezes é convidado que
  // ainda não tem senha nenhuma. "Solicite um novo" não dizia a quem
  // pedir, e a pessoa ficava tentando adivinhar uma senha que nunca
  // existiu.
  "link-invalido":
    "Este link expirou ou já foi usado. Se você foi convidado e ainda não criou sua senha, peça um novo convite a quem administra a clínica. Se já tem conta, use \"Esqueceu a senha?\" abaixo.",
  "conta-desativada":
    "Seu acesso foi desativado. Fale com quem administra a clínica para reativá-lo.",
};

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
        {params.error && ERROR_MESSAGES[params.error] && (
          <Alert variant="destructive">
            <AlertDescription>{ERROR_MESSAGES[params.error]}</AlertDescription>
          </Alert>
        )}
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
