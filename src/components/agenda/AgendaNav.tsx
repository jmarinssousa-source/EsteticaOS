import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  formatDayLong,
  formatMonthTitle,
  startOfWeek,
  toISODate,
} from "@/lib/agenda/date-utils";
import type { AgendaView } from "@/lib/agenda/constants";
import { ProfessionalFilter } from "@/components/agenda/ProfessionalFilter";
import type { ProfessionalOption } from "@/lib/agenda/types";

function buildHref(view: AgendaView, date: string, prof?: string) {
  const params = new URLSearchParams({ view, date });
  if (prof) params.set("prof", prof);
  return `/agenda?${params.toString()}`;
}

function getAdjacentDate(view: AgendaView, date: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, direction * 7);
  return addMonths(date, direction);
}

function getTitle(view: AgendaView, date: Date) {
  if (view === "day") return formatDayLong(date);
  if (view === "month") return formatMonthTitle(date);
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  return `${start.getDate()} – ${end.getDate()} de ${formatMonthTitle(end).split(" de ")[0]}`;
}

export function AgendaNav({
  view,
  date,
  prof,
  professionals,
}: {
  view: AgendaView;
  date: Date;
  prof?: string;
  professionals: ProfessionalOption[];
}) {
  const today = new Date();
  const prev = getAdjacentDate(view, date, -1);
  const next = getAdjacentDate(view, date, 1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" render={<Link href={buildHref(view, toISODate(prev), prof)} />}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" render={<Link href={buildHref(view, toISODate(today), prof)} />}>
          Hoje
        </Button>
        <Button variant="outline" size="icon" render={<Link href={buildHref(view, toISODate(next), prof)} />}>
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="text-sm font-semibold capitalize sm:text-base">{getTitle(view, date)}</h2>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex rounded-lg border p-0.5">
          {(["day", "week", "month"] as AgendaView[]).map((v) => (
            <Link
              key={v}
              href={buildHref(v, toISODate(date), prof)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                v === view ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
            </Link>
          ))}
        </div>
        <ProfessionalFilter professionals={professionals} />
      </div>
    </div>
  );
}
