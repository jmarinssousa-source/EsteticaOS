import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  buildMonthGrid,
  parseISODate,
  startOfWeek,
  toISODate,
} from "@/lib/agenda/date-utils";
import type { AgendaView } from "@/lib/agenda/constants";
import type { Appointment } from "@/lib/agenda/types";
import { AgendaNav } from "@/components/agenda/AgendaNav";
import { AppointmentFormDialog } from "@/components/agenda/AppointmentFormDialog";
import { DayView } from "@/components/agenda/DayView";
import { WeekView } from "@/components/agenda/WeekView";
import { MonthView } from "@/components/agenda/MonthView";

export const metadata = { title: "Agenda — EstéticaOS" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; prof?: string }>;
}) {
  const member = await requirePermission("agenda_view");
  const canEdit = hasPermission(member, "agenda_edit");
  const params = await searchParams;

  const view: AgendaView =
    params.view === "week" || params.view === "month" ? params.view : "day";
  const anchorDate = params.date ? parseISODate(params.date) : new Date();

  let rangeStart: string;
  let rangeEnd: string;
  if (view === "day") {
    rangeStart = rangeEnd = toISODate(anchorDate);
  } else if (view === "week") {
    const start = startOfWeek(anchorDate);
    rangeStart = toISODate(start);
    rangeEnd = toISODate(addDays(start, 6));
  } else {
    const weeks = buildMonthGrid(anchorDate);
    rangeStart = toISODate(weeks[0][0]);
    rangeEnd = toISODate(weeks[weeks.length - 1][6]);
  }

  const supabase = await createClient();

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, patient_id, professional_id, procedure_id, appointment_date, start_time, end_time, status, notes",
    )
    .eq("clinic_id", member.clinicId)
    .gte("appointment_date", rangeStart)
    .lte("appointment_date", rangeEnd);

  if (params.prof) {
    appointmentsQuery = appointmentsQuery.eq("professional_id", params.prof);
  }

  const [{ data: appointments }, { data: patients }, { data: professionals }, { data: procedures }] =
    await Promise.all([
      appointmentsQuery,
      supabase.from("patients").select("id, name").eq("clinic_id", member.clinicId).order("name"),
      supabase
        .from("clinic_members")
        .select("user_id, full_name")
        .eq("clinic_id", member.clinicId)
        .eq("status", "active")
        .order("full_name"),
      supabase.from("procedures").select("id, name, price").eq("clinic_id", member.clinicId).order("name"),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        {canEdit && (
          <AppointmentFormDialog
            defaultDate={toISODate(anchorDate)}
            patients={patients ?? []}
            professionals={professionals ?? []}
            procedures={procedures ?? []}
          />
        )}
      </div>

      <AgendaNav view={view} date={anchorDate} prof={params.prof} professionals={professionals ?? []} />

      {view === "day" && (
        <DayView
          appointments={(appointments ?? []) as Appointment[]}
          patients={patients ?? []}
          professionals={professionals ?? []}
          procedures={procedures ?? []}
          canEdit={canEdit}
        />
      )}

      {view === "week" && (
        <WeekView
          anchorDate={anchorDate}
          appointments={(appointments ?? []) as Appointment[]}
          patients={patients ?? []}
          professionals={professionals ?? []}
          procedures={procedures ?? []}
          canEdit={canEdit}
        />
      )}

      {view === "month" && (
        <MonthView
          anchorDate={anchorDate}
          appointments={(appointments ?? []) as Appointment[]}
          patients={patients ?? []}
          prof={params.prof}
        />
      )}
    </div>
  );
}
