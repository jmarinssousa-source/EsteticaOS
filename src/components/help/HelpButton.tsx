"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Ajuda" />}>
        <HelpCircle className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        overlay={false}
        className="w-full max-w-md border shadow-xl sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Central de ajuda</SheetTitle>
          <SheetDescription>
            Tire dúvidas sobre como usar o EstéticaOS. Continue navegando com este painel aberto e
            feche quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <HelpPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
