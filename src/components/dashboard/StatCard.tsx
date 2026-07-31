import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * O miolo do quadradinho de indicador, sem decidir o que acontece ao
 * clicar. Fica separado porque nem todo indicador leva para outra tela:
 * o de aniversariantes abre uma janela ali mesmo, e precisa ter
 * exatamente a mesma cara dos vizinhos na grade.
 */
export function StatCardBody({
  title,
  value,
  subtitle,
  icon: Icon,
  emphasis = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  emphasis?: boolean;
}) {
  return (
    <Card className="h-full text-left transition-colors hover:bg-accent/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className={emphasis ? "text-2xl font-bold text-amber-600" : "text-2xl font-bold"}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  href,
  emphasis = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  emphasis?: boolean;
}) {
  return (
    <Link href={href}>
      <StatCardBody
        title={title}
        value={value}
        subtitle={subtitle}
        icon={icon}
        emphasis={emphasis}
      />
    </Link>
  );
}
