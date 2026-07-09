import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Criar conta — EstéticaOS" };

export default function CadastroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crie a conta da sua clínica</CardTitle>
        <CardDescription>
          Leva menos de um minuto. Depois é só confirmar seu e-mail para começar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
