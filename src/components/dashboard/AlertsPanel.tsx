import Link from "next/link";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AlertItem = {
  label: string;
  href: string;
};

export function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-muted-foreground" />
          Alertas importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo certo por aqui.</p>
        ) : (
          <ul className="space-y-1.5">
            {alerts.map((alert) => (
              <li key={alert.label}>
                <Link
                  href={alert.href}
                  className="flex items-center gap-2 text-sm text-amber-700 hover:underline"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {alert.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
