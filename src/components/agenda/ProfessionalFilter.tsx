"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfessionalColor } from "@/lib/agenda/professional-colors";
import type { ProfessionalOption } from "@/lib/agenda/types";

export function ProfessionalFilter({ professionals }: { professionals: ProfessionalOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete("prof");
    else params.set("prof", value);
    router.push(`/agenda?${params.toString()}`);
  }

  return (
    <Select
      items={[
        { value: "all", label: "Todos os profissionais" },
        ...professionals.map((professional) => {
          const color = getProfessionalColor(professional.user_id, professional.color);
          return {
            value: professional.user_id,
            label: (
              <span className="flex items-center gap-1.5">
                {color && <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />}
                {professional.full_name}
              </span>
            ),
          };
        }),
      ]}
      value={searchParams.get("prof") ?? "all"}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue placeholder="Todos os profissionais" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os profissionais</SelectItem>
        {professionals.map((professional) => {
          const color = getProfessionalColor(professional.user_id, professional.color);
          return (
            <SelectItem key={professional.user_id} value={professional.user_id}>
              <span className="flex items-center gap-1.5">
                {color && <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />}
                {professional.full_name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
