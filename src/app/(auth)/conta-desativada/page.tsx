import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata = { title: "Acesso indisponível — EstéticaOS" };

const MESSAGES = {
  "sem-clinica": {
    title: "Conta sem clínica vinculada",
    description:
      "Sua conta foi criada, mas não está vinculada a nenhuma clínica. Peça para a pessoa responsável pela clínica enviar um novo convite, ou fale com o suporte.",
  },
  default: {
    title: "Acesso desativado",
    description:
      "Seu acesso a esta clínica foi desativado pela pessoa responsável. Se você acha que isso é um engano, fale com quem administra a clínica ou com o suporte.",
  },
} as const;

export default async function ContaDesativadaPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const message = motivo === "sem-clinica" ? MESSAGES["sem-clinica"] : MESSAGES.default;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{message.title}</CardTitle>
        <CardDescription>{message.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <LogoutButton />
      </CardContent>
    </Card>
  );
}
