import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type ClinicRole, type Permissions, type PermissionKey } from "@/lib/auth/permissions";

export type CurrentMember = {
  userId: string;
  email: string;
  clinicId: string;
  clinicName: string;
  fullName: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
  memberStatus: "active" | "inactive";
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
    };
  },
);

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
