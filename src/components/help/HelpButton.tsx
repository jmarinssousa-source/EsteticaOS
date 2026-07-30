"use client";

import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipHint } from "@/components/ui/tooltip-hint";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HelpPanel } from "@/components/help/HelpPanel";

export function HelpButton() {
  return (
    <Sheet modal={false} disablePointerDismissal>
      <TooltipHint label="Central de ajuda: passo a passo de cada tela">
        {/* Ícone de boia com a palavra "Ajuda" ao lado: um "?" sozinho
            não diz a quem nunca usou o sistema que ali tem socorro. No
            celular fica só o ícone, para não brigar por espaço. */}
        <SheetTrigger
          render={<Button variant="outline" size="sm" aria-label="Abrir central de ajuda" />}
        >
          <LifeBuoy className="size-4" />
          <span className="hidden sm:inline">Ajuda</span>
        </SheetTrigger>
      </TooltipHint>
      <SheetContent
        side="right"
        overlay={false}
        className="w-full max-w-md border shadow-xl sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Central de ajuda</SheetTitle>
          <SheetDescription>
            Escolha o assunto ou escreva sua dúvida. Você pode continuar usando o sistema com este
            painel aberto.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <HelpPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
