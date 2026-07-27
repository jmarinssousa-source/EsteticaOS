"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckSquare, Download, Loader2, Square, Trash2 } from "lucide-react";
import { deletePatientPhoto } from "@/actions/prontuario";
import { PHOTO_TYPE_LABELS } from "@/lib/prontuario/constants";
import type { PatientPhoto } from "@/lib/prontuario/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Nome amigável do arquivo baixado: tipo + data + legenda. */
function downloadName(photo: PatientPhoto, patientName: string) {
  const date = new Date(photo.created_at).toISOString().slice(0, 10);
  const parts = [patientName, PHOTO_TYPE_LABELS[photo.photo_type], date, photo.label]
    .filter(Boolean)
    .join("-");
  const slug = parts
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const extension = photo.storage_path.split(".").pop() || "jpg";
  return `${slug || "foto"}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function PhotosGallery({
  patientId,
  patientName,
  photos,
  signedUrls,
  canEdit,
}: {
  patientId: string;
  patientName: string;
  photos: PatientPhoto[];
  signedUrls: Record<string, string>;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  function toggle(photoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === photos.length ? new Set() : new Set(photos.map((p) => p.id))));
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deletePatientPhoto(photoId, patientId);
      if (result && "error" in result) toast.error(result.error);
      else setSelected((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    });
  }

  /**
   * Uma foto baixa direto; várias viram um .zip. O download usa a URL
   * assinada já carregada na página, então não passa pelo servidor.
   */
  async function handleDownload() {
    const chosen = photos.filter((p) => selected.has(p.id));
    if (chosen.length === 0) return;

    setDownloading(true);
    try {
      if (chosen.length === 1) {
        const photo = chosen[0];
        const response = await fetch(signedUrls[photo.storage_path]);
        if (!response.ok) throw new Error("download falhou");
        triggerDownload(await response.blob(), downloadName(photo, patientName));
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        const used = new Set<string>();

        for (const photo of chosen) {
          const response = await fetch(signedUrls[photo.storage_path]);
          if (!response.ok) continue;
          let name = downloadName(photo, patientName);
          // Evita sobrescrever quando duas fotos geram o mesmo nome.
          let counter = 2;
          while (used.has(name)) {
            const [base, ext] = [name.replace(/\.[^.]+$/, ""), name.split(".").pop()];
            name = `${base}-${counter++}.${ext}`;
          }
          used.add(name);
          zip.file(name, await response.blob());
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const date = new Date().toISOString().slice(0, 10);
        triggerDownload(blob, `fotos-${patientName.split(" ")[0].toLowerCase()}-${date}.zip`);
      }
      toast.success(chosen.length === 1 ? "Foto baixada." : `${chosen.length} fotos baixadas em .zip.`);
      setSelected(new Set());
    } catch {
      toast.error("Não foi possível baixar. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  if (photos.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
          {selected.size === photos.length ? (
            <CheckSquare className="size-4" />
          ) : (
            <Square className="size-4" />
          )}
          {selected.size === photos.length ? "Desmarcar todas" : "Selecionar todas"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleDownload}
          disabled={selected.size === 0 || downloading}
        >
          {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {downloading
            ? "Preparando..."
            : selected.size > 1
              ? `Baixar ${selected.size} fotos (.zip)`
              : "Baixar foto"}
        </Button>
        {selected.size > 0 && (
          <span className="text-xs text-muted-foreground">{selected.size} selecionada(s)</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          const url = signedUrls[photo.storage_path];
          const isSelected = selected.has(photo.id);
          return (
            <div key={photo.id} className="space-y-1">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Selecionar foto ${PHOTO_TYPE_LABELS[photo.photo_type]}`}
                onClick={() => toggle(photo.id)}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md border bg-muted transition-shadow",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                )}
              >
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={photo.label ?? "Foto do paciente"}
                    className="h-full w-full object-cover"
                  />
                )}
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded border bg-background/90",
                    isSelected && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {isSelected && <CheckSquare className="size-3.5" />}
                </span>
              </button>
              <div className="flex items-center justify-between gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {PHOTO_TYPE_LABELS[photo.photo_type]}
                </Badge>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Excluir foto"
                    disabled={isPending}
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              {photo.label && <p className="truncate text-xs text-muted-foreground">{photo.label}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
