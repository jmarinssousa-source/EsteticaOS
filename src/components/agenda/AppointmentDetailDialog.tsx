"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAppointment } from "@/actions/agenda";
import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABELS } from "@/lib/agenda/constants";
import type { Appointment, PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";

function buildForm(appointment: Appointment) {
  return {
    patientId: appointment.patient_id,
    professionalId: appointment.professional_id ?? "",
    procedureId: appointment.procedure_id ?? "",
    appointmentDate: appointment.appointment_date,
    startTime: appointment.start_time.slice(0, 5),
    endTime: appointment.end_time.slice(0, 5),
    status: appointment.status,
    notes: appointment.notes ?? "",
  };
}

export function AppointmentDetailDialog({
  appointment,
  patients,
  professionals,
  procedures,
  canEdit,
  open,
  onOpenChange,
}: {
  appointment: Appointment;
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(() => buildForm(appointment));

  const [syncedWith, setSyncedWith] = useState({ open, id: appointment.id });
  if (open !== syncedWith.open || appointment.id !== syncedWith.id) {
    setSyncedWith({ open, id: appointment.id });
    if (open) setForm(buildForm(appointment));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateAppointment(appointment.id, form);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Agendamento atualizado.");
        onOpenChange(false);
      }
    });
  }

  const patientName = patients.find((p) => p.id === appointment.patient_id)?.name ?? "Paciente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patientName}</DialogTitle>
          <DialogDescription>Edite o agendamento, mude o status ou reagende.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select
              value={form.patientId}
              onValueChange={(v) => v && setForm((f) => ({ ...f, patientId: v }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Select
                value={form.professionalId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, professionalId: v === "none" ? "" : (v ?? "") }))}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem profissional</SelectItem>
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
              <Select
                value={form.procedureId || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, procedureId: v === "none" ? "" : (v ?? "") }))}
                disabled={!canEdit}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.appointmentDate}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, appointmentDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={form.startTime}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input
                type="time"
                value={form.endTime}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as typeof form.status }))}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {APPOINTMENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={form.notes}
              disabled={!canEdit}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        {canEdit && (
          <DialogFooter>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
