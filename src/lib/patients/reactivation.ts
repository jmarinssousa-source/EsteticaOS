import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

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

type PatientRow = {
  id: string;
  name: string;
  phone: string | null;
  reactivation_dismissed_at?: string | null;
};

/**
 * Quem foi tirado da lista continua fora dela até dar as caras de novo.
 *
 * A comparação é por dia porque a visita é uma data (sem hora) e a
 * dispensa é um instante: uma visita no mesmo dia em que alguém tirou a
 * pessoa da lista não a traz de volta, o que é o certo — a dispensa é a
 * informação mais recente das duas.
 */
function isDismissed(patient: PatientRow, lastVisit: string | null) {
  const dismissedAt = patient.reactivation_dismissed_at;
  if (!dismissedAt) return false;
  if (!lastVisit) return true;
  return lastVisit <= dismissedAt.slice(0, 10);
}

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
  patients: PatientRow[],
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
      if (isDismissed(patient, lastVisit)) return null;

      const daysSince = daysBetween(lastVisit ?? a.created_at, today);
      if (daysSince < inactiveDays) return null;

      return { id: patient.id, name: patient.name, phone: patient.phone, lastVisit, daysSince };
    })
    .filter((p): p is InactivePatient => p !== null)
    .sort((a, b) => b.daysSince - a.daysSince);
}

/**
 * Lista de pacientes com a coluna de dispensa quando ela existe.
 *
 * Banco sem a migração 0019 responde erro à coluna desconhecida, e a
 * tela inteira de reativação cairia por causa de um SQL que ninguém
 * rodou. Nesse caso a busca é refeita sem a coluna: perde-se o "tirei da
 * lista", nunca a lista.
 */
async function fetchAllPatients(
  supabase: SupabaseClient,
  clinicId: string,
): Promise<PatientRow[]> {
  const forClinic = (columns: string) => () =>
    supabase.from("patients").select(columns).eq("clinic_id", clinicId).order("id");

  try {
    return await fetchAllRows<PatientRow>(
      forClinic("id, name, phone, reactivation_dismissed_at"),
    );
  } catch {
    return fetchAllRows<PatientRow>(forClinic("id, name, phone"));
  }
}

/** Busca a lista pronta para a clínica atual. */
export async function getInactivePatients(
  supabase: SupabaseClient,
  clinicId: string,
  inactiveDays: number,
): Promise<InactivePatient[]> {
  // Varredura completa de propósito: com o corte de mil linhas do
  // PostgREST, uma clínica com base grande veria só um pedaço da lista de
  // quem sumiu — e justamente os nomes do começo do alfabeto.
  const [patients, activity] = await Promise.all([
    fetchAllPatients(supabase, clinicId),
    fetchAllRows<PatientActivity>(() =>
      supabase
        .from("patient_activity")
        .select("patient_id, created_at, last_appointment, last_session, next_appointment")
        .eq("clinic_id", clinicId)
        .order("patient_id"),
    ),
  ]);

  return findInactivePatients(patients, activity, inactiveDays);
}
