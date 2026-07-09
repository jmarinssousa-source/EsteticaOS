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

        <form action={formAction} className="space-y-4">
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
            <Select name="photoType" value={photoType} onValueChange={(v) => v && setPhotoType(v as PhotoType)}>
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
