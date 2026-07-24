import { groupOverlapping } from "@/lib/agenda/grouping";
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

  const groups = groupOverlapping(sorted);

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      {groups.map((group) => (
        <div
          key={group[0].id}
          className={group.length > 1 ? "grid gap-2" : ""}
          style={group.length > 1 ? { gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` } : undefined}
        >
          {group.map((appointment) => (
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
      ))}
    </div>
  );
}
