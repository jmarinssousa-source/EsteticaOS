"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BODY_MAP_SVG, FACIAL_MAP_SVG } from "@/lib/prontuario/svg-maps";
import type { MapType } from "@/lib/prontuario/constants";

const MAP_SVG: Record<MapType, string> = { facial: FACIAL_MAP_SVG, body: BODY_MAP_SVG };

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function MapCanvas({
  mapType,
  onSave,
  saving = false,
}: {
  mapType: MapType;
  onSave: (dataUrl: string) => void;
  saving?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#DC2626";
      }
    }

    resize();
    setHasDrawn(false);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mapType]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const from = lastPointRef.current;
    const to = getPoint(event);
    if (!ctx || !from) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    lastPointRef.current = to;
    if (!hasDrawn) setHasDrawn(true);
  }

  function handlePointerUp() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const composite = document.createElement("canvas");
    composite.width = canvas.width;
    composite.height = canvas.height;
    const ctx = composite.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, composite.width, composite.height);

    const outline = new Image();
    await new Promise<void>((resolve, reject) => {
      outline.onload = () => resolve();
      outline.onerror = () => reject(new Error("Falha ao carregar o mapa base."));
      outline.src = svgToDataUri(MAP_SVG[mapType]);
    });
    ctx.drawImage(outline, 0, 0, composite.width, composite.height);
    ctx.drawImage(canvas, 0, 0);

    onSave(composite.toDataURL("image/png"));
  }

  return (
    <div className="space-y-2">
      <div className="relative h-80 w-full overflow-hidden rounded-md border bg-white">
        <div
          className="pointer-events-none absolute inset-0"
          dangerouslySetInnerHTML={{ __html: MAP_SVG[mapType] }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} disabled={!hasDrawn}>
          <Eraser className="size-4" />
          Limpar marcação
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={!hasDrawn || saving}>
          {saving ? "Salvando..." : "Salvar marcação"}
        </Button>
      </div>
    </div>
  );
}
