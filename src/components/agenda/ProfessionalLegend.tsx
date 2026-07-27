import Link from "next/link";
import { getProfessionalColor } from "@/lib/agenda/professional-colors";
import type { ProfessionalOption } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

/**
 * Legenda de cores dos profissionais exibida abaixo da agenda. Cada chip
 * filtra a agenda pelo profissional; o chip ativo volta para "todos".
 */
export function ProfessionalLegend({
  professionals,
  activeProf,
  view,
  date,
}: {
  professionals: ProfessionalOption[];
  activeProf?: string;
  view: string;
  date: string;
}) {
  if (professionals.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Profissionais:</span>
      {professionals.map((professional) => {
        const color = getProfessionalColor(professional.user_id, professional.color);
        const isActive = activeProf === professional.user_id;
        const params = new URLSearchParams({ view, date });
        if (!isActive) params.set("prof", professional.user_id);
        const href = `/agenda?${params.toString()}`;
        return (
          <Link
            key={professional.user_id}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-accent",
              isActive && "border-primary bg-accent font-medium",
            )}
          >
            {color && <span className={cn("size-2 shrink-0 rounded-full", color.dot)} />}
            {professional.full_name}
          </Link>
        );
      })}
    </div>
  );
}
