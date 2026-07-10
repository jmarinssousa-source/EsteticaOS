import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardList, FileUp, Package, Percent, Users } from "lucide-react";

export const metadata = { title: "Configurações — EstéticaOS" };

export default async function ConfiguracoesPage() {
  await requirePermission("settings_access");

  const sections = [
    {
      href: "/configuracoes/clinica",
      title: "Minha clínica",
      description: "Dados cadastrais da clínica.",
      icon: Building2,
    },
    {
      href: "/configuracoes/usuarios",
      title: "Usuários e permissões",
      description: "Convide sua equipe e defina o que cada pessoa pode ver ou editar.",
      icon: Users,
    },
    {
      href: "/configuracoes/formularios",
      title: "Anamnese e consentimento",
      description: "Modelos de anamnese e o termo de consentimento/autorização de imagem.",
      icon: ClipboardList,
    },
    {
      href: "/configuracoes/pacotes",
      title: "Pacotes",
      description: "Agrupe sessões de procedimentos para vender em orçamentos.",
      icon: Package,
    },
    {
      href: "/configuracoes/comissoes",
      title: "Comissões",
      description: "Percentuais de comissão por profissional e procedimento.",
      icon: Percent,
    },
    {
      href: "/configuracoes/importacao",
      title: "Importação/Exportação",
      description: "Migre ou exporte pacientes, procedimentos, agenda e financeiro por planilha.",
      icon: FileUp,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <section.icon className="mb-2 size-5 text-muted-foreground" />
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
