import type { Appointment, PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { AppointmentCard } from "@/components/agenda/AppointmentCard";

export function DayView({
  appointments,
  patients,
  professionals,
  procedures,
  canEdit,
}: {
  appointments: Appointment[];
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  canEdit: boolean;
}) {
  const sorted = [...appointments].sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (sorted.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum agendamento neste dia.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-2">
      {sorted.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          patients={patients}
          professionals={professionals}
          procedures={procedures}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
