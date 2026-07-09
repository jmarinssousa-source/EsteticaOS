"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deletePatientPhoto } from "@/actions/prontuario";
import { PHOTO_TYPE_LABELS } from "@/lib/prontuario/constants";
import type { PatientPhoto } from "@/lib/prontuario/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PhotosGallery({
  patientId,
  photos,
  signedUrls,
  canEdit,
}: {
  patientId: string;
  photos: PatientPhoto[];
  signedUrls: Record<string, string>;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(photoId: string) {
    startTransition(async () => {
      const result = await deletePatientPhoto(photoId, patientId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  if (photos.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma foto enviada ainda.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => {
        const url = signedUrls[photo.storage_path];
        return (
          <div key={photo.id} className="space-y-1">
            <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={photo.label ?? "Foto do paciente"} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex items-center justify-between gap-1">
              <Badge variant="outline" className="text-[10px]">
                {PHOTO_TYPE_LABELS[photo.photo_type]}
              </Badge>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
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
  );
}
