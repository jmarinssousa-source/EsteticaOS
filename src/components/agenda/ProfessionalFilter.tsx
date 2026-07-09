"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Select value={searchParams.get("prof") ?? "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue placeholder="Todos os profissionais" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os profissionais</SelectItem>
        {professionals.map((professional) => (
          <SelectItem key={professional.user_id} value={professional.user_id}>
            {professional.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
