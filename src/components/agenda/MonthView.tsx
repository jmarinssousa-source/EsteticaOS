import Link from "next/link";
import { buildMonthGrid, formatTime, isSameDay, toISODate } from "@/lib/agenda/date-utils";
import { getProfessionalColor } from "@/lib/agenda/professional-colors";
import type { Appointment, PatientOption, ProfessionalOption } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthView({
  anchorDate,
  appointments,
  patients,
  professionals,
  prof,
}: {
  anchorDate: Date;
  appointments: Appointment[];
  patients: PatientOption[];
  professionals: ProfessionalOption[];
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
          <div
            key={label}
            className="p-1 text-center text-[10px] font-medium text-muted-foreground sm:p-2 sm:text-xs"
          >
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
                "flex min-h-16 flex-col gap-1 border-b border-r p-1 text-left transition-colors last:border-r-0 hover:bg-accent/50 sm:min-h-24 sm:p-1.5",
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
              {/* Sete colunas num celular deixam cada dia com ~45px: nome do
                  paciente e horário viram um borrão cortado. Até `sm` o dia
                  mostra só uma bolinha por agendamento, com a cor do
                  profissional; a lista escrita volta no tablet/desktop. */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {dayAppointments.slice(0, 6).map((appointment) => {
                  const professional = professionals.find(
                    (p) => p.user_id === appointment.professional_id,
                  );
                  const color = getProfessionalColor(
                    appointment.professional_id,
                    professional?.color,
                  );
                  return (
                    <span
                      key={appointment.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        color ? color.dot : "bg-muted-foreground/50",
                      )}
                    />
                  );
                })}
              </div>
              <div className="hidden space-y-0.5 sm:block">
                {dayAppointments.slice(0, 3).map((appointment) => {
                  const patient = patients.find((p) => p.id === appointment.patient_id);
                  const professional = professionals.find(
                    (p) => p.user_id === appointment.professional_id,
                  );
                  const color = getProfessionalColor(
                    appointment.professional_id,
                    professional?.color,
                  );
                  return (
                    <p
                      key={appointment.id}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1 py-px text-[10px]",
                        color ? color.tint : "text-muted-foreground",
                      )}
                    >
                      {color && <span className={cn("size-1.5 shrink-0 rounded-full", color.dot)} />}
                      <span className="truncate">
                        {formatTime(appointment.start_time)} {patient?.name ?? "Paciente"}
                      </span>
                    </p>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <p className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{dayAppointments.length - 3} agendamento(s)
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
