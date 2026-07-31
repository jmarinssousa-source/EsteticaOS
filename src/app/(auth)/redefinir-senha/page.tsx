import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Redefinir senha — EstéticaOS" };

/**
 * Só abre o formulário quando o link do e-mail virou sessão de verdade.
 *
 * Sem essa checagem a tela aparecia igual para quem chegou por um link
 * já usado: a pessoa escolhia a senha nova, digitava duas vezes e só no
 * envio descobria que não valia. Agora a conversa acontece antes.
 *
 * Vale para os dois caminhos que caem aqui, convite de equipe e
 * recuperação de senha: nos dois quem autoriza é a mesma sessão criada
 * em /auth/callback.
 */
export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link expirado</CardTitle>
          <CardDescription>Não dá para definir a senha por aqui agora.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Este link expirou ou já foi usado. Peça um novo convite a quem administra a clínica,
              ou solicite um novo link de senha.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/recuperar-senha" />}>
              Pedir novo link de senha
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Voltar para o login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defina sua senha</CardTitle>
        <CardDescription>
          Escolha uma senha com pelo menos 8 caracteres. Depois de salvar você entra direto no
          sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
