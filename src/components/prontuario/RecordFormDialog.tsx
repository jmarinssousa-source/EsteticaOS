"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createPatientRecord } from "@/actions/prontuario";
import {
  GENDERS,
  GENDER_LABELS,
  MAP_TYPES,
  MAP_TYPE_LABELS,
  type Gender,
  type MapType,
} from "@/lib/prontuario/constants";
import { cn } from "@/lib/utils";
import type { ProcedureOption } from "@/lib/procedures/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MapCanvas } from "@/components/prontuario/MapCanvas";

export function RecordFormDialog({
  patientId,
  procedures,
}: {
  patientId: string;
  procedures: ProcedureOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [procedureId, setProcedureId] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [complication, setComplication] = useState("");
  const [mapType, setMapType] = useState<MapType | "">("");
  const [gender, setGender] = useState<Gender>("female");
  const [mapImageDataUrl, setMapImageDataUrl] = useState<string | null>(null);

  const [syncedWith, setSyncedWith] = useState(open);
  if (open !== syncedWith) {
    setSyncedWith(open);
    if (open) {
      setProcedureId("");
      setRecordDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setComplication("");
      setMapType("");
      setGender("female");
      setMapImageDataUrl(null);
      setError(null);
    }
  }

  function handleSave() {
    if (mapType && !mapImageDataUrl) {
      setError('Desenhe e clique em "Salvar marcação" antes de concluir o registro.');
      return;
    }
    startTransition(async () => {
      const result = await createPatientRecord(patientId, {
        procedureId,
        recordDate,
        notes,
        mapType,
        complication,
        mapImageDataUrl,
      });
      if ("error" in result) {
        setError(result.error ?? "Não foi possível salvar.");
        toast.error(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo registro
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo registro clínico</DialogTitle>
          <DialogDescription>
            O que foi conversado, planejado e executado no atendimento — com marcação no mapa
            facial ou corporal, se quiser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select
                items={[
                  { value: "none", label: "Sem procedimento" },
                  ...procedures.map((procedure) => ({ value: procedure.id, label: procedure.name })),
                ]}
                value={procedureId || "none"}
                onValueChange={(v) => setProcedureId(v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem procedimento</SelectItem>
                  {procedures.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Intercorrência (se houver)</Label>
            <Textarea rows={2} value={complication} onChange={(e) => setComplication(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Mapa</Label>
            <Select
              items={[
                { value: "none", label: "Sem mapa" },
                ...MAP_TYPES.map((type) => ({ value: type, label: MAP_TYPE_LABELS[type] })),
              ]}
              value={mapType || "none"}
              onValueChange={(v) => {
                const next = v === "none" ? "" : (v as MapType);
                setMapType(next);
                setMapImageDataUrl(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem mapa</SelectItem>
                {MAP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MAP_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mapType && (
            <div className="flex w-fit items-center gap-1 rounded-lg border p-0.5">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    gender === g
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {GENDER_LABELS[g]}
                </button>
              ))}
            </div>
          )}

          {mapType && (
            <MapCanvas
              key={`${mapType}-${gender}`}
              mapType={mapType}
              gender={gender}
              onSave={(dataUrl) => {
                setMapImageDataUrl(dataUrl);
                setError(null);
              }}
            />
          )}
          {mapType && mapImageDataUrl && (
            <p className="text-sm text-emerald-600">Marcação salva. Pronto para concluir o registro.</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
