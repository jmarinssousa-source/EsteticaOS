"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/auth/session";
import {
  CLINIC_ROLES,
  PERMISSION_KEYS,
  type ClinicRole,
  type Permissions,
} from "@/lib/auth/permissions";
import type { ActionState } from "@/actions/auth";

const ASSIGNABLE_ROLES = CLINIC_ROLES.filter((role) => role !== "owner") as Exclude<
  ClinicRole,
  "owner"
>[];

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.email("Informe um e-mail válido."),
  role: z.enum(ASSIGNABLE_ROLES),
});

const NOT_OWNER_ERROR = "Apenas o dono/admin da clínica pode gerenciar usuários.";

async function requireOwner() {
  const member = await getCurrentMember();
  if (!member || member.role !== "owner") return null;
  return member;
}

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { fullName, email, role } = parsed.data;
  const siteUrl = await getSiteUrl();
  const admin = createAdminClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha` },
  );

  if (inviteError || !invited.user) {
    return {
      error:
        inviteError?.code === "email_exists"
          ? "Este e-mail já está em uso por outra conta."
          : "Não foi possível convidar este usuário. Tente novamente.",
    };
  }

  const { error: memberError } = await admin.from("clinic_members").insert({
    clinic_id: owner.clinicId,
    user_id: invited.user.id,
    full_name: fullName,
    email,
    role,
    permissions: {},
    status: "active",
  });

  if (memberError) {
    return { error: "Não foi possível adicionar o usuário à clínica." };
  }

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function updateMemberRole(memberUserId: string, role: string) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };
  const parsedRole = z.enum(ASSIGNABLE_ROLES).safeParse(role);
  if (!parsedRole.success) return { error: "Perfil inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_members")
    .update({ role: parsedRole.data })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId)
    .neq("role", "owner");

  if (error) return { error: "Não foi possível atualizar o perfil." };

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function updateMemberPermissions(
  memberUserId: string,
  permissions: Partial<Permissions>,
) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  const cleaned = Object.fromEntries(
    Object.entries(permissions).filter(([key]) =>
      PERMISSION_KEYS.includes(key as (typeof PERMISSION_KEYS)[number]),
    ),
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_members")
    .update({ permissions: cleaned })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId)
    .neq("role", "owner");

  if (error) return { error: "Não foi possível atualizar as permissões." };

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function toggleMemberStatus(memberUserId: string, status: "active" | "inactive") {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  if (memberUserId === owner.userId) {
    return { error: "Você não pode desativar sua própria conta." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_members")
    .update({ status })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId)
    .neq("role", "owner");

  if (error) return { error: "Não foi possível atualizar o status do usuário." };

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}
