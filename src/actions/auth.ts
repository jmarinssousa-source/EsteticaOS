"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validations/auth";

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
    if (signUpError.code === "user_already_exists") {
      return { error: "Este e-mail já está cadastrado. Faça login ou recupere sua senha." };
    }
    return { error: "Não foi possível criar sua conta. Tente novamente." };
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
    return { error: "Não foi possível concluir seu cadastro. Tente novamente." };
  }

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
