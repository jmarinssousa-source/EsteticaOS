import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Entrada dos links de e-mail no formato `token_hash`.
 *
 * É o caminho recomendado para aplicação que guarda a sessão em cookie,
 * e o mais robusto dos três que existem hoje:
 *
 * - `{{ .ConfirmationURL }}` manda a pessoa para `/auth/v1/verify` no
 *   Supabase, que confere o `redirect_to` contra a lista de Redirect
 *   URLs e, quando não bate, larga todo mundo na Site URL. Foi assim que
 *   o convidado foi parar na landing.
 * - E, mesmo batendo, o `verify` devolve os tokens no fragmento da URL
 *   (`#access_token=...`), que o navegador nunca envia ao servidor: uma
 *   rota de servidor não enxerga nada.
 *
 * Com `token_hash` o e-mail aponta direto para cá. Não há intermediário,
 * não há lista de destinos para casar e a sessão é gravada no cookie
 * aqui mesmo. Ver docs/smtp.md para o texto do link em cada template.
 */

const TIPOS: EmailOtpType[] = ["invite", "recovery", "signup", "email_change", "magiclink"];

/** Para onde ir quando o link não diz. Convite e recuperação precisam de
 *  senha nova; confirmação de cadastro já pode entrar no painel. */
const DESTINO_PADRAO: Record<string, string> = {
  invite: "/redefinir-senha",
  recovery: "/redefinir-senha",
};

function safePath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safePath(searchParams.get("next"));

  console.info(
    "[auth/confirm] recebido",
    JSON.stringify({ temToken: Boolean(tokenHash), type: type ?? "(ausente)", next: next ?? "(ausente)" }),
  );

  if (!tokenHash || !type || !TIPOS.includes(type)) {
    console.info("[auth/confirm] redirecionou", JSON.stringify({ para: "/login?error=link-invalido" }));
    return NextResponse.redirect(`${origin}/login?error=link-invalido`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("[auth/confirm] verifyOtp falhou", JSON.stringify({ code: error.code, status: error.status }));
    return NextResponse.redirect(`${origin}/login?error=link-invalido`);
  }

  const destino = next ?? DESTINO_PADRAO[type] ?? "/hoje";
  console.info("[auth/confirm] redirecionou", JSON.stringify({ para: destino, type }));
  return NextResponse.redirect(`${origin}${destino}`);
}
