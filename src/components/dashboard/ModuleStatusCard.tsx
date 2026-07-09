import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModuleStatusCard({
  title,
  icon: Icon,
  href,
  availableFrom,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  availableFrom: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground/40">—</p>
          <p className="mt-1 text-xs text-muted-foreground">Disponível a partir de {availableFrom}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
