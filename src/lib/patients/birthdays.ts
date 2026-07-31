import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/fetch-all";

export type Birthday = {
  id: string;
  name: string;
  phone: string | null;
  /** Idade que a pessoa completa hoje, ou null se o ano não faz sentido. */
  age: number | null;
};

type PatientRow = { id: string; name: string; phone: string | null; birth_date: string | null };

/** "aaaa-mm-dd" → "mm-dd", sem passar por Date: `new Date("1990-05-10")`
 *  é UTC e vira dia 9 em fuso negativo, trocando o aniversário de dia. */
function monthDay(isoDate: string) {
  return isoDate.slice(5, 10);
}

export function findBirthdays(patients: PatientRow[], today = new Date()): Birthday[] {
  const todayKey = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  return patients
    .filter((p) => p.birth_date && monthDay(p.birth_date) === todayKey)
    .map((p) => {
      const birthYear = Number(p.birth_date!.slice(0, 4));
      const age = birthYear > 1900 ? today.getFullYear() - birthYear : null;
      return { id: p.id, name: p.name, phone: p.phone, age };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/**
 * Aniversariantes de hoje da clínica.
 *
 * O filtro de mês/dia é feito aqui e não no banco porque `birth_date` é
 * uma data completa: comparar só mês e dia exigiria uma coluna calculada
 * no Postgres. Para o tamanho de base de uma clínica, varrer a lista sai
 * mais barato que manter esse índice.
 */
export async function getTodaysBirthdays(
  supabase: SupabaseClient,
  clinicId: string,
  today = new Date(),
): Promise<Birthday[]> {
  const patients = await fetchAllRows<PatientRow>(() =>
    supabase
      .from("patients")
      .select("id, name, phone, birth_date")
      .eq("clinic_id", clinicId)
      .not("birth_date", "is", null)
      .order("id"),
  );

  return findBirthdays(patients, today);
}
