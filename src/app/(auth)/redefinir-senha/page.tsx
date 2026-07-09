import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Redefinir senha — EstéticaOS" };

export default function RedefinirSenhaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Defina sua nova senha</CardTitle>
        <CardDescription>Escolha uma senha com pelo menos 8 caracteres.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
