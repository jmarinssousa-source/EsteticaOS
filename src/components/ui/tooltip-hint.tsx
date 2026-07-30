"use client";

import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Legenda que aparece ao parar o mouse em cima de um botão de ícone.
 *
 * O gatilho é um `<span>` em volta do controle, e não o próprio controle:
 * assim o clique, o `onClick` e o `href` continuam sendo do botão/link
 * original, sem depender do merge de props do Base UI. É o mesmo padrão
 * já usado no menu lateral recolhido.
 */
export function TooltipHint({
  label,
  side = "bottom",
  children,
}: {
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
