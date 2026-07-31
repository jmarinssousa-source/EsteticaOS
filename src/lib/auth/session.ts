import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type ClinicRole, type Permissions, type PermissionKey } from "@/lib/auth/permissions";
import { resolveClinicPlan, type ClinicPlan } from "@/lib/plan/trial";
import { mustSetPassword } from "@/lib/auth/must-set-password";

export type CurrentMember = {
  userId: string;
  email: string;
  clinicId: string;
  clinicName: string;
  fullName: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
  memberStatus: "active" | "inactive";
  /** Convite aceito e senha ainda não criada. Ver lib/auth/must-set-password. */
  mustSetPassword: boolean;
};

/**
 * Resolves the signed-in user's clinic membership for this request.
 * Cached per request with React's cache() to avoid duplicate queries
 * across layouts/pages/components.
 */
export const getCurrentMember = cache(
  async (): Promise<CurrentMember | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: member } = await supabase
      .from("clinic_members")
      .select("clinic_id, full_name, role, permissions, status, clinics(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) return null;

    return {
      userId: user.id,
      email: user.email ?? "",
      clinicId: member.clinic_id,
      clinicName: (member.clinics as unknown as { name: string } | null)?.name ?? "",
      fullName: member.full_name,
      role: member.role as ClinicRole,
      permissions: (member.permissions ?? {}) as Partial<Permissions>,
      memberStatus: member.status as "active" | "inactive",
      mustSetPassword: mustSetPassword(user),
    };
  },
);

/**
 * Situação do plano da clínica atual.
 *
 * Tolera o banco sem as colunas de teste (migração 0017 ainda não
 * aplicada): nesse caso devolve "assinatura ativa", que é o
 * comportamento de antes — ninguém fica trancado do lado de fora porque
 * um SQL não rodou.
 */
export const getClinicPlan = cache(async (): Promise<ClinicPlan> => {
  const member = await getCurrentMember();
  if (!member) return resolveClinicPlan(null);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select(
      "plan_status, trial_ends_at, never_expires, billing_cycle, subscription_ends_at",
    )
    .eq("id", member.clinicId)
    .maybeSingle();

  if (!error) return resolveClinicPlan(data);

  // Banco sem as colunas de assinatura (migração 0018 não aplicada):
  // tenta de novo só com o que existe desde o 0017, em vez de devolver
  // "sem informação" e mandar a tela dizer coisa errada.
  const { data: basic, error: basicError } = await supabase
    .from("clinics")
    .select("plan_status, trial_ends_at, never_expires")
    .eq("id", member.clinicId)
    .maybeSingle();

  if (basicError) return resolveClinicPlan(null);
  return resolveClinicPlan(basic);
});

/**
 * Use at the top of a page/action to enforce a granular permission. Assumes
 * the (dashboard) layout already redirected unauthenticated/inactive users.
 */
export async function requirePermission(key: PermissionKey) {
  const member = await getCurrentMember();
  if (!member || !hasPermission(member, key)) {
    redirect("/hoje?error=sem-permissao");
  }
  return member;
}
