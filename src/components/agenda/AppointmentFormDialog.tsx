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
import { Combobox } from "@/components/ui/combobox";
import { TimeField } from "@/components/ui/time-field";
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

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : Number.NaN;
}

function minutesBetween(start: string, end: string) {
  const diff = toMinutes(end) - toMinutes(start);
  return Number.isFinite(diff) ? diff : 0;
}

function addMinutes(time: string, minutes: number) {
  const total = (toMinutes(time) + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

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
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }

  function handleCreateProcedure(name: string) {
    createProcedure(name).then((result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setProcedureList((prev) => [...prev, { id: result.id, name, price: null }]);
      setProcedureId(result.id);
      toast.success(`Procedimento “${name}” cadastrado.`);
    });
  }

  // Mantém a consulta com a mesma duração ao mudar o início, em vez de
  // deixar um horário final inválido para trás.
  function handleStartTimeChange(next: string) {
    const duration = minutesBetween(startTime, endTime);
    setStartTime(next);
    if (next && duration > 0) setEndTime(addMinutes(next, duration));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo agendamento
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Marque uma avaliação, procedimento ou retorno.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="status" value="scheduled" />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="patientId">Paciente</Label>
            <Combobox
              id="patientId"
              name="patientId"
              placeholder="Digite para buscar o paciente"
              emptyMessage="Nenhum paciente encontrado."
              options={patients.map((patient) => ({ value: patient.id, label: patient.name }))}
            />
            {state.fieldErrors?.patientId && (
              <p className="text-sm text-destructive">{state.fieldErrors.patientId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalId">Profissional</Label>
            <Select
              name="professionalId"
              defaultValue=""
              items={professionals.map((professional) => ({
                value: professional.user_id,
                label: professional.full_name,
              }))}
            >
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
            <Label htmlFor="procedureId">Procedimento</Label>
            <Combobox
              id="procedureId"
              name="procedureId"
              placeholder="Digite para buscar ou cadastrar"
              emptyMessage="Nenhum procedimento com esse nome."
              options={procedureList.map((procedure) => ({ value: procedure.id, label: procedure.name }))}
              value={procedureId}
              onValueChange={setProcedureId}
              onCreate={handleCreateProcedure}
            />
            <p className="text-xs text-muted-foreground">
              Não achou? Digite o nome e escolha “Cadastrar” para incluir no catálogo da clínica.
            </p>
          </div>

          {/* No celular a data ocupa a linha inteira e início/fim dividem a
              seguinte: três campos lado a lado deixam cada um com ~90px, e a
              data não cabe. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="col-span-2 space-y-2 sm:col-span-1">
              <Label htmlFor="appointmentDate">Data</Label>
              <Input id="appointmentDate" name="appointmentDate" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <TimeField
                id="startTime"
                name="startTime"
                value={startTime}
                onValueChange={handleStartTimeChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <TimeField id="endTime" name="endTime" value={endTime} onValueChange={setEndTime} />
            </div>
            {state.fieldErrors?.endTime && (
              <p className="col-span-2 text-sm text-destructive sm:col-span-3">
                {state.fieldErrors.endTime[0]}
              </p>
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
