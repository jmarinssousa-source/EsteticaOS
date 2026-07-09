import Link from "next/link";
import { cn } from "@/lib/utils";

export function ReportNav({ tab, from, to }: { tab: "dashboard" | "relatorios"; from: string; to: string }) {
  const items: { key: "dashboard" | "relatorios"; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "relatorios", label: "Relatórios" },
  ];

  return (
    <div className="flex w-fit rounded-lg border p-0.5">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`/relatorios?tab=${item.key}&from=${from}&to=${to}`}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            tab === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
