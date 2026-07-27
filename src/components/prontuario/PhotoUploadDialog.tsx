"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { uploadPatientPhotos } from "@/actions/prontuario";
import type { ActionState } from "@/actions/auth";
import { PHOTO_TYPES, PHOTO_TYPE_LABELS, type PhotoType } from "@/lib/prontuario/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionState = {};

// Comprime no aparelho antes de enviar: fotos de celular (4–10 MB) viram
// JPEGs de ~200–400 KB, o que economiza armazenamento no Supabase e evita
// o limite de 10 MB por envio do servidor. Se a foto não puder ser
// decodificada (formato exótico), envia o arquivo original.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoUploadDialog({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const [photoType, setPhotoType] = useState<PhotoType>("general");
  const [state, formAction, pending] = useActionState(uploadPatientPhotos, initialState);

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Upload className="size-4" />
        Enviar fotos
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar fotos</DialogTitle>
          <DialogDescription>Envie uma ou mais fotos do celular, tablet ou computador.</DialogDescription>
        </DialogHeader>

        <form
          action={async (formData) => {
            const files = formData
              .getAll("files")
              .filter((f): f is File => f instanceof File && f.size > 0);
            if (files.length > 0) {
              const compressed = await Promise.all(files.map(compressImage));
              formData.delete("files");
              for (const file of compressed) formData.append("files", file);
            }
            formAction(formData);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="patientId" value={patientId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="files">Fotos</Label>
            <Input id="files" name="files" type="file" accept="image/*" multiple required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoType">Tipo</Label>
            <Select
              name="photoType"
              items={PHOTO_TYPES.map((type) => ({ value: type, label: PHOTO_TYPE_LABELS[type] }))}
              value={photoType}
              onValueChange={(v) => v && setPhotoType(v as PhotoType)}
            >
              <SelectTrigger id="photoType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PHOTO_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Legenda (opcional)</Label>
            <Input id="label" name="label" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
