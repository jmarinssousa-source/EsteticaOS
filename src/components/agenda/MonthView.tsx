import Link from "next/link";
import { buildMonthGrid, formatTime, isSameDay, toISODate } from "@/lib/agenda/date-utils";
import type { Appointment, PatientOption } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthView({
  anchorDate,
  appointments,
  patients,
  prof,
}: {
  anchorDate: Date;
  appointments: Appointment[];
  patients: PatientOption[];
  prof?: string;
}) {
  const weeks = buildMonthGrid(anchorDate);
  const today = new Date();
  const currentMonth = anchorDate.getMonth();

  function hrefFor(day: Date) {
    const params = new URLSearchParams({ view: "day", date: toISODate(day) });
    if (prof) params.set("prof", prof);
    return `/agenda?${params.toString()}`;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const dayAppointments = appointments
            .filter((a) => a.appointment_date === toISODate(day))
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          const isCurrentMonth = day.getMonth() === currentMonth;

          return (
            <Link
              key={toISODate(day)}
              href={hrefFor(day)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-accent/50",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs",
                  isSameDay(day, today) && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayAppointments.slice(0, 2).map((appointment) => {
                  const patient = patients.find((p) => p.id === appointment.patient_id);
                  return (
                    <p key={appointment.id} className="truncate text-[10px] text-muted-foreground">
                      {formatTime(appointment.start_time)} {patient?.name ?? "Paciente"}
                    </p>
                  );
                })}
                {dayAppointments.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">+{dayAppointments.length - 2}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
