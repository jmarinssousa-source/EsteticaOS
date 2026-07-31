"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_ANAMNESIS_TEMPLATES } from "@/lib/anamnesis/default-templates";
import { trialEndDate } from "@/lib/plan/trial";
import { PASSWORD_SET_METADATA } from "@/lib/auth/must-set-password";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validations/auth";

async function seedDefaultAnamnesisTemplates(
  admin: ReturnType<typeof createAdminClient>,
  clinicId: string,
) {
  for (const template of DEFAULT_ANAMNESIS_TEMPLATES) {
    const { data: inserted, error } = await admin
      .from("anamnesis_templates")
      .insert({ clinic_id: clinicId, name: template.name })
      .select("id")
      .single();

    if (error || !inserted) continue;

    await admin.from("anamnesis_questions").insert(
      template.questions.map((question, index) => ({
        template_id: inserted.id,
        clinic_id: clinicId,
        label: question.label,
        type: question.type,
        required: question.required,
        options: question.options,
        position: index,
      })),
    );
  }
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  /** Aviso neutro (nem erro, nem sucesso) para exibir ao usuário. */
  info?: string;
};

/**
 * Só aceita caminhos internos ("/algo") como destino de redirect, para
 * impedir open redirect via redirectTo/next controlados pelo cliente.
 */
function safeInternalPath(value: unknown, fallback = "/hoje") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}


export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    responsibleName: formData.get("responsibleName"),
    clinicName: formData.get("clinicName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { responsibleName, clinicName, email, phone, password } = parsed.data;
  const siteUrl = await resolveSiteUrl();
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/hoje`,
      data: { full_name: responsibleName },
    },
  });

  if (signUpError) {
    console.error("signUp falhou:", signUpError.code, signUpError.status, signUpError.message);

    if (signUpError.code === "user_already_exists") {
      return { error: "Este e-mail já está cadastrado. Faça login ou recupere sua senha." };
    }
    if (signUpError.code === "email_address_invalid") {
      return { error: "Esse endereço de e-mail parece inválido. Confira e tente novamente." };
    }
    if (signUpError.code === "weak_password") {
      return {
        error: "Senha muito fraca. Use pelo menos 8 caracteres, misturando letras e números.",
      };
    }
    if (signUpError.code === "over_email_send_rate_limit" || signUpError.status === 429) {
      return { error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente." };
    }
    return { error: "Não foi possível criar sua conta. Tente novamente em instantes." };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  // Com proteção contra enumeração de e-mails ativada, o Supabase devolve
  // um usuário "fantasma" (sem identities) quando o e-mail já existe, em
  // vez de erro. Não podemos criar clínica para esse caso.
  if (signUpData.user && signUpData.user.identities?.length === 0) {
    return { error: "Este e-mail já está cadastrado. Faça login ou recupere sua senha." };
  }

  // Bootstrap the clinic + owner membership with the service role: the
  // new user has no session yet (email not confirmed), so RLS on
  // clinic_members would otherwise block this insert.
  const admin = createAdminClient();

  // Reenvio de cadastro com e-mail ainda não confirmado retorna o mesmo
  // usuário: se a clínica já foi criada, não duplica o bootstrap.
  const { data: existingMember } = await admin
    .from("clinic_members")
    .select("clinic_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    redirect(`/verificar-email?email=${encodeURIComponent(email)}`);
  }

  // O teste de 7 dias começa a contar da criação da clínica, não do
  // primeiro acesso: assim a data já existe mesmo se a pessoa demorar
  // para confirmar o e-mail.
  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({
      name: clinicName,
      phone,
      email,
      plan_status: "trialing",
      trial_ends_at: trialEndDate(),
    })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    console.error("signUp: falha ao criar clínica:", clinicError?.message);
    return { error: "Não foi possível criar sua clínica. Tente novamente." };
  }

  const { error: memberError } = await admin.from("clinic_members").insert({
    clinic_id: clinic.id,
    user_id: userId,
    full_name: responsibleName,
    email,
    role: "owner",
    permissions: {},
    status: "active",
  });

  if (memberError) {
    console.error("signUp: falha ao criar clinic_members:", memberError.message);
    return { error: "Não foi possível concluir seu cadastro. Tente novamente." };
  }

  await seedDefaultAnamnesisTemplates(admin, clinic.id);

  redirect(`/verificar-email?email=${encodeURIComponent(email)}`);
}

export async function resendVerificationEmail(email: string): Promise<ActionState> {
  if (!email) return { error: "E-mail inválido." };

  const siteUrl = await resolveSiteUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/hoje` },
  });

  if (error) {
    return { error: "Não foi possível reenviar o e-mail. Tente novamente em instantes." };
  }

  return { success: true };
}

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const redirectTo = safeInternalPath(formData.get("redirectTo"));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(`/verificar-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const siteUrl = await resolveSiteUrl();
  const supabase = await createClient();

  // Always return success, whether or not the e-mail exists, to avoid
  // leaking which e-mails are registered.
  //
  // O erro, porém, vai para o log do servidor. Antes ele era descartado
  // junto com a resposta, então SMTP caído ou limite de envio estourado
  // ficavam invisíveis: a tela dizia "verifique seu e-mail" e ninguém
  // nunca descobria por que o e-mail não chegava.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    console.error("resetPasswordForEmail falhou:", error.code, error.status, error.message);
  }

  return { success: true };
}

export async function requestOwnPasswordReset(email: string): Promise<ActionState> {
  if (!email) return { error: "E-mail inválido." };

  const siteUrl = await resolveSiteUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    // O Supabase limita reenvios (1 por minuto por padrão). Nesse caso um
    // link já foi enviado há pouco — não é falha, então não mostramos erro.
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return {
        info: "Um link já foi enviado há pouco. Confira sua caixa de entrada (e o spam). Você pode pedir outro em 1 minuto.",
      };
    }
    console.error("requestOwnPasswordReset falhou:", error.code, error.status, error.message);
    return { error: "Não foi possível enviar o link. Tente novamente em instantes." };
  }

  return { success: true };
}

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A tela já barra quem chega sem sessão; isto cobre a sessão que
  // vence entre abrir a página e enviar o formulário.
  if (!user) {
    return { error: "Este link expirou ou já foi usado. Peça um novo convite." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    // Apaga a pendência do convite: a partir daqui a pessoa tem senha e
    // o painel para de mandá-la de volta para cá.
    data: PASSWORD_SET_METADATA,
  });

  if (error) {
    console.error("updatePassword falhou:", error.code, error.status);
    // O Supabase recusa repetir a senha que já está valendo. "Não foi
    // possível, tente novamente" mandava a pessoa tentar exatamente a
    // mesma coisa de novo, sem nunca dizer qual era o problema.
    if (error.code === "same_password") {
      return { error: "A senha nova precisa ser diferente da que você já usa." };
    }
    if (error.code === "weak_password") {
      return { error: "Senha muito fraca. Use pelo menos 8 caracteres, misturando letras e números." };
    }
    return { error: "Não foi possível atualizar sua senha. Tente novamente." };
  }

  // Derruba a conta em todos os outros aparelhos.
  //
  // É o que faz a troca de senha valer alguma coisa. Quem troca a senha
  // desconfiando de alguém (celular perdido, computador da recepção,
  // alguém que descobriu a senha antiga) espera que a outra ponta caia
  // — e sem isto a sessão dela continua de pé com a senha velha, que já
  // nem serve mais para entrar.
  //
  // `scope: "others"` preserva a sessão desta aba de propósito: quem
  // acabou de escolher a senha não precisa provar nada digitando-a de
  // novo trinta segundos depois.
  const { error: erroDeSessoes } = await supabase.auth.signOut({ scope: "others" });
  if (erroDeSessoes) {
    // Não impede a entrada: a senha já mudou, e travar aqui deixaria a
    // pessoa fora do sistema por causa de uma limpeza que falhou.
    console.error("signOut(others) falhou:", erroDeSessoes.code, erroDeSessoes.status);
  }

  // Senha no lugar e sessão de pé: a pessoa entra direto. O aviso do que
  // acabou de acontecer aparece no Hoje.
  redirect("/hoje?senha=alterada");
}
