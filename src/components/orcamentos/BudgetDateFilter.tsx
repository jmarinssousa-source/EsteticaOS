"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Filtro por período de criação do orçamento, guardado na URL para que
 *  o link possa ser compartilhado e o botão voltar funcione. */
export function BudgetDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("de") ?? "";
  const to = searchParams.get("ate") ?? "";

  function apply(key: "de" | "ate", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/orcamentos?${params.toString()}`);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("de");
    params.delete("ate");
    router.push(`/orcamentos?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor="de" className="text-xs text-muted-foreground">
          De
        </Label>
        <Input
          id="de"
          type="date"
          className="w-40"
          value={from}
          max={to || undefined}
          onChange={(event) => apply("de", event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ate" className="text-xs text-muted-foreground">
          Até
        </Label>
        <Input
          id="ate"
          type="date"
          className="w-40"
          value={to}
          min={from || undefined}
          onChange={(event) => apply("ate", event.target.value)}
        />
      </div>
      {(from || to) && (
        <Button variant="ghost" size="sm" onClick={clear}>
          Limpar período
        </Button>
      )}
    </div>
  );
}
