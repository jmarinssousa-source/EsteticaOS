"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/auth/session";
import { CLINIC_ROLES, PERMISSION_KEYS, type Permissions } from "@/lib/auth/permissions";
import type { ActionState } from "@/actions/auth";

/**
 * Convite com dois extras: o e-mail para onde ele foi, para a tela poder
 * confirmar por escrito, e o link de acesso para quando o e-mail não sai
 * e o dono precisa repassar por outro canal.
 */
export type InviteState = ActionState & {
  inviteLink?: string;
  invitedEmail?: string;
  /**
   * Como a pessoa vai conseguir entrar:
   * - `email`: o convite saiu por e-mail.
   * - `link`: o e-mail não saiu e sobrou o link para repassar.
   * - `existing`: já tinha conta no EstéticaOS e entra com a senha dela.
   *
   * A tela precisa saber a diferença. Dizer "convite enviado" nos três
   * casos é o tipo de mentira que só aparece dois dias depois, quando
   * ninguém entrou e o e-mail nunca existiu.
   */
  outcome?: "email" | "link" | "existing";
};
import { PROFESSIONAL_COLOR_KEYS } from "@/lib/agenda/professional-colors";

/**
 * Todos os perfis podem ser atribuídos, inclusive Dono/Admin.
 *
 * Clínica com dois sócios precisava escolher qual dos dois teria a conta
 * de verdade; o outro ficava como Gerente e sem acesso a Configurações.
 * A trava agora não é o perfil, é a quantidade: `blockIfLastOwner`
 * impede que a clínica fique sem nenhum dono.
 */
const ASSIGNABLE_ROLES = CLINIC_ROLES;

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.email("Informe um e-mail válido."),
  role: z.enum(ASSIGNABLE_ROLES),
  profession: z
    .string()
    .trim()
    .max(60, "Profissão muito longa.")
    .transform((value) => value || null)
    .nullable(),
});

const NOT_OWNER_ERROR = "Apenas o dono/admin da clínica pode gerenciar usuários.";

async function requireOwner() {
  const member = await getCurrentMember();
  if (!member || member.role !== "owner") return null;
  return member;
}

/**
 * Recusa a operação quando ela deixaria a clínica sem nenhum dono.
 *
 * Vale para rebaixar de perfil, desativar e remover. Sem dono ninguém
 * mais consegue abrir Configurações, convidar gente ou ativar o plano:
 * a clínica ficaria trancada por fora, e desfazer exigiria mexer no
 * banco. Por isso a checagem é aqui no servidor, e não só escondendo o
 * botão na tela.
 *
 * Devolve a mensagem de erro quando deve barrar, e `null` quando pode
 * seguir.
 */
async function blockIfLastOwner(
  clinicId: string,
  targetUserId: string,
  action: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("clinic_members")
    .select("role")
    .eq("user_id", targetUserId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (target?.role !== "owner") return null;

  const { count } = await admin
    .from("clinic_members")
    .select("user_id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("role", "owner")
    .eq("status", "active");

  if ((count ?? 0) > 1) return null;
  return `Esta é a única conta de Dono/Admin da clínica. Promova outra pessoa a Dono/Admin antes de ${action}.`;
}

/** Procura uma conta pelo e-mail percorrendo as páginas do Auth. */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ id: string } | null> {
  const perPage = 200;
  const normalized = email.toLowerCase();

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;

    const found = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (found) return { id: found.id };
    if (data.users.length < perPage) return null;
  }

  return null;
}

export async function createUser(
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
    profession: formData.get("profession") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { fullName, email, role, profession } = parsed.data;
  const siteUrl = await resolveSiteUrl();
  const admin = createAdminClient();

  // Quem já tem conta no EstéticaOS (outra clínica, ou um cadastro
  // anterior) não pode ser convidado de novo — o Supabase recusa com
  // `email_exists`. Nesse caso basta vincular a conta existente.
  const existingUser = await findAuthUserByEmail(admin, email);

  let userId = existingUser?.id ?? null;
  let info: string | undefined;
  let inviteLink: string | undefined;

  if (!userId) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
    });

    if (invited?.user) {
      userId = invited.user.id;
    } else {
      // O convite falha quando o projeto Supabase está sem SMTP próprio
      // ou estourou o limite do e-mail de cortesia. Em vez de travar o
      // cadastro, cria a conta e devolve o link de acesso para o dono
      // mandar por WhatsApp.
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha` },
      });

      if (linkError || !link.user) {
        return {
          error: `Não foi possível convidar este usuário: ${
            inviteError?.message ?? linkError?.message ?? "erro desconhecido"
          }`,
        };
      }

      userId = link.user.id;
      inviteLink = link.properties.action_link;
      info = `O e-mail de convite não pôde ser enviado (${inviteError?.message ?? "envio indisponível"}).`;
    }
  }

  const { data: currentMembership } = await admin
    .from("clinic_members")
    .select("id, clinic_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentMembership) {
    return {
      error:
        currentMembership.clinic_id === owner.clinicId
          ? "Esta pessoa já faz parte da equipe desta clínica."
          : "Este e-mail já está vinculado a outra clínica no EstéticaOS.",
    };
  }

  const { error: memberError } = await admin.from("clinic_members").insert({
    clinic_id: owner.clinicId,
    user_id: userId,
    full_name: fullName,
    email,
    role,
    profession,
    permissions: {},
    status: "active",
  });

  if (memberError) {
    return { error: "Não foi possível adicionar o usuário à clínica." };
  }

  revalidatePath("/configuracoes/usuarios");
  const outcome: InviteState["outcome"] = existingUser
    ? "existing"
    : inviteLink
      ? "link"
      : "email";
  return { success: true, info, inviteLink, invitedEmail: email, outcome };
}

export async function updateMemberProfession(memberUserId: string, profession: string) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  const trimmed = profession.trim().slice(0, 60);
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_members")
    .update({ profession: trimmed || null })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId);

  if (error) return { error: "Não foi possível salvar a profissão." };

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function updateMemberRole(memberUserId: string, role: string) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };
  const parsedRole = z.enum(ASSIGNABLE_ROLES).safeParse(role);
  if (!parsedRole.success) return { error: "Perfil inválido." };

  // Mudar o próprio perfil é sempre perda de acesso, nunca ganho: quem
  // já é dono só pode se rebaixar. Se for engano, não sobra caminho de
  // volta pela tela. Quem quiser sair da função pede a outro dono.
  if (memberUserId === owner.userId) {
    return {
      error:
        "Você não pode mudar o próprio perfil. Peça a outra pessoa com perfil Dono/Admin.",
    };
  }

  if (parsedRole.data !== "owner") {
    const blocked = await blockIfLastOwner(owner.clinicId, memberUserId, "mudar este perfil");
    if (blocked) return { error: blocked };
  }

  // Sem service role o update não alcança linha de dono: o RLS de
  // `clinic_members` filtra em silêncio em vez de recusar, e a promoção
  // parecia dar certo sem ter mudado nada.
  const admin = createAdminClient();
  const { error } = await admin
    .from("clinic_members")
    .update({ role: parsedRole.data })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId);

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

export async function updateMemberColor(memberUserId: string, color: string | null) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  const parsed = z.enum(PROFESSIONAL_COLOR_KEYS).nullable().safeParse(color);
  if (!parsed.success) return { error: "Cor inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clinic_members")
    .update({ color: parsed.data })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId);

  if (error) return { error: "Não foi possível atualizar a cor." };

  revalidatePath("/configuracoes/usuarios");
  revalidatePath("/agenda");
  return { success: true };
}

/**
 * Tira a pessoa da clínica de vez. Diferente de desativar: some da lista
 * e o histórico perde o nome dela (agendamentos e atendimentos antigos
 * passam a mostrar "—"), porque o nome vive no vínculo, não no registro.
 * A conta de acesso em si continua existindo — só deixa de pertencer a
 * esta clínica.
 */
export async function deleteMember(memberUserId: string) {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  if (memberUserId === owner.userId) {
    return { error: "Você não pode remover a própria conta da clínica." };
  }

  const blocked = await blockIfLastOwner(owner.clinicId, memberUserId, "remover esta conta");
  if (blocked) return { error: blocked };

  // `clinic_members` só tem policy de select e update no RLS: um delete pela
  // sessão do usuário não dá erro, ele simplesmente não apaga linha nenhuma
  // (o Postgres filtra as linhas em vez de recusar). Por isso a remoção usa a
  // service role — o escopo já está garantido acima: só o dono chega aqui, e
  // o filtro prende a operação à clínica dele, nunca no próprio dono.
  const admin = createAdminClient();
  const { data: removed, error } = await admin
    .from("clinic_members")
    .delete()
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId)
    .select("user_id");

  if (error) {
    console.error("deleteMember falhou:", error.message);
    return { error: "Não foi possível remover este usuário." };
  }

  // Sem linha apagada não houve remoção — avisar sucesso aqui era o que fazia
  // a pessoa continuar na lista depois do toast de confirmação.
  if (!removed?.length) {
    return { error: "Este usuário não faz mais parte da clínica." };
  }

  revalidatePath("/configuracoes/usuarios");
  revalidatePath("/agenda");
  return { success: true };
}

export async function toggleMemberStatus(memberUserId: string, status: "active" | "inactive") {
  const owner = await requireOwner();
  if (!owner) return { error: NOT_OWNER_ERROR };

  if (memberUserId === owner.userId) {
    return { error: "Você não pode desativar sua própria conta." };
  }

  if (status === "inactive") {
    const blocked = await blockIfLastOwner(owner.clinicId, memberUserId, "desativar esta conta");
    if (blocked) return { error: blocked };
  }

  // Service role pelo mesmo motivo do delete: o RLS não alcança a linha
  // de outro dono, e a operação sairia em silêncio.
  const admin = createAdminClient();
  const { error } = await admin
    .from("clinic_members")
    .update({ status })
    .eq("user_id", memberUserId)
    .eq("clinic_id", owner.clinicId);

  if (error) return { error: "Não foi possível atualizar o status do usuário." };

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}
