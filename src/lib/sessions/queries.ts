import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { PackageBalanceOption } from "@/lib/sessions/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Remaining sessions are computed from 'done' session rows rather than
 * stored as a mutable counter, so there's nothing to keep in sync. */
export async function getPackageBalancesWithUsage(
  supabase: SupabaseServerClient,
  clinicId: string,
  patientId?: string,
): Promise<(PackageBalanceOption & { patient_id: string })[]> {
  let query = supabase
    .from("package_balances")
    .select("id, patient_id, package_id, total_sessions, expires_at, packages(name)")
    .eq("clinic_id", clinicId);

  if (patientId) query = query.eq("patient_id", patientId);

  const { data: balances } = await query;
  if (!balances || balances.length === 0) return [];

  const { data: doneSessions } = await supabase
    .from("sessions")
    .select("package_balance_id")
    .eq("clinic_id", clinicId)
    .eq("status", "done")
    .not("package_balance_id", "is", null);

  const usedCounts = new Map<string, number>();
  for (const session of doneSessions ?? []) {
    const key = session.package_balance_id as string;
    usedCounts.set(key, (usedCounts.get(key) ?? 0) + 1);
  }

  return balances.map((balance) => ({
    id: balance.id,
    patient_id: balance.patient_id,
    package_id: balance.package_id,
    package_name: (balance.packages as unknown as { name: string } | null)?.name ?? "Pacote",
    total_sessions: balance.total_sessions,
    used_sessions: usedCounts.get(balance.id) ?? 0,
    expires_at: balance.expires_at,
  }));
}
