import { addDays, formatWeekdayShort, isSameDay, startOfWeek, toISODate } from "@/lib/agenda/date-utils";
import type { Appointment, PatientOption, ProcedureOption, ProfessionalOption } from "@/lib/agenda/types";
import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import { cn } from "@/lib/utils";

export function WeekView({
  anchorDate,
  appointments,
  patients,
  professionals,
  procedures,
  canEdit,
}: {
  anchorDate: Date;
  appointments: Appointment[];
  patients: PatientOption[];
  professionals: ProfessionalOption[];
  procedures: ProcedureOption[];
  canEdit: boolean;
}) {
  const start = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayAppointments = appointments
          .filter((a) => a.appointment_date === toISODate(day))
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div key={toISODate(day)} className="space-y-2">
            <p
              className={cn(
                "text-center text-xs font-medium text-muted-foreground",
                isSameDay(day, today) && "font-bold text-foreground",
              )}
            >
              {formatWeekdayShort(day)} {day.getDate()}
            </p>
            <div className="space-y-1.5">
              {dayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  patients={patients}
                  professionals={professionals}
                  procedures={procedures}
                  canEdit={canEdit}
                  compact
                />
              ))}
              {dayAppointments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground/60">—</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
