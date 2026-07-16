"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_ANAMNESIS_TEMPLATES } from "@/lib/anamnesis/default-templates";
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
};

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
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
  const siteUrl = await getSiteUrl();
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

  // Bootstrap the clinic + owner membership with the service role: the
  // new user has no session yet (email not confirmed), so RLS on
  // clinic_members would otherwise block this insert.
  const admin = createAdminClient();

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({ name: clinicName, phone, email })
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

  const siteUrl = await getSiteUrl();
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

  const redirectTo = (formData.get("redirectTo") as string) || "/hoje";
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
  redirect("/login");
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

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();

  // Always return success, whether or not the e-mail exists, to avoid
  // leaking which e-mails are registered.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

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

  if (!user) {
    return { error: "Sua sessão de recuperação expirou. Solicite um novo link." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Não foi possível atualizar sua senha. Tente novamente." };
  }

  redirect("/hoje");
}
