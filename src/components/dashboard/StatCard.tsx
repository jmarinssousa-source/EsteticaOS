import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
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
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className={emphasis ? "text-2xl font-bold text-amber-600" : "text-2xl font-bold"}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
