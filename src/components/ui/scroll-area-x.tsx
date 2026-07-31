"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Área que rola para o lado, com barra de rolagem sempre à vista.
 *
 * A barra é desenhada por nós, e não a do navegador, porque no macOS a
 * nativa só aparece enquanto a pessoa rola: o quadro do CRM parecia
 * terminar na última coluna visível e ninguém descobria que havia mais
 * etapas à direita. Nem estilizar `::-webkit-scrollbar` resolve, a
 * flutuante continua flutuante.
 *
 * A rolagem em si continua sendo a do navegador: dedo, trackpad, roda do
 * mouse e Tab entre os campos funcionam como sempre. A barra é só o
 * indicador visível e uma alça a mais para arrastar com o mouse.
 */
export function ScrollAreaX({
  children,
  className,
  viewportClassName,
  label = "Rolar para o lado",
}: {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  /** Descrição da região para quem usa leitor de tela. */
  label?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScroll: number } | null>(null);

  // Em fração de 0 a 1: quanto da largura total cabe na tela, e onde
  // começa o pedaço visível. Guardar assim deixa a barra independente da
  // largura do trilho, que muda quando a janela muda.
  const [thumb, setThumb] = useState({ size: 1, offset: 0 });
  const [trackWidth, setTrackWidth] = useState(0);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    // O trilho é `w-full` no mesmo pai do container, então tem sempre a
    // mesma largura que ele. Medir pelo container evita depender de o
    // trilho já estar na tela.
    setTrackWidth(el.clientWidth);
    const { clientWidth, scrollWidth, scrollLeft } = el;
    if (scrollWidth <= clientWidth) {
      setThumb({ size: 1, offset: 0 });
      return;
    }
    setThumb({ size: clientWidth / scrollWidth, offset: scrollLeft / scrollWidth });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    measure();

    // Observa o container e o conteúdo: a barra precisa se refazer tanto
    // quando a janela muda de tamanho quanto quando entra ou sai uma
    // coluna do quadro.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [measure, children]);

  function scrollToFraction(fraction: number) {
    const el = viewportRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = Math.max(0, Math.min(max, fraction * el.scrollWidth));
  }

  function handleThumbPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = viewportRef.current;
    if (!el) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startScroll: el.scrollLeft };
  }

  function handleThumbPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!drag || !el || !track) return;
    // O trilho representa a largura total do conteúdo, então cada pixel
    // arrastado vale `scrollWidth / trackWidth` pixels de rolagem.
    const ratio = el.scrollWidth / track.clientWidth;
    el.scrollLeft = drag.startScroll + (event.clientX - drag.startX) * ratio;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTrackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || dragRef.current) return;
    const { left, width } = track.getBoundingClientRect();
    // Centraliza o pedaço visível no ponto clicado.
    scrollToFraction((event.clientX - left) / width - thumb.size / 2);
  }

  const scrollable = thumb.size < 1;
  // Alça minúscula não dá para pegar: com muitas colunas o pedaço
  // proporcional fica com poucos pixels. Por isso o piso de 32px, e por
  // isso a posição é calculada dentro do que sobra do trilho em vez de
  // ser a fração pura, senão a alça passaria do fim.
  const thumbWidth = Math.max(32, thumb.size * trackWidth);
  const thumbLeft =
    trackWidth > 0
      ? Math.min(thumb.offset / (1 - thumb.size), 1) * (trackWidth - thumbWidth)
      : 0;

  return (
    <div className={className}>
      <div
        ref={viewportRef}
        onScroll={measure}
        role="region"
        aria-label={label}
        className={cn("hide-native-scrollbar overflow-x-auto", viewportClassName)}
      >
        {children}
      </div>

      {scrollable && (
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          // Só afordância de mouse: quem usa teclado ou leitor de tela já
          // rola a região pelo caminho normal, sem passar por aqui.
          aria-hidden
          className="relative mt-2 h-2.5 w-full cursor-pointer rounded-full bg-border/60"
        >
          <div
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute inset-y-0 cursor-grab rounded-full bg-muted-foreground/50 transition-colors hover:bg-muted-foreground/70 active:cursor-grabbing active:bg-muted-foreground/80"
            style={{ width: thumbWidth, left: thumbLeft }}
          />
        </div>
      )}
    </div>
  );
}
