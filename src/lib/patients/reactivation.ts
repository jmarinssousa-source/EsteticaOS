import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_INACTIVE_PATIENT_DAYS = 90;

export type PatientActivity = {
  patient_id: string;
  created_at: string;
  last_appointment: string | null;
  last_session: string | null;
  next_appointment: string | null;
};

export type InactivePatient = {
  id: string;
  name: string;
  phone: string | null;
  /** Última vez que veio à clínica; null se nunca veio. */
  lastVisit: string | null;
  daysSince: number;
};

function daysBetween(from: string, today: Date) {
  const start = new Date(`${from.slice(0, 10)}T00:00:00`);
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Pacientes que merecem um contato de retorno: sem horário marcado e sem
 * vir há mais de `inactiveDays`. Quem nunca veio conta a partir do
 * cadastro — assim um cadastro de ontem não vira alerta, mas alguém que
 * se cadastrou e nunca apareceu, sim.
 */
export function findInactivePatients(
  patients: { id: string; name: string; phone: string | null }[],
  activity: PatientActivity[],
  inactiveDays: number,
  today = new Date(),
): InactivePatient[] {
  const byPatient = new Map(activity.map((a) => [a.patient_id, a]));

  return patients
    .map((patient) => {
      const a = byPatient.get(patient.id);
      if (!a || a.next_appointment) return null;

      const visits = [a.last_appointment, a.last_session].filter(
        (d): d is string => Boolean(d),
      );
      const lastVisit = visits.length > 0 ? visits.sort().at(-1)! : null;
      const daysSince = daysBetween(lastVisit ?? a.created_at, today);
      if (daysSince < inactiveDays) return null;

      return { ...patient, lastVisit, daysSince };
    })
    .filter((p): p is InactivePatient => p !== null)
    .sort((a, b) => b.daysSince - a.daysSince);
}

/** Busca a lista pronta para a clínica atual. */
export async function getInactivePatients(
  supabase: SupabaseClient,
  clinicId: string,
  inactiveDays: number,
): Promise<InactivePatient[]> {
  const [{ data: patients }, { data: activity }] = await Promise.all([
    supabase.from("patients").select("id, name, phone").eq("clinic_id", clinicId),
    supabase
      .from("patient_activity")
      .select("patient_id, created_at, last_appointment, last_session, next_appointment")
      .eq("clinic_id", clinicId),
  ]);

  return findInactivePatients(patients ?? [], (activity ?? []) as PatientActivity[], inactiveDays);
}
