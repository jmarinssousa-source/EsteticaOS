import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar — EstéticaOS" };

const ERROR_MESSAGES: Record<string, string> = {
  // Três fluxos diferentes caem aqui: confirmação de cadastro, convite
  // de equipe e recuperação de senha. Quem chega pelo cadastro já
  // escolheu a senha no formulário, então falar em "criar senha" mandava
  // essa pessoa procurar uma tela que não existe para ela. A mensagem
  // cobre os três sem chutar em qual deles a pessoa está.
  "link-invalido":
    "Este link expirou ou já foi usado. Se você criou uma clínica, tente entrar com o e-mail e a senha cadastrados. Se estava criando senha por convite ou recuperando o acesso, peça um novo link.",
  // O `/auth/confirm` sabe quando o link era de confirmação de cadastro,
  // e aí não há dúvida nenhuma a resolver: a senha existe, é só entrar.
  "cadastro-ja-confirmado":
    "Este link de confirmação expirou ou já foi usado. Entre com o e-mail e a senha que você cadastrou — se o e-mail ainda precisar ser confirmado, a gente reenvia o link na tela seguinte.",
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
