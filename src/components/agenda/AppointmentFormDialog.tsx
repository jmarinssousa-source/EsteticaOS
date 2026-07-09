"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createAppointment } from "@/actions/agenda";
import { createProcedure } from "@/actions/procedures";
import type { ActionState } from "@/actions/auth";
import type { PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
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

const initialState: ActionState = {};

export function AppointmentFormDialog({
  defaultDate,
  patients,
  professionals,
  procedures,
}: {
  defaultDate: string;
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  const [procedureList, setProcedureList] = useState(procedures);
  const [procedureId, setProcedureId] = useState("");
  const [newProcedureOpen, setNewProcedureOpen] = useState(false);
  const [newProcedureName, setNewProcedureName] = useState("");

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  function handleCreateProcedure() {
    const trimmed = newProcedureName.trim();
    if (!trimmed) return;
    createProcedure(trimmed).then((result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setProcedureList((prev) => [...prev, { id: result.id, name: trimmed, price: null }]);
      setProcedureId(result.id);
      setNewProcedureName("");
      setNewProcedureOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo agendamento
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Marque uma avaliação, procedimento ou retorno.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="status" value="scheduled" />
          <input type="hidden" name="procedureId" value={procedureId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="patientId">Paciente</Label>
            <Select name="patientId">
              <SelectTrigger id="patientId" className="w-full">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.patientId && (
              <p className="text-sm text-destructive">{state.fieldErrors.patientId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalId">Profissional</Label>
            <Select name="professionalId" defaultValue="">
              <SelectTrigger id="professionalId" className="w-full">
                <SelectValue placeholder="Sem profissional definido" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((professional) => (
                  <SelectItem key={professional.user_id} value={professional.user_id}>
                    {professional.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedimento</Label>
            {newProcedureOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  placeholder="Nome do procedimento"
                  value={newProcedureName}
                  onChange={(e) => setNewProcedureName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateProcedure();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleCreateProcedure}>
                  Adicionar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={procedureId} onValueChange={(v) => setProcedureId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem procedimento definido" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedureList.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id}>
                        {procedure.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={() => setNewProcedureOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Data</Label>
              <Input id="appointmentDate" name="appointmentDate" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
            {state.fieldErrors?.endTime && (
              <p className="col-span-3 text-sm text-destructive">{state.fieldErrors.endTime[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Agendando..." : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
