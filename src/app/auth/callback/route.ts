import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta dos links de e-mail: confirmar cadastro, convite de equipe e
 * recuperar senha.
 *
 * O destino vem em `next`, mas esta rota não depende disso.
 *
 * Motivo: quem monta a URL final não é o nosso código, é o Supabase. O
 * link do e-mail aponta para `/auth/v1/verify`, que confere o
 * `redirect_to` contra a lista de Redirect URLs do projeto e só então
 * manda a pessoa para cá. Entrada de lista sem curinga casa com a URL
 * inteira, query incluída: `.../auth/callback` não casa com
 * `.../auth/callback?next=/redefinir-senha`, e o Supabase descarta o
 * destino e joga a pessoa na Site URL, ou seja, na landing. Era esse o
 * bug do convite.
 *
 * A lista de Redirect URLs precisa do curinga (ver docs/smtp.md), mas o
 * código não fica refém dela: sem `next`, o destino é deduzido de quem
 * está entrando. Quem foi convidado e nunca entrou vai definir a senha;
 * o resto vai para o painel.
 */

/** Só caminho interno, para o link do e-mail não virar open redirect. */
function safePath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

/** Log de diagnóstico sem token, código nem e-mail. */
function log(step: string, detail: Record<string, unknown> = {}) {
  console.info("[auth/callback]", step, JSON.stringify(detail));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"));

  // O Supabase devolve o erro na própria URL quando o link já foi usado
  // ou passou da validade, e nesse caso nem manda `code`.
  const providerError = searchParams.get("error_code") ?? searchParams.get("error");

  log("recebido", {
    temCode: Boolean(code),
    next: next ?? "(ausente)",
    erroDoProvedor: providerError ?? "(nenhum)",
  });

  if (!code) {
    log("redirecionou", { para: "/login?error=link-invalido", motivo: "sem code" });
    return NextResponse.redirect(`${origin}/login?error=link-invalido`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    log("exchangeCodeForSession falhou", { code: error.code, status: error.status });
    return NextResponse.redirect(`${origin}/login?error=link-invalido`);
  }

  // `invited_at` marca quem entrou por convite da equipe. Somado a nunca
  // ter entrado antes, é convite recém-aceito: essa pessoa ainda não tem
  // senha e precisa criar uma, senão só conseguiria voltar por outro
  // link de e-mail.
  const user = data.user;
  const primeiroAcessoPorConvite =
    Boolean(user?.invited_at) &&
    (!user?.last_sign_in_at ||
      new Date(user.last_sign_in_at).getTime() >= Date.now() - 60_000);

  const destino = next ?? (primeiroAcessoPorConvite ? "/redefinir-senha" : "/hoje");

  log("redirecionou", {
    para: destino,
    origemDoDestino: next ? "parâmetro next" : "deduzido do usuário",
    convite: primeiroAcessoPorConvite,
  });

  return NextResponse.redirect(`${origin}${destino}`);
}
