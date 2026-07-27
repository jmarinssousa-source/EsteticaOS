"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/agenda/constants";
import { formatTime } from "@/lib/agenda/date-utils";
import { getProfessionalColor } from "@/lib/agenda/professional-colors";
import type { Appointment, PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppointmentDetailDialog } from "@/components/agenda/AppointmentDetailDialog";

export function AppointmentCard({
  appointment,
  patients,
  professionals,
  procedures,
  canEdit,
  compact = false,
}: {
  appointment: Appointment;
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  canEdit: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const patient = patients.find((p) => p.id === appointment.patient_id);
  const professional = professionals.find((p) => p.user_id === appointment.professional_id);
  const procedure = procedures.find((p) => p.id === appointment.procedure_id);
  const professionalColor = getProfessionalColor(appointment.professional_id, professional?.color);
  const isCanceled =
    appointment.status === "canceled_by_patient" ||
    appointment.status === "canceled_by_clinic" ||
    appointment.status === "no_show";

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer gap-1 border-l-4 p-2.5 shadow-sm transition-shadow hover:shadow-md",
          professionalColor
            ? [professionalColor.border, professionalColor.tint]
            : APPOINTMENT_STATUS_COLORS[appointment.status],
          isCanceled && "opacity-55",
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {formatTime(appointment.start_time)}–{formatTime(appointment.end_time)}
          </p>
          {!compact && (
            <Badge variant="outline" className="text-[10px]">
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </Badge>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          {professionalColor && (
            <span className={cn("size-1.5 shrink-0 rounded-full", professionalColor.dot)} />
          )}
          <p className="truncate text-sm font-medium">{patient?.name ?? "Paciente"}</p>
        </div>
        {!compact && (procedure || professional) && (
          <p className="truncate text-xs text-muted-foreground">
            {[procedure?.name, professional?.full_name].filter(Boolean).join(" · ")}
          </p>
        )}
      </Card>

      <AppointmentDetailDialog
        appointment={appointment}
        patients={patients}
        professionals={professionals}
        procedures={procedures}
        canEdit={canEdit}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
