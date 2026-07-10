"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimir / salvar como PDF" }: { label?: string }) {
  return (
    <Button className="print:hidden" onClick={() => window.print()}>
      <Printer className="size-4" />
      {label}
    </Button>
  );
}
