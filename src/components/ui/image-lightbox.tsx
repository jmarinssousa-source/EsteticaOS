"use client";

import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Miniatura clicável que abre a imagem ampliada. A imagem grande cresce
 * até caber na tela (95vw x 85vh), então funciona igual no celular e no
 * computador, sem cortar o desenho.
 */
export function ImageLightbox({
  src,
  alt,
  title,
  className,
}: {
  src: string;
  alt: string;
  /** Cabeçalho mostrado dentro do visualizador. */
  title?: string;
  /** Classes da miniatura. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar ${alt}`}
        className={cn(
          "group relative w-fit overflow-hidden rounded-md border bg-white transition-shadow hover:shadow-md",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-48 w-auto object-contain" />
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/10 group-hover:opacity-100">
          <span className="rounded-full bg-background/90 p-2 shadow-sm">
            <ZoomIn className="size-5" />
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Largura explícita (não shrink-to-fit): num container que encolhe
            com o conteúdo, o max-w-full da imagem vira referência circular e
            ela quase não cresce em telas estreitas. */}
        <DialogContent className="p-3 sm:max-w-3xl">
          <DialogTitle className="pr-8 text-sm font-medium">{title ?? alt}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-[80vh] w-auto max-w-full rounded-md bg-white object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
