"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BodyView, Gender, MapType } from "@/lib/prontuario/constants";

// Fotos em public/prontuario/ — recortadas das imagens de referência da
// clínica. Corpo tem frente e costas (giro 3D); rosto tem vista única.
const BODY_IMAGE_SIZE = { width: 440, height: 1100 };
const FACE_IMAGE_SIZE = { width: 880, height: 1100 };

function bodyImageUrl(gender: Gender, view: BodyView) {
  return `/prontuario/body-${gender}-${view}.jpg`;
}

function faceImageUrl(gender: Gender) {
  return `/prontuario/face-${gender}.jpg`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a imagem do mapa."));
    img.src = src;
  });
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

/** Lado visível para um dado ângulo de giro. */
function sideForAngle(angle: number): BodyView {
  const norm = normalizeAngle(angle);
  return norm < 90 || norm >= 270 ? "front" : "back";
}

function useDrawing(strokeColor = "#DC2626") {
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
        ctx.strokeStyle = strokeColor;
      }
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [strokeColor]);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  const handlers = {
    onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      lastPointRef.current = getPoint(event);
    },
    onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
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
      setHasDrawn(true);
    },
    onPointerUp() {
      drawingRef.current = false;
      lastPointRef.current = null;
    },
    onPointerLeave() {
      drawingRef.current = false;
      lastPointRef.current = null;
    },
  };

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  return { canvasRef, handlers, hasDrawn, clear };
}

export function MapCanvas({
  mapType,
  gender = "female",
  onSave,
  saving = false,
}: {
  mapType: MapType;
  gender?: Gender;
  onSave: (dataUrl: string) => void;
  saving?: boolean;
}) {
  const front = useDrawing();
  const back = useDrawing();
  const { canvasRef: faceCanvasRef, handlers: faceHandlers } = front;

  // Giro do corpo: ângulo contínuo, com animação ao usar os botões e
  // arraste livre na barra de girar (snap para frente/costas ao soltar).
  const [angle, setAngle] = useState(0);
  const [animated, setAnimated] = useState(true);
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null);
  const visibleSide = sideForAngle(angle);
  const resting = normalizeAngle(angle) % 180 === 0;

  function rotateBy(delta: number) {
    setAnimated(true);
    setAngle((a) => a + delta);
  }

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setAnimated(false);
    dragRef.current = { startX: event.clientX, startAngle: angle };
  }

  function handleDragMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setAngle(drag.startAngle + (event.clientX - drag.startX) * 0.6);
  }

  function handleDragEnd() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setAnimated(true);
    setAngle((a) => Math.round(a / 180) * 180);
  }

  const isBody = mapType === "body";
  const imageSize = isBody ? BODY_IMAGE_SIZE : FACE_IMAGE_SIZE;
  const aspectRatio = `${imageSize.width} / ${imageSize.height}`;
  const hasDrawn = isBody ? front.hasDrawn || back.hasDrawn : front.hasDrawn;

  function clearVisible() {
    if (isBody && visibleSide === "back") back.clear();
    else front.clear();
  }

  async function handleSave() {
    const { width, height } = imageSize;
    const composite = document.createElement("canvas");
    const labelSpace = isBody ? 44 : 0;
    const gap = 32;
    composite.width = isBody ? width * 2 + gap : width;
    composite.height = height + labelSpace;
    const ctx = composite.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, composite.width, composite.height);

    async function drawSide(
      url: string,
      canvas: HTMLCanvasElement | null,
      offsetX: number,
      label?: string,
    ) {
      if (!ctx) return;
      const img = await loadImage(url);
      ctx.drawImage(img, offsetX, labelSpace, width, height);
      if (canvas && canvas.width > 0) {
        ctx.drawImage(canvas, offsetX, labelSpace, width, height);
      }
      if (label) {
        ctx.fillStyle = "#111827";
        ctx.font = "600 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, offsetX + width / 2, 32);
      }
    }

    if (isBody) {
      await drawSide(bodyImageUrl(gender, "front"), front.canvasRef.current, 0, "Frente");
      await drawSide(bodyImageUrl(gender, "back"), back.canvasRef.current, width + gap, "Costas");
    } else {
      await drawSide(faceImageUrl(gender), front.canvasRef.current, 0);
    }

    onSave(composite.toDataURL("image/png"));
  }

  return (
    <div className="space-y-2">
      <div
        className="relative mx-auto h-[420px] max-w-full overflow-hidden rounded-md border bg-white sm:h-[480px]"
        style={{ aspectRatio, perspective: "1400px" }}
      >
        {isBody ? (
          <div
            className={cn(
              "relative size-full",
              animated && "transition-transform duration-500 ease-out",
            )}
            style={{ transformStyle: "preserve-3d", transform: `rotateY(${angle}deg)` }}
          >
            {(["front", "back"] as const).map((side) => {
              const pad = side === "front" ? front : back;
              return (
                <div
                  key={side}
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: side === "back" ? "rotateY(180deg)" : undefined,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bodyImageUrl(gender, side)}
                    alt={side === "front" ? "Corpo de frente" : "Corpo de costas"}
                    className="pointer-events-none absolute inset-0 size-full select-none"
                    draggable={false}
                  />
                  <canvas
                    ref={pad.canvasRef}
                    className={cn(
                      "absolute inset-0 size-full touch-none",
                      (!resting || visibleSide !== side) && "pointer-events-none",
                    )}
                    {...pad.handlers}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faceImageUrl(gender)}
              alt="Rosto"
              className="pointer-events-none absolute inset-0 size-full select-none"
              draggable={false}
            />
            <canvas
              ref={faceCanvasRef}
              className="absolute inset-0 size-full touch-none"
              {...faceHandlers}
            />
          </>
        )}
      </div>

      {isBody && (
        <div className="mx-auto flex w-full max-w-xs items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Girar para a esquerda"
            onClick={() => rotateBy(-180)}
          >
            <RotateCcw className="size-4" />
          </Button>
          <div
            className="flex h-8 flex-1 cursor-ew-resize touch-none select-none items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            ⇆ arraste para girar · {visibleSide === "front" ? "frente" : "costas"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Girar para a direita"
            onClick={() => rotateBy(180)}
          >
            <RotateCw className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearVisible} disabled={!hasDrawn}>
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
